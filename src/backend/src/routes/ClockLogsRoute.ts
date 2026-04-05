import { Router } from "express";
import { ClockLogsController } from "../controller/ClockLogsController";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { validateBody } from '../middleware/validateBody';
import { bulkCreateClockLogSchema } from '../schemas/ClockLogSchema';

const router = Router();

router.use(AuthMiddleware.verifyToken);
const controller = new ClockLogsController();

/**
 * @route   GET /clock-logs
 * @desc    Get clock logs with date range filter
 * @access  Private
 */
/**
 * @swagger
 * /api/clock-logs:
 *   get:
 *     tags:
 *       - Clock Logs
 *     summary: Get clock logs
 *     description: Retrieve clock logs within a specified date range
 *     parameters:
 *       - in: query
 *         name: initDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *         example: "2024-01-31"
 *     responses:
 *       '200':
 *         description: Clock logs retrieved successfully
 *       '400':
 *         description: Missing required parameters
 *       '500':
 *         description: Internal server error
 */
router.get("/clock-logs", asyncHandler((req, res) => controller.getClockLogs(req, res)));

/**
 * @route   GET /clock-logs/stats
 * @desc    Get clock log stats grouped by status and source
 * @access  Private
 */
/**
 * @swagger
 * /api/clock-logs/stats:
 *   get:
 *     tags:
 *       - Clock Logs
 *     summary: Get clock log stats
 *     description: Retrieve aggregated counts of clock logs grouped by status and source within a date range
 *     parameters:
 *       - in: query
 *         name: initDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *         example: "2024-01-31"
 *     responses:
 *       '200':
 *         description: Stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     byStatus:
 *                       type: object
 *                     bySource:
 *                       type: object
 *                     total:
 *                       type: integer
 *       '400':
 *         description: Missing required parameters
 *       '500':
 *         description: Internal server error
 */
router.get("/clock-logs/stats", asyncHandler((req, res) => controller.getStats(req, res)));

router.post("/clock-logs/bulk", validateBody(bulkCreateClockLogSchema), asyncHandler((req, res) => controller.bulkCreate(req, res)));

export default router;
