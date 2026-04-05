import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { ImportSessionService } from '../../../service/ImportSessionService';

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

describe('ImportSessionService', () => {
  describe('createSession', () => {
    it('should create a session with pending status and correct fields', async () => {
      prisma.vpg_clock_import_sessions.create.mockResolvedValue({
        import_sessions_id: 1,
        import_sessions_started_at: NOW,
      });

      const result = await ImportSessionService.createSession('java_import', 50, 3);

      expect(result).toEqual({ id: 1, started_at: NOW });
      expect(prisma.vpg_clock_import_sessions.create).toHaveBeenCalledWith({
        data: {
          import_sessions_source: 'java_import',
          import_sessions_status: 'pending',
          import_sessions_total_records: 50,
          import_sessions_created_by: 3,
        },
        select: {
          import_sessions_id: true,
          import_sessions_started_at: true,
        },
      });
    });

    it('should throw if database fails during createSession', async () => {
      prisma.vpg_clock_import_sessions.create.mockRejectedValue(new Error('DB error'));

      await expect(
        ImportSessionService.createSession('excel_import', 10, 1),
      ).rejects.toThrow('DB error');
    });
  });

  describe('updateSession', () => {
    it('should update counts correctly without setting completed_at for non-terminal status', async () => {
      prisma.vpg_clock_import_sessions.update.mockResolvedValue({} as any);

      await ImportSessionService.updateSession(1, {
        status: 'running',
        createdCount: 0,
        skippedCount: 0,
        anomalyCount: 0,
      });

      expect(prisma.vpg_clock_import_sessions.update).toHaveBeenCalledWith({
        where: { import_sessions_id: 1 },
        data: expect.objectContaining({
          import_sessions_status: 'running',
          import_sessions_created_count: 0,
          import_sessions_skipped_count: 0,
          import_sessions_anomaly_count: 0,
        }),
      });

      const call = prisma.vpg_clock_import_sessions.update.mock.lastCall;
      expect(call[0].data.import_sessions_completed_at).toBeUndefined();
    });

    it('should set completed_at when status is completed', async () => {
      prisma.vpg_clock_import_sessions.update.mockResolvedValue({} as any);

      await ImportSessionService.updateSession(2, {
        status: 'completed',
        createdCount: 40,
        skippedCount: 10,
        anomalyCount: 0,
      });

      const call = prisma.vpg_clock_import_sessions.update.mock.lastCall;
      expect(call[0].data.import_sessions_completed_at).toEqual(NOW);
      expect(call[0].data.import_sessions_status).toBe('completed');
      expect(call[0].data.import_sessions_created_count).toBe(40);
      expect(call[0].data.import_sessions_skipped_count).toBe(10);
    });

    it('should set completed_at when status is failed', async () => {
      prisma.vpg_clock_import_sessions.update.mockResolvedValue({} as any);

      await ImportSessionService.updateSession(3, { status: 'failed' });

      const call = prisma.vpg_clock_import_sessions.update.mock.lastCall;
      expect(call[0].data.import_sessions_completed_at).toEqual(NOW);
      expect(call[0].data.import_sessions_status).toBe('failed');
    });

    it('should only update provided fields (partial update)', async () => {
      prisma.vpg_clock_import_sessions.update.mockResolvedValue({} as any);

      await ImportSessionService.updateSession(4, { createdCount: 5 });

      const call = prisma.vpg_clock_import_sessions.update.mock.lastCall;
      expect(call[0].data.import_sessions_created_count).toBe(5);
      expect(call[0].data.import_sessions_status).toBeUndefined();
    });

    it('should throw if database fails during updateSession', async () => {
      prisma.vpg_clock_import_sessions.update.mockRejectedValue(new Error('Update failed'));

      await expect(
        ImportSessionService.updateSession(99, { status: 'completed' }),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('getSession', () => {
    it('should return the session when found', async () => {
      const mockSession = {
        import_sessions_id: 1,
        import_sessions_started_at: NOW,
        import_sessions_completed_at: null,
        import_sessions_source: 'java_import',
        import_sessions_status: 'completed',
        import_sessions_total_records: 50,
        import_sessions_created_count: 40,
        import_sessions_skipped_count: 10,
        import_sessions_anomaly_count: 0,
        import_sessions_created_by: 3,
      };

      prisma.vpg_clock_import_sessions.findUnique.mockResolvedValue(mockSession as any);

      const result = await ImportSessionService.getSession(1);

      expect(result).toEqual(mockSession);
      expect(prisma.vpg_clock_import_sessions.findUnique).toHaveBeenCalledWith({
        where: { import_sessions_id: 1 },
      });
    });

    it('should return null when session is not found', async () => {
      prisma.vpg_clock_import_sessions.findUnique.mockResolvedValue(null);

      const result = await ImportSessionService.getSession(999);

      expect(result).toBeNull();
    });

    it('should throw if database fails during getSession', async () => {
      prisma.vpg_clock_import_sessions.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(ImportSessionService.getSession(1)).rejects.toThrow('DB error');
    });
  });
});
