import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { LegalParamService } from "@/services/legalParamService";

const legalConfigSchema = z.object({
  minWageCheckEnabled: z.boolean(),
});

export type LegalConfigValues = z.infer<typeof legalConfigSchema>;

/**
 * Hook to manage legal parameter configuration.
 * Specifically handles the MIN_WAGE_CHECK_ENABLED parameter.
 */
export const useLegalParamConfig = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LegalConfigValues>({
    resolver: zodResolver(legalConfigSchema),
    defaultValues: {
      minWageCheckEnabled: false,
    },
  });

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const param = await LegalParamService.getParam('MIN_WAGE_CHECK_ENABLED');
      
      // Values in vpg_legal_params are stored as strings/numbers.
      // 1 means enabled, 0 means disabled.
      form.reset({
        minWageCheckEnabled: Boolean(Number(param.value)),
      });
    } catch (error) {
      console.error("Error loading legal param config:", error);
      // We don't toast error here to avoid double toasts if the page already toasts
      // But according to plan we should manage it.
    } finally {
      setIsLoading(false);
    }
  }, [form]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  /**
   * Saves the current legal configuration to the backend.
   * @param data The form data to save.
   */
  const saveConfig = async (data: LegalConfigValues) => {
    try {
      setIsSubmitting(true);
      // Update parameter via service
      await LegalParamService.updateParam('MIN_WAGE_CHECK_ENABLED', data.minWageCheckEnabled ? 1 : 0);
      
      toast.success("Configuración de validación actualizada");
      form.reset(data); // Mark as pristine
    } catch (error) {
      console.error("Error updating legal param:", error);
      toast.error("Error al actualizar la configuración legal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isLoading,
    isSubmitting,
    saveConfig: form.handleSubmit(saveConfig),
  };
};
