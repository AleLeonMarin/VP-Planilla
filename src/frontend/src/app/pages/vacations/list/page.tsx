"use client";

import React, { useState } from 'react';
import Table from '@/components/ui/Table';
import FormModal from '@/components/ui/FormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useVacations } from '@/hooks/useVacations';
import { Vacation } from '@/services/vacationsService';
import { useModal } from '@/hooks/useModal';
import { zodResolver } from '@hookform/resolvers/zod';
import { VacationSchema } from '@/schemas/vacationSchema';

export default function VacationsListPage() {
  const { data, isLoading, error, refetch, create, update, remove } = useVacations();
  const modal = useModal();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vacation | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Vacation | null>(null);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (v: Vacation) => { setEditing(v); setFormOpen(true); };
  const openDelete = (v: Vacation) => { setToDelete(v); setConfirmOpen(true); };

  const handleSubmit = async (values: any) => {
    try {
      if (editing) {
        await update(editing.id, values);
        modal.showSuccess('Actualizado', 'Vacación actualizada correctamente');
      } else {
        await create(values);
        modal.showSuccess('Creado', 'Vacación creada correctamente');
      }
      refetch();
      setFormOpen(false);
    } catch (err: any) {
      modal.showError('Error', err?.message || 'Error al guardar');
    }
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove(toDelete.id);
      modal.showSuccess('Eliminado', 'Vacación eliminada correctamente');
      refetch();
    } catch (err: any) {
      modal.showError('Error', err?.message || 'Error al eliminar');
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'employee_id', title: 'Empleado' },
    { key: 'start_date', title: 'Inicio' },
    { key: 'end_date', title: 'Fin' },
    { key: 'days', title: 'Días' },
    { key: 'status', title: 'Estado' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Vacaciones</h2>
        <div>
          <button onClick={() => refetch()} className="mr-2 px-4 py-2 bg-gray-200 rounded">Recargar</button>
          <button onClick={openCreate} className="px-4 py-2 bg-green-600 text-white rounded">Nueva vacación</button>
        </div>
      </div>

      <Table columns={columns} data={data || []} onEdit={openEdit} onDelete={openDelete} />

      <FormModal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Editar Vacación' : 'Nueva Vacación'} initialValues={editing || undefined} onSubmit={handleSubmit} resolver={zodResolver(VacationSchema)}>
        {(methods: any) => (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Empleado (ID)</label>
              <input {...methods.register('employee_id', { valueAsNumber: true })} className="w-full border px-2 py-1 rounded" />
              {methods.formState.errors.employee_id && <p className="text-red-600 text-sm">{methods.formState.errors.employee_id.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fecha inicio</label>
                <input type="date" {...methods.register('start_date')} className="w-full border px-2 py-1 rounded" />
                {methods.formState.errors.start_date && <p className="text-red-600 text-sm">{methods.formState.errors.start_date.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha fin</label>
                <input type="date" {...methods.register('end_date')} className="w-full border px-2 py-1 rounded" />
                {methods.formState.errors.end_date && <p className="text-red-600 text-sm">{methods.formState.errors.end_date.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Días</label>
              <input type="number" {...methods.register('days', { valueAsNumber: true })} className="w-full border px-2 py-1 rounded" />
              {methods.formState.errors.days && <p className="text-red-600 text-sm">{methods.formState.errors.days.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Pagada</label>
                <input type="checkbox" {...methods.register('paid')} className="h-4 w-4" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <input {...methods.register('status')} className="w-full border px-2 py-1 rounded" />
              </div>
            </div>
          </div>
        )}
      </FormModal>

      <ConfirmDialog open={confirmOpen} title="Eliminar vacación" description="¿Confirma eliminar esta vacación?" onCancel={() => setConfirmOpen(false)} onConfirm={handleConfirmDelete} />

      {error && <div className="mt-4 text-red-600">{error}</div>}
    </div>
  );
}
