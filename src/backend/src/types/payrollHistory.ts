/**
 * One row in the per-employee payroll history feed used by the employee
 * profile "Planillas" tab. Aggregates one vpg_payroll_employee row joined
 * with vpg_payrolls and vpg_payroll_types.
 */
export interface EmployeePayrollRow {
  payroll_id: number;
  period_start: Date;
  period_end: Date;
  status: 'BORRADOR' | 'APROBADA' | 'PAGADA';
  period_type: string;          // 'quincenal' | 'mensual' | 'rango_libre'
  payroll_type_name: string;    // joined from vpg_payroll_types
  total_hours: number | null;
  overtime_hours: number | null;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  is_manually_adjusted: boolean;
}
