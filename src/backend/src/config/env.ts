import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

/**
 * Preprocess function to handle boolean strings in environment variables
 */
const booleanString = z.preprocess((val) => {
  if (typeof val === 'string') {
    if (['true', '1', 'yes'].includes(val.toLowerCase())) return true;
    if (['false', '0', 'no'].includes(val.toLowerCase())) return false;
  }
  return val;
}, z.boolean());

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.coerce.number().default(86400),
  ALLOWED_ORIGINS: z.string().default('').transform((s) => (s ? s.split(',') : [])),
  RESEND_API_KEY: z.string().optional(),
  REPORTS_OUTPUT_DIR: z.string().default(() => path.join(process.cwd(), "storage", "reports")),
  
  // SMTP / Email Config
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  SMTP_SECURE: booleanString.default(false),
  SMTP_TLS: booleanString.default(false),
  
  // Enterprise info for reports
  REPORTS_ENTERPRISE_NAME: z.string().default('VP-Planillas'),
  REPORTS_ENTERPRISE_TAX_ID: z.string().default('DESCONOCIDO'),
});

export type Env = z.infer<typeof envSchema>;

// Validate process.env and export result
export const env = envSchema.parse(process.env);
