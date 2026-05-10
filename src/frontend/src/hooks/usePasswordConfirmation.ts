'use client';

import { useState, useCallback } from 'react';

interface UsePasswordConfirmationOptions {
  onSuccess?: () => void;
}

export function usePasswordConfirmation(options: UsePasswordConfirmationOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paramName, setParamName] = useState('');
  const [pendingAction, setPendingAction] = useState<((password: string) => Promise<void>) | null>(null);

  const requireConfirmation = useCallback(
    (name: string, action: (password: string) => Promise<void>) => {
      setParamName(name);
      setError(null);
      setPendingAction(() => action);
      setIsOpen(true);
    },
    []
  );

  const onConfirm = useCallback(
    async (password: string) => {
      if (!pendingAction) return;
      setIsLoading(true);
      setError(null);
      try {
        await pendingAction(password);
        setIsOpen(false);
        setPendingAction(null);
        options.onSuccess?.();
      } catch (err: unknown) {
        // Surface the backend error message if available (403 returns { error: string })
        const message =
          err instanceof Error
            ? err.message
            : 'Contraseña incorrecta. El cambio no fue guardado.';
        setError(message);
        // Do NOT close the modal — user can retry
      } finally {
        setIsLoading(false);
      }
    },
    [pendingAction, options]
  );

  const onCancel = useCallback(() => {
    if (isLoading) return; // prevent cancel while request is in flight
    setIsOpen(false);
    setError(null);
    setPendingAction(null);
  }, [isLoading]);

  return {
    isOpen,
    isLoading,
    error,
    paramName,
    onConfirm,
    onCancel,
    requireConfirmation,
  };
}
