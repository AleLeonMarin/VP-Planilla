import { Router } from "express";
import { PayrollController } from "../controller/PayrollController";

const router = Router();

router.post("/payroll/create", PayrollController.createPayroll);
router.get("/payroll/:id", PayrollController.getPayrollById);
router.put("/payroll/:id", PayrollController.updatePayroll);

export default router;
