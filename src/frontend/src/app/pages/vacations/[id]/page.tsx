"use client";

import React, { useEffect, useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { VacationsService, Vacation } from '@/services/vacationsService';
import {
  CalendarDaysIcon,
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  CurrencyDollarIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function VacationDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [vacation, setVacation] = useState<Vacation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVacation = async () => {
      try {
        setLoading(true);
        const data = await VacationsService.getById(parseInt(id));
        setVacation(data);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Error al cargar vacación');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVacation();
    }
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const calculateDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const getStatusBadge = (status?: string, paid?: boolean) => {
    if (status === 'approved' || paid) {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
          <CheckCircleIcon className="w-4 h-4" />
          Aprobado
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
          <XCircleIcon className="w-4 h-4" />
          Rechazado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300">
        <ClockIcon className="w-4 h-4" />
        Pendiente
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-zinc-200 dark:border-zinc-700 border-t-green-600 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-300 font-medium text-lg">Cargando detalle de vacación...</p>
        </div>
      </div>
    );
  }

  if (!vacation) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
        <div className="p-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
            <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-3">No se encontró la vacación</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-all font-medium"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="p-6">
        {/* Breadcrumb */}
        <p className="text-xs text-zinc-400 uppercase tracking-widest mb-2">
          Vacaciones / Detalle
        </p>

        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-green-600 hover:text-green-500 transition-colors mb-4 font-medium"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Volver
          </button>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-green-600 p-3 rounded-lg">
                  <CalendarDaysIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                    Detalle de Vacación #{vacation.id}
                  </h1>
                  <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                    Información completa de la solicitud de vacaciones
                  </p>
                </div>
              </div>
              {getStatusBadge(vacation.status, vacation.paid)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information Card */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center justify-center w-14 h-14 bg-green-600 rounded-lg">
                <CalendarDaysIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Información de Vacaciones</h2>
            </div>

            <div className="space-y-6">
              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-2">Fecha de Inicio</p>
                  <p className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                    {formatDate(vacation.start_date)}
                  </p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-2">Fecha de Fin</p>
                  <p className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                    {formatDate(vacation.end_date)}
                  </p>
                </div>
              </div>

              {/* Duration */}
              <div className="bg-green-600 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/80 font-medium mb-2">Duración Total</p>
                    <p className="text-4xl font-bold text-white">
                      {vacation.total_days || calculateDays(vacation.start_date, vacation.end_date)} días
                    </p>
                  </div>
                  <ClockIcon className="w-16 h-16 text-white/30" />
                </div>
              </div>

              {/* Payment Status */}
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-2">Estado de Pago</p>
                    <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                      {vacation.paid ? 'Pagado' : 'No Pagado'}
                    </p>
                  </div>
                  <CurrencyDollarIcon 
                    className={`w-12 h-12 ${vacation.paid ? 'text-green-600' : 'text-zinc-400'}`} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel - Employee and Additional Info */}
          <div className="space-y-6">
            {/* Employee Info */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-green-600 rounded-lg">
                  <UserIcon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Empleado</h3>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-5 border border-zinc-200 dark:border-zinc-700">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mb-1">ID del Empleado</p>
                <p className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">#{vacation.employee_id}</p>
              </div>
            </div>

            {/* Metadata */}
            {vacation.created_at && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-5">Información Adicional</h3>
                <div className="space-y-3">
                  <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-1">Fecha de Creación</p>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                      {formatDate(vacation.created_at)}
                    </p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-1">Estado</p>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                      {vacation.status || 'Pendiente'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-5">Acciones</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/pages/vacations/edit/${vacation.id}`)}
                  className="w-full px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <PencilIcon className="w-5 h-5" />
                  Editar Vacación
                </button>
                <button
                  onClick={() => router.back()}
                  className="w-full px-5 py-3 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all font-medium"
                >
                  Volver a la Lista
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
