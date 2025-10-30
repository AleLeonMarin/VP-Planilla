"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogsController = void 0;
const AuditLogsService_1 = require("../service/AuditLogsService");
class AuditLogsController {
    /**
     * Get audit logs with optional filters
     * GET /audit-logs
     */
    static async getAuditLogs(req, res) {
        try {
            const filters = {};
            if (req.query.userId) {
                filters.userId = parseInt(req.query.userId, 10);
            }
            if (req.query.action) {
                filters.action = req.query.action;
            }
            if (req.query.entity) {
                filters.entity = req.query.entity;
            }
            if (req.query.startDate) {
                filters.startDate = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                filters.endDate = new Date(req.query.endDate);
            }
            if (req.query.limit) {
                filters.limit = parseInt(req.query.limit, 10);
            }
            if (req.query.offset) {
                filters.offset = parseInt(req.query.offset, 10);
            }
            const result = await AuditLogsService_1.AuditLogsService.getAuditLogs(filters);
            return res.status(200).json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            console.error("Error getting audit logs:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to retrieve audit logs",
            });
        }
    }
    /**
     * Get audit log by ID
     * GET /audit-logs/:id
     */
    static async getAuditLogById(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid audit log ID",
                });
            }
            const log = await AuditLogsService_1.AuditLogsService.getAuditLogById(id);
            if (!log) {
                return res.status(404).json({
                    success: false,
                    error: "Audit log not found",
                });
            }
            return res.status(200).json({
                success: true,
                data: log,
            });
        }
        catch (error) {
            console.error("Error getting audit log:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to retrieve audit log",
            });
        }
    }
}
exports.AuditLogsController = AuditLogsController;
