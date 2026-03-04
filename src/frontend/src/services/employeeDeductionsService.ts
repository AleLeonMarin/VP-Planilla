import {
  EmployeeDeduction,
  EmployeeDeductionWithDetails,
  AssignDeductionRequest
} from '@/types/employeeDeductions';
import { http } from './http';

/**
 * Service for managing employee deductions
 */
export const EmployeeDeductionsService = {
  /**
   * Get all deductions assigned to a specific employee
   */
  async getEmployeeDeductions(employeeId: number): Promise<EmployeeDeductionWithDetails[]> {
    try {
      const data = await http.get(`/nominee/employee-deductions/${employeeId}`);
      if (!data) return [];
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      console.error('Error fetching employee deductions:', error);
      throw error;
    }
  },

  /**
   * Assign a deduction to an employee
   */
  async assignDeductionToEmployee(
    request: AssignDeductionRequest
  ): Promise<EmployeeDeduction> {
    const data = await http.post('/employee-deductions/assign', request);
    return data as EmployeeDeduction;
  },

  /**
   * Remove a deduction from an employee
   */
  async removeDeductionFromEmployee(
    employeeId: number,
    deductionId: number
  ): Promise<boolean> {
    await http.delete(`/employee-deductions/${employeeId}/${deductionId}`);
    return true;
  },
};
