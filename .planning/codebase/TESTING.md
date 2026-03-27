# Testing Patterns

**Analysis Date:** 2026-03-26

## Test Framework

**Runner:**
- Jest 29.7.0
- Config: `src/backend/jest.config.js`
- Preset: `ts-jest`
- Environment: `node`
- Timeout: 10 000 ms per test

**Assertion Library:**
- Jest built-in (`expect`, `toEqual`, `toHaveBeenCalledWith`, `toHaveBeenCalledTimes`, `rejects.toThrow`)

**Mocking Library:**
- `jest-mock-extended` 3.0.5 — used for deep Prisma mocking via `mockDeep<PrismaClient>()`

**Run Commands:**
```bash
# From src/backend/
npm test                # Run all tests (Jest)
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report (text + lcov + html)
```

**Coverage Output:**
- Directory: `src/backend/coverage/`
- Reporters: `text` (terminal), `lcov`, `html`

## Test File Organization

**Location:** `src/backend/src/__tests__/` — separate from source (not co-located)

**Directory structure:**
```
src/backend/src/__tests__/
├── setup/
│   └── prisma-mock.ts          # Shared Prisma mock setup (not currently used via setupFiles)
└── unit/
    └── services/
        └── PayrollService.test.ts  # Only existing test file
```

**Pattern:** `testMatch: ['**/__tests__/**/*.test.ts']` — only `.test.ts` files inside `__tests__/` are picked up.

**Naming:** `<ServiceName>.test.ts` matching the service under test.

## Current Test Coverage

**Overall (as of 2026-03-26):**
| Metric | Coverage |
|--------|----------|
| Statements | 1.81% |
| Branches | 0.33% |
| Functions | 1.35% |
| Lines | 1.75% |

**Only tested file:** `src/backend/src/service/PayrollService.ts` (45% statements, 63% lines)

**Coverage by layer:**
| Layer | Coverage |
|-------|----------|
| Controllers | 0% (16 files) |
| Services | ~2.5% statements — only PayrollService has tests |
| Routes | 0% (16 files) |
| Schemas | 0% (5 files) |
| Utils (payrollUtils.ts) | 0% |
| Middleware | 0% |

**No tests exist for:**
- `src/backend/src/service/EmployeeService.ts`
- `src/backend/src/service/NomineeService.ts` (payroll calculation engine)
- `src/backend/src/service/AuthService.ts`
- `src/backend/src/utils/payrollUtils.ts` (pure functions — highest-value test target)
- Any frontend code (no test runner configured for `src/frontend/`)

## Test Suite Status

**Current state:** 2 tests **failing**, 7 tests passing (1 suite total).

**Failing tests** (in `PayrollService.test.ts`):
1. `getAllPayrolls > should retrieve all payrolls ordered by ID descending` — test expects the old plain `Payroll` shape but `PayrollService.getAllPayrolls()` now returns an enriched object with `total_employees`, `total_gross`, `total_net`, etc. (added during Phase 4 aggregation refactor)
2. `getAllPayrolls > should correctly map database fields to model fields` — same root cause; expected shape omits the new aggregation fields

**Root cause:** `PayrollService.getAllPayrolls()` was refactored to include aggregated employee statistics via `vpg_payroll_employee` relation, but the test mocks return raw `vpg_payrolls` without the `vpg_payroll_employee` include, causing `undefined` on the relation and producing `total_*: 0` fields the test does not expect.

**Passing tests (7):**
- `createPayroll > should create a payroll successfully with valid data`
- `createPayroll > should throw error when database operation fails`
- `createPayroll > should create payroll with default version 1`
- `getAllPayrolls > should return empty array when no payrolls exist`
- `getAllPayrolls > should throw error when database query fails`
- `Edge Cases > should handle different payroll statuses`
- `Edge Cases > should handle payroll with same period dates`

## Test Structure

**Suite organization:**
```typescript
describe('PayrollService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayroll', () => {
    it('should create a payroll successfully with valid data', async () => {
      // Arrange
      const payrollData: Payroll = { ... };
      const mockCreatedPayroll = { payrolls_id: 1, ... };
      prismaMock.vpg_payrolls.create.mockResolvedValue(mockCreatedPayroll);

      // Act
      const result = await PayrollService.createPayroll(payrollData);

      // Assert
      expect(result).toEqual({ id: 1, ... });
      expect(prismaMock.vpg_payrolls.create).toHaveBeenCalledWith({ data: { ... } });
      expect(prismaMock.vpg_payrolls.create).toHaveBeenCalledTimes(1);
    });
  });
});
```

**Pattern:** Arrange / Act / Assert with inline comments labeling each section.

## Mocking

**Framework:** `jest-mock-extended` — `mockDeep<PrismaClient>()`

