import { useState, useEffect, useCallback } from 'react';
import { employeePayrollsService } from '@/services/employeePayrollsService';
import { EmployeePayrollRow } from '@/types/payrollHistory';

/**
 * Hook to fetch and manage an employee's payroll history.
 * Mirrors the canonical useAguinaldo pattern.
 */
export function useEmployeePayrolls(employeeId: number | string | undefined) {
  const [data, setData] = useState<EmployeePayrollRow[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayrolls = useCallback(async () => {
    if (!employeeId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await employeePayrollsService.getByEmployee(Number(employeeId));
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el historial de planillas');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  const downloadReceipt = useCallback(
    async (payrollId: number) => {
      if (!employeeId) return;
      await employeePayrollsService.downloadReceiptPdf(payrollId, Number(employeeId));
    },
    [employeeId]
  );

  return {
    data,
    isLoading,
    error,
    refresh: fetchPayrolls,
    downloadReceipt,
  };
}
