import { Request, Response } from "express";
import { PayrollService } from "../service/PayrollService";

export class PayrollController {
  static async createPayroll(req: Request, res: Response) {
    try {
      const payroll = await PayrollService.createPayroll(req.body);
      res.status(201).json(payroll);
    } catch (error) {
      console.error("Failed to create payroll:", error);
      res.status(500).json({ error: "Failed to create payroll" });
    }
  }

  static async getPayrollById(req: Request, res: Response) {
    try {
      const payroll = await PayrollService.getPayrollById(
        Number(req.params.id)
      );
      if (!payroll) return res.status(404).json({ error: "Payroll not found" });
      res.json(payroll);
    } catch (error) {
        console.error("Failed to retrieve payroll:", error);
      res.status(500).json({ error: "Failed to retrieve payroll" });
    }
  }

  static async updatePayroll(req: Request, res: Response) {
    try {
      const payroll = await PayrollService.updatePayroll(
        Number(req.params.id),
        req.body
      );
      if (!payroll) return res.status(404).json({ error: "Payroll not found" });
      res.json(payroll);
    } catch (error) {
        console.error("Failed to update payroll:", error);
      res.status(500).json({ error: "Failed to update payroll" });
    }
  }
}
