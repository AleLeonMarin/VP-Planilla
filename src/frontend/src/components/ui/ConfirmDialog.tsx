"use client";

import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({ open, title, description, onCancel, onConfirm }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-6">
        {/* Icono de advertencia */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <ExclamationTriangleIcon className="w-7 h-7 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">{title || 'Confirmar acción'}</h3>
        </div>
        
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">{description || '¿Estás seguro de que deseas continuar?'}</p>
        
        <div className="flex gap-3">
          <button 
            onClick={onCancel} 
            className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-semibold transition-colors shadow-sm"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm} 
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700 rounded-lg font-semibold transition-colors shadow-sm"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
