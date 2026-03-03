import { Request, Response } from "express";
import {
  OfficialReportType,
  ReportsService,
} from "../service/ReportsService";
import { PaymentReceiptService } from "../service/PaymentReceiptService";

export class ReportsController {
  static async getDashboard(_req: Request, res: Response) {
    try {
      const data = await ReportsService.getDashboard();
      res.json({ success: true, data });
    } catch (error) {
      console.error("Failed to load reports dashboard:", error);
      res
        .status(500)
        .json({ success: false, message: "No se pudo obtener el dashboard" });
    }
  }

  static async getPayrollDataset(req: Request, res: Response) {
    const payrollId = Number(req.params.id);
    if (Number.isNaN(payrollId)) {
      return res
        .status(400)
        .json({ success: false, message: "ID de planilla inválido" });
    }

    try {
      const dataset = await ReportsService.getPayrollDataset(payrollId);
      res.json({ success: true, data: dataset });
    } catch (error) {
      console.error("Failed to load payroll dataset:", error);
      res
        .status(500)
        .json({ success: false, message: "No se pudo obtener la planilla" });
    }
  }

  static async getPayrollLogs(req: Request, res: Response) {
    const payrollId = Number(req.params.id);
    if (Number.isNaN(payrollId)) {
      return res
        .status(400)
        .json({ success: false, message: "ID de planilla inválido" });
    }

    try {
      const logs = await ReportsService.getReportLogs(payrollId);
      res.json({ success: true, data: logs });
    } catch (error) {
      console.error("Failed to load payroll logs:", error);
      res
        .status(500)
        .json({ success: false, message: "No se pudo obtener el historial" });
    }
  }

  static async sendReports(req: Request, res: Response) {
    const payrollId = Number(req.params.id);
    if (Number.isNaN(payrollId)) {
      return res
        .status(400)
        .json({ success: false, message: "ID de planilla inválido" });
    }

    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res
        .status(401)
        .json({ success: false, message: "Usuario no autenticado" });
    }

    const body = req.body || {};
    const employeeIds = Array.isArray(body.employeeIds)
      ? body.employeeIds
          .map((value: any) => Number(value))
          .filter((value: number) => !Number.isNaN(value))
      : undefined;

    const reportTypes = Array.isArray(body.reportTypes)
      ? (body.reportTypes as string[])
      : undefined;

    const cc = Array.isArray(body.cc)
      ? body.cc
      : typeof body.cc === "string"
      ? body.cc.split(",")
      : undefined;

    const customMessage =
      typeof body.customMessage === "string" ? body.customMessage : undefined;

    try {
      const summary = await ReportsService.sendReports({
        payrollId,
        employeeIds: employeeIds && employeeIds.length > 0 ? employeeIds : undefined,
        reportTypes: (reportTypes as OfficialReportType[]) || [],
        cc,
        customMessage,
        requesterUserId: req.user.id || req.user.user_id,
      });

      res.json({ success: true, data: summary });
    } catch (error) {
      console.error("Failed to send reports:", error);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo enviar los reportes";
      res.status(500).json({ success: false, message });
    }
  }

  static async downloadPaymentReceiptsPdf(req: Request, res: Response) {
    const payrollId = Number(req.params.id);
    if (Number.isNaN(payrollId)) {
      return res
        .status(400)
        .json({ success: false, message: "ID de planilla inválido" });
    }

    const body = req.body || {};
    const employeeIds = Array.isArray(body.employeeIds)
      ? body.employeeIds
          .map((value: unknown) => Number(value))
          .filter((value: number) => Number.isInteger(value) && value > 0)
      : undefined;

    try {
      const { pdf, employeeIds: resolvedEmployeeIds } =
        await PaymentReceiptService.generateConsolidatedReceiptsPDF(
          payrollId,
          employeeIds && employeeIds.length > 0 ? employeeIds : undefined
        );

      const fileName =
        resolvedEmployeeIds.length === 1
          ? `comprobante_pago_${payrollId}_${resolvedEmployeeIds[0]}.pdf`
          : `comprobantes_planilla_${payrollId}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      res.setHeader("Content-Length", pdf.length);
      res.send(pdf);
    } catch (error) {
      console.error("Failed to generate payment receipts PDF:", error);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo generar el PDF de comprobantes";
      res.status(500).json({ success: false, message });
    }
  }
}
