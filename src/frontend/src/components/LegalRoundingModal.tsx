"use client";

import React from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface LegalRoundingModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * High-stakes compliance modal for the NEAREST_QUARTER rounding policy.
 * Displays the exact legal disclaimer required by Costa Rican labor law context.
 */
export default function LegalRoundingModal({
  isOpen,
  onCancel,
  onConfirm,
}: LegalRoundingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 p-8">
        <div className="flex flex-col items-center text-center">
          {/* Warning Icon */}
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-6">
            <ExclamationTriangleIcon className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
          </div>

          {/* Header */}
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-6">
            ⚠️ Advertencia legal — Redondeo bidireccional
          </h2>

          {/* Body */}
          <div className="space-y-4 mb-8">
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-left">
              Esta modalidad puede descartar minutos trabajados por el empleado cuando la fracción es menor a 8 minutos. 
              Según el artículo 17 del Código de Trabajo (principio <em>in dubio pro operario</em>), esta práctica puede ser objetada 
              por el Ministerio de Trabajo si no está respaldada en el reglamento interno de trabajo de su empresa.
            </p>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-left font-medium">
              Al confirmar, usted declara que esta política está documentada en su reglamento interno y es del conocimiento de todos sus trabajadores.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold transition-colors border border-zinc-200 dark:border-zinc-700"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white dark:bg-yellow-600 dark:hover:bg-yellow-700 rounded-xl font-semibold transition-colors shadow-lg shadow-yellow-600/20"
            >
              Confirmo, activar Modalidad C
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
