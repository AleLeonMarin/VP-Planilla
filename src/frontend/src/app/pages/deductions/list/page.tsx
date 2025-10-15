"use client";

import React, { useState } from 'react';
import Table from '@/components/ui/Table';
import FormModal from '@/components/ui/FormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useDeductions } from '@/hooks/useDeductions';
import { Deduction } from '@/services/deductionsService';
import { useModal } from '@/hooks/useModal';

export default function DeductionsPage() {
  const { data, isLoading, error, refetch, create, update, remove } = useDeductions();
  const modal = useModal();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Deduction | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Deduction | null>(null);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (d: Deduction) => { setEditing(d); setFormOpen(true); };
  const openDelete = (d: Deduction) => { setToDelete(d); setConfirmOpen(true); };

  const handleSubmit = async (values: any) => {
    try {
      if (editing) {
        await update(editing.id, values);
        modal.showSuccess('Actualizado', 'Deducción actualizada correctamente');
      } else {
        await create(values);
        modal.showSuccess('Creado', 'Deducción creada correctamente');
      }
      refetch();
    } catch (err: any) {
      modal.showError('Error', err?.message || 'Error al guardar');
    }
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove(toDelete.id);
      modal.showSuccess('Eliminado', 'Deducción eliminada correctamente');
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
    { key: 'name', title: 'Nombre' },
    { key: 'description', title: 'Descripción' },
    { key: 'fixed_amount', title: 'Monto fijo', render: (r: Deduction) => r.fixed_amount?.toFixed?.(2) ?? '' },
    { key: 'percentage', title: 'Porcentaje', render: (r: Deduction) => r.percentage ? `${r.percentage}%` : '' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Deducciones</h2>
        <div>
          <button onClick={() => refetch()} className="mr-2 px-4 py-2 bg-gray-200 rounded">Recargar</button>
          <button onClick={openCreate} className="px-4 py-2 bg-green-600 text-white rounded">Nueva deducción</button>
        </div>
      </div>

      <Table columns={columns} data={data || []} onEdit={openEdit} onDelete={openDelete} />

      <FormModal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Editar Deducción' : 'Nueva Deducción'} initialValues={editing || undefined} onSubmit={handleSubmit}>
        {(methods: any) => (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input {...methods.register('name')} className="w-full border px-2 py-1 rounded" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <input {...methods.register('description')} className="w-full border px-2 py-1 rounded" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Monto fijo</label>
              <input {...methods.register('fixed_amount', { valueAsNumber: true })} className="w-full border px-2 py-1 rounded" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Porcentaje</label>
              <input {...methods.register('percentage', { valueAsNumber: true })} className="w-full border px-2 py-1 rounded" />
            </div>
          </div>
        )}
      </FormModal>

      <ConfirmDialog open={confirmOpen} title="Eliminar deducción" description="¿Confirma eliminar esta deducción?" onCancel={() => setConfirmOpen(false)} onConfirm={handleConfirmDelete} />
    </div>
  );
}
