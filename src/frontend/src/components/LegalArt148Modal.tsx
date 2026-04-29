"use client";

import React from "react";
import { ShieldExclamationIcon } from "@heroicons/react/24/outline";

interface LegalArt148ModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Compliance modal for the Art. 148 mandatory holiday eligibility check.
 * Presents the legal disclaimer and descargo de responsabilidades before
 * the employer opts in to the attendance-based holiday pay validation.
 */
export default function LegalArt148Modal({
  isOpen,
  onCancel,
  onConfirm,
}: LegalArt148ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 p-8">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
            <ShieldExclamationIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>

          {/* Header */}
          <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">
            Desactivar pago de feriados no trabajados
          </h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-6">
            Descargo de responsabilidades
          </p>

          {/* Body */}
          <div className="space-y-4 mb-8 text-left">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Los <strong>feriados de pago obligatorio</strong> establecidos por el Código de Trabajo
              de Costa Rica (Art. 148) deben ser remunerados aunque el empleado no los trabaje.
              Al desactivar esta opción, el sistema <strong>no incluirá automáticamente</strong> esos
              días en el cálculo de planilla.
            </p>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-2">
                ¿Qué sigue funcionando?
              </p>
              <ul className="text-xs text-amber-700 dark:text-amber-500 space-y-1 list-disc list-inside">
                <li>Los feriados que el empleado <strong>sí trabajó</strong> siempre se calculan con su configuración individual (doble, triple, etc.).</li>
                <li>Solo se omiten los días feriados donde el empleado no registró marcaje.</li>
              </ul>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm font-semibold text-red-800 dark:text-red-400 mb-1">
                Descargo de responsabilidades
              </p>
              <p className="text-xs text-red-700 dark:text-red-500 leading-relaxed">
                VP-Planilla es una herramienta de apoyo administrativo. La omisión del pago
                automático de feriados no exime al empleador de sus obligaciones legales.
                La verificación y el pago correcto de feriados es responsabilidad exclusiva
                del empleador. Este software no asume responsabilidad por decisiones
                laborales derivadas del uso de esta configuración.
              </p>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
              Al confirmar, usted declara que comprende estas implicaciones legales y asume
              la responsabilidad del manejo correcto de los feriados en su planilla.
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
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-red-600/20"
            >
              Entiendo, desactivar pago automático
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
