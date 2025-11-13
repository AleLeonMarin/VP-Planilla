import { http } from './http';
import {
  PayrollReportDataset,
  ReportDispatchSummary,
  ReportLogEntry,
  ReportsDashboardData,
  SendReportsPayload,
} from '@/types/reports';

export const ReportsService = {
  async getDashboard(): Promise<ReportsDashboardData> {
    return (await http.get('/reports/dashboard')) as ReportsDashboardData;
  },

  async getPayrollDataset(payrollId: number): Promise<PayrollReportDataset> {
    return (await http.get(
      `/reports/payroll/${payrollId}/employees`
    )) as PayrollReportDataset;
  },

  async getPayrollLogs(payrollId: number): Promise<ReportLogEntry[]> {
    return (await http.get(
      `/reports/payroll/${payrollId}/logs`
    )) as ReportLogEntry[];
  },

  async sendReports(payload: SendReportsPayload): Promise<ReportDispatchSummary> {
    const { payrollId, ...body } = payload;
    return (await http.post(
      `/reports/payroll/${payrollId}/send`,
      body
    )) as ReportDispatchSummary;
  },
};
