import { PrismaClient, MinuteRoundingPolicy } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { NomineeService } from '../../service/NomineeService';
import * as PayrollUtils from '../../utils/payrollUtils';

jest.mock('../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

jest.mock('../../service/EmployeeService');
jest.mock('../../service/ClockLogEffectiveService');
jest.mock('../../service/LegalParamService');

const { EmployeeService } = require('../../service/EmployeeService');
const { ClockLogEffectiveService } = require('../../service/ClockLogEffectiveService');
const { LegalParamService } = require('../../service/LegalParamService');
const { prisma } = require('../../lib/prisma');

describe('NomineeService Rounding Integration', () => {
  const service = new NomineeService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should apply ALWAYS_UP rounding to daily total minutes', async () => {
    const startDate = new Date('2026-04-01');
    const endDate = new Date('2026-04-01');

    const mockEmployee = {
      id: 1,
      name: 'Rounding Test',
      national_id: '1',
      position_id: 1,
    };

    const mockParams = {
      ...PayrollUtils.DEFAULT_LEGAL_PARAMS,
      minuteRoundingPolicy: MinuteRoundingPolicy.ALWAYS_UP,
    };

    // 431 minutes = 7h 11min
    // ALWAYS_UP -> 435 min -> 7.25h
    const inTime = new Date('2026-04-01T08:00:00Z');
    const outTime = new Date('2026-04-01T15:11:00Z'); // 7h 11m = 431m

    const mockPairs = [
      {
        in: { effectiveTimestamp: inTime },
        out: { effectiveTimestamp: outTime },
        status: 'valid',
        durationHours: 7.18 // Approximate floating point
      }
    ];

    jest.mocked(EmployeeService.getActiveEmployeesForPeriod).mockResolvedValue([mockEmployee]);
    jest.mocked(ClockLogEffectiveService.getEffectiveMarksForAllEmployees).mockResolvedValue(new Map([[1, []]]));
    jest.mocked(ClockLogEffectiveService.pairLogs).mockReturnValue(mockPairs);
    jest.mocked(LegalParamService.getParamSetAtDate).mockResolvedValue(mockParams);
    
    prisma.vpg_positions.findMany.mockResolvedValue([{
      position_id: 1,
      position_base_salary: 1000,
      position_name: 'Test',
    }]);

    prisma.vpg_vacations.findMany.mockResolvedValue([]);
    prisma.vpg_employee_labor_event.findMany.mockResolvedValue([]);
    prisma.vpg_bonuses.findMany.mockResolvedValue([]);
    prisma.vpg_deductions_per_employee.findMany.mockResolvedValue([]);
    prisma.vpg_company_holidays.findMany.mockResolvedValue([]);

    const result = await service.calculatePayrollForPeriod(startDate, endDate);
    
    expect(result.employees[0].days[0].hoursWorked).toBe(7.25);
  });

  it('should apply NEAREST_QUARTER rounding to daily total minutes', async () => {
    const startDate = new Date('2026-04-01');
    const endDate = new Date('2026-04-01');

    const mockEmployee = {
      id: 1,
      name: 'Rounding Test',
      national_id: '1',
      position_id: 1,
    };

    const mockParams = {
      ...PayrollUtils.DEFAULT_LEGAL_PARAMS,
      minuteRoundingPolicy: MinuteRoundingPolicy.NEAREST_QUARTER,
    };

    // Case 1: 424 minutes = 7h 04min -> NEAREST_QUARTER -> 420 min -> 7.00h
    const inTime1 = new Date('2026-04-01T08:00:00Z');
    const outTime1 = new Date('2026-04-01T15:04:00Z'); 

    const mockPairs = [
      {
        in: { effectiveTimestamp: inTime1 },
        out: { effectiveTimestamp: outTime1 },
        status: 'valid'
      }
    ];

    jest.mocked(EmployeeService.getActiveEmployeesForPeriod).mockResolvedValue([mockEmployee]);
    jest.mocked(ClockLogEffectiveService.getEffectiveMarksForAllEmployees).mockResolvedValue(new Map([[1, []]]));
    jest.mocked(ClockLogEffectiveService.pairLogs).mockReturnValue(mockPairs);
    jest.mocked(LegalParamService.getParamSetAtDate).mockResolvedValue(mockParams);
    
    prisma.vpg_positions.findMany.mockResolvedValue([{
      position_id: 1,
      position_base_salary: 1000,
      position_name: 'Test',
    }]);

    prisma.vpg_vacations.findMany.mockResolvedValue([]);
    prisma.vpg_employee_labor_event.findMany.mockResolvedValue([]);
    prisma.vpg_bonuses.findMany.mockResolvedValue([]);
    prisma.vpg_deductions_per_employee.findMany.mockResolvedValue([]);
    prisma.vpg_company_holidays.findMany.mockResolvedValue([]);

    const result = await service.calculatePayrollForPeriod(startDate, endDate);
    expect(result.employees[0].days[0].hoursWorked).toBe(7.00);
  });

  it('should apply EXACT rounding (no rounding beyond 2 decimals) to daily total minutes', async () => {
    const startDate = new Date('2026-04-01');
    const endDate = new Date('2026-04-01');

    const mockEmployee = {
      id: 1,
      name: 'Rounding Test',
      national_id: '1',
      position_id: 1,
    };

    const mockParams = {
      ...PayrollUtils.DEFAULT_LEGAL_PARAMS,
      minuteRoundingPolicy: MinuteRoundingPolicy.EXACT,
    };

    // 431 minutes -> 7.183333333h
    const inTime = new Date('2026-04-01T08:00:00Z');
    const outTime = new Date('2026-04-01T15:11:00Z'); 

    const mockPairs = [
      {
        in: { effectiveTimestamp: inTime },
        out: { effectiveTimestamp: outTime },
        status: 'valid'
      }
    ];

    jest.mocked(EmployeeService.getActiveEmployeesForPeriod).mockResolvedValue([mockEmployee]);
    jest.mocked(ClockLogEffectiveService.getEffectiveMarksForAllEmployees).mockResolvedValue(new Map([[1, []]]));
    jest.mocked(ClockLogEffectiveService.pairLogs).mockReturnValue(mockPairs);
    jest.mocked(LegalParamService.getParamSetAtDate).mockResolvedValue(mockParams);
    
    prisma.vpg_positions.findMany.mockResolvedValue([{
      position_id: 1,
      position_base_salary: 1000,
      position_name: 'Test',
    }]);

    prisma.vpg_vacations.findMany.mockResolvedValue([]);
    prisma.vpg_employee_labor_event.findMany.mockResolvedValue([]);
    prisma.vpg_bonuses.findMany.mockResolvedValue([]);
    prisma.vpg_deductions_per_employee.findMany.mockResolvedValue([]);
    prisma.vpg_company_holidays.findMany.mockResolvedValue([]);

    const result = await service.calculatePayrollForPeriod(startDate, endDate);
    
    // 431 / 60 = 7.183333...
    expect(result.employees[0].days[0].hoursWorked).toBeCloseTo(7.1833, 4);
  });
});
