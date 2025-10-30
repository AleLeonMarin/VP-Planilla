"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClockLogsController = void 0;
const ClockLogsService_1 = require("../service/ClockLogsService");
class ClockLogsController {
    /**
     * Get clock logs within a specified date range
     * GET /clock-logs?initDate=YYYY-MM-DD&endDate=YYYY-MM-DD
     * @param req - Express request object containing initDate and endDate query parameters
     * @param res - Express response object
     * @returns Promise<Response> - HTTP response with clock logs data or error
     */
    async getClockLogs(req, res) {
        const { initDate, endDate } = req.query;
        let nomineeLogs;
        if (!initDate || !endDate) {
            return res.status(400).json({ error: "initDate and endDate are required" });
        }
        const service = new ClockLogsService_1.ClockLogsService();
        try {
            const logs = await service.getClockLogs({
                initDate: new Date(initDate),
                endDate: new Date(endDate)
            });
            return res.json(logs);
            nomineeLogs = logs;
        }
        catch (error) {
            return res.status(500).json({ error: "Internal server error" });
        }
    }
}
exports.ClockLogsController = ClockLogsController;
