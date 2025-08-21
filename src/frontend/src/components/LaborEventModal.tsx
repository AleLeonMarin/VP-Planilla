'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LaborEventFormData, EmployeeLaborEvent } from '@/types/laborEvent';
import { Employee } from '@/types/employee';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LaborEventFormData) => Promise<void>;
  event?: EmployeeLaborEvent;
  employees: Employee[];
  onPreviewChange?: (preview: Partial<EmployeeLaborEvent> | null) => void;
  initialDates?: { start?: Date; end?: Date } | null;
}

const laborEventSchema = z.object({
  name: z.string().min(1, 'El nombre del evento es requerido'),
  description: z.string().optional(),
  employee_id: z.number().min(1, 'Debe seleccionar un empleado'),
  start_date: z.string().min(1, 'La fecha de inicio es requerida'),
  end_date: z.string().optional(),
  status: z.enum(['active', 'completed', 'cancelled']),
});

type FormData = z.infer<typeof laborEventSchema>;

const pad = (n: number) => n.toString().padStart(2, '0');
const toLocalInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

const LaborEventModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  event,
  employees,
  onPreviewChange,
  initialDates
}) => {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(laborEventSchema),
    defaultValues: {
      name: '',
      description: '',
      employee_id: 0,
      start_date: toLocalInput(new Date()),
      end_date: '',
      status: 'active'
    }
  });

  // Watch form values for preview
  const watchedValues = watch();

  useEffect(() => {
    if (!isOpen) return;

    if (event) {
      const startIsoLocal = event.start_date ? toLocalInput(new Date(event.start_date)) : toLocalInput(new Date());
      const endIsoLocal = event.end_date ? toLocalInput(new Date(event.end_date)) : '';
      
      reset({
        name: (event as any).labor_event_name || '',
        description: (event as any).labor_event_description || '',
        employee_id: event.employee_id || 0,
        start_date: startIsoLocal,
        end_date: endIsoLocal,
        status: event.status
      });
      return;
    }

    if (initialDates && initialDates.start) {
      const startLocal = toLocalInput(initialDates.start);
      const endLocal = initialDates.end ? toLocalInput(initialDates.end) : '';
      
      reset({
        name: '',
        description: '',
        employee_id: 0,
        start_date: startLocal,
        end_date: endLocal,
        status: 'active'
      });
      
      onPreviewChange?.({ 
        labor_event_name: '', 
        employee_id: undefined, 
        start_date: startLocal, 
        end_date: endLocal 
      });
      return;
    }

    const defaultStart = toLocalInput(new Date());
    reset({
      name: '',
      description: '',
      employee_id: 0,
      start_date: defaultStart,
      end_date: '',
      status: 'active'
    });
    
    onPreviewChange?.({ 
      labor_event_name: '', 
      employee_id: undefined, 
      start_date: defaultStart, 
      end_date: undefined 
    });
  }, [isOpen, event, initialDates]);

  // Update preview when form values change (only when creating new event)
  useEffect(() => {
    if (!event && isOpen && onPreviewChange) {
      onPreviewChange({
        labor_event_name: watchedValues.name || '',
        employee_id: watchedValues.employee_id || undefined,
        start_date: watchedValues.start_date || undefined,
        end_date: watchedValues.end_date || undefined,
      });
    }
  }, [watchedValues.name, watchedValues.employee_id, watchedValues.start_date, watchedValues.end_date, event, isOpen]);

  const onFormSubmit = async (data: FormData) => {
    const payload: LaborEventFormData = {
      name: data.name,
      description: data.description,
      employee_id: data.employee_id,
      start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
      end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
      status: data.status
    };

    await onSubmit(payload);
    onPreviewChange?.(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop con animación de fade */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Modal Container flotante centrado con animación de scale y fade */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className={`w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#E0D6B7] transition-all duration-500 ease-out ${
            isOpen 
              ? 'transform scale-100 opacity-100 translate-y-0' 
              : 'transform scale-95 opacity-0 translate-y-4'
          }`}
          onClick={(e) => e.stopPropagation()} // Prevenir cierre al hacer click en el modal
        >
          {/* Header del modal */}
          <div className="bg-[#6F7153] px-6 py-4 rounded-t-xl flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              {event ? 'Editar Evento' : 'Nuevo Evento'}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/10 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contenido del formulario con altura máxima y scroll */}
          <div className="max-h-[70vh] overflow-y-auto p-6">
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#3B4D36] mb-2">
                  Nombre del Evento
                </label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className="w-full rounded-lg border border-[#D2B48C] p-3 focus:ring-2 focus:ring-[#6F7153] focus:border-transparent transition-all"
                      placeholder="Ingrese el nombre del evento"
                    />
                  )}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 animate-pulse">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3B4D36] mb-2">
                  Descripción
                </label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      className="w-full rounded-lg border border-[#D2B48C] p-3 focus:ring-2 focus:ring-[#6F7153] focus:border-transparent transition-all resize-none"
                      rows={3}
                      placeholder="Descripción opcional del evento"
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3B4D36] mb-2">
                  Empleado
                </label>
                <Controller
                  name="employee_id"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="w-full rounded-lg border border-[#D2B48C] p-3 focus:ring-2 focus:ring-[#6F7153] focus:border-transparent transition-all"
                    >
                      <option value={0}>Seleccionar empleado</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.employee_id && (
                  <p className="mt-1 text-sm text-red-600 animate-pulse">{errors.employee_id.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#3B4D36] mb-2">
                    Fecha Inicio
                  </label>
                  <Controller
                    name="start_date"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="datetime-local"
                        className="w-full rounded-lg border border-[#D2B48C] p-3 focus:ring-2 focus:ring-[#6F7153] focus:border-transparent transition-all"
                      />
                    )}
                  />
                  {errors.start_date && (
                    <p className="mt-1 text-sm text-red-600 animate-pulse">{errors.start_date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#3B4D36] mb-2">
                    Fecha Fin
                  </label>
                  <Controller
                    name="end_date"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="datetime-local"
                        className="w-full rounded-lg border border-[#D2B48C] p-3 focus:ring-2 focus:ring-[#6F7153] focus:border-transparent transition-all"
                      />
                    )}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3B4D36] mb-2">
                  Estado
                </label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full rounded-lg border border-[#D2B48C] p-3 focus:ring-2 focus:ring-[#6F7153] focus:border-transparent transition-all"
                    >
                      <option value="active">Activo</option>
                      <option value="completed">Completado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  )}
                />
              </div>
            </form>
          </div>

          {/* Footer con botones */}
          <div className="border-t border-[#E0D6B7] p-6 bg-[#F5F1E8] rounded-b-xl">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { onPreviewChange?.(null); onClose(); }}
                className="flex-1 px-4 py-3 text-[#3B4D36] border border-[#3B4D36] rounded-lg hover:bg-[#E7DCC1] transition-all duration-200 font-medium"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleSubmit(onFormSubmit)}
                className="flex-1 px-4 py-3 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </div>
                ) : (
                  event ? 'Guardar Cambios' : 'Crear Evento'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LaborEventModal;