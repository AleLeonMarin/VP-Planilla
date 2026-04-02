"use client";

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { usePayrollEmployees } from '@/hooks/usePayrollEmployees';
import { formatCRC } from '@/utils/number';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
} from '@heroicons/react/24/outline';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PayrollEmployeesPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const payrollId = parseInt(resolvedParams.id, 10);
  
  const { data: employees, isLoading, error, fetchPayrollEmployees } = usePayrollEmployees(payrollId);

  useEffect(() => {
    if (!isNaN(payrollId)) {
      fetchPayrollEmployees(payrollId);
    }
  }, [payrollId, fetchPayrollEmployees]);

  const totalGrossSalary = employees.reduce((sum, emp) => sum + emp.gross_salary, 0);
  const totalDeductions = employees.reduce((sum, emp) => sum + emp.total_deductions, 0);
  const totalNetSalary = employees.reduce((sum, emp) => sum + emp.net_salary, 0);

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-zinc-700 dark:text-zinc-100" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Empleados en Planilla</h1>
              <p className="text-zinc-500 dark:text-zinc-400">Planilla #{payrollId}</p>
            </div>
          </div>
          <button
            onClick={() => fetchPayrollEmployees(payrollId)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        {!isLoading && employees.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <BanknotesIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Salario Bruto Total</p>
                  <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{formatCRC(totalGrossSalary)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <ReceiptPercentIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Deducciones Totales</p>
                  <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{formatCRC(totalDeductions)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Salario Neto Total</p>
                  <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{formatCRC(totalNetSalary)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Employees List */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-zinc-800 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
              Empleados ({employees.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                  <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-700 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-700 rounded" />
                    <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
                  </div>
                  <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
                  <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
                  <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
                </div>
              ))}
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="w-16 h-16 text-zinc-400 dark:text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-500 dark:text-zinc-400">No hay empleados en esta planilla</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-800 dark:text-zinc-100">Empleado</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-800 dark:text-zinc-100">Identificación</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-800 dark:text-zinc-100">Puesto</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-800 dark:text-zinc-100">Salario Bruto</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-800 dark:text-zinc-100">Deducciones</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-800 dark:text-zinc-100">Salario Neto</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr 
                      key={employee.id}
                      className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-zinc-800 rounded-lg">
                            <UserGroupIcon className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-zinc-800 dark:text-zinc-100">{employee.employee_name}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">ID: {employee.employee_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                        {employee.employee_identification}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                        {employee.position_name || 'Sin puesto'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-medium text-green-700 dark:text-green-400">
                          {formatCRC(employee.gross_salary)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-medium text-red-700 dark:text-red-400">
                          {formatCRC(employee.total_deductions)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-zinc-800 dark:text-zinc-100">
                          {formatCRC(employee.net_salary)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
