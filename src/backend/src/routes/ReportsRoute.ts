import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { ReportsController } from "../controller/ReportsController";

const router = Router();

router.use(AuthMiddleware.verifyToken);

router.get(
  "/reports/dashboard",
  asyncHandler(ReportsController.getDashboard)
);
router.get(
  "/reports/payroll/:id/employees",
  asyncHandler(ReportsController.getPayrollDataset)
);
router.get(
  "/reports/payroll/:id/logs",
  asyncHandler(ReportsController.getPayrollLogs)
);
router.post(
  "/reports/payroll/:id/send",
  asyncHandler(ReportsController.sendReports)
);

export default router;
