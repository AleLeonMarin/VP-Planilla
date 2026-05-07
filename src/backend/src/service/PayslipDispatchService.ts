import { prisma } from '../lib/prisma';
import { EmailService } from './EmailService';
import { PaymentReceiptService } from './PaymentReceiptService';
import { AuditLogsService } from './AuditLogsService';
import { NotificationService } from './NotificationService';

const emailService = new EmailService();

export class PayslipDispatchService {
  /**
   * Dispatch payslips to all employees of a payroll asynchronously.
   * Called fire-and-forget after APROBADA → PAGADA transition.
   * Errors on individual employees are captured and notified; they never abort the loop.
   * @param payrollId - The ID of the payroll that was just marked as paid
   * @param adminUserId - The ID of the admin who triggered the payment
   * @returns Promise<void>
   */
  static async dispatchPayslips(payrollId: number, adminUserId: number): Promise<void> {
    const payroll = await prisma.vpg_payrolls.findUnique({
      where: { payrolls_id: payrollId },
      include: {
        vpg_payroll_employee: {
          include: {
            vpg_employees: {
              select: {
                employee_id: true,
                employee_first_name: true,
                employee_last_name: true,
                employee_email: true,
              },
            },
          },
        },
      },
    });

    if (!payroll) {
      console.error(`[PayslipDispatch] Planilla ${payrollId} no encontrada`);
      return;
    }

    const start = payroll.payrolls_period_start.toLocaleDateString('es-CR');
    const end = payroll.payrolls_period_end.toLocaleDateString('es-CR');
    const periodLabel = `${start} — ${end}`;

    let sent = 0;
    let failed = 0;

    for (const pe of payroll.vpg_payroll_employee) {
      const emp = pe.vpg_employees;
      const fullName = `${emp.employee_first_name} ${emp.employee_last_name}`;

      // Sin email configurado → notificación in-app, continuar
      if (!emp.employee_email) {
        await NotificationService.createNotification({
          userId: adminUserId,
          title: 'Comprobante no enviado — sin email',
          message: `Empleado ${fullName} no tiene email configurado. Comprobante no enviado.`,
          type: 'PAYSLIP_SENT',
        });
        continue;
      }

      // Generar PDF
      let pdfBuffer: Buffer;
      try {
        pdfBuffer = await PaymentReceiptService.generateReceiptPDF(payrollId, emp.employee_id);
      } catch (genErr) {
        const errMsg = genErr instanceof Error ? genErr.message : 'Error desconocido al generar PDF';
        await AuditLogsService.createAuditLog({
          userId: adminUserId,
          action: 'PAYSLIP_SENT',
          entity: 'vpg_payroll_employee',
          entityId: pe.payroll_employee_id,
          details: JSON.stringify({
            email: emp.employee_email,
            success: false,
            timestamp: new Date().toISOString(),
            payrollId,
            error: errMsg,
          }),
        });
        await NotificationService.createNotification({
          userId: adminUserId,
          title: 'Error al generar comprobante',
          message: `No se pudo generar el comprobante de ${fullName} — ${emp.employee_email}: ${errMsg}`,
          type: 'PAYSLIP_SENT',
        });
        failed++;
        continue;
      }

      // Enviar email con PDF adjunto
      const result = await emailService.sendEmail({
        to: emp.employee_email,
        subject: `Comprobante de pago — Planilla ${periodLabel}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#18181b">Comprobante de Pago</h2>
          <p>Hola ${fullName},</p>
          <p>Adjunto encontrará su comprobante de pago del período <strong>${periodLabel}</strong>.</p>
          <p style="margin-top:20px;color:#71717a;font-size:12px">
            Este es un mensaje automático de VP-Planilla. Por favor no responder a este correo.
          </p>
        </div>`,
        attachments: [{ filename: `comprobante-planilla-${payrollId}-emp-${emp.employee_id}.pdf`, content: pdfBuffer }],
      });

      await AuditLogsService.createAuditLog({
        userId: adminUserId,
        action: 'PAYSLIP_SENT',
        entity: 'vpg_payroll_employee',
        entityId: pe.payroll_employee_id,
        details: JSON.stringify({
          email: emp.employee_email,
          success: result.success,
          timestamp: new Date().toISOString(),
          payrollId,
        }),
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
        await NotificationService.createNotification({
          userId: adminUserId,
          title: 'Error al enviar comprobante',
          message: `No se pudo enviar comprobante a ${fullName} — ${emp.employee_email}: ${result.message}`,
          type: 'PAYSLIP_SENT',
        });
      }
    }

    // Notificación resumen
    await NotificationService.createNotification({
      userId: adminUserId,
      title: `Despacho de comprobantes — Planilla ${periodLabel}`,
      message: `Planilla ${periodLabel}: ${sent} comprobante${sent !== 1 ? 's' : ''} enviado${sent !== 1 ? 's' : ''}, ${failed} fallo${failed !== 1 ? 's' : ''}.`,
      type: 'PAYSLIP_SENT',
    });
  }

  /**
   * Resend a single payslip to an employee. Used by the admin resend endpoint.
   * Does not require the payroll to be in a specific status.
   * @param payrollId - The ID of the payroll
   * @param employeeId - The ID of the employee (vpg_employees.employee_id)
   * @param adminUserId - The ID of the admin requesting the resend
   * @returns Promise<{ success: boolean; message: string }>
   */
  static async resendPayslip(
    payrollId: number,
    employeeId: number,
    adminUserId: number
  ): Promise<{ success: boolean; message: string }> {
    // Verify payroll_employee record exists and fetch email
    const pe = await prisma.vpg_payroll_employee.findFirst({
      where: {
        payroll_employee_payroll_id: payrollId,
        payroll_employee_employee_id: employeeId,
      },
      include: {
        vpg_employees: {
          select: {
            employee_id: true,
            employee_first_name: true,
            employee_last_name: true,
            employee_email: true,
          },
        },
        vpg_payrolls: {
          select: {
            payrolls_period_start: true,
            payrolls_period_end: true,
          },
        },
      },
    });

    if (!pe) {
      return { success: false, message: `Empleado ${employeeId} no encontrado en la planilla ${payrollId}` };
    }

    const emp = pe.vpg_employees;
    const fullName = `${emp.employee_first_name} ${emp.employee_last_name}`;

    if (!emp.employee_email) {
      return { success: false, message: `El empleado ${fullName} no tiene email configurado` };
    }

    const start = pe.vpg_payrolls.payrolls_period_start.toLocaleDateString('es-CR');
    const end = pe.vpg_payrolls.payrolls_period_end.toLocaleDateString('es-CR');
    const periodLabel = `${start} — ${end}`;

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await PaymentReceiptService.generateReceiptPDF(payrollId, employeeId);
    } catch (genErr) {
      const errMsg = genErr instanceof Error ? genErr.message : 'Error desconocido al generar PDF';
      await AuditLogsService.createAuditLog({
        userId: adminUserId,
        action: 'PAYSLIP_SENT',
        entity: 'vpg_payroll_employee',
        entityId: pe.payroll_employee_id,
        details: JSON.stringify({
          email: emp.employee_email,
          success: false,
          timestamp: new Date().toISOString(),
          payrollId,
          resend: true,
          error: errMsg,
        }),
      });
      return { success: false, message: `Error al generar PDF: ${errMsg}` };
    }

    const result = await emailService.sendEmail({
      to: emp.employee_email,
      subject: `Comprobante de pago — Planilla ${periodLabel}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#18181b">Comprobante de Pago</h2>
        <p>Hola ${fullName},</p>
        <p>Adjunto encontrará su comprobante de pago del período <strong>${periodLabel}</strong>.</p>
        <p style="margin-top:20px;color:#71717a;font-size:12px">
          Este es un mensaje automático de VP-Planilla. Por favor no responder a este correo.
        </p>
      </div>`,
      attachments: [{ filename: `comprobante-planilla-${payrollId}-emp-${employeeId}.pdf`, content: pdfBuffer }],
    });

    await AuditLogsService.createAuditLog({
      userId: adminUserId,
      action: 'PAYSLIP_SENT',
      entity: 'vpg_payroll_employee',
      entityId: pe.payroll_employee_id,
      details: JSON.stringify({
        email: emp.employee_email,
        success: result.success,
        timestamp: new Date().toISOString(),
        payrollId,
        resend: true,
      }),
    });

    return result;
  }
}
