import React from 'react';
import { LegalParam } from '../types/legalParam';
import { LockClosedIcon, PencilIcon, ClockIcon } from '@heroicons/react/24/outline';

interface LegalParamCardProps {
  param: LegalParam;
  onEdit: (param: LegalParam) => void;
  onHistory: (param: LegalParam) => void;
  readOnly?: boolean;
}

const formatValue = (param: LegalParam) => {
  const num = Number(param.value);
  if (param.category === 'MIN_WAGE') {
    return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(num);
  }
  if (param.category === 'CCSS' || param.key.includes('FACTOR')) {
    // If it's a percentage or factor, usually it's plain number.
    // e.g. 1.5, 0.055
    return num.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
  }
  return num.toString();
};

export const LegalParamCard: React.FC<LegalParamCardProps> = ({
  param,
  onEdit,
  onHistory,
  readOnly = false,
}) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col hover:border-zinc-700 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-zinc-100 font-semibold truncate" title={param.key}>
              {param.key}
            </h3>
            {param.isCritical && (
              <LockClosedIcon className="w-4 h-4 text-[#FCF1D5]" title="Parámetro Crítico" />
            )}
          </div>
          <p className="text-sm text-zinc-400 mt-1 line-clamp-2" title={param.description}>
            {param.description}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-2">
        <div className="text-3xl font-bold text-zinc-50 mb-4">
          {formatValue(param)}
        </div>

        <div className="flex flex-col gap-1 text-xs text-zinc-500 mb-4">
          <div>
            <span className="font-medium text-zinc-400">Vigente desde:</span>{' '}
            {new Intl.DateTimeFormat('es-CR', { dateStyle: 'long' }).format(new Date(param.validFrom))}
          </div>
          {param.source_decree && (
            <div>
              <span className="font-medium text-zinc-400">Decreto:</span> {param.source_decree}
            </div>
          )}
        </div>

        {!readOnly && (
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-zinc-800/50">
            <button
              onClick={() => onHistory(param)}
              className="text-zinc-400 hover:text-zinc-200 transition-colors p-2 rounded-md hover:bg-zinc-800 flex items-center justify-center"
              title="Ver Historial"
            >
              <ClockIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onEdit(param)}
              className="text-[#FCF1D5] hover:text-[#e5d5b1] transition-colors p-2 rounded-md hover:bg-zinc-800 flex items-center justify-center"
              title="Editar"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
