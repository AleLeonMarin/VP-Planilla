'use client';

import { useState, useEffect } from 'react';
import { LaborEvent, EmployeeLaborEvent, LaborEventFormData } from '@/types/laborEvent';
import { API_CONFIG } from '@/config';

export const useLaborEvents = () => {
  const [events, setEvents] = useState<EmployeeLaborEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/labor-events`);
      if (!response.ok) throw new Error('Error al cargar eventos');
      const data = await response.json();
      // API now returns { laborEvents, employeeEvents }
      const types: any[] = data.laborEvents || [];
      const employeeEvents: any[] = data.employeeEvents || [];
      // Map assignments to frontend shape and attach labor event name
      const mapped = employeeEvents.map(ev => {
        const type = types.find(t => t.id === ev.labor_event_id);
        return {
          id: ev.id,
          employee_id: ev.employee_labor_event_employee_id || ev.employee_id || ev.employee_id,
          labor_event_id: ev.labor_event_id || ev.employee_labor_event_labor_event_id,
          start_date: ev.start_date || ev.employee_labor_event_start_date,
          end_date: ev.end_date || ev.employee_labor_event_end_date,
          status: ev.status || ev.employee_labor_event_status,
          version: ev.version || ev.employee_labor_event_version,
          labor_event_name: type?.name || ev.labor_event_name || null,
        } as any;
      });
      setEvents(mapped as any[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async (eventData: LaborEventFormData) => {
    try {
      // If the client provided a labor_event_id it means the type already exists; otherwise create the labor event first
      let laborEventId: number | undefined = (eventData as any).labor_event_id;
      let created: any = undefined;

      if (!laborEventId && (eventData.name || eventData.description)) {
        // Create labor event (type)
        const resCreate = await fetch(`${API_CONFIG.baseUrl}/labor-events/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: eventData.name, description: eventData.description }),
        });
        if (!resCreate.ok) throw new Error('Error al crear tipo de evento');
        created = await resCreate.json();
        laborEventId = created.id;
      }

      // Now assign to employee
      const assignPayload = {
        employee_id: eventData.employee_id,
        labor_event_id: laborEventId,
        start_date: eventData.start_date instanceof Date ? eventData.start_date.toISOString() : eventData.start_date,
        end_date: eventData.end_date ? (eventData.end_date instanceof Date ? eventData.end_date.toISOString() : eventData.end_date) : null,
        status: eventData.status || 'active'
      };

      const resAssign = await fetch(`${API_CONFIG.baseUrl}/labor-events/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignPayload),
      });

      if (!resAssign.ok) {
        let err = 'Error al asignar evento';
        try { const j = await resAssign.json(); err = JSON.stringify(j); } catch {};
        throw new Error(err);
      }

      const assignedEvent = await resAssign.json();
      // Enrich assigned event with name if we created the labor event just now or provided a name
      const enriched: any = {
        ...assignedEvent,
        labor_event_name: (eventData as any).name || (created ? created.name : undefined),
        start_date: assignPayload.start_date,
        end_date: assignPayload.end_date,
      };
      setEvents(prev => [...prev, enriched]);
      return enriched;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear evento');
      throw err;
    }
  };

  const updateEvent = async (id: number, eventData: Partial<LaborEventFormData>) => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/labor-events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) throw new Error('Error al actualizar evento');
      const updatedEvent = await response.json();
      setEvents(prev => prev.map(event => 
        event.id === id ? updatedEvent : event
      ));
      return updatedEvent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar evento');
      throw err;
    }
  };

  const deleteEvent = async (id: number) => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/labor-events/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar evento');
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar evento');
      throw err;
    }
  };

  const assignEventToEmployee = async (eventData: EmployeeLaborEvent) => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/labor-events/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) throw new Error('Error al asignar evento');
      const assignedEvent = await response.json();
      setEvents(prev => [...prev, assignedEvent]);
      return assignedEvent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al asignar evento');
      throw err;
    }
  };

  // Cargar eventos al montar el componente
  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    assignEventToEmployee,
    refreshEvents: fetchEvents,
  };
};