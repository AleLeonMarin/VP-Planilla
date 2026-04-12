import { z } from 'zod';
import { env } from './env';

export const emailConfigSchema = z.object({
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
});

export type EmailConfig = z.infer<typeof emailConfigSchema>;

export function getEmailConfig(): EmailConfig {
  const apiKey = env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }

  const result = emailConfigSchema.safeParse({ RESEND_API_KEY: apiKey });

  if (!result.success) {
    const errorMessages = result.error.issues.map(i => i.message).join(', ');
    throw new Error(`Invalid email config: ${errorMessages}`);
  }

  return result.data;
}
