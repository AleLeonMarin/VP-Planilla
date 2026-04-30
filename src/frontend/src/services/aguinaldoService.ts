import { http } from './http';
import { AguinaldoAccrual, AguinaldoSummaryRow } from '@/types/aguinaldo';

export const aguinaldoService = {
  /**
   * Obtiene el aguinaldo acumulado para un empleado.
   * @param employeeId ID del empleado
   */
  getEmployeeAguinaldo: async (employeeId: number): Promise<AguinaldoAccrual> => {
    return http.get(`/employees/${employeeId}/aguinaldo`);
  },

  /**
   * Obtiene el resumen de aguinaldo para una planilla específica.
   * @param payrollId ID de la planilla
   */
  getPayrollAguinaldoSummary: async (payrollId: number): Promise<AguinaldoSummaryRow[]> => {
    return http.get(`/payroll/${payrollId}/aguinaldo-summary`);
  }
};
