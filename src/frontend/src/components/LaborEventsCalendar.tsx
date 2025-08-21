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
  events: EmployeeLaborEvent[];
  isLoading: boolean;
  refreshEvents: () => Promise<void>;
  deleteAssignment: (id: number) => Promise<void>;
  preview?: Partial<EmployeeLaborEvent> | null;
  updateEvent?: (id: number, data: Partial<any>) => Promise<any>;
}

const LaborEventsCalendar: React.FC<Props> = ({ onEventClick, onDateSelect, events, isLoading, refreshEvents, deleteAssignment, preview, updateEvent }) => {
  const { employees } = useEmployeeList();
  const { showError } = useModal();
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EmployeeLaborEvent | null>(null);
  const menuOpenedAtRef = React.useRef<number | null>(null);
  const [calendarKey, setCalendarKey] = useState(0); // Force re-render key
  const [currentDate, setCurrentDate] = useState(new Date());

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
      
      // Si es click derecho (button === 2), no hacer nada aquí
      // El menú se abrirá via el event listener de contextmenu
      if (jsEvent.button === 2) return;
    }

    // Solo manejar click izquierdo: abrir modal de edición
    const event = events.find(e => String(e.id) === info.event.id);
    if (event && onEventClick) {
      onEventClick(event);
    }
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

  // Función para obtener eventos del mes actual
  const getCurrentMonthEvents = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return events.filter(event => {
      const startDate = parseBackendDateToLocal(event.start_date as any);
      if (!startDate) return false;
      
      return startDate.getFullYear() === year && startDate.getMonth() === month;
    }).sort((a, b) => {
      const dateA = parseBackendDateToLocal(a.start_date as any);
      const dateB = parseBackendDateToLocal(b.start_date as any);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });
  };

  // Función para formatear la fecha en español
  const formatEventDate = (dateStr: string | Date) => {
    const date = parseBackendDateToLocal(dateStr as any);
    if (!date) return '';
    
    const day = date.getDate();
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dayName = dayNames[date.getDay()];
    
    return `${day} ${dayName}`;
  };

  // Función para obtener el nombre del mes actual
  const getCurrentMonthName = () => {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Cargando eventos...</div>;
  }

  const monthEvents = getCurrentMonthEvents();

  return (
    <div className="flex gap-6">
      {/* Calendario principal */}
      <div className="flex-1 calendar-container bg-white rounded-lg shadow p-4">
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
          datesSet={(dateInfo) => {
            // Usar la fecha del centro de la vista para obtener el mes correcto
            // dateInfo.start puede ser del mes anterior si la vista incluye días de otros meses
            const viewCenter = new Date(dateInfo.start.getTime() + (dateInfo.end.getTime() - dateInfo.start.getTime()) / 2);
            setCurrentDate(viewCenter);
          }}
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

      {/* Minimenu lateral de eventos del mes */}
      <div className="w-80 bg-[#F5F1E8] rounded-lg shadow-sm border border-[#E0D6B7] flex flex-col h-fit max-h-[670px]">
        {/* Header del minimenu */}
        <div className="bg-[#E7DCC1] px-4 py-3 rounded-t-lg border-b border-[#D2B48C] flex-shrink-0">
          <h3 className="text-sm font-semibold text-[#3B4D36] uppercase tracking-wider">
            Eventos - {getCurrentMonthName()}
          </h3>
        </div>

        {/* Lista de eventos */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {monthEvents.length === 0 ? (
            <div className="p-4 text-center text-[#8B8B8B] text-sm">
              No hay eventos este mes
            </div>
          ) : (
            <div className="divide-y divide-[#E0D6B7]">
              {monthEvents.map((event) => {
                const employee = employees.find(e => String(e.id) === String(event.employee_id));
                const eventName = (event as any).labor_event_name || `Evento #${event.labor_event_id}`;
                const startDate = parseBackendDateToLocal(event.start_date as any);
                const endDate = parseBackendDateToLocal(event.end_date as any);
                
                return (
                  <div 
                    key={event.id} 
                    className="p-3 hover:bg-[#FDFCF9] transition-colors cursor-pointer"
                    onClick={() => onEventClick?.(event)}
                  >
                    {/* Fecha del evento */}
                    <div className="flex items-center gap-3 mb-1">
                      <div className="flex flex-col items-center min-w-[40px]">
                        <div className="text-lg font-bold text-[#3B4D36]">
                          {startDate ? startDate.getDate() : '??'}
                        </div>
                        <div className="text-xs text-[#5D4E37] uppercase">
                          {formatEventDate(event.start_date).split(' ')[1]}
                        </div>
                      </div>
                      
                      {/* Información del evento */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-[#3B4D36] text-sm truncate">
                          {eventName}
                        </h4>
                        <p className="text-xs text-[#5D4E37] truncate">
                          {employee ? employee.name : 'Empleado no asignado'}
                        </p>
                        {endDate && endDate.getTime() !== startDate?.getTime() && (
                          <p className="text-xs text-[#8B8B8B]">
                            Hasta: {event.end_date ? formatEventDate(event.end_date) : ''}
                          </p>
                        )}
                      </div>
                      
                      {/* Estado del evento */}
                      <div className="flex flex-col items-end">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.status === 'active' ? 'bg-green-100 text-green-800' :
                          event.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {event.status === 'active' ? 'Activo' :
                           event.status === 'completed' ? 'Completado' :
                           event.status === 'cancelled' ? 'Cancelado' :
                           'Pendiente'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Descripción si existe */}
                    {(event as any).labor_event_description && (
                      <p className="text-xs text-[#8B8B8B] mt-1 line-clamp-2">
                        {(event as any).labor_event_description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LaborEventsCalendar;