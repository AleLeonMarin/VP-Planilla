"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLaborEvents } from "@/hooks/useLaborEvents";
import useEmployeeList from "@/hooks/useEmployeeList";
import { formatSalary, getStatusBadgeConfig } from "@/utils/employeeUtils";
import { EmployeeLaborEvent } from "@/types/laborEvent";
import { Employee } from "@/types/employee";

interface CalendarEvent {
  date: number;
  type: "highlighted" | "today";
  title: string;
  description?: string;
}

const fallbackCalendarEvents: CalendarEvent[] = [
  { date: 13, type: "highlighted", title: "Quincena de Pago", description: "Primera quincena del mes" },
  { date: 17, type: "highlighted", title: "Reunión de Equipo", description: "Coordinación mensual" },
  { date: 19, type: "highlighted", title: "Día de Pago", description: "Depósito de salarios" },
  { date: 26, type: "highlighted", title: "Cierre de Planilla", description: "Fecha límite de horas" }
];

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const renderCalendarDays = (
  year: number,
  month: number,
  events: CalendarEvent[],
  onMouseEnter: (event: React.MouseEvent, eventData: CalendarEvent) => void,
  onMouseLeave: () => void,
  onClickDay?: (date: Date, dayEvents: CalendarEvent[]) => void
) => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);
  const calendarDays: (number | null)[] = Array(firstDayIndex).fill(null);

  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const totalCells = 6 * 7;
  while (calendarDays.length < totalCells) {
    calendarDays.push(null);
  }

  return calendarDays.map((day, index) => {
    const isCurrentMonthDay = index >= firstDayIndex && index < daysInMonth + firstDayIndex;
    const event = isCurrentMonthDay ? events.find((e) => e.date === day) : undefined;

    let highlightBgClass = "";
    if (event) {
      highlightBgClass = "bg-zinc-50 dark:bg-zinc-700";
    }

    const dayClasses = `
      text-xs font-semibold rounded h-7 flex items-center justify-center
      ${highlightBgClass}
      ${isCurrentMonthDay ? "text-zinc-700 dark:text-zinc-100 bg-white dark:bg-zinc-800" : "text-zinc-400 dark:text-zinc-500 bg-transparent"}
      hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer
    `;

    return (
      <div
        key={`${day}-${index}`}
        className={dayClasses.trim()}
        onMouseEnter={event && isCurrentMonthDay ? (e) => onMouseEnter(e, event) : undefined}
        onMouseLeave={event && isCurrentMonthDay ? onMouseLeave : undefined}
        onClick={
          isCurrentMonthDay && typeof day === "number"
            ? () => {
                const dt = new Date(year, month, day);
                const dayEvents = events.filter((ev) => ev.date === day);
                onClickDay?.(dt, dayEvents);
              }
            : undefined
        }
      >
        {day ?? ""}
      </div>
    );
  });
};

