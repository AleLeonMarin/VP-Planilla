import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { PayrollService } from '../../../service/PayrollService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

describe('PayrollService.saveEmployeeOverride — PAY-12', () => {
  const payrollId = 1;
  const employeeId = 101;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockEmployeeData = {
    payroll_employee_id: 1,
    payroll_employee_total_hours: 8,
    payroll_employee_overtime_hours: 2,
    payroll_employee_weekly_rest_hours: 2,
    payroll_employee_gross_salary: 1000,
    payroll_employee_total_deductions: 100,
    payroll_employee_version: 1,
    vpg_employees: {
      vpg_positions: {
        position_base_salary: 480000 // 480,000 / 30 / 8 = 2000 per hour
      }
    }
  };

  it('should throw error if payroll does not exist', async () => {
    prisma.vpg_payrolls.findUnique.mockResolvedValue(null);

    await expect(PayrollService.saveEmployeeOverride(payrollId, employeeId, {}))
      .rejects.toThrow(`Planilla ${payrollId} no encontrada`);
  });

  it('should throw error if payroll is not in BORRADOR state', async () => {
    prisma.vpg_payrolls.findUnique.mockResolvedValue({ payrolls_status: 'APROBADA' });

    await expect(PayrollService.saveEmployeeOverride(payrollId, employeeId, {}))
      .rejects.toThrow(/Solo se pueden ajustar planillas en estado BORRADOR/);
  });

  it('should throw error if employee is not in the payroll', async () => {
    prisma.vpg_payrolls.findUnique.mockResolvedValue({ payrolls_status: 'BORRADOR' });
    prisma.vpg_payroll_employee.findUnique.mockResolvedValue(null);

    await expect(PayrollService.saveEmployeeOverride(payrollId, employeeId, {}))
      .rejects.toThrow(`Registro de planilla ${employeeId} no encontrado.`);
  });

  it('should allow hours exceeding 24h (removed old validation)', async () => {
    prisma.vpg_payrolls.findUnique.mockResolvedValue({ payrolls_status: 'BORRADOR' });
    prisma.vpg_payroll_employee.findUnique.mockResolvedValue(mockEmployeeData);
    prisma.vpg_payroll_employee.update.mockResolvedValue({ id: 1 });

    // Should NOT throw for 80 hours (biweekly)
    await expect(PayrollService.saveEmployeeOverride(payrollId, employeeId, { regularHours: 80 }))
      .resolves.toBeDefined();
  });

  it('should update correctly and recalculate gross and net salary', async () => {
    prisma.vpg_payrolls.findUnique.mockResolvedValue({ payrolls_status: 'BORRADOR' });
    prisma.vpg_payroll_employee.findUnique.mockResolvedValue(mockEmployeeData);
    prisma.vpg_payroll_employee.update.mockResolvedValue({ id: 1 });

    // Hourly rate = 2000
    // new hours: reg=40, ot=10, rest=8
    // regPay = 40 * 2000 = 80,000
    // otPay = 10 * 2000 * 1.5 = 30,000
    // restPay = 8 * 2000 = 16,000
    // gross = 80000 + 30000 + 16000 = 126,000
    // deductions = 26,000
    // net = 100,000

    await PayrollService.saveEmployeeOverride(payrollId, employeeId, { 
      regularHours: 40, 
      overtimeHours: 10,
      weeklyRestHours: 8,
      totalDeductions: 26000 
    });

    expect(prisma.vpg_payroll_employee.update).toHaveBeenCalledWith({
      where: { payroll_employee_id: 101 },
      data: expect.objectContaining({
        payroll_employee_hours_override: 40,
        payroll_employee_overtime_override: 10,
        payroll_employee_weekly_rest_override: 8,
        payroll_employee_gross_salary: 126000,
        payroll_employee_total_deductions: 26000,
        payroll_employee_net_salary: 100000,
        payroll_employee_is_manually_adjusted: true,
        payroll_employee_version: 2
      })
    });
  });
});
