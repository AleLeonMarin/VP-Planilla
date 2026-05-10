import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SYSTEM_USER = 'system-seed';

// validFrom dates: use real decree date for CCSS; today as baseline for others
const TODAY = new Date('2026-01-01T00:00:00.000Z');
const CCSS_DATE = new Date('2024-07-01T00:00:00.000Z'); // CCSS rates effective July 2024

const legalParams = [
  // WORKDAY — Art. 136 Código de Trabajo
  {
    key: 'WORKDAY_DIURNA_DAILY',
    value: 8,
    description: 'Horas diarias jornada diurna ordinaria',
    category: 'WORKDAY',
    validFrom: TODAY,
    isCritical: false,
    source_decree: 'Art. 136 CT',
  },
  {
    key: 'WORKDAY_DIURNA_WEEKLY',
    value: 48,
    description: 'Horas semanales jornada diurna ordinaria',
    category: 'WORKDAY',
    validFrom: TODAY,
    isCritical: false,
    source_decree: 'Art. 136 CT',
  },
  {
    key: 'WORKDAY_MIXTA_DAILY',
    value: 7,
    description: 'Horas diarias jornada mixta ordinaria',
    category: 'WORKDAY',
    validFrom: TODAY,
    isCritical: false,
    source_decree: 'Art. 136 CT',
  },
  {
    key: 'WORKDAY_MIXTA_WEEKLY',
    value: 42,
    description: 'Horas semanales jornada mixta ordinaria',
    category: 'WORKDAY',
    validFrom: TODAY,
    isCritical: false,
    source_decree: 'Art. 136 CT',
  },
  {
    key: 'WORKDAY_NOCTURNA_DAILY',
    value: 6,
    description: 'Horas diarias jornada nocturna ordinaria',
    category: 'WORKDAY',
    validFrom: TODAY,
    isCritical: false,
    source_decree: 'Art. 136 CT',
  },
  {
    key: 'WORKDAY_NOCTURNA_WEEKLY',
    value: 36,
    description: 'Horas semanales jornada nocturna ordinaria',
    category: 'WORKDAY',
    validFrom: TODAY,
    isCritical: false,
    source_decree: 'Art. 136 CT',
  },
  // OVERTIME — Art. 139, 148 Código de Trabajo
  {
    key: 'OT_FACTOR',
    value: 1.5,
    description: 'Multiplicador de horas extra ordinarias (1.5x)',
    category: 'OVERTIME',
    validFrom: TODAY,
    isCritical: true,
    source_decree: 'Art. 139 CT',
  },
  {
    key: 'HOLIDAY_MANDATORY_FACTOR',
    value: 2.0,
    description: 'Multiplicador día feriado obligatorio trabajado (2x)',
    category: 'OVERTIME',
    validFrom: TODAY,
    isCritical: true,
    source_decree: 'Art. 148 CT',
  },
  {
    key: 'HOLIDAY_TRIPLE_FACTOR',
    value: 3.0,
    description: 'Multiplicador día feriado triple (3x)',
    category: 'OVERTIME',
    validFrom: TODAY,
    isCritical: true,
    source_decree: 'Art. 148 CT',
  },
  // CCSS — Ley CCSS (tasas vigentes julio 2024)
  {
    key: 'CCSS_OBRERO_SALUD',
    value: 5.50,
    description: 'Cuota obrera CCSS — seguro de salud (%)',
    category: 'CCSS',
    validFrom: CCSS_DATE,
    isCritical: true,
    source_decree: 'Ley CCSS',
  },
  {
    key: 'CCSS_OBRERO_PENSION',
    value: 4.00,
    description: 'Cuota obrera CCSS — pensión IVM (%)',
    category: 'CCSS',
    validFrom: CCSS_DATE,
    isCritical: true,
    source_decree: 'Ley CCSS',
  },
  {
    key: 'CCSS_OBRERO_BP',
    value: 1.00,
    description: 'Cuota obrera CCSS — Banco Popular (%)',
    category: 'CCSS',
    validFrom: CCSS_DATE,
    isCritical: true,
    source_decree: 'Ley CCSS',
  },
  {
    key: 'CCSS_PATRONAL_SALUD',
    value: 9.25,
    description: 'Cuota patronal CCSS — seguro de salud (%)',
    category: 'CCSS',
    validFrom: CCSS_DATE,
    isCritical: true,
    source_decree: 'Ley CCSS',
  },
  {
    key: 'CCSS_PATRONAL_PENSION',
    value: 5.25,
    description: 'Cuota patronal CCSS — pensión IVM (%)',
    category: 'CCSS',
    validFrom: CCSS_DATE,
    isCritical: true,
    source_decree: 'Ley CCSS',
  },
  {
    key: 'CCSS_PATRONAL_INA',
    value: 1.50,
    description: 'Cuota patronal INA (%)',
    category: 'CCSS',
    validFrom: CCSS_DATE,
    isCritical: true,
    source_decree: 'Ley CCSS',
  },
  {
    key: 'CCSS_PATRONAL_IMAS',
    value: 0.50,
    description: 'Cuota patronal IMAS (%)',
    category: 'CCSS',
    validFrom: CCSS_DATE,
    isCritical: true,
    source_decree: 'Ley CCSS',
  },
  {
    key: 'CCSS_PATRONAL_ASFAM',
    value: 5.00,
    description: 'Cuota patronal asignaciones familiares (%)',
    category: 'CCSS',
    validFrom: CCSS_DATE,
    isCritical: true,
    source_decree: 'Ley CCSS',
  },
  {
    key: 'CCSS_PATRONAL_FONATEL',
    value: 0.25,
    description: 'Cuota patronal FONATEL (%)',
    category: 'CCSS',
    validFrom: CCSS_DATE,
    isCritical: true,
    source_decree: 'Ley CCSS',
  },
  {
    key: 'CCSS_PATRONAL_BP',
    value: 0.25,
    description: 'Cuota patronal Banco Popular (%)',
    category: 'CCSS',
    validFrom: CCSS_DATE,
    isCritical: true,
    source_decree: 'Ley CCSS',
  },
  // FEATURE_FLAG — MTSS
  {
    key: 'MIN_WAGE_CHECK_ENABLED',
    value: 1,
    description: 'Habilita validación de salario mínimo al aprobar planilla (1=activo, 0=inactivo)',
    category: 'FEATURE_FLAG',
    validFrom: TODAY,
    isCritical: true,
    source_decree: 'MTSS',
  },
  // MIN_WAGE — Referencia Global MTSS
  {
    key: 'GLOBAL_MIN_WAGE_RATE',
    value: 1494.20,
    description: 'Tarifa mínima por hora (Referencia MTSS 2024)',
    category: 'MIN_WAGE',
    validFrom: new Date('2024-01-01T00:00:00.000Z'),
    isCritical: true,
    source_decree: 'MTSS 2024',
  },
  {
    key: 'GLOBAL_MIN_WAGE_RATE',
    value: 1529.62,
    description: 'Tarifa mínima por hora (Referencia MTSS 2025)',
    category: 'MIN_WAGE',
    validFrom: new Date('2025-01-01T00:00:00.000Z'),
    isCritical: true,
    source_decree: 'MTSS 2025',
  },
];

