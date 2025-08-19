'use client';

import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EmployeeLaborEvent } from '@/types/laborEvent';
import { useModal } from '@/hooks/useModal';
import useEmployeeList from '@/hooks/useEmployeeList';
import '@/styles/calendar.css';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface Props {
  onEventClick?: (event: EmployeeLaborEvent) => void;
  onDateSelect?: (start: Date, end: Date) => void;
  // New props to receive events and control functions from parent hook
  events: EmployeeLaborEvent[];
  isLoading: boolean;
  refreshEvents: () => Promise<void>;
  deleteAssignment: (id: number) => Promise<void>;
  preview?: Partial<EmployeeLaborEvent> | null;
  // New: update event handler provided by parent
  updateEvent?: (id: number, data: Partial<any>) => Promise<any>;
}

const LaborEventsCalendar: React.FC<Props> = ({ onEventClick, onDateSelect, events, isLoading, refreshEvents, deleteAssignment, preview, updateEvent }) => {
  const { employees } = useEmployeeList();
  const { showError } = useModal();
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EmployeeLaborEvent | null>(null);
  const menuOpenedAtRef = React.useRef<number | null>(null);
  const [calendarKey, setCalendarKey] = useState(0); // Force re-render key

  // Force calendar re-render when events change
  React.useEffect(() => {
    setCalendarKey(prev => prev + 1);
  }, [events]);

  // Also force re-render when employees change (needed for event titles)
  React.useEffect(() => {
    setCalendarKey(prev => prev + 1);
  }, [employees]);

  // Función auxiliar para determinar el color del evento según su estado
  const getEventColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#3B4D36'; // Verde oscuro
      case 'completed':
        return '#6F7153'; // Verde grisáceo
      case 'cancelled':
        return '#E7DCC1'; // Beige
      default:
        return '#A7AA94'; // Verde claro
    }
  };

  // Helper: parse backend date strings into local Date objects while avoiding UTC-midnight shifts
  function parseBackendDateToLocal(dateStr?: string | null) {
    if (!dateStr) return undefined;
    try {
      // If backend provided a UTC-midnight string like 2025-08-18T00:00:00Z
      // treat it as a local all-day date (preserve Y-M-D) to avoid shifting to previous day in local timezone.
      const utcMidnightRegex = /^(\d{4}-\d{2}-\d{2})T00:00:00(?:\.000)?Z$/;
      const m = String(dateStr).match(utcMidnightRegex);
      if (m) {
        const [y, mo, d] = m[1].split('-').map(Number);
        return new Date(y, mo - 1, d, 0, 0, 0);
      }

      // Otherwise, try normal Date parsing (keeps time component)
      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) return undefined;
      return parsed;
    } catch (e) {
      return undefined;
    }
  }

  // Convertir eventos a formato FullCalendar
  const calendarEvents = events.map(event => {
    const emp = employees.find(e => String(e.id) === String(event.employee_id || (event as any).employee_labor_event_employee_id));
    const employeeName = emp ? emp.name : 'Empleado';
    const titleName = (event as any).labor_event_name || `Evento #${event.labor_event_id}`;

    const startDate = parseBackendDateToLocal(event.start_date as any);
    let endDate = parseBackendDateToLocal(event.end_date as any);

    // If backend sent a UTC-midnight string we treat as allDay. Ensure endDate is exclusive (add 1 day)
    const isAllDay = typeof event.start_date === 'string' && /T00:00:00(?:\.000)?Z$/.test(String(event.start_date));
    if (isAllDay) {
      // If endDate not provided or not after startDate, set endDate = startDate + 1 day so it renders as full single-day event
      if (!endDate || (startDate && endDate && endDate.getTime() <= (startDate.getTime()))) {
        if (startDate) {
          const nd = new Date(startDate);
          nd.setDate(nd.getDate() + 1);
          endDate = nd;
        }
      }
    }

    return {
      id: String(event.id),
      title: `${titleName} - ${employeeName}`,
      start: startDate,
      end: endDate || undefined,
      allDay: isAllDay,
      backgroundColor: '#A7AA94',
      borderColor: '#6F7153',
      textColor: '#3B4D36',
      extendedProps: { ...event }
    };
  });

  // Add preview event if provided
  if (preview) {
    const emp = employees.find(e => String(e.id) === String(preview.employee_id));
    const empName = emp ? emp.name : 'Empleado';
    const title = (preview as any).labor_event_name || 'Evento (previsualización)';
    const start = preview.start_date ? (preview.start_date instanceof Date ? preview.start_date : parseBackendDateToLocal(String(preview.start_date))) : undefined;
    let end = preview.end_date ? (preview.end_date instanceof Date ? preview.end_date : parseBackendDateToLocal(String(preview.end_date))) : undefined;
    const isAllDayPreview = typeof preview.start_date === 'string' && /T00:00:00(?:\.000)?Z$/.test(String(preview.start_date));

    if (isAllDayPreview) {
      if (!end || (start && end && end.getTime() <= start.getTime())) {
        if (start) {
          const nd = new Date(start);
          nd.setDate(nd.getDate() + 1);
          end = nd;
        }
      }
    }

    if (start) {
      calendarEvents.push({
        id: 'preview',
        title: `${title} - ${empName}`,
        start,
        end: end || undefined,
        allDay: isAllDayPreview,
        backgroundColor: '#3B4D36',
        borderColor: '#3B4D36',
        textColor: '#fff',
        extendedProps: { ...(preview as any), __isPreview: true }
      });
    }
  }

  const openMenuForEvent = (ev: any, clientX: number, clientY: number) => {
    const eventObj = events.find(e => String(e.id) === String(ev.id));
    setSelectedEvent(eventObj || null);
    setAnchor({ x: clientX, y: clientY });
    // mark when menu was opened to avoid immediate outside-click closing
    menuOpenedAtRef.current = Date.now();
  };

  const closeMenu = () => {
    setAnchor(null);
    setSelectedEvent(null);
    menuOpenedAtRef.current = null;
  };

  const handleDeleteClick = async () => {
    if (!selectedEvent) return;
    try {
      await deleteAssignment(selectedEvent.id);
      // Force refresh of calendar events after deletion
      await refreshEvents();
      closeMenu();
    } catch (err) {
      showError('Error', 'No se pudo eliminar la asignación');
    }
  };

  const handleEventClick = (info: any) => {
    // Prevent the browser context menu and ignore right-clicks
    const jsEvent = info.jsEvent;
    if (jsEvent) {
      // Prevent default to stop browser context menu appearing
      jsEvent.preventDefault();
      jsEvent.stopPropagation();
      // If right-click (button === 2) don't open the custom menu
      if (jsEvent.button === 2) return;
    }

    const event = events.find(e => String(e.id) === info.event.id);
    if (event && onEventClick) {
      onEventClick(event);
    }
    // open the small options menu near cursor (offset a little)
    const { clientX = 0, clientY = 0 } = jsEvent || {};
    openMenuForEvent(info.event.toPlainObject(), clientX + 6, clientY + 6);
  };

  // Close menu on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!anchor) return;
      // ignore clicks that happen immediately after opening the menu (often generated by the same interaction)
      if (menuOpenedAtRef.current && Date.now() - menuOpenedAtRef.current < 300) return;
      // If click is outside the menu, close it
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const menu = document.querySelector('.laborevent-options-menu');
      if (menu && !menu.contains(target)) {
        closeMenu();
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [anchor]);

  const handleDateSelect = (selectInfo: any) => {
    if (onDateSelect) {
      onDateSelect(selectInfo.start, selectInfo.end);
    }
  };

  // Handle event resizing (drag to extend duration)
  const handleEventResize = async (resizeInfo: any) => {
    const eventId = Number(resizeInfo.event.id);
    const payload = {
      start_date: resizeInfo.event.start ? resizeInfo.event.start.toISOString() : null,
      end_date: resizeInfo.event.end ? resizeInfo.event.end.toISOString() : null,
    };

    try {
      // Try parent provided updater first
      if (updateEvent) {
        try {
          await updateEvent(eventId, payload);
        } catch (errUpdate) {
          // If updateEvent exists but fails, fall through to attempt PATCH on assign endpoint
          console.warn('updateEvent failed, attempting fallback PATCH', errUpdate);
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/labor-events/assign/${eventId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
      } else {
        // fallback: call assign PATCH endpoint
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/labor-events/assign/${eventId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      await refreshEvents();
    } catch (err) {
      // revert UI change
      try { resizeInfo.revert(); } catch(e){}
      showError('Error', 'No se pudo actualizar la duración del evento');
    }
  };

  // Handle event drag and drop (move to different dates)
  const handleEventDrop = async (dropInfo: any) => {
    const eventId = Number(dropInfo.event.id);
    const payload = {
      start_date: dropInfo.event.start ? dropInfo.event.start.toISOString() : null,
      end_date: dropInfo.event.end ? dropInfo.event.end.toISOString() : null,
    };

    try {
      if (updateEvent) {
        try {
          await updateEvent(eventId, payload);
        } catch (errUpdate) {
          console.warn('updateEvent failed, attempting fallback PATCH', errUpdate);
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/labor-events/assign/${eventId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
      } else {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/labor-events/assign/${eventId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      await refreshEvents();
    } catch (err) {
      try { dropInfo.revert(); } catch(e){}
      showError('Error', 'No se pudo mover el evento');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Cargando eventos...</div>;
  }

  return (
    <div className="calendar-container bg-white rounded-lg shadow p-4">
      <FullCalendar
        key={calendarKey} // Force re-render when events change
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={calendarEvents}
        // Ensure FullCalendar uses local timezone to avoid day-shifts
        timeZone="local"
        // Enable event resizing and dragging
        editable={true}
        eventResizableFromStart={true}
        eventDurationEditable={true}
        eventStartEditable={true}
        // Event interaction handlers
        eventResize={handleEventResize}
        eventDrop={handleEventDrop}
        // Prevent browser context menu on event elements
        eventDidMount={(info) => {
          try {
            // prevent default context menu and open our custom one
            info.el.addEventListener('contextmenu', (e: MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                const evObj = info.event.toPlainObject();
                openMenuForEvent(evObj, e.clientX || 0, e.clientY || 0);
              } catch (ex) {}
            });

          } catch (e) {
            // ignore
          }
        }}
        eventClick={handleEventClick}
        select={handleDateSelect}
        selectable={true}
        locale="es"
        height="auto"
      />

      {/* Options popover */}
      {anchor && selectedEvent && (
        <div
          style={{ position: 'fixed', left: anchor.x, top: anchor.y, transform: 'translate(6px, 6px)' }}
          className="laborevent-options-menu z-50 w-48 bg-[#F9F1DC] border rounded-md shadow-lg"
        >
          <div className="py-1">
            <button
              onClick={() => { if (selectedEvent) onEventClick?.(selectedEvent); closeMenu(); }}
              className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-[#3B4D36] hover:bg-[#E7DCC1] transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
              Ver Perfil
            </button>
            <button
              onClick={() => { /* TODO: open edit modal */ closeMenu(); }}
              className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-[#3B4D36] hover:bg-[#E7DCC1] transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
              Editar Información
            </button>
            <div className="border-t border-[#E7DCC1] mx-2 my-1"></div>
            <button
              onClick={handleDeleteClick}
              className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-red-600 hover:bg-[#E7DCC1] transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaborEventsCalendar;