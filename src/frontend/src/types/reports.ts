export type OfficialReportType = 'CCSS' | 'HACIENDA';

export interface ReportablePayrollSummary {
  id: number;
  label: string;
  period_start: string;
  period_end: string;
  payment_date: string | null;
  status: string;
  total_employees: number;
  total_gross: number;
  total_net: number;
  last_sent_at?: string;
  last_sent_type?: OfficialReportType;
  last_sent_status?: string;
}

export interface ReportTargetSummary {
  id: number;
  institution: string;
  endpoint_url: string;
  contact_email: string;
}

export interface ReportsDashboardData {
  payrolls: ReportablePayrollSummary[];
  targets: ReportTargetSummary[];
  availableReportTypes: OfficialReportType[];
}

export interface ReportEmployeeDeduction {
  id: number;
  name: string;
  amount: number;
}

export interface ReportLogEntry {
  id: number;
  type: OfficialReportType;
  status: string;
  generated_at: string;
  period_start: string;
  period_end: string;
  file_path: string;
  payrollId?: number;
  employeeId?: number;
  employeeName?: string;
}

export interface PayrollEmployeeReportRow {
  payrollEmployeeId: number;
  employeeId: number;
  fullName: string;
  email: string | null;
  socialSecurityCode?: string | null;
  nationalId?: string | null;
  position?: string | null;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  deductions: ReportEmployeeDeduction[];
  lastDispatch?: ReportLogEntry;
}

export interface PayrollReportDataset {
  payroll: {
    id: number;
    period_start: string;
    period_end: string;
    payment_date: string | null;
    status: string;
    total_employees: number;
    total_gross: number;
    total_net: number;
  };
  employer: {
    id: number | null;
    name: string;
    taxId: string;
  };
  employees: PayrollEmployeeReportRow[];
}

export interface ReportDispatchResult {
  employeeId: number;
  employeeName: string;
  email?: string | null;
  status: 'sent' | 'skipped' | 'failed';
  detail: string;
  reportTypes: OfficialReportType[];
  attachments: string[];
}

export interface ReportDispatchSummary {
  requested: number;
  sent: number;
  failed: number;
  reportTypes: OfficialReportType[];
  results: ReportDispatchResult[];
}

export interface SendReportsPayload {
  payrollId: number;
  employeeIds?: number[];
  reportTypes: OfficialReportType[];
  cc?: string[];
  customMessage?: string;
}
