import { PrismaClient } from "@prisma/client";
import { Payroll } from "../model/payroll";
import { error } from "console";

const prisma = new PrismaClient();

export class PayrollService {
  /**
   * Create a new payroll record in the system
   * @param data - Payroll data to create
   * @returns Promise<Payroll> - The created payroll with assigned ID and version
   * @throws Error if payroll creation fails
   */
  static async createPayroll(data: Payroll): Promise<Payroll> {
    const createdPayroll = await prisma.vpg_payrolls.create({
      data: {
        payrolls_payroll_type_id: data.payroll_type,
        payrolls_period_start: data.period_start,
        payrolls_period_end: data.period_end,
        payrolls_payment_date: data.payment_date,
        payrolls_status: data.status,
        payrolls_version: 1,
      },
    });
    const payroll: Payroll = {
      id: createdPayroll.payrolls_id,
      payroll_type: createdPayroll.payrolls_payroll_type_id,
      period_start: createdPayroll.payrolls_period_start,
      period_end: createdPayroll.payrolls_period_end,
      payment_date: createdPayroll.payrolls_payment_date,
      status: createdPayroll.payrolls_status,
      version: createdPayroll.payrolls_version,
    };
    return payroll;
  }

  /**
   * Get a payroll record by its ID
   * @param id - The ID of the payroll to retrieve
   * @returns Promise<Payroll | null> - The payroll record or null if not found
   * @throws Error if database query fails
   */
  static async getPayrollById(id: number): Promise<Payroll | null> {
    const payroll = await prisma.vpg_payrolls.findUnique({
      where: { payrolls_id: id },
    });
    if (!payroll) return null;
    return {
      id: payroll.payrolls_id,
      payroll_type: payroll.payrolls_payroll_type_id,
      period_start: payroll.payrolls_period_start,
      period_end: payroll.payrolls_period_end,
      payment_date: payroll.payrolls_payment_date,
      status: payroll.payrolls_status,
      version: payroll.payrolls_version,
    };
  }

  /**
   * Update an existing payroll record
   * @param id - The ID of the payroll to update
   * @param data - Updated payroll data
   * @returns Promise<Payroll | null> - The updated payroll record or null if not found
   * @throws Error if payroll is not found or update fails
   */
  static async updatePayroll(
    id: number,
    data: Payroll
  ): Promise<Payroll | null> {
    const updatedPayroll = await prisma.vpg_payrolls.update({
      where: { payrolls_id: id },
      data: {
        payrolls_payroll_type_id: data.payroll_type,
        payrolls_period_start: data.period_start,
        payrolls_period_end: data.period_end,
        payrolls_payment_date: data.payment_date,
        payrolls_status: data.status,
        payrolls_version: (data.version ?? 0) + 1,
      },
    });
    if (!updatedPayroll) throw error("Payroll not found");
    
    return {
      id: updatedPayroll.payrolls_id,
      payroll_type: updatedPayroll.payrolls_payroll_type_id,
      period_start: updatedPayroll.payrolls_period_start,
      period_end: updatedPayroll.payrolls_period_end,
      payment_date: updatedPayroll.payrolls_payment_date,
      status: updatedPayroll.payrolls_status,
      version: updatedPayroll.payrolls_version,
    };
  }
}
