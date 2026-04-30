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

/**
 * API response shape for snapshot entries.
 * param_value is serialized as string (via Decimal.toString()) for JSON consumers.
 * Use this type for API response payloads, not for internal DB operations.
 */
export interface VpgPayrollParamSnapshotResponse {
  param_key: string;
  param_value: string;
  param_valid_from: Date;
  source_decree: string | null;
}
