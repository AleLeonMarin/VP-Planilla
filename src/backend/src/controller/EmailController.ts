import { Request, Response } from 'express';
import { EmailService } from '../service/EmailService';

export class EmailController {
  private emailService = new EmailService();

  async sendEmail(req: Request, res: Response): Promise<Response> {
    const { to, subject, html, text, from, replyTo } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, html',
      });
    }

    const result = await this.emailService.sendEmail({
      to,
      subject,
      html,
      text,
      from,
      replyTo,
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  }

  async sendPayrollNotification(req: Request, res: Response): Promise<Response> {
    const { employee_email, employee_name, period } = req.body;

    if (!employee_email || !employee_name || !period) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: employee_email, employee_name, period',
      });
    }

    const result = await this.emailService.sendPayrollNotification(
      employee_email,
      employee_name,
      period
    );

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  }

  async sendBatchPayrollNotification(req: Request, res: Response): Promise<Response> {
    const { employees, period } = req.body;

    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid employees array',
      });
    }

    if (!period) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: period',
      });
    }

    const result = await this.emailService.sendBatchPayrollNotifications(
      employees,
      period
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  }
}