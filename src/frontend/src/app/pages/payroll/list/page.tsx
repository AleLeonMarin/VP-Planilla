"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PayrollService } from '@/services/payrollService';
import Table from '@/components/ui/Table';

export default function PayrollListPage() {
  const [payrolls, setPayrolls] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const raw = localStorage.getItem('vp_payroll_history') || '[]';
        const ids: number[] = JSON.parse(raw);
        if (!Array.isArray(ids) || ids.length === 0) {
          setPayrolls([]);
          return;
        }

        const uniqueIds = Array.from(new Set(ids)).slice(0, 50);
        const results = await Promise.all(uniqueIds.map(async (id) => {
          try {
            const p = await PayrollService.getPayrollById(id);
            return p || { id, missing: true };
          } catch (e) {
            return { id, error: (e as any)?.message || 'Error' };
          }
        }));

        setPayrolls(results as any[]);
      } catch (e: any) {
        setError(e?.message || 'Error cargando historial');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'period_start', title: 'Inicio', render: (r: any) => r.period_start ?? '-' },
    { key: 'period_end', title: 'Fin', render: (r: any) => r.period_end ?? '-' },
    { key: 'payroll_type_id', title: 'Tipo', render: (r: any) => r.payroll_type_id ?? '-' },
    { key: 'status', title: 'Estado', render: (r: any) => r.status ?? (r.missing ? 'No encontrado' : '-') },
    { key: 'total', title: 'Total', render: (r: any) => (typeof r.total !== 'undefined' ? Number(r.total).toFixed(2) : (r.summary?.total ? Number(r.summary.total).toFixed(2) : '-')) },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Historial de planillas</h2>
        <div>
          <Link href="/pages/payroll/calculate" className="px-4 py-2 bg-green-600 text-white rounded">Calcular nueva</Link>
        </div>
      </div>

      {loading && <div className="p-4 bg-white rounded shadow">Cargando...</div>}
      {error && <div className="p-4 bg-red-50 text-red-700 rounded">{error}</div>}

      <Table columns={columns} data={payrolls || []} onEdit={(row: any) => { /* no edit */ }} onDelete={(row: any) => { /* optional delete */ }} />

      <div className="mt-4">
        {payrolls && payrolls.length > 0 && (
          <ul className="space-y-2">
            {payrolls.map((p: any) => (
              <li key={p.id} className="bg-white rounded shadow p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">ID: {p.id}</div>
                  <div className="font-medium">{p.period_start ?? '—'} — {p.period_end ?? '—'}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Link href={`/pages/payroll/${p.id}`} className="px-3 py-1 bg-blue-600 text-white rounded">Ver</Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        {payrolls && payrolls.length === 0 && (
          <div className="mt-4 p-4 bg-white rounded shadow text-gray-600">No hay planillas guardadas aún.</div>
        )}
      </div>
    </div>
  );
}
