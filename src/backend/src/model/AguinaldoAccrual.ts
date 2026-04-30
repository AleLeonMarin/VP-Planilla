export interface AguinaldoAccrual {
  accrued: number;
  projectedAnnual: number;
  periodStart: Date;
  periodEnd: Date;
  monthsCompleted: number;
  payrollsIncluded: number;
}

export interface AguinaldoSummaryRow {
  employeeId: number;
  employeeName: string;
  accruedBeforeThisPayroll: number;
  thisPayrollContribution: number;
  totalAccruedWithThis: number;
  periodStart: Date;
  periodEnd: Date;
}
