import { prisma } from '../lib/prisma';
import { ClockLogs } from "../model/clockLog";
import { normalizeLogType, CanonicalLogType } from '../utils/clockLogNormalization';

/**
 * Request parameters for filtering clock logs by date range
 */
export interface RequestParams {
    /** Start date for the clock logs query */
    initDate: Date;
    /** End date for the clock logs query */
    endDate: Date;
}

export type ClockLogSource = 'java_import' | 'excel_import' | 'manual';

export class ClockLogsService {
    /**
     * Retrieve clock logs within a specified date range
     * @param params - Request parameters containing start and end dates
     * @returns Promise<ClockLogs[]> - Array of clock logs within the specified date range
     * @throws Error if database query fails
     */
    async getClockLogs(params: RequestParams): Promise<ClockLogs[]> {
        const logs = await prisma.vpg_clock_logs.findMany({
            where: {
                clock_logs_timestamp: {
                    gte: params.initDate,
                    lte: params.endDate
                }
            }
        });

        return logs.map(log => ({
            id: log.clock_logs_id,
            employee_id: log.clock_logs_employee_id,
            timestamp: log.clock_logs_timestamp,
            log_type: log.clock_logs_log_type as 'IN' | 'OUT',
            remarks: log.clock_logs_remarks ?? undefined,
            version: log.clock_logs_version,
            status: log.clock_logs_status,
            source: log.clock_logs_source
        }));

    }

    /**
     * Create multiple clock logs in bulk
     * @param logs - Array of clock log data with raw log_type strings
     * @param source - Origin of the clock logs (java_import, excel_import, manual)
     * @returns Object with count of created records
     * @throws Error if database operation fails or log_type cannot be normalized
     */
    async bulkCreate(
        logs: Array<{
            employee_id: number;
            timestamp: Date;
            log_type: string;
            remarks?: string | null;
        }>,
        source: ClockLogSource = 'manual'
    ): Promise<{ created: number }> {
        const result = await prisma.vpg_clock_logs.createMany({
            data: logs.map(l => ({
                clock_logs_employee_id: l.employee_id,
                clock_logs_timestamp: l.timestamp,
                clock_logs_log_type: normalizeLogType(l.log_type),
                clock_logs_remarks: l.remarks ?? null,
                clock_logs_version: 1,
                clock_logs_status: 'pending',
                clock_logs_source: source
            })),
            skipDuplicates: true
        });
        return { created: result.count };
    }

    /**
     * Get aggregated stats grouped by status and source for a date range
     * @param initDate - Start date for the stats query
     * @param endDate - End date for the stats query
     * @returns Array of status/source/count groupings
     * @throws Error if database query fails
     */
    async getStats(initDate: Date, endDate: Date): Promise<
        Array<{ status: string; source: string; count: number }>
    > {
        const stats = await prisma.vpg_clock_logs.groupBy({
            by: ['clock_logs_status', 'clock_logs_source'],
            where: {
                clock_logs_timestamp: {
                    gte: initDate,
                    lte: endDate
                }
            },
            _count: true
        });

        return stats.map(s => ({
            status: s.clock_logs_status,
            source: s.clock_logs_source,
            count: s._count
        }));
    }
}