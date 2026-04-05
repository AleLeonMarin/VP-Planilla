import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { ClockLogAnalysisService } from '../../../service/ClockLogAnalysisService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

const NOW = new Date('2026-04-05T10:00:00.000Z');

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ClockLogAnalysisService', () => {
  describe('detectOrphans', () => {
    it('should mark IN logs without matching OUT within 24h as orphan', async () => {
      const sessionId = 1;
      const logs = [
        {
          clock_logs_id: 1,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T08:00:00.000Z'),
          clock_logs_log_type: 'IN' as const,
          clock_logs_status: 'pending' as const,
        },
        {
          clock_logs_id: 2,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T17:00:00.000Z'),
          clock_logs_log_type: 'OUT' as const,
          clock_logs_status: 'pending' as const,
        },
        {
          clock_logs_id: 3,
          clock_logs_employee_id: 2,
          clock_logs_timestamp: new Date('2026-04-05T09:00:00.000Z'),
          clock_logs_log_type: 'IN' as const,
          clock_logs_status: 'pending' as const,
          // No OUT for employee 2 => orphan
        },
      ];

      prisma.vpg_clock_logs.findMany.mockResolvedValue(logs);
      prisma.vpg_clock_logs.updateMany.mockResolvedValue({ count: 1 });

      const result = await ClockLogAnalysisService.detectOrphans(sessionId);

      expect(result).toBe(1);
      expect(prisma.vpg_clock_logs.updateMany).toHaveBeenCalledWith({
        where: { clock_logs_id: { in: [3] } },
        data: { clock_logs_status: 'orphan' },
      });
    });

    it('should mark OUT logs without preceding IN within 24h as orphan', async () => {
      const sessionId = 1;
      const logs = [
        {
          clock_logs_id: 1,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T08:00:00.000Z'),
          clock_logs_log_type: 'IN' as const,
          clock_logs_status: 'pending' as const,
        },
        {
          clock_logs_id: 2,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T17:00:00.000Z'),
          clock_logs_log_type: 'OUT' as const,
          clock_logs_status: 'pending' as const,
        },
        {
          clock_logs_id: 4,
          clock_logs_employee_id: 2,
          clock_logs_timestamp: new Date('2026-04-05T18:00:00.000Z'),
          clock_logs_log_type: 'OUT' as const,
          clock_logs_status: 'pending' as const,
          // No IN before this OUT for employee 2 => orphan
        },
      ];

      prisma.vpg_clock_logs.findMany.mockResolvedValue(logs);
      prisma.vpg_clock_logs.updateMany.mockResolvedValue({ count: 1 });

      const result = await ClockLogAnalysisService.detectOrphans(sessionId);

      expect(result).toBe(1);
      expect(prisma.vpg_clock_logs.updateMany).toHaveBeenCalledWith({
        where: { clock_logs_id: { in: [4] } },
        data: { clock_logs_status: 'orphan' },
      });
    });

    it('should not mark IN with matching OUT within 24h as orphan', async () => {
      const sessionId = 1;
      const logs = [
        {
          clock_logs_id: 1,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T08:00:00.000Z'),
          clock_logs_log_type: 'IN' as const,
          clock_logs_status: 'pending' as const,
        },
        {
          clock_logs_id: 2,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T17:00:00.000Z'),
          clock_logs_log_type: 'OUT' as const,
          clock_logs_status: 'pending' as const,
        },
      ];

      prisma.vpg_clock_logs.findMany.mockResolvedValue(logs);
      prisma.vpg_clock_logs.updateMany.mockResolvedValue({ count: 0 });

      const result = await ClockLogAnalysisService.detectOrphans(sessionId);

      expect(result).toBe(0);
    });

    it('should only process pending logs for the given session', async () => {
      const sessionId = 1;
      const logs = [
        {
          clock_logs_id: 1,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T08:00:00.000Z'),
          clock_logs_log_type: 'IN' as const,
          clock_logs_status: 'valid' as const, // not pending
        },
      ];

      prisma.vpg_clock_logs.findMany.mockResolvedValue(logs);

      const result = await ClockLogAnalysisService.detectOrphans(sessionId);

      expect(result).toBe(0);
    });
  });

  describe('detectDoubleEntry', () => {
    it('should mark two consecutive IN logs without OUT between as anomaly', async () => {
      const sessionId = 1;
      const logs = [
        {
          clock_logs_id: 1,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T08:00:00.000Z'),
          clock_logs_log_type: 'IN' as const,
          clock_logs_status: 'pending' as const,
        },
        {
          clock_logs_id: 2,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T09:00:00.000Z'),
          clock_logs_log_type: 'IN' as const,
          clock_logs_status: 'pending' as const,
        },
        {
          clock_logs_id: 3,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T17:00:00.000Z'),
          clock_logs_log_type: 'OUT' as const,
          clock_logs_status: 'pending' as const,
        },
      ];

      prisma.vpg_clock_logs.findMany.mockResolvedValue(logs);
      prisma.vpg_clock_logs.updateMany.mockResolvedValue({ count: 2 });

      const result = await ClockLogAnalysisService.detectDoubleEntry(sessionId);

      expect(result).toBe(2);
      expect(prisma.vpg_clock_logs.updateMany).toHaveBeenCalledWith({
        where: { clock_logs_id: { in: [1, 2] } },
        data: { clock_logs_status: 'anomaly' },
      });
    });

    it('should not flag IN followed by IN then OUT as anomaly for the first IN if OUT comes after second IN', async () => {
      // Sequence: IN -> OUT -> IN -> OUT should not have double entry
      const sessionId = 1;
      const logs = [
        {
          clock_logs_id: 1,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T08:00:00.000Z'),
          clock_logs_log_type: 'IN' as const,
          clock_logs_status: 'pending' as const,
        },
        {
          clock_logs_id: 2,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T12:00:00.000Z'),
          clock_logs_log_type: 'OUT' as const,
          clock_logs_status: 'pending' as const,
        },
        {
          clock_logs_id: 3,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T13:00:00.000Z'),
          clock_logs_log_type: 'IN' as const,
          clock_logs_status: 'pending' as const,
        },
        {
          clock_logs_id: 4,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T17:00:00.000Z'),
          clock_logs_log_type: 'OUT' as const,
          clock_logs_status: 'pending' as const,
        },
      ];

      prisma.vpg_clock_logs.findMany.mockResolvedValue(logs);
      prisma.vpg_clock_logs.updateMany.mockResolvedValue({ count: 0 });

      const result = await ClockLogAnalysisService.detectDoubleEntry(sessionId);

      expect(result).toBe(0);
    });
  });

  describe('detectDoubleExit', () => {
    it('should mark two consecutive OUT logs without IN between as anomaly', async () => {
      const sessionId = 1;
      const logs = [
        {
          clock_logs_id: 1,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T08:00:00.000Z'),
          clock_logs_log_type: 'IN' as const,
          clock_logs_status: 'pending' as const,
        },
        {
          clock_logs_id: 2,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T12:00:00.000Z'),
          clock_logs_log_type: 'OUT' as const,
          clock_logs_status: 'pending' as const,
        },
        {
          clock_logs_id: 3,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T13:00:00.000Z'),
          clock_logs_log_type: 'OUT' as const,
          clock_logs_status: 'pending' as const,
          // consecutive OUT without IN between
        },
      ];

      prisma.vpg_clock_logs.findMany.mockResolvedValue(logs);
      prisma.vpg_clock_logs.updateMany.mockResolvedValue({ count: 2 });

      const result = await ClockLogAnalysisService.detectDoubleExit(sessionId);

      expect(result).toBe(2);
      expect(prisma.vpg_clock_logs.updateMany).toHaveBeenCalledWith({
        where: { clock_logs_id: { in: [2, 3] } },
        data: { clock_logs_status: 'anomaly' },
      });
    });
  });

  describe('detectLongSessions', () => {
    it('should mark IN->OUT pairs with duration > 16 hours as anomaly', async () => {
      const sessionId = 1;
      const logs = [
        {
          clock_logs_id: 1,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T08:00:00.000Z'),
          clock_logs_log_type: 'IN' as const,
          clock_logs_status: 'pending' as const,
        },
        {
          clock_logs_id: 2,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-06T02:00:00.000Z'), // 18 hours later
          clock_logs_log_type: 'OUT' as const,
          clock_logs_status: 'pending' as const,
        },
      ];

      prisma.vpg_clock_logs.findMany.mockResolvedValue(logs);
      prisma.vpg_clock_logs.updateMany.mockResolvedValue({ count: 2 });

      const result = await ClockLogAnalysisService.detectLongSessions(sessionId);

      expect(result).toBe(2);
      expect(prisma.vpg_clock_logs.updateMany).toHaveBeenCalledWith({
        where: { clock_logs_id: { in: [1, 2] } },
        data: { clock_logs_status: 'anomaly' },
      });
    });

    it('should not mark IN->OUT pairs with duration <= 16 hours', async () => {
      const sessionId = 1;
      const logs = [
        {
          clock_logs_id: 1,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T08:00:00.000Z'),
          clock_logs_log_type: 'IN' as const,
          clock_logs_status: 'pending' as const,
        },
        {
          clock_logs_id: 2,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T16:00:00.000Z'), // 8 hours later
          clock_logs_log_type: 'OUT' as const,
          clock_logs_status: 'pending' as const,
        },
      ];

      prisma.vpg_clock_logs.findMany.mockResolvedValue(logs);
      prisma.vpg_clock_logs.updateMany.mockResolvedValue({ count: 0 });

      const result = await ClockLogAnalysisService.detectLongSessions(sessionId);

      expect(result).toBe(0);
    });
  });

  describe('runPostImportAnalysis', () => {
    it('should orchestrate all detection methods and mark remaining pending as valid', async () => {
      const sessionId = 1;
      const logs = [
        {
          clock_logs_id: 1,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T08:00:00.000Z'),
          clock_logs_log_type: 'IN' as const,
          clock_logs_status: 'pending' as const,
        },
        {
          clock_logs_id: 2,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T17:00:00.000Z'),
          clock_logs_log_type: 'OUT' as const,
          clock_logs_status: 'pending' as const,
        },
      ];

      prisma.vpg_clock_logs.findMany.mockResolvedValue(logs);

      // Mock each detection method to return counts
      ClockLogAnalysisService.detectOrphans = jest.fn().mockResolvedValue(0);
      ClockLogAnalysisService.detectDoubleEntry = jest.fn().mockResolvedValue(0);
      ClockLogAnalysisService.detectDoubleExit = jest.fn().mockResolvedValue(0);
      ClockLogAnalysisService.detectLongSessions = jest.fn().mockResolvedValue(0);
      prisma.vpg_clock_logs.updateMany.mockResolvedValue({ count: 2 });

      const result = await ClockLogAnalysisService.runPostImportAnalysis(sessionId);

      expect(result).toEqual({
        orphans: 0,
        doubleEntry: 0,
        doubleExit: 0,
        longSessions: 0,
        total: 0,
      });

      expect(ClockLogAnalysisService.detectOrphans).toHaveBeenCalledWith(sessionId);
      expect(ClockLogAnalysisService.detectDoubleEntry).toHaveBeenCalledWith(sessionId);
      expect(ClockLogAnalysisService.detectDoubleExit).toHaveBeenCalledWith(sessionId);
      expect(ClockLogAnalysisService.detectLongSessions).toHaveBeenCalledWith(sessionId);

      // Verify remaining pending logs marked as valid
      expect(prisma.vpg_clock_logs.updateMany).toHaveBeenCalledWith({
        where: {
          clock_logs_import_session_id: sessionId,
          clock_logs_status: 'pending',
        },
        data: { clock_logs_status: 'valid' },
      });
    });

    it('should aggregate counts from all detection methods', async () => {
      const sessionId = 1;

      ClockLogAnalysisService.detectOrphans = jest.fn().mockResolvedValue(2);
      ClockLogAnalysisService.detectDoubleEntry = jest.fn().mockResolvedValue(4);
      ClockLogAnalysisService.detectDoubleExit = jest.fn().mockResolvedValue(0);
      ClockLogAnalysisService.detectLongSessions = jest.fn().mockResolvedValue(1);
      prisma.vpg_clock_logs.updateMany.mockResolvedValue({ count: 3 });

      const result = await ClockLogAnalysisService.runPostImportAnalysis(sessionId);

      expect(result).toEqual({
        orphans: 2,
        doubleEntry: 4,
        doubleExit: 0,
        longSessions: 1,
        total: 7,
      });
    });
  });

  describe('markValid', () => {
    it('should mark all remaining pending logs for the session as valid', async () => {
      const sessionId = 1;
      prisma.vpg_clock_logs.updateMany.mockResolvedValue({ count: 5 });

      const result = await ClockLogAnalysisService.markValid(sessionId);

      expect(result).toBe(5);
      expect(prisma.vpg_clock_logs.updateMany).toHaveBeenCalledWith({
        where: {
          clock_logs_import_session_id: sessionId,
          clock_logs_status: 'pending',
        },
        data: { clock_logs_status: 'valid' },
      });
    });
  });
});
