import { useState, useEffect, useCallback } from 'react';
import { aguinaldoService } from '@/services/aguinaldoService';
import type { AguinaldoSummaryRow } from '@/types/aguinaldo';

export function useAguinaldoSummary(payrollId: number | null) {
  const [data, setData] = useState<AguinaldoSummaryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (payrollId === null) {
      setData([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await aguinaldoService.getPayrollAguinaldoSummary(payrollId);
      setData(result);
    } catch (err) {
      console.error('Error fetching aguinaldo summary:', err);
      setError('Error al cargar resumen de aguinaldo');
    } finally {
      setIsLoading(false);
    }
  }, [payrollId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchSummary
  };
}
