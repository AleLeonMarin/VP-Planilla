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

    it('should mark all INs in a run of three consecutive INs as anomaly', async () => {
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
          clock_logs_timestamp: new Date('2026-04-05T10:00:00.000Z'),
          clock_logs_log_type: 'IN' as const,
          clock_logs_status: 'pending' as const,
        },
      ];

      prisma.vpg_clock_logs.findMany.mockResolvedValue(logs);
      prisma.vpg_clock_logs.updateMany.mockResolvedValue({ count: 3 });

      const result = await ClockLogAnalysisService.detectDoubleEntry(sessionId);

      expect(result).toBe(3);
      expect(prisma.vpg_clock_logs.updateMany).toHaveBeenCalledWith({
        where: { clock_logs_id: { in: [1, 2, 3] } },
        data: { clock_logs_status: 'anomaly' },
      });
    });

    it('should mark all INs in a longer run (four INs) as anomaly', async () => {
      const sessionId = 1;
      const logs = Array.from({ length: 4 }, (_, i) => ({
        clock_logs_id: i + 1,
        clock_logs_employee_id: 1,
        clock_logs_timestamp: new Date(`2026-04-05T${8 + i}:00:00.000Z`),
        clock_logs_log_type: 'IN' as const,
        clock_logs_status: 'pending' as const,
      }));

      prisma.vpg_clock_logs.findMany.mockResolvedValue(logs);
      prisma.vpg_clock_logs.updateMany.mockResolvedValue({ count: 4 });

      const result = await ClockLogAnalysisService.detectDoubleEntry(sessionId);

      expect(result).toBe(4);
      expect(prisma.vpg_clock_logs.updateMany).toHaveBeenCalledWith({
        where: { clock_logs_id: { in: [1, 2, 3, 4] } },
        data: { clock_logs_status: 'anomaly' },
      });
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

    it('should mark all OUTs in a run of three consecutive OUTs as anomaly', async () => {
      const sessionId = 1;
      const logs = [
        {
          clock_logs_id: 1,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T08:00:00.000Z'),
          clock_logs_log_type: 'OUT' as const,
          clock_logs_status: 'pending' as const,
        },
        {
          clock_logs_id: 2,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T09:00:00.000Z'),
          clock_logs_log_type: 'OUT' as const,
          clock_logs_status: 'pending' as const,
        },
        {
          clock_logs_id: 3,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T10:00:00.000Z'),
          clock_logs_log_type: 'OUT' as const,
          clock_logs_status: 'pending' as const,
        },
      ];

      prisma.vpg_clock_logs.findMany.mockResolvedValue(logs);
      prisma.vpg_clock_logs.updateMany.mockResolvedValue({ count: 3 });

      const result = await ClockLogAnalysisService.detectDoubleExit(sessionId);

      expect(result).toBe(3);
      expect(prisma.vpg_clock_logs.updateMany).toHaveBeenCalledWith({
        where: { clock_logs_id: { in: [1, 2, 3] } },
        data: { clock_logs_status: 'anomaly' },
      });
    });

    it('should mark all OUTs in a longer run (five OUTs) as anomaly', async () => {
      const sessionId = 1;
      const logs = Array.from({ length: 5 }, (_, i) => ({
        clock_logs_id: i + 1,
        clock_logs_employee_id: 1,
        clock_logs_timestamp: new Date(`2026-04-05T${8 + i}:00:00.000Z`),
        clock_logs_log_type: 'OUT' as const,
        clock_logs_status: 'pending' as const,
      }));

      prisma.vpg_clock_logs.findMany.mockResolvedValue(logs);
      prisma.vpg_clock_logs.updateMany.mockResolvedValue({ count: 5 });

      const result = await ClockLogAnalysisService.detectDoubleExit(sessionId);

      expect(result).toBe(5);
      expect(prisma.vpg_clock_logs.updateMany).toHaveBeenCalledWith({
        where: { clock_logs_id: { in: [1, 2, 3, 4, 5] } },
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
          clock_logs_timestamp: new Date('2026-04-06T02:00:00.000Z'),
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
          clock_logs_timestamp: new Date('2026-04-05T16:00:00.000Z'),
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
    it('should orchestrate optimized analysis and mark remaining pending as valid', async () => {
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
      const mockUpdateMany = prisma.vpg_clock_logs.updateMany.mockResolvedValue({ count: 2 });

      const result = await ClockLogAnalysisService.runPostImportAnalysis(sessionId);

      expect(result).toEqual({
        orphans: 0,
        doubleEntry: 0,
        doubleExit: 0,
        longSessions: 0,
        total: 0,
      });

      expect(prisma.vpg_clock_logs.findMany).toHaveBeenCalledWith({
        where: {
          clock_logs_import_session_id: sessionId,
          clock_logs_status: 'pending'
        },
        orderBy: { clock_logs_timestamp: 'asc' }
      });

      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: {
          clock_logs_import_session_id: sessionId,
          clock_logs_status: 'pending',
        },
        data: { clock_logs_status: 'valid' },
      });
    });

    it('should aggregate counts from all detectors in optimized path', async () => {
      const sessionId = 1;
      const logs = [
        // Orphan: IN with no OUT at all
        {
          clock_logs_id: 1,
          clock_logs_employee_id: 1,
          clock_logs_timestamp: new Date('2026-04-05T08:00:00.000Z'),
          clock_logs_log_type: 'IN' as const,
          clock_logs_status: 'pending' as const,
        },
        // Double entry: IN, IN, then OUT (so not orphans)
        {
          clock_logs_id: 2,
          clock_logs_employee_id: 2,
          clock_logs_timestamp: new Date('2026-04-05T08:00:00.000Z'),
          clock_logs_log_type: 'IN' as const,
          clock_logs_status: 'pending' as const,
        },
        {
          clock_logs_id: 3,
          clock_logs_employee_id: 2,
          clock_logs_timestamp: new Date('2026-04-05T09:00:00.000Z'),
          clock_logs_log_type: 'IN' as const,
          clock_logs_status: 'pending' as const,
        },
        {
          clock_logs_id: 4,
          clock_logs_employee_id: 2,
          clock_logs_timestamp: new Date('2026-04-05T17:00:00.000Z'),
          clock_logs_log_type: 'OUT' as const,
          clock_logs_status: 'pending' as const,
        },
        // Double exit: IN then two consecutive OUTs
        {
          clock_logs_id: 5,
          clock_logs_employee_id: 3,
          clock_logs_timestamp: new Date('2026-04-05T08:00:00.000Z'),
          clock_logs_log_type: 'IN' as const,
          clock_logs_status: 'pending' as const,
        },
        {
          clock_logs_id: 6,
          clock_logs_employee_id: 3,
          clock_logs_timestamp: new Date('2026-04-05T12:00:00.000Z'),
          clock_logs_log_type: 'OUT' as const,
          clock_logs_status: 'pending' as const,
        },
        {
          clock_logs_id: 7,
          clock_logs_employee_id: 3,
          clock_logs_timestamp: new Date('2026-04-05T13:00:00.000Z'),
          clock_logs_log_type: 'OUT' as const,
          clock_logs_status: 'pending' as const,
        },
        // Long session: IN then OUT >16h later
        {
          clock_logs_id: 8,
          clock_logs_employee_id: 4,
          clock_logs_timestamp: new Date('2026-04-05T08:00:00.000Z'),
          clock_logs_log_type: 'IN' as const,
          clock_logs_status: 'pending' as const,
        },
        {
          clock_logs_id: 9,
          clock_logs_employee_id: 4,
          clock_logs_timestamp: new Date('2026-04-06T02:00:00.000Z'),
          clock_logs_log_type: 'OUT' as const,
          clock_logs_status: 'pending' as const,
        },
      ];

      prisma.vpg_clock_logs.findMany.mockResolvedValue(logs);
      const mockUpdateMany = prisma.vpg_clock_logs.updateMany.mockResolvedValue({ count: 1 });

      const result = await ClockLogAnalysisService.runPostImportAnalysis(sessionId);

      expect(result).toEqual({
        orphans: 1,
        doubleEntry: 2,
        doubleExit: 2,
        longSessions: 2,
        total: 7,
      });

      // Verify batch updates: first orphan (1), then anomalies (2+2+2=6), then valid (none left)
      expect(mockUpdateMany).toHaveBeenCalledTimes(3);
      const calls = mockUpdateMany.mock.calls;
      // First: orphan update
      expect(calls[0][0].where.clock_logs_id.in).toContain(1);
      // Second: anomaly update (contains double entry (2,3), double exit (6,7), long session (8,9))
      expect(calls[1][0].where.clock_logs_id.in).toEqual(expect.arrayContaining([2, 3, 6, 7, 8, 9]));
      // Third: valid update (where pending, but none left)
      expect(calls[2][0].where).toEqual({
        clock_logs_import_session_id: sessionId,
        clock_logs_status: 'pending'
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