export interface AguinaldoAccrual {
  accrued: number;
  projectedAnnual: number;
  periodStart: string;
  periodEnd: string;
  monthsCompleted: number;
  payrollsIncluded: number;
}

export interface AguinaldoSummaryRow {
  employeeId: number;
  employeeName: string;
  accruedBeforeThisPayroll: number;
  thisPayrollContribution: number;
  totalAccruedWithThis: number;
}
