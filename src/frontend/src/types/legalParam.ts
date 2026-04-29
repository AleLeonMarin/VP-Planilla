export interface LegalParam {
  id: string;
  key: string;
  value: number | string;
  description: string;
  category: string;
  validFrom: string;
  validUntil?: string | null;
  isActive: boolean;
  isCritical: boolean;
  source_decree?: string | null;
  createdBy: string;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}
