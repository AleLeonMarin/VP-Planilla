"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  DocumentTextIcon, 
  PlusCircleIcon, 
  EyeIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { usePayroll } from '@/hooks/usePayroll';

export default function PayrollListPage() {
  const { getAllPayrolls, isLoading, error } = usePayroll();
  const [payrolls, setPayrolls] = useState<any[]>([]);

  const loadPayrolls = useCallback(async () => {
    try {
      const data = await getAllPayrolls();
      console.log('[PayrollList] data received:', data);
      if (Array.isArray(data)) {
        setPayrolls(data);
      } else {
        console.warn('[PayrollList] Expected array, got:', data);
        setPayrolls([]);
      }
    } catch (e) {
      console.error('Error loading payrolls:', e);
    }
  }, [getAllPayrolls]);

  useEffect(() => {
    loadPayrolls();
  }, [loadPayrolls]);

  const getStatusBadge = (status: string | undefined) => {
    if (status === 'CALCULADO' || status === 'PAGADO' || status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircleIcon className="w-3 h-3" />
          {status}
        </span>
      );
    }

    if (status === 'PENDIENTE' || status === 'draft') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          <ClockIcon className="w-3 h-3" />
          {status}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        <ClockIcon className="w-3 h-3" />
        {status || 'Sin estado'}
      </span>
    );
  };

  // (formatCurrency not used yet; keep placeholder or remove entirely)

  const formatDate = (date: string | Date | undefined | null) => {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('es-CR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return String(date);
    }
  };

  return (
    <div className="min-h-screen bg-[#E7DCC1]">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#3B4D36]">Historial de Planillas</h1>
            <p className="text-sm text-[#6B5B3D] mt-1">
              Consulta todas las planillas generadas y guardadas
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadPayrolls}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-[#B8A989] text-[#3B4D36] rounded-lg hover:bg-[#A89979] transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Cargando...' : 'Recargar'}
            </button>
            <Link
              href="/pages/payroll/calculate"
              className="flex items-center gap-2 px-4 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Calcular Nueva
            </Link>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6F7153] mx-auto mb-4"></div>
            <p className="text-[#5D4E37]">Cargando planillas...</p>
          </div>
        )}

        {/* Lista de planillas */}
        {!isLoading && payrolls.length > 0 && (
          <div className="space-y-3">
            {payrolls.map((p) => (
              <div
                key={p.id}
                className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  {/* Información principal */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center justify-center w-10 h-10 bg-[#6F7153] rounded-lg">
                        <DocumentTextIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-[#3B4D36]">
                          Planilla #{p.id}
                        </h3>
                        <p className="text-sm text-[#6B5B3D]">
                          <span className="font-medium">Periodo:</span>{' '}
                          {formatDate(p.period_start)} a {formatDate(p.period_end)}
                        </p>
                      </div>
                    </div>

                    {/* Detalles */}
                    <div className="grid grid-cols-3 gap-4 mt-3 ml-13">
                      <div>
                        <p className="text-xs text-[#6B5B3D]">Fecha de pago</p>
                        <p className="text-sm font-medium text-[#3B4D36]">
                          {formatDate(p.payment_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#6B5B3D]">Tipo</p>
                        <p className="text-sm font-medium text-[#3B4D36]">
                          {p.payroll_type ? `Tipo ${p.payroll_type}` : 'No especificado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#6B5B3D]">Estado</p>
                        <div className="mt-1">
                          {getStatusBadge(p.status)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="ml-4">
                    <Link
                      href={`/pages/payroll/${p.id}`}
                      className="flex items-center gap-2 px-4 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors"
                    >
                      <EyeIcon className="w-4 h-4" />
                      Ver Detalle
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estado vacío */}
        {!isLoading && payrolls.length === 0 && (
          <div className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#E7DCC1] rounded-full flex items-center justify-center">
                <DocumentTextIcon className="w-8 h-8 text-[#6F7153]" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-[#3B4D36] mb-2">
              No hay planillas guardadas
            </h3>
            <p className="text-sm text-[#6B5B3D] mb-6">
              Comienza calculando tu primera planilla para ver el historial aquí
            </p>
            <Link
              href="/pages/payroll/calculate"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Calcular Primera Planilla
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
