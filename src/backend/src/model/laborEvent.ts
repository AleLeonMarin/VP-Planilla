export type LaborEventPayBehavior = 'FULL_PAY' | 'PARTIAL_PAY' | 'NO_PAY' | 'EXTERNAL_PAY';

export interface LaborEvent {
  id: number;
  name: string;
  description: string;
  version: number;
  payBehavior: LaborEventPayBehavior;
  /** Max days the employer pays under this behavior. null = unlimited. */
  maxPaidDays: number | null;
  /** Percentage of daily salary to pay when payBehavior = PARTIAL_PAY. null otherwise. */
  payPercentage: number | null;
}
