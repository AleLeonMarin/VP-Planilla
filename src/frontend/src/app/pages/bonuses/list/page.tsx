"use client";

import React, { useState } from 'react';
import Table from '@/components/ui/Table';
import FormModal from '@/components/ui/FormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useBonuses } from '@/hooks/useBonuses';
import { Bonus } from '@/services/bonusesService';
import { useModal } from '@/hooks/useModal';
import { UseFormReturn } from 'react-hook-form';
import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function BonusesPage() {
  const { data, refetch, create, update, remove } = useBonuses();
  const modal = useModal();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Bonus | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Bonus | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (b: Bonus) => {
    setEditing(b);
    setFormOpen(true);
  };

  const openDelete = (b: Bonus) => {
    setToDelete(b);
    setConfirmOpen(true);
  };

  const handleSubmit = async (values: Partial<Bonus>) => {
    try {
      if (editing) {
        await update(editing.id, values);
        modal.showSuccess('Actualizado', 'Bonificación actualizada correctamente');
      } else {
        await create(values);
        modal.showSuccess('Creado', 'Bonificación creada correctamente');
      }
      refetch();
    } catch (err: unknown) {
      modal.showError('Error', err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove(toDelete.id);
      modal.showSuccess('Eliminado', 'Bonificación eliminada correctamente');
      refetch();
    } catch (err: unknown) {
      modal.showError('Error', err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'employee_id', title: 'Empleado' },
    { key: 'year', title: 'Año' },
    { key: 'month', title: 'Mes' },
    { key: 'description', title: 'Descripción' },
    { key: 'amount', title: 'Monto', render: (r: Bonus) => r.amount?.toFixed(2) },
  ];

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 p-6">
      <div className="mb-2">
        <p className="text-xs text-zinc-400 uppercase tracking-widest">Nómina / Bonificaciones</p>
        <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">Bonificaciones</h1>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div />
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2">
            <ArrowPathIcon className="h-4 w-4" />
            Recargar
          </button>
          <button onClick={openCreate} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Nueva bonificación
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
        <Table columns={columns} data={data || []} onEdit={openEdit} onDelete={openDelete} />
      </div>

      <FormModal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Editar Bonificación' : 'Nueva Bonificación'} initialValues={editing || undefined} onSubmit={handleSubmit}>
        {(methods: UseFormReturn<Partial<Bonus>>) => (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-100">Empleado (ID)</label>
              <input {...methods.register('employee_id', { valueAsNumber: true })} className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-100">Payroll ID</label>
              <input {...methods.register('payroll_id', { valueAsNumber: true })} className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-100">Año</label>
              <input {...methods.register('year', { valueAsNumber: true })} className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-100">Mes</label>
              <input {...methods.register('month', { valueAsNumber: true })} className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-100">Descripción</label>
              <input {...methods.register('description')} className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-100">Monto</label>
              <input {...methods.register('amount', { valueAsNumber: true })} className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100" />
            </div>
          </div>
        )}
      </FormModal>

      <ConfirmDialog open={confirmOpen} title="Eliminar bonificación" description="¿Confirma eliminar esta bonificación?" onCancel={() => setConfirmOpen(false)} onConfirm={handleConfirmDelete} />
    </div>
  );
}
