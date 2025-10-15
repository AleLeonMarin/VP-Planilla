"use client";

import React, { useState } from 'react';
import { useNominee } from '@/hooks/useNominee';
import PayrollResults from '@/components/PayrollResults';
import PayrollCreateModal from '@/components/PayrollCreateModal';
import { useModal } from '@/hooks/useModal';

export default function PayrollCalculatePage() {
  const { data, isLoading, error, calculatePayrollForPeriod } = useNominee();
  const modal = useModal();

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);

  const handleCalculate = async () => {
    if (!startDate || !endDate) {
      modal.showError('Fechas incompletas', 'Selecciona fecha de inicio y fin');
      return;
    }
    try {
      await calculatePayrollForPeriod(startDate, endDate);
      modal.showSuccess('Cálculo completado', 'Se generó el resultado del cálculo');
    } catch (err: any) {
      modal.showError('Error', err?.message || 'Error al calcular nómina');
    }
  };

  const handleSave = (id: number) => {
    modal.showSuccess('Planilla guardada', `Planilla creada con id ${id}`);
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded shadow p-6 mb-6">
        <h1 className="text-2xl font-semibold mb-2">Cálculo de planilla</h1>
        <p className="text-sm text-gray-600 mb-4">Selecciona el periodo para calcular la planilla y genera el resultado. Luego podrás guardar la planilla.</p>

        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Fecha inicio</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border px-2 py-2 rounded" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fecha fin</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border px-2 py-2 rounded" />
          </div>

          <div className="flex space-x-2">
            <button onClick={handleCalculate} disabled={isLoading} className="px-4 py-2 bg-green-600 text-white rounded">{isLoading ? 'Calculando...' : 'Calcular'}</button>
            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="px-4 py-2 bg-gray-200 rounded">Limpiar</button>
          </div>
        </div>
      </div>

      <PayrollResults data={data} onCreate={() => setShowCreate(true)} />

      <PayrollCreateModal open={showCreate} onClose={() => setShowCreate(false)} periodStart={startDate} periodEnd={endDate} onSaved={handleSave} />

      {error && <div className="mt-4 text-red-600">{error}</div>}
    </div>
  );
}
