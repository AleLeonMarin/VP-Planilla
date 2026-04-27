import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { EnterpriseService } from '../../../service/EnterpriseService';
import { AuditLogsService } from '../../../service/AuditLogsService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

jest.mock('../../../service/AuditLogsService');

const { prisma } = require('../../../lib/prisma');

const mockEnterprise = {
  enterprise_id: 1,
  enterprise_name: 'VP-Planilla',
  enterprise_image: Buffer.from('test-image'),
  enterprise_creation_date: new Date('2026-01-01'),
  enterpise_version: 1,
  enterprise_minute_rounding_policy: 'EXACT',
  enterprise_rounding_policy_acknowledged: false,
  enterprise_is_commercial_activity: true,
  enterprise_ordinary_shift_type: 'DIURNA',
};

beforeEach(() => {
  jest.clearAllMocks();
  // Mock transaction to just execute the callback
  prisma.$transaction.mockImplementation(async (callback: any) => {
    return await callback(prisma);
  });
  prisma.vpg_enterprise.findFirst.mockResolvedValue(mockEnterprise);
  prisma.vpg_enterprise.update.mockResolvedValue(mockEnterprise);
});

describe('EnterpriseService', () => {
  describe('getConfig', () => {
    it('returns the current enterprise settings', async () => {
      const result = await EnterpriseService.getConfig();
      expect(result).toEqual(mockEnterprise);
      expect(prisma.vpg_enterprise.findFirst).toHaveBeenCalled();
    });
  });

  describe('updateConfig', () => {
    const userId = 42;

    it('persists fields using enterprise_ prefix', async () => {
      const updateData = { enterprise_name: 'New Name' };
      await EnterpriseService.updateConfig(updateData, userId);

      expect(prisma.vpg_enterprise.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { enterprise_id: 1 },
          data: expect.objectContaining({ enterprise_name: 'New Name' }),
        })
      );
    });

    it('handles partial updates without modifying unprovided fields', async () => {
      const updateData = { enterprise_is_commercial_activity: false };
      await EnterpriseService.updateConfig(updateData, userId);

      const updateCall = prisma.vpg_enterprise.update.mock.calls[0][0];
      expect(updateCall.data).toEqual({ enterprise_is_commercial_activity: false });
      expect(updateCall.data).not.toHaveProperty('enterprise_image');
      expect(updateCall.data).not.toHaveProperty('enterprise_name');
    });

    it('resets acknowledgment flag to false when policy is changed away from NEAREST_QUARTER', async () => {
      // Setup: current is NEAREST_QUARTER and acknowledged
      prisma.vpg_enterprise.findFirst.mockResolvedValue({
        ...mockEnterprise,
        enterprise_minute_rounding_policy: 'NEAREST_QUARTER',
        enterprise_rounding_policy_acknowledged: true,
      });

      const updateData = { enterprise_minute_rounding_policy: 'EXACT' as const };
      await EnterpriseService.updateConfig(updateData, userId);

      expect(prisma.vpg_enterprise.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            enterprise_minute_rounding_policy: 'EXACT',
            enterprise_rounding_policy_acknowledged: false,
          }),
        })
      );
    });

    it('keeps acknowledgment flag if policy is set TO NEAREST_QUARTER (waiting for user to ack later)', async () => {
      const updateData = { enterprise_minute_rounding_policy: 'NEAREST_QUARTER' as const };
      await EnterpriseService.updateConfig(updateData, userId);

      expect(prisma.vpg_enterprise.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            enterprise_minute_rounding_policy: 'NEAREST_QUARTER',
          }),
        })
      );
      // It should NOT force it to true or false unless explicitly provided
      const callData = prisma.vpg_enterprise.update.mock.calls[0][0].data;
      expect(callData).not.toHaveProperty('enterprise_rounding_policy_acknowledged');
    });

    it('creates an audit log with entity "enterprise_config"', async () => {
      const updateData = { enterprise_name: 'Audit Test' };
      await EnterpriseService.updateConfig(updateData, userId);

      expect(AuditLogsService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          action: 'UPDATE_CONFIG',
          entity: 'enterprise_config',
          entityId: 1,
        }),
        prisma // Should be prisma because of our $transaction mock
      );
    });

    it('uses action "NEAREST_QUARTER_ACKNOWLEDGED" when acknowledging the policy', async () => {
      const updateData = { enterprise_rounding_policy_acknowledged: true };
      await EnterpriseService.updateConfig(updateData, userId);

      expect(AuditLogsService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          action: 'NEAREST_QUARTER_ACKNOWLEDGED',
          entity: 'enterprise_config',
          entityId: 1,
        }),
        prisma
      );
    });

    it('wraps updates in a transaction', async () => {
      await EnterpriseService.updateConfig({ enterprise_name: 'Tx Test' }, userId);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
