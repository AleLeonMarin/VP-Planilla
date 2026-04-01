import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { PositionsService, Position } from '@/services/positionsService';

export const usePositions = () => {
  const [data, setData] = useState<Position[] | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsFetching(true);
    setError(null);
    try {
      const res = await PositionsService.getAllPositions();
      setData(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error cargando posiciones');
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (payload: Partial<Position>) => {
    setIsMutating(true);
    try {
      const created = await PositionsService.createPosition(payload);
      setData(prev => prev ? [created, ...prev] : [created]);
      return created;
    } finally { setIsMutating(false); }
  };

  const update = async (id: number, payload: Partial<Position>) => {
    setIsMutating(true);
    try {
      const updated = await PositionsService.updatePosition(id, payload);
      setData(prev => prev ? prev.map(p => p.id === id ? updated : p) : [updated]);
      return updated;
    } finally { setIsMutating(false); }
  };

  const remove = async (id: number) => {
    setIsMutating(true);
    try {
      await PositionsService.deletePosition(id);
      setData(prev => prev ? prev.filter(p => p.id !== id) : null);
    } finally { setIsMutating(false); }
  };

  return { data, isLoading: isFetching, isMutating, error, refetch: fetchAll, create, update, remove };
};
