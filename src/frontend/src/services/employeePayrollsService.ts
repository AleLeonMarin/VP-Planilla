import { http } from './http';
import { EmployeePayrollRow } from '@/types/payrollHistory';

/**
 * Trigger a browser download of the payment-receipt PDF for a given
 * (payrollId, employeeId) pair. Uses http.raw so the Bearer token is
 * attached (window.open cannot send Authorization headers — see
 * RESEARCH §A2).
 */
async function downloadReceiptPdf(payrollId: number, employeeId: number): Promise<void> {
  if (typeof window === 'undefined') return;

  const res = await http.raw(`/payment-receipts/${payrollId}/employee/${employeeId}`, {
    method: 'GET',
  });
  if (!res.ok) {
    throw new Error(`No se pudo descargar el comprobante (HTTP ${res.status})`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `comprobante-planilla-${payrollId}-empleado-${employeeId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a tick so the browser has time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const employeePayrollsService = {
  getByEmployee: (employeeId: number): Promise<EmployeePayrollRow[]> =>
    http.get(`/employees/${employeeId}/payrolls`),
  downloadReceiptPdf,
};
