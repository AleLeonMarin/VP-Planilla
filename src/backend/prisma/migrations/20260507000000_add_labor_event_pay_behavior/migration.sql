-- CreateEnum
CREATE TYPE "verdepradera"."LaborEventPayBehavior" AS ENUM ('FULL_PAY', 'PARTIAL_PAY', 'NO_PAY', 'EXTERNAL_PAY');

-- AlterTable vpg_labor_events
ALTER TABLE "verdepradera"."vpg_labor_events"
  ADD COLUMN "labor_event_pay_behavior"   "verdepradera"."LaborEventPayBehavior" NOT NULL DEFAULT 'NO_PAY',
  ADD COLUMN "labor_event_max_paid_days"  INTEGER,
  ADD COLUMN "labor_event_pay_percentage" DECIMAL(5,2);