// Standard labor event catalog (Costa Rica legal baseline)
const standardLaborEvents: Array<{
  name: string;
  description: string;
  payBehavior: 'FULL_PAY' | 'PARTIAL_PAY' | 'NO_PAY' | 'EXTERNAL_PAY';
  maxPaidDays: number | null;
  payPercentage: number | null;
}> = [
  {
    name: 'Incapacidad CCSS',
    description: 'Incapacidad médica emitida por la CCSS. Días 1–3: patrono paga el 50%. Día 4 en adelante: CCSS paga directamente.',
    payBehavior: 'PARTIAL_PAY',
    payPercentage: 50.00,
    maxPaidDays: 3,
  },
  {
    name: 'Ausencia injustificada',
    description: 'Ausencia sin permiso ni justificación. No genera pago. Puede ser causal de despido (CT Art. 81).',
    payBehavior: 'NO_PAY',
    payPercentage: null,
    maxPaidDays: null,
  },
  {
    name: 'Permiso sin goce de salario',
    description: 'Permiso acordado entre patrono y trabajador sin compensación salarial (CT Art. 31).',
    payBehavior: 'NO_PAY',
    payPercentage: null,
    maxPaidDays: null,
  },
  {
    name: 'Permiso con goce de salario',
    description: 'Permiso otorgado por el patrono con pago completo del salario (contrato / reglamento interno).',
    payBehavior: 'FULL_PAY',
    payPercentage: null,
    maxPaidDays: null,
  },
  {
    name: 'Licencia de paternidad',
    description: 'Licencia por nacimiento o adopción. Patrono paga el 100% hasta 8 días hábiles (Ley 9371).',
    payBehavior: 'FULL_PAY',
    payPercentage: null,
    maxPaidDays: 8,
  },
  {
    name: 'Suspensión disciplinaria',
    description: 'Suspensión sin goce de salario impuesta por el patrono como medida disciplinaria (CT Art. 81).',
    payBehavior: 'NO_PAY',
    payPercentage: null,
    maxPaidDays: null,
  },
  {
    name: 'Duelo familiar',
    description: 'Licencia por fallecimiento de familiar directo. Patrono paga el 100% (convención colectiva estándar, hasta 3 días).',
    payBehavior: 'FULL_PAY',
    payPercentage: null,
    maxPaidDays: 3,
  },
  {
    name: 'Licencia de maternidad',
    description: 'Licencia de maternidad (4 meses). La CCSS paga directamente al trabajador — no genera pago patronal.',
    payBehavior: 'EXTERNAL_PAY',
    payPercentage: null,
    maxPaidDays: null,
  },
  {
    name: 'Otro',
    description: 'Evento laboral de tipo no categorizado. Revisar con RR.HH. para definir impacto en el pago.',
    payBehavior: 'NO_PAY',
    payPercentage: null,
    maxPaidDays: null,
  },
];

