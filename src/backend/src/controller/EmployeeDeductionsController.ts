import { Request, Response } from "express";
import { EmployeeDeductionsService } from "../service/EmployeeDeductions";

export class EmployeeDeductionsController {
  /**
   * Assign a deduction to an employee
   * @route POST /employee-deductions/assign
   * @param req.body.employeeId - The employee ID
   * @param req.body.deductionId - The deduction ID
   */
  static async assignDeduction(req: Request, res: Response): Promise<Response> {
    try {
      const { employeeId, deductionId } = req.body;

      if (!employeeId || !deductionId) {
        return res.status(400).json({
          success: false,
          error: "employeeId and deductionId are required"
        });
      }

      const result = await EmployeeDeductionsService.assignDeductionToEmployee(
        Number(employeeId),
        Number(deductionId)
      );

      return res.status(201).json({
        success: true,
        data: result,
        message: "Deduction assigned successfully"
      });
    } catch (error: any) {
      console.error("Error assigning deduction:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Error assigning deduction to employee"
      });
    }
  }

  /**
   * Remove a deduction from an employee
   * @route DELETE /employee-deductions/:employeeId/:deductionId
   */
  static async removeDeduction(req: Request, res: Response): Promise<Response> {
    try {
      const { employeeId, deductionId } = req.params;

      if (!employeeId || !deductionId) {
        return res.status(400).json({
          success: false,
          error: "employeeId and deductionId are required"
        });
      }

      await EmployeeDeductionsService.removeDeductionFromEmployee(
        Number(employeeId),
        Number(deductionId)
      );

      return res.status(200).json({
        success: true,
        message: "Deduction removed successfully"
      });
    } catch (error: any) {
      console.error("Error removing deduction:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Error removing deduction from employee"
      });
    }
  }
}
