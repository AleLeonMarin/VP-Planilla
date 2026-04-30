"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { ParamSnapshot } from '@/services/payrollService';

interface PayrollParamSnapshotSectionProps {
  snapshots: ParamSnapshot[];
  isLoading?: boolean;
}

// Category prefix mapping to human-readable labels
const CATEGORY_LABELS: Record<string, string> = {
  OT: 'Horas Extraordinarias',
  CCSS: 'Seguridad Social',
  GLOBAL: 'Salarios Mínimos',
  ENTERPRISE: 'Configuración Empresa',
  MIN: 'Salarios Mínimos',
  WORKDAY: 'Jornada Laboral',
  HOLIDAY: 'Feriados',
};

function getCategoryLabel(prefix: string): string {
  return CATEGORY_LABELS[prefix] || prefix;
}

// Human-readable labels for ENTERPRISE_* special keys
const ENTERPRISE_VALUE_LABELS: Record<string, Record<string, string>> = {
  ENTERPRISE_MINUTE_ROUNDING_POLICY: { EXACT: 'Exacto', ALWAYS_UP: 'Siempre arriba', NEAREST_QUARTER: 'Cuarto más cercano' },
  ENTERPRISE_ORDINARY_SHIFT_TYPE: { DIURNA: 'Diurna (8h)', NOCTURNA: 'Nocturna (6h)', MIXTA: 'Mixta (7h)' },
  ENTERPRISE_IS_COMMERCIAL_ACTIVITY: { '1': 'Sí', '0': 'No' },
};

function formatParamValue(param: ParamSnapshot): string {
  const labels = ENTERPRISE_VALUE_LABELS[param.param_key];
  if (labels) return labels[param.param_value] ?? param.param_value;
  const num = Number(param.param_value);
  return isNaN(num) ? param.param_value : num.toFixed(4).replace(/\.?0+$/, '');
}

export const PayrollParamSnapshotSection: React.FC<PayrollParamSnapshotSectionProps> = ({
  snapshots,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Don't render section at all if no snapshots (historical payrolls pre-Phase 64)
  if (!isLoading && (!snapshots || snapshots.length === 0)) {
    return null;
  }

  // Group params by first segment of param_key (e.g. OT_FACTOR → OT)
  const grouped = snapshots.reduce<Record<string, ParamSnapshot[]>>((acc, snap) => {
    const prefix = snap.param_key.split('_')[0] || 'OTROS';
    if (!acc[prefix]) acc[prefix] = [];
    acc[prefix].push(snap);
    return acc;
  }, {});

  // Determine if any param in any group has a source_decree
  const hasDecrees = snapshots.some((s) => s.source_decree);

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 mt-8">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex items-center gap-3 w-full text-left font-semibold text-[#4A5D3A] dark:text-white hover:opacity-80 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4A5D3A] focus:ring-offset-2 rounded"
      >
        <ChevronDown
          className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
        <span className="text-lg">
          Parámetros utilizados en el cálculo
          {!isLoading && snapshots.length > 0 && (
            <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
              ({snapshots.length} parámetros)
            </span>
          )}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4">
              {isLoading ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Cargando parámetros...</p>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-sm" role="grid">
                    <thead>
                      <tr className="bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-300 dark:border-zinc-700">
                        <th className="px-4 py-4 text-left text-xs text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                          Parámetro
                        </th>
                        <th className="px-4 py-4 text-right text-xs text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-4 py-4 text-left text-xs text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                          Vigente desde
                        </th>
                        {hasDecrees && (
                          <th className="px-4 py-4 text-left text-xs text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                            Decreto
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(grouped).map(([prefix, params]) => (
                        <React.Fragment key={prefix}>
                          {/* Category sub-header row */}
                          <tr className="bg-zinc-200 dark:bg-zinc-700/50">
                            <td
                              colSpan={hasDecrees ? 4 : 3}
                              className="px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider"
                            >
                              {getCategoryLabel(prefix)}
                            </td>
                          </tr>
                          {/* Parameter rows */}
                          {params.map((param) => (
                            <tr
                              key={param.param_key}
                              className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                            >
                              <td className="px-4 py-4 text-sm text-zinc-800 dark:text-zinc-100 pl-8">
                                {param.param_key}
                              </td>
                              <td className="px-4 py-4 text-sm font-bold text-[#4A5D3A] dark:text-white text-right font-mono">
                                {formatParamValue(param)}
                              </td>
                              <td className="px-4 py-4 text-xs text-zinc-600 dark:text-zinc-400">
                                {new Date(param.param_valid_from).toLocaleDateString('es-CR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </td>
                              {hasDecrees && (
                                <td className="px-4 py-4">
                                  {param.source_decree ? (
                                    <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded text-xs">
                                      {param.source_decree}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-zinc-400">—</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 italic mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    Estos valores fueron vigentes en la fecha de cierre de planilla. Parámetros actuales pueden diferir.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