**Prisma mock setup (inline per test file):**
```typescript
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

const prismaMock = mockDeep<PrismaClient>();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock),
}));

// Import service AFTER mocking
import { PayrollService } from '../../../service/PayrollService';
```

**Important:** The service must be imported **after** `jest.mock()` is called. The `prisma-mock.ts` setup file at `src/backend/src/__tests__/setup/prisma-mock.ts` exists but is **not wired** into `jest.config.js` via `setupFiles` or `setupFilesAfterFramework` — it is a utility import used manually.

**Mock method pattern:**
```typescript
prismaMock.vpg_payrolls.create.mockResolvedValue(mockDbRow);
prismaMock.vpg_payrolls.findMany.mockRejectedValue(new Error('timeout'));
```

**What is mocked:** `@prisma/client` PrismaClient — the only external dependency in services.

**What is NOT mocked:** Business logic in `payrollUtils.ts` (not yet tested), Express request/response (no integration tests).

## Fixtures and Factories

**Test data:** Inline object literals per test case — no factory functions or shared fixtures.

**DB row shape convention:**
```typescript
// Raw DB row (as Prisma returns it)
const mockCreatedPayroll = {
  payrolls_id: 1,
  payrolls_payroll_type_id: 1,
  payrolls_period_start: new Date('2026-02-01'),
  payrolls_period_end: new Date('2026-02-28'),
  payrolls_payment_date: new Date('2026-03-05'),
  payrolls_status: 'PENDIENTE',
  payrolls_version: 1,
};

// Expected model output
const expected: Payroll = {
  id: 1,
  payroll_type: 1,
  period_start: new Date('2026-02-01'),
  ...
};
```

**Location:** All fixtures are inline in `src/backend/src/__tests__/unit/services/PayrollService.test.ts`.

## Coverage Requirements

**Target:** None enforced — no `coverageThreshold` configured in `jest.config.js`.

**Current state:** 1.81% overall (critically low).

**Coverage directory:** `src/backend/coverage/` (committed or gitignored — not confirmed)

## Test Types

**Unit Tests:**
- Only unit tests exist
- Scope: individual service methods
- Location: `src/backend/src/__tests__/unit/services/`
- Database: always mocked via `jest-mock-extended`

**Integration Tests:**
- None — no HTTP-level tests, no supertest usage

**E2E Tests:**
- None — no Playwright, Cypress, or similar

**Frontend Tests:**
- None — no Jest/Vitest configuration in `src/frontend/`
- No React Testing Library setup detected

## Common Patterns

**Async Testing:**
```typescript
// Success path
const result = await PayrollService.createPayroll(payrollData);
expect(result).toEqual(expected);

// Error path
await expect(PayrollService.createPayroll(payrollData)).rejects.toThrow('Database connection failed');
```

**Verifying Prisma calls:**
```typescript
expect(prismaMock.vpg_payrolls.create).toHaveBeenCalledWith({
  data: {
    payrolls_payroll_type_id: 1,
    payrolls_period_start: new Date('2026-02-01'),
    // ... exact shape Prisma receives
  },
});
expect(prismaMock.vpg_payrolls.create).toHaveBeenCalledTimes(1);
```

**Partial matching (used for version tests):**
```typescript
expect(prismaMock.vpg_payrolls.create).toHaveBeenCalledWith(
  expect.objectContaining({
    data: expect.objectContaining({ payrolls_version: 1 }),
  })
);
```

## Highest-Value Untested Areas

These areas have zero test coverage and carry the highest risk:

1. **`src/backend/src/utils/payrollUtils.ts`** — Pure functions (no DB, no HTTP). Easiest to test. Calculates CR labor-law overtime, weekly rest, deductions. A bug here affects every payroll calculation silently.

2. **`src/backend/src/service/NomineeService.ts` — `calculatePayrollForPeriod`** — The payroll engine. Requires mocking Prisma + multiple service calls. Highest business risk if broken.

3. **`src/backend/src/service/EmployeeService.ts`** — `statusMap` translation logic (frontend string → DB Char(1)) is untested. A mapping mistake sends wrong status to DB.

4. **`src/backend/src/schemas/`** — All 5 Zod schema files have 0% coverage. Schema validation errors are the primary defense against malformed HTTP bodies; they should be tested with valid and invalid inputs.

5. **`src/backend/src/middleware/validateBody.ts`** — The Zod middleware bridges schemas to routes. Untested behavior: what happens when `result.error.issues` is empty, or when schema coerces types unexpectedly.

6. **`getAllPayrolls` test fix** — Two existing tests are broken because the mock does not include the `vpg_payroll_employee` relation that `getAllPayrolls` now uses. Fix: add `vpg_payroll_employee: []` to the mock return value.

---

*Testing analysis: 2026-03-26*
