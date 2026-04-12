import { Resend } from 'resend';
import { getEmailConfig } from '../config/emailConfig';

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  message: string;
  emailId?: string;
}

let resendInstance: Resend | null = null;

function getResendClient(): Resend {
  if (!resendInstance) {
    const config = getEmailConfig();
    resendInstance = new Resend(config.RESEND_API_KEY);
  }
  return resendInstance;
}

export class EmailService {
  private defaultFrom = 'VP-Planilla <noreply@mail.vplanilla.app>';

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    const { to, subject, html, text, from = this.defaultFrom, replyTo } = params;

    try {
      const resend = getResendClient();

      const { data, error } = await resend.emails.send({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        replyTo,
      });

      if (error) {
        console.error('Resend error:', error);
        return {
          success: false,
          message: error.message || 'Failed to send email',
        };
      }

      return {
        success: true,
        message: 'Email sent successfully',
        emailId: data?.id,
      };
    } catch (err) {
      console.error('Exception sending email:', err);
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  async sendPayrollNotification(
    employeeEmail: string,
    employeeName: string,
    period: string
  ): Promise<SendEmailResult> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #18181b;">Notificación de Nómina</h2>
        <p>Hola ${employeeName},</p>
        <p>Tu nómina del período <strong>${period}</strong> ya está disponible.</p>
        <p>Puedes acceder al sistema para ver los detalles de tu pago.</p>
        <p style="margin-top: 20px; color: #71717a; font-size: 12px;">
          Este es un mensaje automático de VP-Planilla. Por favor no responder a este correo.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: employeeEmail,
      subject: `Tu nómina del período ${period} está disponible`,
      html,
      text: `Hola ${employeeName}, Tu nómina del período ${period} ya está disponible. Puedes acceder al sistema para ver los detalles.`,
    });
  }

  async sendBatchPayrollNotifications(
    employees: Array<{ email: string; name: string }>,
    period: string
  ): Promise<{ sent: number; failed: number; errors: string[] }> {
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const emp of employees) {
      const result = await this.sendPayrollNotification(emp.email, emp.name, period);

      if (result.success) {
        sent++;
      } else {
        failed++;
        errors.push(`${emp.email}: ${result.message}`);
      }
    }

    return { sent, failed, errors };
  }
}