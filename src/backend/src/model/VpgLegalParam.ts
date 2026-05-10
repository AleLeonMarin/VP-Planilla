import { Decimal } from '@prisma/client/runtime/library';

/**
 * TypeScript interface for the vpg_legal_params table.
 * Mirrors the Prisma VpgLegalParam model field-for-field.
 */
export interface VpgLegalParam {
  id: string;
  key: string;
  value: Decimal;
  description: string;
  category: string; // WORKDAY | OVERTIME | CCSS | MIN_WAGE | FEATURE_FLAG
  validFrom: Date;
  validUntil: Date | null;
  isActive: boolean;
  isCritical: boolean;
  source_decree: string | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for creating or updating a legal parameter.
 * Used by LegalParamController → LegalParamService.upsertParam().
 */
export interface CreateLegalParamDto {
  key: string;
  value: number | string; // Accepts number or string; service converts to Decimal
  description: string;
  category: string;
  validFrom: Date | string; // Accepts ISO string; service converts to Date
  isCritical?: boolean;
  source_decree?: string;
}
