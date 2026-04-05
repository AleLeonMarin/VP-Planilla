import { Request, Response } from "express";
import { ClockLogsService, ClockLogSource } from "../service/ClockLogsService";
import { prisma } from "../lib/prisma";
import { normalizeLogType } from "../utils/clockLogNormalization";

function normalizeName(value: string) {
    return (value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

async function resolveEmployeeId(
    employee_id: unknown,
    employee_name: unknown
): Promise<number | null> {
    if (employee_id != null) {
        const n = Number(employee_id);
        if (!isNaN(n)) return n;
    }

    if (!employee_name) return null;

    const normalized = normalizeName(String(employee_name));
    if (!normalized) return null;

    const employees = await prisma.vpg_employees.findMany({
        select: {
            employee_id: true,
            employee_first_name: true,
            employee_middle_name: true,
            employee_last_name: true
        },
        where: { employee_fired: false },
        orderBy: { employee_id: 'asc' }
    });

    for (const emp of employees) {
        const fullWithMiddle = normalizeName(
            `${emp.employee_first_name} ${emp.employee_middle_name ?? ''} ${emp.employee_last_name}`
        );
        const fullWithout = normalizeName(
            `${emp.employee_first_name} ${emp.employee_last_name}`
        );
        if (fullWithMiddle === normalized || fullWithout === normalized) {
            return emp.employee_id;
        }
    }
    return null;
}

export class ClockLogsController {
    /**
     * Get clock logs within a specified date range
     * GET /clock-logs?initDate=YYYY-MM-DD&endDate=YYYY-MM-DD
     * @param req - Express request object containing initDate and endDate query parameters
     * @param res - Express response object
     * @returns Promise<Response> - HTTP response with clock logs data or error
     */
    async getClockLogs(req: Request, res: Response): Promise<Response> {
        const { initDate, endDate } = req.query;

        if (!initDate || !endDate) {
            return res.status(400).json({ error: "initDate and endDate are required" });
        }

        const service = new ClockLogsService();
        try {
            const logs = await service.getClockLogs({
                initDate: new Date(initDate as string),
                endDate: new Date(endDate as string)
            });
            return res.json(logs);
        } catch (error) {
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Get aggregated stats grouped by status and source for a date range
     * GET /clock-logs/stats?initDate=YYYY-MM-DD&endDate=YYYY-MM-DD
     * @param req - Express request object containing initDate and endDate query parameters
     * @param res - Express response object
     * @returns Promise<Response> - HTTP response with stats data or error
     */
    async getStats(req: Request, res: Response): Promise<Response> {
        const { initDate, endDate } = req.query;

        if (!initDate || !endDate) {
            return res.status(400).json({ error: "initDate and endDate are required" });
        }

        const service = new ClockLogsService();
        try {
            const stats = await service.getStats(
                new Date(initDate as string),
                new Date(endDate as string)
            );

            const byStatus: Record<string, number> = {};
            const bySource: Record<string, number> = {};
            let total = 0;

            for (const s of stats) {
                byStatus[s.status] = (byStatus[s.status] || 0) + s.count;
                bySource[s.source] = (bySource[s.source] || 0) + s.count;
                total += s.count;
            }

            return res.json({
                success: true,
                data: { byStatus, bySource, total }
            });
        } catch (error) {
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    async bulkCreate(req: Request, res: Response): Promise<Response> {
        const { logs } = req.body;

        if (!Array.isArray(logs) || logs.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de logs no vacío' });
        }

        const resolved: Array<{
            employee_id: number;
            timestamp: Date;
            log_type: string;
            remarks: string | null;
        }> = [];
        const skipped: string[] = [];

        for (const l of logs) {
            if (!l.timestamp || !l.log_type) {
                skipped.push(`Fila sin timestamp o log_type`);
                continue;
            }

            const timestamp = new Date(l.timestamp);
            if (isNaN(timestamp.getTime())) {
                skipped.push(`Timestamp inválido: ${l.timestamp}`);
                continue;
            }

            const employeeId = await resolveEmployeeId(l.employee_id, l.employee_name);
            if (!employeeId) {
                skipped.push(`No se encontró empleado: id=${l.employee_id} nombre="${l.employee_name}"`);
                continue;
            }

            try {
                const normalizedType = normalizeLogType(String(l.log_type));
                resolved.push({
                    employee_id: employeeId,
                    timestamp,
                    log_type: normalizedType,
                    remarks: l.remarks ?? null
                });
            } catch (error) {
                skipped.push(`Tipo de marca desconocido: "${l.log_type}"`);
                continue;
            }
        }

        if (!resolved.length) {
            return res.status(400).json({
                error: 'No se pudieron resolver empleados para ningún log',
                skipped
            });
        }

        const service = new ClockLogsService();
        try {
            const source: ClockLogSource = 'manual';
            const result = await service.bulkCreate(resolved, source);
            return res.status(201).json({
                success: true,
                created: result.created,
                skipped,
                skipped_count: skipped.length,
                matched_count: resolved.length
            });
        } catch (error) {
            console.error('Error en bulkCreate de clock logs:', error);
            return res.status(500).json({ error: 'Error interno del servidor', detail: String(error) });
        }
    }

}
