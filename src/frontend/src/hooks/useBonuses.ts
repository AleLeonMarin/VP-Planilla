import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { BonusesService, Bonus } from '@/services/bonusesService';
import { readCache, writeCache, invalidateCache } from '@/utils/sessionCache';

const CACHE_KEY = 'vp_bonuses_cache';

export const useBonuses = () => {
  const [data, setData] = useState<Bonus[] | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const cached = readCache<Bonus[]>(CACHE_KEY);
    if (cached) { setData(cached); return; }
    setIsFetching(true);
    setError(null);
    try {
      const res = await BonusesService.getAllBonuses();
      setData(res);
      writeCache(CACHE_KEY, res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error cargando bonificaciones');
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (payload: Partial<Bonus>) => {
    setIsMutating(true);
    try {
      const created = await BonusesService.createBonus(payload);
      invalidateCache(CACHE_KEY);
      setData(prev => prev ? [created, ...prev] : [created]);
      return created;
    } finally { setIsMutating(false); }
  };

  const update = async (id: number, payload: Partial<Bonus>) => {
    setIsMutating(true);
    try {
      const updated = await BonusesService.updateBonus(id, payload);
      invalidateCache(CACHE_KEY);
      setData(prev => prev ? prev.map(p => p.id === id ? updated : p) : [updated]);
      return updated;
    } finally { setIsMutating(false); }
  };

  const remove = async (id: number) => {
    setIsMutating(true);
    try {
      await BonusesService.deleteBonus(id);
      invalidateCache(CACHE_KEY);
      setData(prev => prev ? prev.filter(p => p.id !== id) : null);
    } finally { setIsMutating(false); }
  };

  return { data, isLoading: isFetching, isMutating, error, refetch: fetchAll, create, update, remove };
};
