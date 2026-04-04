import { useEffect, useState, useCallback } from 'react';
import { VacationsService, Vacation } from '@/services/vacationsService';
import { readCache, writeCache, invalidateCache } from '@/utils/sessionCache';

const CACHE_KEY = 'vp_vacations_cache';

export const useVacations = () => {
  const [data, setData] = useState<Vacation[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const cached = readCache<Vacation[]>(CACHE_KEY);
    if (cached) {
      setData(cached);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await VacationsService.getAll();
      writeCache(CACHE_KEY, res);
      setData(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error cargando vacaciones');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (payload: Partial<Vacation>) => {
    setIsLoading(true);
    try {
      invalidateCache(CACHE_KEY);
      const created = await VacationsService.create(payload);
      setData(prev => prev ? [created, ...prev] : [created]);
      return created;
    } finally { setIsLoading(false); }
  };

  const update = async (id: number, payload: Partial<Vacation>) => {
    setIsLoading(true);
    try {
      invalidateCache(CACHE_KEY);
      const updated = await VacationsService.update(id, payload);
      setData(prev => prev ? prev.map(p => p.id === id ? updated : p) : [updated]);
      return updated;
    } finally { setIsLoading(false); }
  };

  const remove = async (id: number) => {
    setIsLoading(true);
    try {
      invalidateCache(CACHE_KEY);
      await VacationsService.delete(id);
      setData(prev => prev ? prev.filter(p => p.id !== id) : null);
    } finally { setIsLoading(false); }
  };

  return { data, isLoading, error, refetch: fetchAll, create, update, remove };
};
