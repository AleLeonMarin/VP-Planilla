import React, { useState } from 'react';
import { LegalParam } from '../types/legalParam';
import { LegalParamService } from '../services/legalParamService';
import PasswordConfirmModal from './PasswordConfirmModal';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface FeatureFlagToggleProps {
  param: LegalParam;
  onChange: () => void;
  readOnly?: boolean;
}

export const FeatureFlagToggle: React.FC<FeatureFlagToggleProps> = ({
  param,
  onChange,
  readOnly = false,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [pendingState, setPendingState] = useState<boolean | null>(null);

  const isOn = String(param.value) === '1' || String(param.value).toLowerCase() === 'true';

  const handleToggleClick = () => {
    if (readOnly || isSubmitting) return;
    
    const newState = !isOn;
    
    if (param.isCritical) {
      setPendingState(newState);
      setIsConfirming(true);
    } else {
      executeSave(newState);
    }
  };

  const executeSave = async (newState: boolean, confirmationPassword?: string) => {
    setIsSubmitting(true);
    setPasswordError(undefined);
    try {
      await LegalParamService.patchParam(param.key, {
        value: newState ? 1 : 0,
        confirmationPassword,
      });

      toast.success('Configuración actualizada exitosamente');
      onChange();
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Error al actualizar configuración';
      if (msg.toLowerCase().includes('contraseña')) {
        setPasswordError(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
      setIsConfirming(false);
      setPendingState(null);
    }
  };

  return (
    <>
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

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-zinc-800/50">
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isOn}
              disabled={readOnly || isSubmitting}
              onClick={handleToggleClick}
              className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#FCF1D5] focus:ring-offset-2 focus:ring-offset-zinc-900
                ${isOn ? 'bg-[#4A5D3A]' : 'bg-zinc-700'}
                ${readOnly || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span
                aria-hidden="true"
                className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                  ${isOn ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
            <span className="text-sm font-medium text-zinc-300">
              {isOn ? 'Activado' : 'Desactivado'}
            </span>
          </div>

          {!isOn && (
            <span className="inline-flex items-center rounded-md bg-red-400/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-400/20">
              DESACTIVADO
            </span>
          )}
        </div>
      </div>

      <PasswordConfirmModal
        isOpen={isConfirming}
        paramName={param.key}
        onConfirm={(pwd) => {
          if (pendingState !== null) executeSave(pendingState, pwd);
        }}
        onCancel={() => {
          setIsConfirming(false);
          setPasswordError(undefined);
          setPendingState(null);
        }}
        isLoading={isSubmitting}
        error={passwordError}
      />
    </>
  );
};
