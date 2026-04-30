import { PrismaClient, PayrollStatus } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { Decimal } from '@prisma/client/runtime/library';

// Create mock instance
const prismaMock = mockDeep<PrismaClient>();

// Mock the PrismaClient module
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock),
  PayrollStatus: {
    BORRADOR: 'BORRADOR',
    APROBADA: 'APROBADA',
    PAGADA: 'PAGADA',
  },
}));

// Mock the lib/prisma module
jest.mock('../../../lib/prisma', () => ({
  prisma: prismaMock,
}));

// Import AguinaldoService after mocking
// Note: This will fail until Task 2 if not careful, but TDD says we write it first.
// We expect this file to not compile or fail to run if the service doesn't exist yet.
import { AguinaldoService } from '../../../service/AguinaldoService';

describe('AguinaldoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateAccruedAguinaldo', () => {
    it('should handle fiscal year rollover (Dec 1 boundary)', async () => {
      // Arrange
      const employeeId = 1;
      const asOfDate = new Date('2026-12-05'); // Just after Dec 1
      
      prismaMock.vpg_payrolls.findMany.mockResolvedValue([]);

      // Act
      const result = await AguinaldoService.calculateAccruedAguinaldo(employeeId, asOfDate);

      // Assert
      expect(result.periodStart.getFullYear()).toBe(2026);
      expect(result.periodStart.getMonth()).toBe(11); // December
      expect(result.periodStart.getDate()).toBe(1);

      // Verify prisma call used the correct date
      expect(prismaMock.vpg_payrolls.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            payrolls_period_end: { gte: result.periodStart, lte: result.periodEnd },
          })
        })
      );
    });

    it('should exclude BORRADOR payrolls from calculation', async () => {
      // Arrange
      const employeeId = 1;
      const asOfDate = new Date('2026-06-15');
      
      prismaMock.vpg_payrolls.findMany.mockResolvedValue([]);

      // Act
      await AguinaldoService.calculateAccruedAguinaldo(employeeId, asOfDate);

      // Assert
      expect(prismaMock.vpg_payrolls.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            payrolls_status: { in: ['APROBADA', 'PAGADA'] }
          })
        })
      );
    });

    it('should correctly sum gross salaries and calculate accrued (gross / 12)', async () => {
        // Arrange
        const employeeId = 1;
        const asOfDate = new Date('2026-06-15');
        
        const mockPayrolls = [
          {
            payrolls_id: 1,
            vpg_payroll_employee: [
              { payroll_employee_gross_salary: new Decimal(120000) }
            ]
          },
          {
            payrolls_id: 2,
            vpg_payroll_employee: [
              { payroll_employee_gross_salary: new Decimal(120000) }
            ]
          }
        ];

        prismaMock.vpg_payrolls.findMany.mockResolvedValue(mockPayrolls as any);

        // Act
        const result = await AguinaldoService.calculateAccruedAguinaldo(employeeId, asOfDate);

        // Assert
        // (120000 + 120000) / 12 = 20000
        expect(result.accrued).toBe(20000);
        expect(result.payrollsIncluded).toBe(2);
    });
  });

  describe('getAguinaldoSummaryForPayroll', () => {
    it('should use bulk query (groupBy) to fetch prior accruals', async () => {
      // Arrange
      const payrollId = 100;
      const mockPayroll = {
        payrolls_id: payrollId,
        payrolls_period_start: new Date('2026-05-15'),
        vpg_payroll_employee: [
          { 
            payroll_employee_employee_id: 1, 
            payroll_employee_gross_salary: new Decimal(100000),
            vpg_employees: { employee_first_name: 'John', employee_last_name: 'Doe' }
          },
          { 
            payroll_employee_employee_id: 2, 
            payroll_employee_gross_salary: new Decimal(200000),
            vpg_employees: { employee_first_name: 'Jane', employee_last_name: 'Smith' }
          }
        ]
      };

      prismaMock.vpg_payrolls.findUnique.mockResolvedValue(mockPayroll as any);
      
      // Mock groupBy result
      (prismaMock.vpg_payroll_employee.groupBy as any).mockResolvedValue([
        {
          payroll_employee_employee_id: 1,
          _sum: { payroll_employee_gross_salary: new Decimal(500000) }
        },
        {
          payroll_employee_employee_id: 2,
          _sum: { payroll_employee_gross_salary: new Decimal(600000) }
        }
      ] as any);

      // Act
      const result = await AguinaldoService.getAguinaldoSummaryForPayroll(payrollId);

      // Assert
      expect(result).toHaveLength(2);
      
      // Employee 1: (500000 / 12) = 41666.67
      expect(result[0].employeeId).toBe(1);
      expect(result[0].accruedBeforeThisPayroll).toBe(41666.67);
      expect(result[0].thisPayrollContribution).toBe(8333.33); // 100000 / 12
      expect(result[0].totalAccruedWithThis).toBe(50000); // (500000 + 100000) / 12

      expect(prismaMock.vpg_payroll_employee.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['payroll_employee_employee_id'],
          where: expect.objectContaining({
            payroll_employee_employee_id: { in: [1, 2] },
            vpg_payrolls: expect.objectContaining({
              payrolls_id: { not: payrollId },
              payrolls_status: { in: ['APROBADA', 'PAGADA'] }
            })
          })
        })
      );
    });
  });
});
