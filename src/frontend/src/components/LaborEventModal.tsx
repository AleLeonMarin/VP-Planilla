'use client';

import React, { useState, useEffect } from 'react';
import { LaborEventFormData, EmployeeLaborEvent } from '@/types/laborEvent';
import { Employee } from '@/types/employee';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LaborEventFormData) => Promise<void>;
  event?: EmployeeLaborEvent;
  employees: Employee[];
  // New callback to notify parent about preview changes
  onPreviewChange?: (preview: Partial<EmployeeLaborEvent> | null) => void;
  // Optional initial dates when opening modal via calendar selection
  initialDates?: { start?: Date; end?: Date } | null;
}

// Local form state where dates are strings for datetime-local inputs
type FormState = {
  name: string;
  description: string;
  employee_id?: number | undefined;
  start_date?: string | null; // format: 'YYYY-MM-DDTHH:mm'
  end_date?: string | null;
  status: 'active' | 'completed' | 'cancelled';
};

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
  const [formData, setFormData] = useState<FormState>({
    name: '',
    description: '',
    employee_id: undefined,
    // use local formatted value for datetime-local
    start_date: toLocalInput(new Date()),
    end_date: undefined,
    status: 'active'
  });

  useEffect(() => {
    // Initialize when modal opens or event/initialDates change
    if (!isOpen) return;

    if (event) {
      const startIsoLocal = event.start_date ? toLocalInput(new Date(event.start_date)) : toLocalInput(new Date());
      const endIsoLocal = event.end_date ? toLocalInput(new Date(event.end_date)) : undefined;
      setFormData({
        name: (event as any).labor_event_name || '',
        description: (event as any).labor_event_description || '',
        employee_id: event.employee_id ?? undefined,
        start_date: startIsoLocal,
        end_date: endIsoLocal,
        status: event.status
      });
      // notify parent of preview when editing existing event - pass local strings
      onPreviewChange?.({
        id: event.id,
        labor_event_name: (event as any).labor_event_name,
        employee_id: event.employee_id,
        start_date: startIsoLocal,
        end_date: endIsoLocal,
      });
      return;
    }

    // If initialDates provided (clicked on calendar), use them
    if (initialDates && initialDates.start) {
      const startLocal = toLocalInput(initialDates.start);
      const endLocal = initialDates.end ? toLocalInput(initialDates.end) : undefined;
      setFormData(prev => ({ ...prev, name: '', description: '', employee_id: undefined, start_date: startLocal, end_date: endLocal, status: 'active' }));
      onPreviewChange?.({ labor_event_name: '', employee_id: undefined, start_date: startLocal, end_date: endLocal });
      return;
    }

    // Default when opened via "Crear Evento" button -> today
    const defaultStart = toLocalInput(new Date());
    setFormData(prev => ({ ...prev, name: '', description: '', employee_id: undefined, start_date: defaultStart, end_date: undefined, status: 'active' }));
    onPreviewChange?.({ labor_event_name: '', employee_id: undefined, start_date: defaultStart, end_date: undefined });
  }, [isOpen, event, initialDates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: LaborEventFormData = {
      name: formData.name,
      description: formData.description,
      employee_id: formData.employee_id,
      // convert to ISO UTC for server storage
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      status: formData.status
    };

    await onSubmit(payload);
    // clear preview
    onPreviewChange?.(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    // Render inline panel instead of full-screen backdrop
    <div className="absolute top-6 right-6 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-[#3B4D36]">
          {event ? 'Editar Evento' : 'Nuevo Evento'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#3B4D36]">
              Nombre del Evento
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => { setFormData(prev => ({ ...prev, name: e.target.value })); onPreviewChange?.({ labor_event_name: e.target.value, start_date: formData.start_date ?? undefined, end_date: formData.end_date ?? undefined, employee_id: formData.employee_id }); }}
              className="mt-1 block w-full rounded-md border border-[#D2B48C] p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4D36]">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => { setFormData(prev => ({ ...prev, description: e.target.value })); onPreviewChange?.({ labor_event_name: formData.name, start_date: formData.start_date ?? undefined, end_date: formData.end_date ?? undefined, employee_id: formData.employee_id }); }}
              className="mt-1 block w-full rounded-md border border-[#D2B48C] p-2"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4D36]">
              Empleado
            </label>
            <select
              value={formData.employee_id ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                const numeric = val === '' ? undefined : Number(val);
                setFormData(prev => ({ ...prev, employee_id: numeric }));
                onPreviewChange?.({ labor_event_name: formData.name, start_date: formData.start_date ?? undefined, end_date: formData.end_date ?? undefined, employee_id: numeric });
              }}
              className="mt-1 block w-full rounded-md border border-[#D2B48C] p-2"
              required
            >
              <option value="">Seleccionar empleado</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#3B4D36]">
                Fecha Inicio
              </label>
              <input
                type="datetime-local"
                value={formData.start_date ?? ''}
                onChange={(e) => { setFormData(prev => ({ ...prev, start_date: e.target.value })); onPreviewChange?.({ labor_event_name: formData.name, start_date: e.target.value, end_date: formData.end_date ?? undefined, employee_id: formData.employee_id }); }}
                className="mt-1 block w-full rounded-md border border-[#D2B48C] p-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3B4D36]">
                Fecha Fin
              </label>
              <input
                type="datetime-local"
                value={formData.end_date ?? ''}
                onChange={(e) => { setFormData(prev => ({ ...prev, end_date: e.target.value })); onPreviewChange?.({ labor_event_name: formData.name, start_date: formData.start_date ?? undefined, end_date: e.target.value, employee_id: formData.employee_id }); }}
                className="mt-1 block w-full rounded-md border border-[#D2B48C] p-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4D36]">
              Estado
            </label>
            <select
              value={formData.status}
              onChange={(e) => { setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'completed' | 'cancelled' })); }}
              className="mt-1 block w-full rounded-md border border-[#D2B48C] p-2"
              required
            >
              <option value="active">Activo</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => { onPreviewChange?.(null); onClose(); }}
              className="px-4 py-2 text-[#3B4D36] border border-[#3B4D36] rounded-lg hover:bg-[#E7DCC1]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#3B4D36] text-white rounded-lg hover:bg-[#6F7153]"
            >
              {event ? 'Guardar Cambios' : 'Crear Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LaborEventModal;