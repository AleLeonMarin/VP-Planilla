import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { PayrollService, Payroll } from '@/services/payrollService';

export const usePayroll = () => {
  const [data, setData] = useState<Payroll | Payroll[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAllPayrolls = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await PayrollService.getAllPayrolls();
      setData(res);
      return res;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error getting payrolls');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPayroll = useCallback(async (payload: Partial<Payroll>) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await PayrollService.createPayroll(payload);
      setData(res);
      return res;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error creating payroll';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPayrollById = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await PayrollService.getPayrollById(id);
      setData(res);
      return res;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error getting payroll');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, getAllPayrolls, createPayroll, getPayrollById };
};
