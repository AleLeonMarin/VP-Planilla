import { useState, useCallback } from 'react';
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
    } catch (err: any) {
      setError(err?.message || 'Error getting payrolls');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPayroll = useCallback(async (payload: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await PayrollService.createPayroll(payload);
      setData(res);
      return res;
    } catch (err: any) {
      setError(err?.message || 'Error creating payroll');
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
    } catch (err: any) {
      setError(err?.message || 'Error getting payroll');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, getAllPayrolls, createPayroll, getPayrollById };
};
