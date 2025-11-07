"use client";

import React from 'react';
import { formatCRC } from '@/utils/number';

interface PayrollResultsProps {
  data: any;
  onCreate?: () => void;
}

export default function PayrollResults({ data, onCreate }: PayrollResultsProps) {
  // DEBUG: Log what we receive
  console.log('PayrollResults received data:', data);
  console.log('data.employees:', data?.employees);
  console.log('data.employeeResults:', data?.employeeResults);
  
  if (!data) return null;

  // Try to find an array of employee results
  const employees = Array.isArray(data.employeeResults) ? data.employeeResults : Array.isArray(data.employees) ? data.employees : Array.isArray(data) ? data : null;
  
  console.log('Extracted employees:', employees);

  const total = (employees && employees.reduce) ? employees.reduce((acc: number, e: any) => {
    const netSalary = e.net ?? e.netSalary ?? e.net_salary ?? 0;
    return acc + Number(netSalary);
  }, 0) : null;

  return (
    <div className="p-4 mt-6 bg-white rounded shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Resultados del cálculo</h3>
        {onCreate && (
          <button onClick={onCreate} className="px-4 py-2 text-white bg-green-600 rounded">Guardar planilla</button>
        )}
      </div>

      {!employees && (
        <pre className="p-3 overflow-auto text-sm rounded bg-gray-50">{JSON.stringify(data, null, 2)}</pre>
      )}

      {employees && (
        <div className="overflow-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">Empleado</th>
                <th className="px-3 py-2 text-right">Horas</th>
                <th className="px-3 py-2 text-right">Bruto</th>
                <th className="px-3 py-2 text-right">Deducciones</th>
                <th className="px-3 py-2 text-right">Bonificaciones</th>
                <th className="px-3 py-2 text-right">Neto</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp: any) => {
                // DEBUG: Log each employee object
                console.log('Employee object:', emp);
                console.log('emp.name:', emp.name);
                console.log('emp.employee_name:', emp.employee_name);
                
                // Calculate total hours from days array if available
                const totalHours = emp.days?.reduce((sum: number, day: any) => sum + (day.hoursWorked || 0), 0) || 0;
                const hours = emp.hours ?? emp.total_hours ?? totalHours;
                
                // Get employee name
                const employeeName = emp.name || emp.employee_name || emp.employeeName || emp.employee || `#${emp.employee_id || emp.id}`;
                
                console.log('Final employeeName:', employeeName);
                
                // Get salary values
                const grossSalary = emp.gross ?? emp.grossSalary ?? emp.total_gross ?? 0;
                const totalDeductions = emp.deductions ?? emp.totalDeductions ?? emp.total_deductions ?? 0;
                const bonuses = emp.bonuses ?? emp.total_bonuses ?? 0;
                const netSalary = emp.net ?? emp.netSalary ?? emp.net_salary ?? 0;
                
                return (
                  <tr key={emp.employee_id || emp.id || Math.random()} className="border-t">
                    <td className="px-3 py-2 text-sm font-medium">{employeeName}</td>
                    <td className="px-3 py-2 text-sm text-right">{hours > 0 ? hours : '-'}</td>
                    <td className="px-3 py-2 text-sm text-right">{formatCRC(grossSalary)}</td>
                    <td className="px-3 py-2 text-sm text-right">{formatCRC(totalDeductions)}</td>
                    <td className="px-3 py-2 text-sm text-right">{formatCRC(bonuses)}</td>
                    <td className="px-3 py-2 text-sm font-semibold text-right">{formatCRC(netSalary)}</td>
                  </tr>
                );
              })}
            </tbody>
            {total !== null && (
              <tfoot className="bg-gray-50">
                <tr className="border-t-2 border-gray-300">
                  <td colSpan={5} className="px-3 py-2 font-bold text-right">Total Neto</td>
                  <td className="px-3 py-2 text-lg font-bold text-right">{formatCRC(total)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
