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
];

async function main() {
  console.log('Seeding vpg_legal_params...');

  for (const param of legalParams) {
    await prisma.vpgLegalParam.upsert({
      where: {
        // Use a compound unique check: key + validFrom (no unique constraint yet; use findFirst + skip if exists)
        id: `seed-${param.key}`, // Will not match; forces create
      },
      update: {},
      create: {
        id: `seed-${param.key}`,
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
