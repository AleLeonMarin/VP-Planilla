import { useState, useEffect, useCallback } from 'react';
import { LaborEventsService } from '@/services/laborEventsService';
import { EmployeeLaborEvent } from '@/types/laborEvent';

interface AssignEventInput {
  labor_event_id: number;
  start_date: string;
  end_date: string | null;
  status: string;
}

/**
 * Hook to fetch labor-event assignments for a single employee and
 * expose mutations to create / delete them. Mirrors useAguinaldo for
 * the read part; mutations re-throw errors so callers can show toasts.
 */
export function useEmployeeEvents(employeeId: number | string | undefined) {
  const [data, setData] = useState<EmployeeLaborEvent[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!employeeId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await LaborEventsService.getByEmployee(Number(employeeId));
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los eventos');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const deleteAssignment = useCallback(
    async (assignmentId: number) => {
      await LaborEventsService.deleteEmployeeLaborEvent(assignmentId);
      await fetchEvents();
    },
    [fetchEvents]
  );

  const assignEvent = useCallback(
    async (input: AssignEventInput) => {
      if (!employeeId) throw new Error('Empleado no especificado');
      await LaborEventsService.assignLaborEventToEmployee({
        employee_id: Number(employeeId),
        labor_event_id: input.labor_event_id,
        start_date: input.start_date,
        end_date: input.end_date,
        status: input.status,
      });
      await fetchEvents();
    },
    [employeeId, fetchEvents]
  );

  return {
    data,
    isLoading,
    error,
    refresh: fetchEvents,
    deleteAssignment,
    assignEvent,
  };
}
