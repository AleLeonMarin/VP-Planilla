import { Decimal } from '@prisma/client/runtime/library';

/**
 * TypeScript interface for the vpg_payroll_param_snapshots table.
 * Mirrors the Prisma vpgPayrollParamSnapshot model field-for-field.
 * Snapshots are immutable once created — never updated, only inserted and read.
 */
export interface VpgPayrollParamSnapshot {
  id: string;
  payroll_id: number;
  param_key: string;
  param_value: Decimal;
  param_valid_from: Date;
  source_decree: string | null;
  captured_at: Date;
}
