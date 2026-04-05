import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { LaborEventsService } from '../../../service/LaborEventsService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

const mockPrismaLaborEvent = {
  labor_events_id: 1,
  labor_events_name: 'Incapacidad',
  labor_events_description: 'Baja médica',
  labor_events_version: 1,
};

const mockPrismaEmployeeLaborEvent = {
  employee_labor_event_id: 1,
  employee_labor_event_employee_id: 1,
  employee_labor_event_labor_event_id: 1,
  employee_labor_event_start_date: new Date('2026-01-01'),
  employee_labor_event_end_date: null,
  employee_labor_event_status: 'active',
  employee_labor_event_version: 1,
  vpg_labor_events: {
    labor_events_name: 'Incapacidad',
    labor_events_description: 'Baja médica',
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.vpg_labor_events.create.mockResolvedValue(mockPrismaLaborEvent);
  prisma.vpg_labor_events.update.mockResolvedValue(mockPrismaLaborEvent);
  prisma.vpg_labor_events.delete.mockResolvedValue(mockPrismaLaborEvent);
  prisma.vpg_labor_events.findMany.mockResolvedValue([mockPrismaLaborEvent]);
  prisma.vpg_employee_labor_event.findMany.mockResolvedValue([mockPrismaEmployeeLaborEvent]);
  prisma.vpg_employee_labor_event.create.mockResolvedValue(mockPrismaEmployeeLaborEvent);
  prisma.vpg_employee_labor_event.delete.mockResolvedValue(mockPrismaEmployeeLaborEvent);
});

describe('LaborEventsService', () => {
  describe('createLaborEvent', () => {
    it('should create and return a mapped LaborEvent', async () => {
      const result = await LaborEventsService.createLaborEvent({
        id: 0,
        name: 'Incapacidad',
        description: 'Baja médica',
        version: 1,
      });

      expect(result).toEqual({
        id: 1,
        name: 'Incapacidad',
        description: 'Baja médica',
        version: 1,
      });
      expect(prisma.vpg_labor_events.create).toHaveBeenCalledTimes(1);
    });

    it('should propagate DB error', async () => {
      prisma.vpg_labor_events.create.mockRejectedValue(new Error('DB error'));

      await expect(
        LaborEventsService.createLaborEvent({ id: 0, name: 'X', description: 'Y', version: 1 })
      ).rejects.toThrow('DB error');
    });
  });

  describe('updateLaborEvent', () => {
    it('should update and return a mapped LaborEvent', async () => {
      const updated = { ...mockPrismaLaborEvent, labor_events_name: 'Permiso' };
      prisma.vpg_labor_events.update.mockResolvedValue(updated);

      const result = await LaborEventsService.updateLaborEvent(1, { name: 'Permiso' });

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Permiso');
      expect(prisma.vpg_labor_events.update).toHaveBeenCalledWith({
        where: { labor_events_id: 1 },
        data: expect.objectContaining({ labor_events_name: 'Permiso' }),
      });
    });

    it('should propagate when Prisma throws (record not found)', async () => {
      const error = new Error('Record not found');
      (error as any).code = 'P2025';
      prisma.vpg_labor_events.update.mockRejectedValue(error);

      await expect(LaborEventsService.updateLaborEvent(999, { name: 'X' })).rejects.toThrow(
        'Record not found'
      );
    });
  });

  describe('deleteLaborEvent', () => {
    it('should delete and return a mapped LaborEvent', async () => {
      const result = await LaborEventsService.deleteLaborEvent(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(prisma.vpg_labor_events.delete).toHaveBeenCalledWith({
        where: { labor_events_id: 1 },
      });
    });

    it('should propagate DB error', async () => {
      prisma.vpg_labor_events.delete.mockRejectedValue(new Error('DB error'));

      await expect(LaborEventsService.deleteLaborEvent(999)).rejects.toThrow('DB error');
    });
  });

  describe('getAllLaborEvents', () => {
    it('should return a mapped array of LaborEvents', async () => {
      const result = await LaborEventsService.getAllLaborEvents();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        name: 'Incapacidad',
        description: 'Baja médica',
        version: 1,
      });
    });

    it('should return empty array when none exist', async () => {
      prisma.vpg_labor_events.findMany.mockResolvedValue([]);

      const result = await LaborEventsService.getAllLaborEvents();

      expect(result).toEqual([]);
    });

    it('should propagate DB error', async () => {
      prisma.vpg_labor_events.findMany.mockRejectedValue(new Error('DB error'));

      await expect(LaborEventsService.getAllLaborEvents()).rejects.toThrow('DB error');
    });
  });

  describe('getAllEmployeeLaborEvents', () => {
    it('should return mapped array including labor_event_name from nested relation', async () => {
      const result = await LaborEventsService.getAllEmployeeLaborEvents();

      expect(result).toHaveLength(1);
      expect((result[0] as any).labor_event_name).toBe('Incapacidad');
      expect((result[0] as any).labor_event_description).toBe('Baja médica');
    });

    it('should return labor_event_name as null when vpg_labor_events is null', async () => {
      const rowWithoutRelation = { ...mockPrismaEmployeeLaborEvent, vpg_labor_events: null };
      prisma.vpg_employee_labor_event.findMany.mockResolvedValue([rowWithoutRelation]);

      const result = await LaborEventsService.getAllEmployeeLaborEvents();

      expect((result[0] as any).labor_event_name).toBeNull();
    });
  });

  describe('assignLaborEventsToEmployee', () => {
    it('should create and return a mapped EmployeeLaborEvent', async () => {
      const input = {
        id: 0,
        employee_id: 1,
        labor_event_id: 1,
        start_date: new Date('2026-01-01'),
        end_date: null,
        status: 'active',
        version: 1,
      };

      const result = await LaborEventsService.assignLaborEventsToEmployee(input);

      expect(result).not.toBeNull();
      expect(result!.employee_id).toBe(1);
      expect(result!.labor_event_id).toBe(1);
      expect(prisma.vpg_employee_labor_event.create).toHaveBeenCalledTimes(1);
    });

    it('should propagate DB error', async () => {
      prisma.vpg_employee_labor_event.create.mockRejectedValue(new Error('DB error'));

      const input = {
        id: 0,
        employee_id: 1,
        labor_event_id: 1,
        start_date: new Date('2026-01-01'),
        end_date: null,
        status: 'active',
        version: 1,
      };

      await expect(LaborEventsService.assignLaborEventsToEmployee(input)).rejects.toThrow(
        'DB error'
      );
    });
  });

  describe('deleteEmployeeLaborEvent', () => {
    it('should delete and return a mapped EmployeeLaborEvent on happy path', async () => {
      const result = await LaborEventsService.deleteEmployeeLaborEvent(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(prisma.vpg_employee_labor_event.delete).toHaveBeenCalledWith({
        where: { employee_labor_event_id: 1 },
      });
    });

    it('should return null when Prisma throws (error caught by service)', async () => {
      prisma.vpg_employee_labor_event.delete.mockRejectedValue(new Error('Record not found'));

      const result = await LaborEventsService.deleteEmployeeLaborEvent(999);

      expect(result).toBeNull();
    });
  });
});
