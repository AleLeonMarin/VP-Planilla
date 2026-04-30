import { PrismaClient, MinuteRoundingPolicy } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { Decimal } from '@prisma/client/runtime/library';
import { LegalParamService } from '../../../service/LegalParamService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

describe('LegalParamService Rounding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load minuteRoundingPolicy from vpg_enterprise', async () => {
    // Mock enterprise policy
    prisma.vpg_enterprise.findFirst.mockResolvedValue({
      enterprise_minute_rounding_policy: MinuteRoundingPolicy.ALWAYS_UP
    });

    // Mock other legal params
    prisma.vpgLegalParam.findMany.mockResolvedValue([
      { key: 'WORKDAY_DIURNA_DAILY', value: new Decimal('8.0'), validFrom: new Date('2026-01-01'), isActive: true },
      { key: 'WORKDAY_DIURNA_WEEKLY', value: new Decimal('48.0'), validFrom: new Date('2026-01-01'), isActive: true },
      { key: 'OT_FACTOR', value: new Decimal('1.5'), validFrom: new Date('2026-01-01'), isActive: true },
      { key: 'HOLIDAY_MANDATORY_FACTOR', value: new Decimal('2.0'), validFrom: new Date('2026-01-01'), isActive: true },
      { key: 'HOLIDAY_TRIPLE_FACTOR', value: new Decimal('3.0'), validFrom: new Date('2026-01-01'), isActive: true },
      { key: 'CCSS_OBRERO_SALUD', value: new Decimal('5.5'), validFrom: new Date('2026-01-01'), isActive: true },
      { key: 'CCSS_OBRERO_PENSION', value: new Decimal('4.33'), validFrom: new Date('2026-01-01'), isActive: true },
      { key: 'CCSS_OBRERO_BP', value: new Decimal('1.0'), validFrom: new Date('2026-01-01'), isActive: true },
    ]);

    const result = await LegalParamService.getParamSetAtDate(new Date('2026-04-26'));

    expect(result.minuteRoundingPolicy).toBe(MinuteRoundingPolicy.ALWAYS_UP);
    expect(prisma.vpg_enterprise.findFirst).toHaveBeenCalled();
  });

  it('should fallback to EXACT if enterprise policy is missing', async () => {
    prisma.vpg_enterprise.findFirst.mockResolvedValue(null);

    prisma.vpgLegalParam.findMany.mockResolvedValue([
      { key: 'WORKDAY_DIURNA_DAILY', value: new Decimal('8.0'), validFrom: new Date('2026-01-01'), isActive: true },
      { key: 'WORKDAY_DIURNA_WEEKLY', value: new Decimal('48.0'), validFrom: new Date('2026-01-01'), isActive: true },
      { key: 'OT_FACTOR', value: new Decimal('1.5'), validFrom: new Date('2026-01-01'), isActive: true },
      { key: 'HOLIDAY_MANDATORY_FACTOR', value: new Decimal('2.0'), validFrom: new Date('2026-01-01'), isActive: true },
      { key: 'HOLIDAY_TRIPLE_FACTOR', value: new Decimal('3.0'), validFrom: new Date('2026-01-01'), isActive: true },
      { key: 'CCSS_OBRERO_SALUD', value: new Decimal('5.5'), validFrom: new Date('2026-01-01'), isActive: true },
      { key: 'CCSS_OBRERO_PENSION', value: new Decimal('4.33'), validFrom: new Date('2026-01-01'), isActive: true },
      { key: 'CCSS_OBRERO_BP', value: new Decimal('1.0'), validFrom: new Date('2026-01-01'), isActive: true },
    ]);

    const result = await LegalParamService.getParamSetAtDate(new Date('2026-04-26'));

    expect(result.minuteRoundingPolicy).toBe(MinuteRoundingPolicy.EXACT);
  });
});
