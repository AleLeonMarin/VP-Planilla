-- AlterTable
ALTER TABLE "vpg_payroll_employee" ADD COLUMN     "payroll_employee_deductions_override" DECIMAL(10,2),
ADD COLUMN     "payroll_employee_hours_override" DECIMAL(10,2),
ADD COLUMN     "payroll_employee_is_manually_adjusted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payroll_employee_overtime_override" DECIMAL(10,2),
ADD COLUMN     "payroll_employee_weekly_rest_override" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "vpg_payrolls" ADD COLUMN     "payrolls_period_type" VARCHAR(20) NOT NULL DEFAULT 'quincenal';
