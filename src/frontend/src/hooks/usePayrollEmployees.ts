import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { PayrollEmployeesService } from '@/services/payrollEmployeesService';
import { PayrollEmployee } from '@/types/payrollEmployee';

/**
 * Hook for managing payroll employees
 */
export const usePayrollEmployees = (payrollId?: number) => {
  const [data, setData] = useState<PayrollEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch employees for a specific payroll
   */
  const fetchPayrollEmployees = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const employees = await PayrollEmployeesService.getPayrollEmployees(id);
      setData(employees);
      return employees;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar empleados de la planilla';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refetch current payroll's employees
   */
  const refetch = useCallback(async () => {
    if (payrollId) {
      return fetchPayrollEmployees(payrollId);
    }
  }, [payrollId, fetchPayrollEmployees]);

  return {
    data,
    isLoading,
    error,
    fetchPayrollEmployees,
    refetch,
  };
};
