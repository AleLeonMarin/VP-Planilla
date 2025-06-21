"use client";

import { useState } from "react";

// --- Type Definitions ---
interface Employee {
  name: string;
  position: string;
  salary: string; // Using string to keep the '€' symbol and comma formatting
  status: "Al día" | "Asistencia incompleta" | "Vacaciones";
}

interface CalendarEvent {
  date: number; // Day of the month
  type: "highlighted" | "today"; // Added 'today' type if needed for future
}

// --- Dummy Data ---
const employees: Employee[] = [
  {
    name: "María Solano Rojas",
    position: "Encargada de caja",
    salary: "€360,000",
    status: "Al día",
  },
  {
    name: "José Andrés Chavarría Soto",
    position: "Cocinero principal",
    salary: "€450,000",
    status: "Asistencia incompleta",
  },
  {
    name: "Gabriela Solano Méndez",
    position: "Salonera",
    salary: "€320,000",
    status: "Vacaciones",
  },
  {
    name: "Kevin Vargas Umaña",
    position: "Barista",
    salary: "€320,000",
    status: "Al día",
  },
  {
    name: "Sofía Valverde",
    position: "Gerente",
    salary: "€500,000",
    status: "Al día",
  },
  {
    name: "Diego González",
    position: "Mesero",
    salary: "€300,000",
    status: "Al día",
  },
  {
    name: "Laura Picado",
    position: "Cajera",
    salary: "€310,000",
    status: "Asistencia incompleta",
  },
  {
    name: "Pablo Arias",
    position: "Chef de partida",
    salary: "€400,000",
    status: "Al día",
  },
  {
    name: "Valeria Solís",
    position: "Bartender",
    salary: "€330,000",
    status: "Vacaciones",
  },
  {
    name: "Andrés Mora",
    position: "Ayudante de cocina",
    salary: "€280,000",
    status: "Al día",
  },
  {
    name: "Fernanda Ureña",
    position: "Encargada de limpieza",
    salary: "€270,000",
    status: "Al día",
  },
  {
    name: "Ricardo Quesada",
    position: "Seguridad",
    salary: "€350,000",
    status: "Al día",
  },
  {
    name: "Carolina Obando",
    position: "Asistente administrativo",
    salary: "€380,000",
    status: "Al día",
  },
  {
    name: "Daniel Jiménez",
    position: "Repostero",
    salary: "€370,000",
    status: "Vacaciones",
  },
  {
    name: "Silvia Calderón",
    position: "Barista",
    salary: "€320,000",
    status: "Asistencia incompleta",
  },
  {
    name: "Felipe Guzmán",
    position: "Mesero",
    salary: "€300,000",
    status: "Al día",
  },
];

const calendarEvents: CalendarEvent[] = [
  // Events from the screenshot. Note that the highlighted days are 13, 17, 19, 26.
  // The colors imply different types of events or statuses.
  { date: 13, type: "highlighted" }, // Grayish
  { date: 17, type: "highlighted" }, // Grayish
  { date: 19, type: "highlighted" }, // Yellowish
  { date: 26, type: "highlighted" }, // Grayish
];

// Array of month names in Spanish (0-indexed)
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
  "Diciembre",
];

// --- Helper for Calendar Days ---
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  // getDay() returns 0 for Sunday, 1 for Monday... 6 for Saturday
  return new Date(year, month, 1).getDay();
};

const renderCalendarDays = (
  year: number,
  month: number,
  events: CalendarEvent[]
) => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month); // Day of week (0=Sun, 6=Sat) for the 1st of the month
  const calendarDays: (number | null)[] = Array(firstDayIndex).fill(null); // Fill leading empty days

  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Fill trailing days from the next month to complete the 6x7 grid
  const totalCells = 6 * 7;
  const remainingCells = totalCells - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push(i);
  }

  return calendarDays.map((day, index) => {
    const isCurrentMonthDay =
      index >= firstDayIndex && index < daysInMonth + firstDayIndex;
    const event = isCurrentMonthDay
      ? events.find((e) => e.date === day)
      : undefined;

    let highlightBgClass = "";
    if (event) {
      // Apply distinct colors for highlighted dates based on the screenshot
      if (event.date === 19) {
        // The yellowish highlight
        highlightBgClass = "bg-[#F0EAD6]"; // Specific yellowish-beige color
      } else {
        // The grayish highlights
        highlightBgClass = "bg-[#D4D2C3]"; // Specific grayish color
      }
    }

    const dayClasses = `
            text-center rounded-full text-base font-semibold
            ${highlightBgClass}
            ${
              !isCurrentMonthDay ? "text-gray-400" : "text-[#5C5C5C]"
            } /* Muted gray for current month days */
            ${
              index % 7 === 0 || index % 7 === 6
                ? "bg-[#ECEAE0] bg-opacity-70"
                : ""
            } /* Subtle background for Sunday/Saturday columns */
            flex items-center justify-center h-10 w-10 mx-auto /* Ensure consistent size and centering for each day cell */
        `;

    return (
      <div key={index} className={dayClasses.trim()}>
        {day}
      </div>
    );
  });
};

