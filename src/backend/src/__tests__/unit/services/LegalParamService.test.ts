import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { Decimal } from '@prisma/client/runtime/library';
import { LegalParamService } from '../../../service/LegalParamService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

const makeParam = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'cuid-1',
  key: 'OT_FACTOR',
  value: new Decimal('1.5'),
  description: 'OT multiplier',
  category: 'OVERTIME',
  validFrom: new Date('2026-01-01'),
  validUntil: null,
  isActive: true,
  isCritical: true,
  source_decree: 'Art. 139 CT',
  createdBy: 'system',
  updatedBy: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LegalParamService', () => {
  describe('getParamAtDate', () => {
    it('returns the matching param record for the given date', async () => {
      const param = makeParam();
      prisma.vpgLegalParam.findFirst.mockResolvedValue(param as any);

      const result = await LegalParamService.getParamAtDate('OT_FACTOR', new Date('2026-03-15'));

      expect(result).toEqual(param);
      expect(prisma.vpgLegalParam.findFirst).toHaveBeenCalledWith({
        where: {
          key: 'OT_FACTOR',
          validFrom: { lte: new Date('2026-03-15') },
          isActive: true,
        },
        orderBy: { validFrom: 'desc' },
      });
    });

    it('returns null when no active param exists for the key', async () => {
      prisma.vpgLegalParam.findFirst.mockResolvedValue(null);

      const result = await LegalParamService.getParamAtDate('NONEXISTENT', new Date());

      expect(result).toBeNull();
    });
  });

  describe('getParam', () => {
    it('returns the Decimal value when param exists', async () => {
      const param = makeParam({ value: new Decimal('1.5') });
      prisma.vpgLegalParam.findFirst.mockResolvedValue(param as any);

      const result = await LegalParamService.getParam('OT_FACTOR', new Date());

      expect(result?.toString()).toBe('1.5');
    });

    it('returns null when param does not exist', async () => {
      prisma.vpgLegalParam.findFirst.mockResolvedValue(null);

      const result = await LegalParamService.getParam('MISSING', new Date());

      expect(result).toBeNull();
    });
  });

  describe('getParamsAtDate', () => {
    it('returns a Record with one entry per unique key (deduplicates by key)', async () => {
      const older = makeParam({ id: '1', validFrom: new Date('2025-01-01'), value: new Decimal('1.5') });
      const newer = makeParam({ id: '2', validFrom: new Date('2026-01-01'), value: new Decimal('1.75') });
      // findMany is ordered desc by validFrom in the service — return newer first
      prisma.vpgLegalParam.findMany.mockResolvedValue([newer, older] as any);

      const result = await LegalParamService.getParamsAtDate(new Date('2026-06-01'));

      expect(Object.keys(result)).toHaveLength(1);
      expect(result['OT_FACTOR']?.toString()).toBe('1.75');
    });

    it('returns empty record when no params exist', async () => {
      prisma.vpgLegalParam.findMany.mockResolvedValue([]);

      const result = await LegalParamService.getParamsAtDate(new Date());

      expect(result).toEqual({});
    });
  });

  describe('getAllParamsByCategory', () => {
    it('returns only the most recent record per key for the given category', async () => {
      const salud = makeParam({ id: '3', key: 'CCSS_OBRERO_SALUD', category: 'CCSS', value: new Decimal('5.5') });
      const pension = makeParam({ id: '4', key: 'CCSS_OBRERO_PENSION', category: 'CCSS', value: new Decimal('4.0') });
      prisma.vpgLegalParam.findMany.mockResolvedValue([salud, pension] as any);

      const result = await LegalParamService.getAllParamsByCategory('CCSS', new Date());

      expect(result).toHaveLength(2);
      const keys = result.map((p) => p.key);
      expect(keys).toContain('CCSS_OBRERO_SALUD');
      expect(keys).toContain('CCSS_OBRERO_PENSION');
    });
  });

  describe('getParamHistory', () => {
    it('returns all records for the key ordered by validFrom desc', async () => {
      const v1 = makeParam({ id: '10', validFrom: new Date('2025-01-01') });
      const v2 = makeParam({ id: '11', validFrom: new Date('2026-01-01') });
      prisma.vpgLegalParam.findMany.mockResolvedValue([v2, v1] as any);

      const result = await LegalParamService.getParamHistory('OT_FACTOR');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('11'); // newest first
    });
  });

  describe('upsertParam', () => {
    it('closes the existing open-ended record and creates a new one', async () => {
      const existing = makeParam({ id: 'existing-id', validUntil: null });
      prisma.vpgLegalParam.findFirst.mockResolvedValue(existing as any);
      prisma.vpgLegalParam.update.mockResolvedValue({ ...existing, validUntil: new Date('2026-04-30') } as any);
      const newParam = makeParam({ id: 'new-id', value: new Decimal('1.75'), validFrom: new Date('2026-05-01') });
      prisma.vpgLegalParam.create.mockResolvedValue(newParam as any);

      const result = await LegalParamService.upsertParam(
        {
          key: 'OT_FACTOR',
          value: 1.75,
          description: 'OT multiplier updated',
          category: 'OVERTIME',
          validFrom: new Date('2026-05-01'),
          isCritical: true,
        },
        'admin-user-id',
      );

      expect(prisma.vpgLegalParam.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'existing-id' },
          data: expect.objectContaining({ validUntil: expect.any(Date), updatedBy: 'admin-user-id' }),
        }),
      );
      expect(prisma.vpgLegalParam.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            key: 'OT_FACTOR',
            createdBy: 'admin-user-id',
            validUntil: null,
            isActive: true,
          }),
        }),
      );
      expect(result.id).toBe('new-id');
    });

    it('creates a new record without update when no existing open-ended record exists', async () => {
      prisma.vpgLegalParam.findFirst.mockResolvedValue(null);
      const newParam = makeParam({ id: 'brand-new' });
      prisma.vpgLegalParam.create.mockResolvedValue(newParam as any);

      await LegalParamService.upsertParam(
        {
          key: 'NEW_PARAM',
          value: 5,
          description: 'Brand new',
          category: 'WORKDAY',
          validFrom: new Date('2026-01-01'),
        },
        'admin-id',
      );

      expect(prisma.vpgLegalParam.update).not.toHaveBeenCalled();
      expect(prisma.vpgLegalParam.create).toHaveBeenCalledTimes(1);
    });
  });
});
