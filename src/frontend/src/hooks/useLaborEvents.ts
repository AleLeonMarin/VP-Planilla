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
      console.log('Fetching events from API...'); // DEBUG
      const response = await fetch(`${API_CONFIG.baseUrl}/labor-events`);
      if (!response.ok) throw new Error('Error al cargar eventos');
      const data = await response.json();
      console.log('Raw API response:', data); // DEBUG
      
      // API now returns { laborEvents, employeeEvents }
      const types: any[] = data.laborEvents || [];
      const employeeEvents: any[] = data.employeeEvents || [];
      console.log('Types:', types.length, 'Employee events:', employeeEvents.length); // DEBUG
      
      // Map assignments to frontend shape and attach labor event name
      const mapped = employeeEvents.map(ev => {
        console.log('Raw employee event from backend:', ev); // DEBUG - para ver la estructura real
        
        return {
          id: ev.id,
          employee_id: ev.employee_labor_event_employee_id || ev.employee_id,
          labor_event_id: ev.labor_event_id || ev.employee_labor_event_labor_event_id,
          start_date: ev.start_date || ev.employee_labor_event_start_date,
          end_date: ev.end_date || ev.employee_labor_event_end_date,
          status: ev.status || ev.employee_labor_event_status,
          version: ev.version || ev.employee_labor_event_version,
          // Ahora el backend envía estos campos correctamente
          labor_event_name: ev.labor_event_name,
          labor_event_description: ev.labor_event_description,
        } as any;
      });
      console.log('Mapped events:', mapped.length, mapped); // DEBUG
      setEvents(mapped as any[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async (eventData: LaborEventFormData) => {
    console.log('createEvent called with:', eventData); // DEBUG
    try {
      // If the client provided a labor_event_id it means the type already exists; otherwise create the labor event first
      let laborEventId: number | undefined = (eventData as any).labor_event_id;
      let created: any = undefined;

      if (!laborEventId && (eventData.name || eventData.description)) {
        console.log('Creating labor event type...'); // DEBUG
        // Create labor event (type)
        const resCreate = await fetch(`${API_CONFIG.baseUrl}/labor-events/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: eventData.name, description: eventData.description }),
        });
        if (!resCreate.ok) throw new Error('Error al crear tipo de evento');
        created = await resCreate.json();
        laborEventId = created.id;
        console.log('Labor event type created:', created); // DEBUG
      }

      console.log('Assigning event to employee...'); // DEBUG
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
      console.log('Event assigned successfully:', assignedEvent); // DEBUG
      
      // Force immediate refresh from server to ensure data consistency
      console.log('Calling fetchEvents to refresh...'); // DEBUG
      await fetchEvents();
      console.log('fetchEvents completed'); // DEBUG
      
      // Return enriched event data
      const enriched: any = {
        ...assignedEvent,
        labor_event_name: (eventData as any).name || (created ? created.name : undefined),
        start_date: assignPayload.start_date,
        end_date: assignPayload.end_date,
      };
      
      return enriched;
    } catch (err) {
      console.error('Error in createEvent:', err); // DEBUG
      setError(err instanceof Error ? err.message : 'Error al crear evento');
      throw err;
    }
  };

  const updateEvent = async (id: number, eventData: Partial<LaborEventFormData>) => {
    try {
      console.log('updateEvent called with:', { id, eventData }); // DEBUG
      
      // Cuando editamos un evento, necesitamos actualizar la asignación del empleado, no el tipo de evento
      // El id que recibimos es el ID de la asignación (employee_labor_event_id)
      
      // Preparar el payload para actualizar la asignación
      const updatePayload: any = {};
      
      if (eventData.start_date) {
        updatePayload.start_date = eventData.start_date instanceof Date ? 
          eventData.start_date.toISOString() : eventData.start_date;
      }
      
      if (eventData.end_date) {
        updatePayload.end_date = eventData.end_date instanceof Date ? 
          eventData.end_date.toISOString() : eventData.end_date;
      }
      
      if (eventData.status) {
        updatePayload.status = eventData.status;
      }
      
      if (eventData.employee_id) {
        updatePayload.employee_id = eventData.employee_id;
      }

      console.log('Update payload being sent:', updatePayload); // DEBUG

      // Si se está actualizando el nombre o descripción del evento, necesitamos actualizar el tipo de evento
      const currentEvent = events.find(e => e.id === id);
      if (currentEvent && (eventData.name || eventData.description)) {
        const eventTypePayload: any = {};
        if (eventData.name) eventTypePayload.name = eventData.name;
        if (eventData.description) eventTypePayload.description = eventData.description;
        
        console.log('Updating event type with:', eventTypePayload); // DEBUG
        
        // Actualizar el tipo de evento
        const eventTypeResponse = await fetch(`${API_CONFIG.baseUrl}/labor-events/${currentEvent.labor_event_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventTypePayload),
        });
        
        if (!eventTypeResponse.ok) {
          throw new Error('Error al actualizar el tipo de evento');
        }
      }

      // Actualizar la asignación del empleado usando el endpoint PUT
      console.log('Sending PUT request to:', `${API_CONFIG.baseUrl}/labor-events/assign/${id}`); // DEBUG
      const response = await fetch(`${API_CONFIG.baseUrl}/labor-events/assign/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PUT request failed:', response.status, errorText); // DEBUG
        throw new Error('Error al actualizar evento');
      }
      
      const responseData = await response.json();
      console.log('PUT response received:', responseData); // DEBUG
      
      // Refrescar los eventos desde el servidor para obtener los datos actualizados
      await fetchEvents();
      
      // Retornar éxito sin intentar buscar el evento actualizado
      // ya que fetchEvents() actualizará el estado y los componentes se re-renderizarán
      return { success: true };
    } catch (err) {
      console.error('Error in updateEvent:', err); // DEBUG
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

  // Delete an employee-assignment using the new backend endpoint
  const deleteAssignment = async (id: number) => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/labor-events/assign/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar asignación');
      // Refresh from server to get updated data
      await fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar asignación');
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
      // Refresh from server to get complete updated data
      await fetchEvents();
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
    deleteAssignment,
    refreshEvents: fetchEvents,
  };
};