const Home: React.FC = () => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string; visible: boolean }>({
    x: 0,
    y: 0,
    content: "",
    visible: false
  });
  const { events, isLoading: eventsLoading, refreshEvents } = useLaborEvents();
  const { employees, refreshEmployees, stats } = useEmployeeList();
  const [visibleRangeStart, setVisibleRangeStart] = useState<Date | null>(null);
  const [visibleRangeEnd, setVisibleRangeEnd] = useState<Date | null>(null);
  const [dayModal, setDayModal] = useState<{ date: Date; events: EmployeeLaborEvent[] } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshEvents().catch(() => {});
      if (refreshEmployees) { refreshEmployees().catch(() => {}); }
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshEvents, refreshEmployees]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const today = new Date();
  const formattedToday = today.toLocaleDateString("es-CR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  const safeEvents = events ?? [];
  const employeeList = employees ?? [];
  const activeEventsCount = safeEvents.filter((event) => event.status === "active").length;
  const goToPrevMonth = () => {
    setCurrentDate((prevDate) => new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate((prevDate) => new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1));
  };

  const handleMouseEnter = (event: React.MouseEvent, eventData: CalendarEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      content: `${eventData.title}${eventData.description ? `: ${eventData.description}` : ""}`,
      visible: true
    });
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    const start = new Date(currentYear, currentMonth, 1);
    const end = new Date(currentYear, currentMonth, getDaysInMonth(currentYear, currentMonth));
    end.setHours(23, 59, 59, 999);
    setVisibleRangeStart(start);
    setVisibleRangeEnd(end);
  }, [currentMonth, currentYear]);

  const monthlyEvents =
    visibleRangeStart && visibleRangeEnd
      ? safeEvents
          .filter((ev) => {
            try {
              const s = ev.start_date ? new Date(ev.start_date) : null;
              const e = ev.end_date ? new Date(ev.end_date) : s;
              if (!s || !e) return false;
              return !(e.getTime() < visibleRangeStart.getTime() || s.getTime() > visibleRangeEnd.getTime());
            } catch {
              return false;
            }
          })
          .sort((a: EmployeeLaborEvent, b: EmployeeLaborEvent) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      : [];

  const currentMonthEvents =
    safeEvents.length > 0
      ? safeEvents
          .filter((ev) => {
            try {
              const s = ev.start_date ? new Date(ev.start_date) : null;
              return s && s.getMonth() === currentMonth && s.getFullYear() === currentYear;
            } catch {
              return false;
            }
          })
          .map((ev) => ({
            date: new Date(ev.start_date).getDate(),
            type: "highlighted" as const,
            title: ev.labor_event_name || "Evento",
            description: ev.labor_event_description
          }))
      : [];

  const calendarHighlights = currentMonthEvents.length > 0 ? currentMonthEvents : fallbackCalendarEvents;

  const attentionEmployees = employeeList
    .filter((emp) => String(emp.status ?? "").toLowerCase().includes("incompleta"))
    .slice(0, 3);

  const quickActions = [
    {
      label: "Generar reportes",
      description: "Descarga métricas y resúmenes.",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      ),
      action: () => router.push("/pages/reports")
    },
    {
      label: "Calcular planilla",
      description: "Inicia el cálculo de la quincena.",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      ),
      action: () => router.push("/pages/payroll")
    },
    {
      label: "Registro de asistencia",
      description: "Completa y valida asistencias.",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      ),
      action: () => router.push("/pages/attendance")
    }
  ];

  const actionItems = [
    {
      title: "Asistencias por revisar",
      value: stats?.incompleteAssistance ?? 0,
      description: "Registros con inconsistencias en la marcación.",
      actionLabel: "Abrir registro",
      onClick: () => router.push("/pages/attendance")
    },
    {
      title: "Vacaciones activas",
      value: stats?.onVacation ?? 0,
      description: "Colaboradores fuera de oficina.",
      actionLabel: "Ver vacaciones",
      onClick: () => router.push("/pages/vacations")
    },
    {
      title: "Eventos activos",
      value: activeEventsCount,
      description: "Actividades laborales en curso.",
      actionLabel: "Gestionar eventos",
      onClick: () => router.push("/pages/employee/events")
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="px-8 py-6 max-w-screen-2xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest mb-1">Panel General</p>
            <h1 className="text-3xl font-bold text-zinc-700 dark:text-zinc-100 leading-none">Dashboard</h1>
          </div>
          <div className="flex flex-col md:items-end text-sm text-zinc-500 dark:text-zinc-400">
            <span className="uppercase tracking-[0.2em] text-xs text-zinc-500 dark:text-zinc-500">Hoy</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-100">{formattedToday}</span>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <section className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col gap-2 px-6 pt-4 pb-3 md:flex-row md:items-center md:justify-between border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">Eventos del mes</p>
                <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-100">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  onClick={goToPrevMonth}
                  aria-label="Mes anterior"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  onClick={goToNextMonth}
                  aria-label="Mes siguiente"
                >
                  →
                </button>
              </div>
            </div>
            <div className="px-6 py-3">
              <div className="grid grid-cols-7 text-center text-zinc-500 dark:text-zinc-400 font-semibold text-[10px] mb-2 uppercase tracking-wide">
                <span>Dom</span>
                <span>Lun</span>
                <span>Mar</span>
                <span>Mié</span>
                <span>Jue</span>
                <span>Vie</span>
                <span>Sáb</span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {renderCalendarDays(
                  currentYear,
                  currentMonth,
                  calendarHighlights,
                  (e, evData) => handleMouseEnter(e, evData),
                  handleMouseLeave,
                  (dateClicked: Date) => {
                    const fullEvents = safeEvents.filter((ev) => {
                      try {
                        const s = ev.start_date ? new Date(ev.start_date) : null;
                        return (
                          s &&
                          s.getDate() === dateClicked.getDate() &&
                          s.getMonth() === dateClicked.getMonth() &&
                          s.getFullYear() === dateClicked.getFullYear()
                        );
                      } catch {
                        return false;
                      }
                    });
                    setDayModal({ date: dateClicked, events: fullEvents });
                  }
                )}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Activos</p>
                  <p className="text-xl font-semibold text-zinc-700 dark:text-zinc-100">{activeEventsCount}</p>
                </div>
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Programados</p>
                  <p className="text-xl font-semibold text-zinc-700 dark:text-zinc-100">{monthlyEvents.length}</p>
                </div>
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Alertas</p>
                  <p className="text-xl font-semibold text-zinc-700 dark:text-zinc-100">{attentionEmployees.length}</p>
                </div>
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-400 uppercase tracking-[0.3em]">Eventos destacados</p>
                  <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-100">Este mes</h3>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{monthlyEvents.length} eventos</span>
              </div>
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {eventsLoading ? (
                  <div className="text-center text-sm text-zinc-500 dark:text-zinc-400 py-6">Cargando eventos...</div>
                ) : monthlyEvents.length === 0 ? (
                  <div className="text-center text-sm text-zinc-400 dark:text-zinc-500 py-6">
                    No hay eventos registrados en este rango.
                  </div>
                ) : (
                  monthlyEvents.slice(0, 6).map((event) => {
                    const employee = employeeList.find((e) => String(e.id) === String(event.employee_id));
                    const start = event.start_date ? new Date(event.start_date) : null;
                    const end = event.end_date ? new Date(event.end_date) : null;
                    return (
                      <button
                        key={event.id}
                        onClick={() => setDayModal({ date: start ?? new Date(), events: [event] })}
                        className="w-full text-left rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-4 py-3 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-100 truncate">
                            {event.labor_event_name || `Evento #${event.id}`}
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              event.status === "active"
                                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                : event.status === "completed"
                                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                                : event.status === "cancelled"
                                ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-zinc-300"
                            }`}
                          >
                            {event.status || "Pendiente"}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">{employee?.name ?? "Sin asignar"}</p>
                        {start && (
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                            {start.toLocaleDateString("es-CR", { day: "2-digit", month: "short" })}
                            {end && end.getTime() !== start.getTime()
                              ? ` · Termina ${end.toLocaleDateString("es-CR", { day: "2-digit", month: "short" })}`
                              : ""}
                          </p>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-400 uppercase tracking-[0.3em]">Centro de tareas</p>
                  <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-100">Atiende pendientes</h3>
                </div>
              </div>
              <div className="space-y-4">
                {actionItems.map((item) => (
                  <div key={item.title} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-100">{item.title}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.description}</p>
                      </div>
                      <span className="text-2xl font-semibold text-zinc-700 dark:text-zinc-100">{item.value}</span>
                    </div>
                    <button
                      type="button"
                      onClick={item.onClick}
                      className="mt-3 text-xs font-semibold text-green-700 dark:text-green-400 hover:text-zinc-700 dark:hover:text-zinc-100 transition-colors"
                    >
                      {item.actionLabel} →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-400 uppercase tracking-[0.3em]">Información de empleados</p>
              <h3 className="text-xl font-semibold text-zinc-700 dark:text-zinc-100">
                {employeeList.length} colaboradores activos
              </h3>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Vista rápida de los últimos movimientos</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 text-left">Nombre</th>
                  <th className="py-3 px-4 text-left">Posición</th>
                  <th className="py-3 px-4 text-left">Salario</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {employeeList.slice(0, 6).map((employee) => {
                  const badge = getStatusBadgeConfig(String(employee.status ?? ""));
                  const salaryDisplay =
                    typeof employee.salary === "number" ? formatSalary(employee.salary as number) : String(employee.salary ?? "");
                  return (
                    <tr key={employee.id} className="border-t border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-100 font-medium">{employee.name}</td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{employee.position || "Sin asignar"}</td>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-100 font-semibold">{salaryDisplay}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={badge.className}>{badge.text}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.action}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-5 text-left hover:-translate-y-0.5 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3 text-green-700 dark:text-zinc-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {action.icon}
                </svg>
              </div>
              <p className="text-base font-semibold text-zinc-700 dark:text-zinc-100">{action.label}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {dayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 px-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">Eventos</p>
                <h4 className="text-xl font-semibold text-zinc-700 dark:text-zinc-100">
                  {dayModal.date.toLocaleDateString("es-CR", { day: "2-digit", month: "long", year: "numeric" })}
                </h4>
              </div>
              <button onClick={() => setDayModal(null)} className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100">
                Cerrar
              </button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {dayModal.events.length === 0 ? (
                <div className="text-sm text-zinc-400 dark:text-zinc-500">No hay eventos para este día.</div>
              ) : (
                dayModal.events.map((ev: EmployeeLaborEvent) => (
                  <div key={ev.id} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-base font-semibold text-zinc-700 dark:text-zinc-100">{ev.labor_event_name || "Evento"}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {employeeList.find((em: Employee) => String(em.id) === String(ev.employee_id))?.name || "Sin asignar"}
                        </div>
                      </div>
                      <div className="text-xs px-2 py-0.5 rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                        {ev.status}
                      </div>
                    </div>
                    {ev.labor_event_description && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3">{ev.labor_event_description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {tooltip.visible && (
        <div
          className="fixed z-50 bg-green-700 dark:bg-green-700 text-white text-xs rounded-md px-3 py-2 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltip.x,
            top: tooltip.y
          }}
        >
          {tooltip.content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-700"></div>
        </div>
      )}
    </div>
  );
};

export default Home;
