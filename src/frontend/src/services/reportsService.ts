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

  async downloadPaymentReceiptsPdf(payload: {
    payrollId: number;
    employeeIds?: number[];
  }): Promise<{ blob: Blob; fileName: string }> {
    const { payrollId, employeeIds } = payload;
    const response = await http.raw(`/reports/payroll/${payrollId}/payment-receipts/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeIds }),
    });

    if (!response.ok) {
      let message = `No se pudo generar el PDF (HTTP ${response.status})`;
      try {
        const errorBody = await response.json();
        message = errorBody?.message || errorBody?.error || message;
      } catch {
        // Keep fallback message
      }
      throw new Error(message);
    }

    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition') || '';
    const fileNameMatch = disposition.match(/filename=([^;]+)/i);
    const fallbackName = employeeIds && employeeIds.length === 1
      ? `comprobante_pago_${payrollId}_${employeeIds[0]}.pdf`
      : `comprobantes_planilla_${payrollId}.pdf`;

    return {
      blob,
      fileName: fileNameMatch ? fileNameMatch[1].trim().replace(/^"|"$/g, '') : fallbackName,
    };
  },
};
