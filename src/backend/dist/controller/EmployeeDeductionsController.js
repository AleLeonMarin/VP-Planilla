"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeDeductionsController = void 0;
const EmployeeDeductions_1 = require("../service/EmployeeDeductions");
class EmployeeDeductionsController {
    /**
     * Assign a deduction to an employee
     * @route POST /employee-deductions/assign
     * @param req.body.employeeId - The employee ID
     * @param req.body.deductionId - The deduction ID
     */
    static async assignDeduction(req, res) {
        try {
            const { employeeId, deductionId } = req.body;
            if (!employeeId || !deductionId) {
                return res.status(400).json({
                    success: false,
                    error: "employeeId and deductionId are required"
                });
            }
            const result = await EmployeeDeductions_1.EmployeeDeductionsService.assignDeductionToEmployee(Number(employeeId), Number(deductionId));
            return res.status(201).json({
                success: true,
                data: result,
                message: "Deduction assigned successfully"
            });
        }
        catch (error) {
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
    static async removeDeduction(req, res) {
        try {
            const { employeeId, deductionId } = req.params;
            if (!employeeId || !deductionId) {
                return res.status(400).json({
                    success: false,
                    error: "employeeId and deductionId are required"
                });
            }
            await EmployeeDeductions_1.EmployeeDeductionsService.removeDeductionFromEmployee(Number(employeeId), Number(deductionId));
            return res.status(200).json({
                success: true,
                message: "Deduction removed successfully"
            });
        }
        catch (error) {
            console.error("Error removing deduction:", error);
            return res.status(500).json({
                success: false,
                error: error.message || "Error removing deduction from employee"
            });
        }
    }
}
exports.EmployeeDeductionsController = EmployeeDeductionsController;
