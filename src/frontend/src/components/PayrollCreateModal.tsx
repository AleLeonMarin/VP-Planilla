"use client";

import React, { useState } from 'react';
import FormModal from '@/components/ui/FormModal';
import { usePayroll } from '@/hooks/usePayroll';
import { useNominee } from '@/hooks/useNominee';

interface Props {
  open: boolean;
  onClose: () => void;
  periodStart: string;
  periodEnd: string;
  onSaved?: (payrollId: number) => void;
}

export default function PayrollCreateModal({ open, onClose, periodStart, periodEnd, onSaved }: Props) {
  const { createPayroll, isLoading } = usePayroll() as any;
  const { calculatePayrollForPeriod } = useNominee();
  const [saving, setSaving] = useState(false);

  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      // 1. Create payroll record
      const payload = {
        payroll_type_id: values.payroll_type_id || 1,
        period_start: periodStart,
        period_end: periodEnd,
        payment_date: values.payment_date || new Date().toISOString().split('T')[0],
        status: values.status || 'CALCULADO'
      };
      const created = await createPayroll(payload);

      // 2. Recalculate and save to vpg_payroll_employee
      await calculatePayrollForPeriod(periodStart, periodEnd, created.id);

      // 3. Store id in local history
      try {
        const key = 'vp_payroll_history';
        const raw = localStorage.getItem(key);
        const arr = raw ? JSON.parse(raw) : [];
        arr.unshift(created.id);
        localStorage.setItem(key, JSON.stringify(arr.slice(0, 50)));
      } catch (_e) {}

      if (onSaved) onSaved(created.id);
    } finally {
      setSaving(false);
      onClose();
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <FormModal 
      open={open} 
      onClose={onClose} 
      title="Guardar planilla" 
      initialValues={{ 
        payroll_type_id: 1, 
        status: 'CALCULADO',
        payment_date: today
      }} 
      onSubmit={handleSave}
    >
      {(methods: any) => (
        <div className="grid grid-cols-1 gap-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Periodo:</strong> {periodStart} — {periodEnd}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tipo de planilla (ID)</label>
            <input 
              {...methods.register('payroll_type_id', { valueAsNumber: true })} 
              className="w-full border px-3 py-2 rounded" 
              type="number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fecha de pago</label>
            <input 
              {...methods.register('payment_date')} 
              className="w-full border px-3 py-2 rounded" 
              type="date"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Estado</label>
            <input 
              {...methods.register('status')} 
              className="w-full border px-3 py-2 rounded" 
              placeholder="CALCULADO, PENDIENTE, PAGADO"
            />
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              💡 Al guardar, se creará el registro de planilla y se almacenarán automáticamente los cálculos de todos los empleados.
            </p>
          </div>
        </div>
      )}
    </FormModal>
  );
}
