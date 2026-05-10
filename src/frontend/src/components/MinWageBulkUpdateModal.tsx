import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LegalParam } from '../types/legalParam';
import { LegalParamService } from '../services/legalParamService';
import PasswordConfirmModal from './PasswordConfirmModal';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

const bulkUpdateSchema = z.object({
  validFrom: z.string().min(1, 'La fecha de vigencia es requerida'),
  source_decree: z.string().min(1, 'El decreto es requerido'),
  updates: z.array(
    z.object({
      key: z.string(),
      value: z.string().min(1, 'El valor es requerido'),
      description: z.string(),
    })
  ),
});

type BulkUpdateFormData = z.infer<typeof bulkUpdateSchema>;

interface MinWageBulkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentWages: LegalParam[];
}

export const MinWageBulkUpdateModal: React.FC<MinWageBulkUpdateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentWages,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [pendingData, setPendingData] = useState<BulkUpdateFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BulkUpdateFormData>({
    resolver: zodResolver(bulkUpdateSchema),
  });

  const { fields } = useFieldArray({
    control,
    name: 'updates',
  });

  useEffect(() => {
    if (isOpen && currentWages.length > 0) {
      reset({
        validFrom: '',
        source_decree: '',
        updates: currentWages.map((w) => ({
          key: w.key,
          value: w.value.toString(),
          description: w.description,
        })),
      });
      setIsConfirming(false);
      setPendingData(null);
      setPasswordError(undefined);
    }
  }, [isOpen, currentWages, reset]);

  const onFormSubmit = (data: BulkUpdateFormData) => {
    setPendingData(data);
    setIsConfirming(true); // Siempre crítico
  };

  const executeSave = async (data: BulkUpdateFormData, confirmationPassword?: string) => {
    setIsSubmitting(true);
    setPasswordError(undefined);
    try {
      const updatesToSend = data.updates.map((u) => ({
        key: u.key,
        value: Number(u.value),
      }));

      await LegalParamService.bulkUpsertMinWages({
        updates: updatesToSend,
        validFrom: new Date(data.validFrom).toISOString(),
        source_decree: data.source_decree,
        confirmationPassword,
      });

      toast.success('Salarios mínimos actualizados masivamente');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Error al actualizar salarios';
      if (msg.toLowerCase().includes('contraseña')) {
        setPasswordError(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col pointer-events-auto">
          <div className="flex justify-between items-center p-6 border-b border-zinc-800">
            <h2 className="text-xl font-bold text-zinc-100">
              Actualización Masiva de Salarios Mínimos
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200 p-2 rounded-full hover:bg-zinc-800 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <form id="bulk-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Decreto / Fuente
                  </label>
                  <input
                    type="text"
                    {...register('source_decree')}
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent"
                    placeholder="Ej: Decreto Ejecutivo N°..."
                  />
                  {errors.source_decree && (
                    <p className="text-red-400 text-xs mt-1">{errors.source_decree.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Vigente Desde
                  </label>
                  <input
                    type="date"
                    {...register('validFrom')}
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent [color-scheme:dark]"
                  />
                  {errors.validFrom && (
                    <p className="text-red-400 text-xs mt-1">{errors.validFrom.message}</p>
                  )}
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-6">
                <h3 className="text-lg font-medium text-zinc-200 mb-4">Nuevos Valores</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-800">
                      <label className="block text-sm font-medium text-zinc-300 mb-1">
                        {field.key}
                      </label>
                      <p className="text-xs text-zinc-500 mb-3">{field.description}</p>
                      <input
                        type="hidden"
                        {...register(`updates.${index}.key` as const)}
                      />
                      <input
                        type="number"
                        step="any"
                        {...register(`updates.${index}.value` as const)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent"
                      />
                      {errors.updates?.[index]?.value && (
                        <p className="text-red-400 text-xs mt-1">{errors.updates[index]?.value?.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </div>

          <div className="p-6 border-t border-zinc-800 bg-zinc-900 flex justify-end gap-4 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="bulk-form"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg bg-[#FCF1D5] text-[#4A5D3A] font-semibold hover:bg-[#e5d5b1] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Preparando...' : 'Aplicar Actualización'}
            </button>
          </div>
        </div>
      </div>

      <PasswordConfirmModal
        isOpen={isConfirming}
        paramName="Actualización Masiva de Salarios Mínimos"
        onConfirm={(pwd) => {
          if (pendingData) executeSave(pendingData, pwd);
        }}
        onCancel={() => {
          setIsConfirming(false);
          setPasswordError(undefined);
        }}
        isLoading={isSubmitting}
        error={passwordError}
      />
    </>
  );
};