// --- React Components ---

const Home: React.FC = () => {
  // Initialize state with current date (June 2025 as per previous discussions/screenshot)
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 1)); // Set to 1st of the month

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const goToPrevMonth = () => {
    setCurrentDate((prevDate) => {
      return new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1);
    });
  };

  const goToNextMonth = () => {
    setCurrentDate((prevDate) => {
      return new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1);
    });
  };

  return (
    <div className="h-screen overflow-auto ">
      <div className="flex flex-col gap-5 p-5 min-h-full font-sans">
        {/* Top Section: Events and Pending Tasks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Events of the Month */}
          <div className="col-span-2 bg-[#FCF1D5] rounded-xl shadow-md p-5 flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
              EVENTOS DEL MES
            </h3>

            <div className="border border-[#D4BD80] rounded-lg p-4 flex-1">
              {/* Month Navigation */}
              <div className="flex items-center justify-between text-base text-gray-600 pb-3 border-b border-[#D4BD80] mb-4">
                <button
                  className="cursor-pointer select-none text-2xl hover:text-gray-800 transition-colors p-2 rounded-lg hover:bg-white hover:bg-opacity-50"
                  onClick={goToPrevMonth}
                >
                  ←
                </button>
                <span className="text-[#3B4D36] text-xl font-semibold">
                  {monthNames[currentMonth]} {currentYear}
                </span>
                <button
                  className="cursor-pointer select-none text-2xl hover:text-gray-800 transition-colors p-2 rounded-lg hover:bg-white hover:bg-opacity-50"
                  onClick={goToNextMonth}
                >
                  →
                </button>
              </div>

              {/* Week Days */}
              <div className="grid grid-cols-7 text-center text-[#5C5C5C] font-bold text-sm mb-3 pb-2 border-b border-[#D4BD80]">
                <span>Domingo</span>
                <span>Lunes</span>
                <span>Martes</span>
                <span>Miércoles</span>
                <span>Jueves</span>
                <span>Viernes</span>
                <span>Sábado</span>
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {renderCalendarDays(currentYear, currentMonth, calendarEvents)}
              </div>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="bg-[#FCF1D5] rounded-xl shadow-md p-5">
            <h3 className="text-lg font-bold text-[#3B4D36] mb-4">
              TAREAS PENDIENTES
            </h3>
            <div className="h-40 bg-[#E7E0C4] border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 text-sm">
              No hay tareas pendientes.
            </div>
          </div>
        </div>

        {/* Employee Information */}
        <div className="bg-[#FCF1D5] rounded-xl shadow-md p-5">
          <h3 className="text-lg font-bold text-[#3B4D36] mb-4">
            INFORMACIÓN DE EMPLEADOS | {employees.length} Empleados
          </h3>

          <div className="overflow-x-auto overflow-y-auto max-h-96 rounded-lg border border-[#D4BD80] bg-white">
            <table className="w-full table-fixed min-w-[800px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#ECEAE0] text-[#5C5C5C] text-sm font-normal border-b border-[#D4BD80]">
                  <th className="text-left py-3 px-4 w-1/4">Nombre</th>
                  <th className="text-left py-3 px-4 w-1/4">Posición</th>
                  <th className="text-left py-3 px-4 w-1/4">Salario</th>
                  <th className="text-center py-3 px-4 w-1/4">Estado</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee, index) => (
                  <tr
                    key={index}
                    className="hover:bg-[#F8F6F0] transition-colors duration-150"
                  >
                    <td className="py-3 px-4 text-[#5C5C5C] text-sm border-b border-[#E5E3D8]">
                      {employee.name}
                    </td>
                    <td className="py-3 px-4 text-[#5C5C5C] text-sm border-b border-[#E5E3D8]">
                      {employee.position}
                    </td>
                    <td className="py-3 px-4 text-[#5C5C5C] text-sm border-b border-[#E5E3D8] font-medium">
                      {employee.salary}
                    </td>
                    <td className="py-3 px-4 text-sm text-center border-b border-[#E5E3D8]">
                      <span
                        className={
                          `inline-block px-3 py-1 rounded-full text-xs font-semibold min-w-[100px] text-center
                         ${employee.status === "Al día"
                           ? "bg-[#D4EDDA] text-[#155724]"
                           : ""}
                         ${employee.status === "Asistencia incompleta"
                           ? "bg-[#F8D7DA] text-[#721C24]"
                           : ""}
                         ${employee.status === "Vacaciones"
                           ? "bg-[#FFEEDD] text-[#856404]"
                           : ""}
                        `
                        }
                      >
                        {employee.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border border-gray-200">
            <span className="text-4xl mb-3">📄</span>
            <span className="text-lg font-bold text-gray-700">
              Generar Reporte
            </span>
          </div>
          <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border border-gray-200">
            <span className="text-4xl mb-3">📊</span>
            <span className="text-lg font-bold text-gray-700 text-center">
              Calcular planilla de quincena
            </span>
          </div>
          <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border border-gray-200">
            <span className="text-4xl mb-3">📅</span>
            <span className="text-lg font-bold text-gray-700 text-center">
              Completar registro de asistencia
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
