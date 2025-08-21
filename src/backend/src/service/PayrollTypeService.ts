import { PrismaClient } from "@prisma/client";
import { PayrollType } from "../model/payrollType";

const prisma = new PrismaClient();

export class PayrollTypeService {
  static async createPayrollType(data: PayrollType): Promise<PayrollType> {
    try {
      const createdPayrollType = await prisma.vpg_payroll_types.create({
        data: {
          payroll_types_name: data.name,
          payroll_types_description: data.description,
          payroll_types_version: 1,
        },
      });
      const payrollType: PayrollType = {
        id: createdPayrollType.payroll_types_id,
        name: createdPayrollType.payroll_types_name,
        description: createdPayrollType.payroll_types_description,
        version: createdPayrollType.payroll_types_version,
      };
      return payrollType;
    } catch (error) {
      console.error("Error creating payroll type:", error);
      throw new Error("Failed to create payroll type");
    } finally {
      await prisma.$disconnect();
    }
  }

  static async updatePayrollType(
    id: number,
    data: Partial<PayrollType>
  ): Promise<PayrollType | null> {
    const prismaPayroll = await prisma.vpg_payroll_types.update({
      where: { payroll_types_id: id },
      data: {
        payroll_types_name: data.name,
        payroll_types_description: data.description,
        payroll_types_version: (data.version ?? 0) + 1,
      },
    });
    const payrollType: PayrollType = {
      id: prismaPayroll.payroll_types_id,
      name: prismaPayroll.payroll_types_name,
      description: prismaPayroll.payroll_types_description,
      version: prismaPayroll.payroll_types_version,
    };
    return payrollType;
  }

  static async getPayrollTypeById(id: number): Promise<PayrollType | null> {
    const payrollType = await prisma.vpg_payroll_types.findUnique({
      where: { payroll_types_id: id },
    });
    if (!payrollType) {
      return null;
    }
    return {
      id: payrollType.payroll_types_id,
      name: payrollType.payroll_types_name,
      description: payrollType.payroll_types_description,
      version: payrollType.payroll_types_version,
    };
  }

  static async getAllPayrollTypes(): Promise<PayrollType[]> {
    const payrollTypes = await prisma.vpg_payroll_types.findMany();
    return payrollTypes.map((pt) => ({
      id: pt.payroll_types_id,
      name: pt.payroll_types_name,
      description: pt.payroll_types_description,
      version: pt.payroll_types_version,
    }));
  }
}
