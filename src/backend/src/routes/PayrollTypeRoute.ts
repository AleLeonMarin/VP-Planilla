import { Router } from "express";
import { PayrollTypesController } from "../controller/PayrollTypesController";

const router = Router();

router.post("/payroll-type/create", PayrollTypesController.createPayrollType);
router.put("/payroll-type/:id", PayrollTypesController.updatePayrollType);
router.get("/payroll-type/:id", PayrollTypesController.getPayrollType);
router.get("/payroll-types", PayrollTypesController.getAllPayrollTypes);

export default router;
