/**
 * One row in the per-employee payroll history feed (matches backend
 * EmployeePayrollRow; dates arrive as ISO strings over JSON).
 */
export interface EmployeePayrollRow {
  payroll_id: number;
  period_start: string;
  period_end: string;
  status: 'BORRADOR' | 'APROBADA' | 'PAGADA';
  period_type: string;
  payroll_type_name: string;
  total_hours: number | null;
  overtime_hours: number | null;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  is_manually_adjusted: boolean;
}
