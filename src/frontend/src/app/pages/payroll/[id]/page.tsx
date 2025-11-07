"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { PayrollService, Payroll, PayrollEmployee } from '@/services/payrollService';
import { formatCRC } from '@/utils/number';

export default function PayrollDetailPage() {
  const pathname = usePathname();
  const [payrollId, setPayrollId] = useState<number | null>(null);
  const [payroll, setPayroll] = useState<Payroll | null>(null);
  const [employees, setEmployees] = useState<PayrollEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parts = pathname?.split('/') || [];
    const last = parts[parts.length - 1];
    const parsed = Number(last);
    if (!isNaN(parsed)) setPayrollId(parsed);
  }, [pathname]);

  useEffect(() => {
    if (!payrollId) return;
    loadPayrollDetails(payrollId);
  }, [payrollId]);

  const loadPayrollDetails = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const payrollData = await PayrollService.getPayrollById(id);
      setPayroll(payrollData);
      const employeesData = await PayrollService.getPayrollEmployees(id);
      setEmployees(employeesData);
    } catch (err) {
      const message = (err as Error)?.message || 'Error al cargar los detalles de la planilla';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => formatCRC(value);

  const formatDate = (date: string) => {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('es-CR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return String(date);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'CALCULADO' || status === 'PAGADO' || status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
          <CheckCircleIcon className="w-4 h-4" />
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-full">
        <ClockIcon className="w-4 h-4" />
        {status || 'Pendiente'}
      </span>
    );
  };

  const totals = employees.reduce(
    (acc, emp) => ({
      grossSalary: acc.grossSalary + emp.gross_salary,
      totalDeductions: acc.totalDeductions + emp.total_deductions,
      netSalary: acc.netSalary + emp.net_salary
    }),
    { grossSalary: 0, totalDeductions: 0, netSalary: 0 }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#E7DCC1] p-6">
        <div className="mx-auto max-w-7xl">
          <div className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6F7153] mx-auto mb-4"></div>
            <p className="text-[#5D4E37]">Cargando detalles de la planilla...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !payroll) {
    return (
      <div className="min-h-screen bg-[#E7DCC1] p-6">
        <div className="mx-auto max-w-7xl">
          <div className="p-8 text-center border border-red-200 bg-red-50 rounded-xl">
            <p className="mb-4 text-red-700">⚠️ {error || 'No se pudo cargar la planilla'}</p>
            <Link
              href="/pages/payroll/list"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Volver al listado
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E7DCC1]">
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <Link
              href="/pages/payroll/list"
              className="inline-flex items-center gap-2 text-[#6F7153] hover:text-[#5D614A] mb-4"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Volver al listado
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-[#3B4D36]">Planilla #{payroll.id}</h1>
                <p className="text-sm text-[#6B5B3D] mt-1">Detalle completo del cálculo de planilla</p>
              </div>
              <div>{getStatusBadge(payroll.status)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
            <div className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-5">
              <div className="flex items-center gap-3 mb-2">
                <CalendarIcon className="w-5 h-5 text-[#6F7153]" />
                <h3 className="text-sm font-medium text-[#6B5B3D]">Periodo</h3>
              </div>
              <p className="text-lg font-semibold text-[#3B4D36]">{formatDate(payroll.period_start)}</p>
              <p className="text-sm text-[#6B5B3D]">al {formatDate(payroll.period_end)}</p>
            </div>
            <div className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-5">
              <div className="flex items-center gap-3 mb-2">
                <CurrencyDollarIcon className="w-5 h-5 text-[#6F7153]" />
                <h3 className="text-sm font-medium text-[#6B5B3D]">Fecha de pago</h3>
              </div>
              <p className="text-lg font-semibold text-[#3B4D36]">{payroll.payment_date ? formatDate(payroll.payment_date) : '—'}</p>
            </div>
            <div className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-5">
              <div className="flex items-center gap-3 mb-2">
                <UserGroupIcon className="w-5 h-5 text-[#6F7153]" />
                <h3 className="text-sm font-medium text-[#6B5B3D]">Empleados</h3>
              </div>
              <p className="text-2xl font-bold text-[#3B4D36]">{employees.length}</p>
            </div>
            <div className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-5">
              <div className="flex items-center gap-3 mb-2">
                <DocumentTextIcon className="w-5 h-5 text-[#6F7153]" />
                <h3 className="text-sm font-medium text-[#6B5B3D]">Tipo</h3>
              </div>
              <p className="text-lg font-semibold text-[#3B4D36]">{payroll.payroll_type ? `Tipo ${payroll.payroll_type}` : 'No especificado'}</p>
            </div>
          </div>

          <div className="bg-linear-to-r from-[#6F7153] to-[#5D614A] rounded-xl shadow-lg p-6 mb-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Resumen Total</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <p className="text-[#E7DCC1] text-sm mb-1">Salario Bruto Total</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(totals.grossSalary)}</p>
              </div>
              <div>
                <p className="text-[#E7DCC1] text-sm mb-1">Deducciones Totales</p>
                <p className="text-3xl font-bold text-red-300">- {formatCurrency(totals.totalDeductions)}</p>
              </div>
              <div>
                <p className="text-[#E7DCC1] text-sm mb-1">Salario Neto Total</p>
                <p className="text-3xl font-bold text-green-300">{formatCurrency(totals.netSalary)}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] overflow-hidden">
            <div className="p-5 border-b border-[#E0D6B7]">
              <h2 className="text-xl font-semibold text-[#3B4D36]">Desglose por Empleado</h2>
            </div>
            {employees.length === 0 ? (
              <div className="p-12 text-center">
                <UserGroupIcon className="w-16 h-16 text-[#B8A989] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#3B4D36] mb-2">No hay empleados en esta planilla</h3>
                <p className="text-sm text-[#6B5B3D]">Esta planilla no tiene empleados asignados o no se ha calculado aún.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#E7DCC1]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#3B4D36] uppercase tracking-wider">Empleado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#3B4D36] uppercase tracking-wider">Identificación</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#3B4D36] uppercase tracking-wider">Puesto</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#3B4D36] uppercase tracking-wider">Salario Bruto</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#3B4D36] uppercase tracking-wider">Deducciones</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#3B4D36] uppercase tracking-wider">Salario Neto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0D6B7]">
                    {employees.map(emp => (
                      <tr key={emp.id} className="hover:bg-[#F5EDD5] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#3B4D36]">{emp.employee_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B5B3D]">{emp.employee_identification}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B5B3D]">{emp.position_name || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-[#3B4D36]">{formatCurrency(emp.gross_salary)}</td>
                        <td className="px-6 py-4 text-sm font-medium text-right text-red-600 whitespace-nowrap">{formatCurrency(emp.total_deductions)}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-right text-green-700 whitespace-nowrap">{formatCurrency(emp.net_salary)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#E7DCC1] font-semibold">
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-sm text-[#3B4D36]">TOTALES</td>
                      <td className="px-6 py-4 text-right text-sm text-[#3B4D36]">{formatCurrency(totals.grossSalary)}</td>
                      <td className="px-6 py-4 text-sm text-right text-red-700">{formatCurrency(totals.totalDeductions)}</td>
                      <td className="px-6 py-4 text-sm text-right text-green-700">{formatCurrency(totals.netSalary)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
