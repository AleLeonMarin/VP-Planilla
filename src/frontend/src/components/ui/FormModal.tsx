"use client";

import React from 'react';
import { useForm, SubmitHandler, UseFormReturn, Resolver, FieldValues, DefaultValues } from 'react-hook-form';

interface FormModalProps<T extends FieldValues> {
  title?: string;
  open: boolean;
  initialValues?: Partial<T>;
  onClose: () => void;
  onSubmit: (values: Partial<T>) => Promise<void> | void;
  children: React.ReactNode | ((methods: UseFormReturn<Partial<T>>) => React.ReactNode);
  resolver?: Resolver<Partial<T>>;
}

export default function FormModal<T extends FieldValues>({ title, open, initialValues, onClose, onSubmit, children, resolver }: FormModalProps<T>) {
  const methods = useForm<Partial<T>>({
    defaultValues: (initialValues ?? {}) as DefaultValues<Partial<T>>,
    resolver
  });
  const { handleSubmit, reset } = methods;

  React.useEffect(() => {
    reset((initialValues ?? {}) as DefaultValues<Partial<T>>);
  }, [initialValues, reset]);

  if (!open) return null;

  const submit: SubmitHandler<Partial<T>> = async (data) => {
    await onSubmit(data);
    onClose();
  };

  const renderChildren = () => {
    if (typeof children === 'function') {
      return children(methods);
    }
    return children;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 dark:bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 dark:from-zinc-800 dark:to-zinc-800 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white dark:text-zinc-100">{title || 'Formulario'}</h3>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 dark:hover:bg-white/10"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="p-6">
          <div className="space-y-4">
            {renderChildren()}
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700 rounded-xl transition-colors font-medium shadow-md"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