async function main() {
  console.log('Seeding vpg_legal_params...');

  for (const param of legalParams) {
    const seedId = `seed-${param.key}-${param.validFrom.toISOString().split('T')[0]}`;
    await prisma.vpgLegalParam.upsert({
      where: {
        id: seedId,
      },
      update: {},
      create: {
        id: seedId,
        key: param.key,
        value: param.value,
        description: param.description,
        category: param.category,
        validFrom: param.validFrom,
        validUntil: null,
        isActive: true,
        isCritical: param.isCritical,
        source_decree: param.source_decree ?? null,
        createdBy: SYSTEM_USER,
        updatedBy: null,
      },
    });
  }

  console.log(`Seeded ${legalParams.length} legal parameters.`);

  // Seed standard labor events catalog
  // No unique constraint on name, so: update existing by name, create if absent
  console.log('Seeding vpg_labor_events catalog...');
  for (const ev of standardLaborEvents) {
    const existing = await prisma.vpg_labor_events.findFirst({
      where: { labor_events_name: ev.name },
    });

    if (existing) {
      await prisma.vpg_labor_events.update({
        where: { labor_events_id: existing.labor_events_id },
        data: {
          labor_events_description: ev.description,
          labor_event_pay_behavior: ev.payBehavior,
          labor_event_max_paid_days: ev.maxPaidDays,
          labor_event_pay_percentage: ev.payPercentage,
        },
      });
    } else {
      await prisma.vpg_labor_events.create({
        data: {
          labor_events_name: ev.name,
          labor_events_description: ev.description,
          labor_events_version: 1,
          labor_event_pay_behavior: ev.payBehavior,
          labor_event_max_paid_days: ev.maxPaidDays,
          labor_event_pay_percentage: ev.payPercentage,
        },
      });
    }
  }
  console.log(`Seeded ${standardLaborEvents.length} labor event catalog entries.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
