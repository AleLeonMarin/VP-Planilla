import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { DeductionsService, Deduction } from '@/services/deductionsService';
import { readCache, writeCache, invalidateCache } from '@/utils/sessionCache';

const CACHE_KEY = 'vp_deductions_cache';

export const useDeductions = () => {
  const [data, setData] = useState<Deduction[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const cached = readCache<Deduction[]>(CACHE_KEY);
    if (cached) {
      setData(cached);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await DeductionsService.getAllDeductions();
      writeCache(CACHE_KEY, res);
      setData(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error cargando deducciones');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (payload: Partial<Deduction>) => {
    setIsLoading(true);
    try {
      invalidateCache(CACHE_KEY);
      const created = await DeductionsService.createDeduction(payload);
      setData(prev => prev ? [created, ...prev] : [created]);
      return created;
    } finally { setIsLoading(false); }
  };

  const update = async (id: number, payload: Partial<Deduction>) => {
    setIsLoading(true);
    try {
      invalidateCache(CACHE_KEY);
      const updated = await DeductionsService.updateDeduction(id, payload);
      setData(prev => prev ? prev.map(p => p.id === id ? updated : p) : [updated]);
      return updated;
    } finally { setIsLoading(false); }
  };

  const remove = async (id: number) => {
    setIsLoading(true);
    try {
      invalidateCache(CACHE_KEY);
      await DeductionsService.deleteDeduction(id);
      setData(prev => prev ? prev.filter(p => p.id !== id) : null);
    } finally { setIsLoading(false); }
  };

  return { data, isLoading, error, refetch: fetchAll, create, update, remove };
};
