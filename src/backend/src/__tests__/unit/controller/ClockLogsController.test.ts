import { Request, Response } from 'express';
import { ClockLogsController } from '../../../controller/ClockLogsController';
import { ClockLogsService } from '../../../service/ClockLogsService';

// Mock the service module - define mocks inside factory to avoid hoisting issues
jest.mock('../../../service/ClockLogsService', () => {
  return {
    ClockLogsService: jest.fn().mockImplementation(() => ({
      bulkCreate: jest.fn().mockResolvedValue({ created: 0 }),
      getStats: jest.fn().mockResolvedValue([]),
      getClockLogs: jest.fn().mockResolvedValue([]),
    })),
  };
});

function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    query: {},
    params: {},
    headers: {},
    ...overrides,
  } as unknown as Request;
}

function createMockResponse(): Response & { json: jest.Mock; status: jest.Mock } {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response & { json: jest.Mock; status: jest.Mock };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Reset default return values after clearAllMocks
  const MockService = ClockLogsService as jest.Mock;
  const mockInstance = MockService.mock.results[0]?.value;
  if (mockInstance) {
    mockInstance.bulkCreate.mockResolvedValue({ created: 0 });
    mockInstance.getStats.mockResolvedValue([]);
    mockInstance.getClockLogs.mockResolvedValue([]);
  }
});

describe('ClockLogsController', () => {
  describe('bulkCreate', () => {
    it('should reject unknown log_type and add to skipped array with descriptive error containing rejected value', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({
        body: {
          logs: [
            { employee_id: 1, timestamp: '2026-02-02T08:00:00Z', log_type: 'UNKNOWN_TYPE' },
          ],
        },
      });
      const res = createMockResponse();

      await controller.bulkCreate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          skipped: expect.arrayContaining([
            expect.stringContaining('UNKNOWN_TYPE'),
          ]),
        }),
      );
    });

    it('should return 400 with skipped details when all logs have unknown types', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({
        body: {
          logs: [
            { employee_id: 1, timestamp: '2026-02-02T08:00:00Z', log_type: 'INVALID' },
            { employee_id: 1, timestamp: '2026-02-02T17:00:00Z', log_type: 'GARBAGE' },
          ],
        },
      });
      const res = createMockResponse();

      await controller.bulkCreate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.skipped).toHaveLength(2);
      expect(jsonCall.skipped[0]).toContain('INVALID');
      expect(jsonCall.skipped[1]).toContain('GARBAGE');
    });
  });

  describe('getStats', () => {
    it('should return { byStatus, bySource, total } shape on success', async () => {
      const MockService = ClockLogsService as jest.Mock;
      
      // Set up the mock to return the desired value whenever a new instance is created
      MockService.mockImplementation(() => ({
        bulkCreate: jest.fn().mockResolvedValue({ created: 0 }),
        getStats: jest.fn().mockResolvedValue([
          { status: 'pending', source: 'manual', count: 5 },
          { status: 'valid', source: 'java_import', count: 10 },
          { status: 'valid', source: 'manual', count: 3 },
        ]),
        getClockLogs: jest.fn().mockResolvedValue([]),
      }));

      const controller = new ClockLogsController();
      const req = createMockRequest({
        query: { initDate: '2026-02-01', endDate: '2026-02-28' },
      });
      const res = createMockResponse();

      await controller.getStats(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          byStatus: { pending: 5, valid: 13 },
          bySource: { manual: 8, java_import: 10 },
          total: 18,
        },
      });
    });

    it('should return 400 when initDate is missing', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({
        query: { endDate: '2026-02-28' },
      });
      const res = createMockResponse();

      await controller.getStats(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) }),
      );
    });

    it('should return 400 when endDate is missing', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({
        query: { initDate: '2026-02-01' },
      });
      const res = createMockResponse();

      await controller.getStats(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) }),
      );
    });

    it('should return 400 when both params are missing', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({
        query: {},
      });
      const res = createMockResponse();

      await controller.getStats(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
