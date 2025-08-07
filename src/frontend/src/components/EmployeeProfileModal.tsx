'use client';

import React from 'react';
import EmployeeProfileCard from './EmployeeProfileCard';
import EmployeeIncidenceCard from './EmployeeIncidenceCard';
import EmployeeAttendanceTable, { AttendanceRecord } from './EmployeeAttendanceTable';

interface EmployeeData {
  id: string;
  name: string;
  position: string;
  phone: string;
  status: string;
  incidences: {
    faltaTiempo: number;
    llegadaTardia: number;
    sobraTiempo: number;
    sinMarcas: number;
  };
  attendanceRecords: AttendanceRecord[];
}

interface EmployeeProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeData?: EmployeeData;
}

const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({ isOpen, onClose, employeeData }) => {
  if (!isOpen) return null;

  // Datos por defecto si no se proporciona employeeData
  const defaultData: EmployeeData = {
    id: "119201921",
    name: "María Solano Rojas",
    position: "Encargado(a) de cajas",
    phone: "+506 8731 0761",
    status: "Al día",
    incidences: {
      faltaTiempo: 2,
      llegadaTardia: 1,
      sobraTiempo: 0,
      sinMarcas: 0
    },
    attendanceRecords: [
      { date: "1 Lun", schedule: "Mañana 8h", entryTime: "08:00 AM", exitTime: "4:00 PM", total: "08:00hr", balance: "00:00" },
      { date: "2 Mar", schedule: "Mañana 8h", entryTime: "08:00 AM", exitTime: "4:31 PM", total: "08:00hr", balance: "+00:31" },
      { date: "3 Mié", schedule: "Mañana 8h", entryTime: "08:00 AM", exitTime: "4:00 PM", total: "08:00hr", balance: "00:00" },
      { date: "4 Jue", schedule: "Mañana 8h", entryTime: "-", exitTime: "-", total: "00:00hr", balance: "-08:00" },
      { date: "5 Vie", schedule: "Mañana 8h", entryTime: "08:00 AM", exitTime: "4:00 PM", total: "08:00hr", balance: "00:00" },
      { date: "6 Sáb", schedule: "No se esperan registros", entryTime: "", exitTime: "", total: "", balance: "", isWeekend: true },
      { date: "7 Dom", schedule: "No se esperan registros", entryTime: "", exitTime: "", total: "", balance: "", isWeekend: true },
      { date: "8 Lun", schedule: "Mañana 8h", entryTime: "08:00 AM", exitTime: "4:00 PM", total: "08:00hr", balance: "00:00" },
      { date: "9 Mar", schedule: "Tarde 8h", entryTime: "2:30 PM", exitTime: "9:07 PM", total: "06:37hr", balance: "-01:22" },
      { date: "10 Mié", schedule: "Tarde 8h", entryTime: "2:42 AM", exitTime: "9:00 PM", total: "08:00hr", balance: "00:00" }
    ]
  };

  const data = employeeData || defaultData;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      style={{ WebkitBackdropFilter: 'blur(4px)', backdropFilter: 'blur(4px)', background: 'rgba(255,255,255,0.2)' }}
    >
      <div className="bg-[#F9F1DC] rounded-lg shadow-2xl w-[1600px] h-[1100px] max-w-[98vw] max-h-[98vh] p-16 relative overflow-hidden">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-[#5D4E37] hover:text-[#3B4D36]"
          onClick={onClose}
        >
          ×
        </button>
        {/* Profile Header */}
        <div className="flex gap-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* Client Component: EmployeeProfileCard */}
            <EmployeeProfileCard
              name={data.name}
              position={data.position}
              id={data.id}
              phone={data.phone}
              status={data.status}
            />
            {/* Client Component: EmployeeIncidenceCard */}
            <EmployeeIncidenceCard
              faltaTiempo={data.incidences.faltaTiempo}
              llegadaTardia={data.incidences.llegadaTardia}
              sobraTiempo={data.incidences.sobraTiempo}
              sinMarcas={data.incidences.sinMarcas}
            />
          </div>
          {/* Attendance Table Section */}
          <EmployeeAttendanceTable
            employeeId={data.id}
            records={data.attendanceRecords}
          />
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfileModal;
