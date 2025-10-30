"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeDeductionsService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class EmployeeDeductionsService {
    /**
     * Assign a deduction to an employee
     * @param employeeId - The ID of the employee
     * @param deductionId - The ID of the deduction to assign
     * @returns Promise<DeductionsPerEmployee> - The created employee deduction record
     * @throws Error if assignment fails or employee/deduction not found
     */
    static async assignDeductionToEmployee(employeeId, deductionId) {
        const prismaEmployeeDeduction = await prisma.vpg_deductions_per_employee.create({
            data: {
                deductions_per_employee_employee_id: employeeId,
                deductions_per_employee_deduction_id: deductionId,
                deductions_per_employee_version: 1,
            },
        });
        const employeeDeduction = {
            employee_id: prismaEmployeeDeduction.deductions_per_employee_employee_id,
            deduction_id: prismaEmployeeDeduction.deductions_per_employee_deduction_id,
            version: prismaEmployeeDeduction.deductions_per_employee_version,
        };
        return employeeDeduction;
    }
    /**
     * Remove a deduction from an employee
     * @param employeeId - The ID of the employee
     * @param deductionId - The ID of the deduction to remove
     * @returns Promise<void>
     * @throws Error if deletion fails or record not found
     */
    static async removeDeductionFromEmployee(employeeId, deductionId) {
        await prisma.vpg_deductions_per_employee.delete({
            where: {
                deductions_per_employee_employee_id_deductions_per_employee_deduction_id: {
                    deductions_per_employee_employee_id: employeeId,
                    deductions_per_employee_deduction_id: deductionId,
                },
            },
        });
    }
}
exports.EmployeeDeductionsService = EmployeeDeductionsService;
