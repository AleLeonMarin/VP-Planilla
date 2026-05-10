import { useState, useEffect, useCallback } from 'react';
import { aguinaldoService } from '@/services/aguinaldoService';
import { AguinaldoAccrual } from '@/types/aguinaldo';

/**
 * Hook to fetch and manage aguinaldo accrual data for an employee.
 * @param employeeId Employee ID
 */
export function useAguinaldo(employeeId: number | string | undefined) {
  const [data, setData] = useState<AguinaldoAccrual | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAguinaldo = useCallback(async () => {
    if (!employeeId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await aguinaldoService.getEmployeeAguinaldo(Number(employeeId));
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading aguinaldo data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchAguinaldo();
  }, [fetchAguinaldo]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchAguinaldo
  };
}
