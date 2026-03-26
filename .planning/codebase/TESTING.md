# Testing Patterns

**Analysis Date:** 2026-03-26

---

## Summary

Testing is backend-only and extremely limited in scope. The frontend has zero test files or testing framework installed. The backend has one test file covering a single service (`PayrollService`) with 9 test cases. No integration tests, no API/HTTP tests, and no end-to-end tests exist.

---

## Test Framework

**Runner:**
- Jest 29.7.0
- Config: `src/backend/jest.config.js`

**TypeScript Transformer:**
- ts-jest 29.1.2 via `preset: 'ts-jest'`

**Mocking Library:**
- jest-mock-extended 3.0.5 — used for deep mock of `PrismaClient`

**Assertion Library:**
- Jest built-in (`expect`)

**HTTP Testing:**
- supertest 6.3.4 — installed as a dev dependency but not used in any test file

**Run Commands (from `src/backend/`):**

```bash
npm test                  # Run all tests once
npm run test:watch        # Watch mode — re-runs on file change
npm run test:coverage     # Run with coverage report → src/backend/coverage/
```

Coverage HTML report lands at `src/backend/coverage/index.html`.

---

## Jest Configuration

File: `src/backend/jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 10000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
```

Key settings:
- `clearMocks`, `resetMocks`, `restoreMocks` all `true` — full mock isolation per test, no shared mock state leaking between tests
- `testTimeout: 10000ms` — 10-second timeout per test
- No coverage thresholds enforced

---

## Test File Organization

Tests live under `src/backend/src/__tests__/`, separate from source files (not co-located).

```
src/backend/src/__tests__/
├── setup/
│   └── prisma-mock.ts          # Shared Prisma mock factory (currently not imported by test file)
└── unit/
    └── services/
        └── PayrollService.test.ts   # Only test file in the project
```

New test files should follow:
- **Path:** `src/backend/src/__tests__/unit/services/<ServiceName>.test.ts`
- **Test match pattern:** `**/__tests__/**/*.test.ts`

---

## Test Structure

### Suite Organization

Tests use Arrange/Act/Assert comments and are grouped by class → method → edge cases:

```typescript
describe('PayrollService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayroll', () => {
    it('should create a payroll successfully with valid data', async () => {
      // Arrange
      const payrollData: Payroll = { id: 0, payroll_type: 1, ... };
      prismaMock.vpg_payrolls.create.mockResolvedValue(mockCreatedPayroll);

      // Act
      const result = await PayrollService.createPayroll(payrollData);

      // Assert
      expect(result).toEqual({ id: 1, payroll_type: 1, ... });
      expect(prismaMock.vpg_payrolls.create).toHaveBeenCalledWith({
        data: { payrolls_payroll_type_id: 1, ... }
      });
      expect(prismaMock.vpg_payrolls.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAllPayrolls', () => { ... });

  describe('Edge Cases and Validation', () => { ... });
});
```

**Test naming:** `should [expected outcome] [when/given condition]`

**Group structure:**
1. Top-level `describe` = class name
2. Nested `describe` = method name
3. Final `describe('Edge Cases and Validation', ...)` = boundary / edge case tests

---

## Mocking

### Framework

`jest-mock-extended` with `mockDeep<PrismaClient>()` creates a deep mock that types all Prisma model methods.

### Pattern Used in Test Files

The current test file (`PayrollService.test.ts`) sets up the mock inline at the top of the file:

```typescript
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Payroll } from '../../../model/payroll';

// Create mock instance
const prismaMock = mockDeep<PrismaClient>();

// Mock the PrismaClient module — must happen before importing the service
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock),
}));

// Import service AFTER mocking
import { PayrollService } from '../../../service/PayrollService';

describe('PayrollService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  ...
});
```

### Mock Usage in Tests

```typescript
// Mock a resolved value
prismaMock.vpg_payrolls.create.mockResolvedValue(mockCreatedPayroll);
prismaMock.vpg_payrolls.findMany.mockResolvedValue(mockPayrolls);

// Mock a rejection (DB error path)
prismaMock.vpg_payrolls.create.mockRejectedValue(new Error('Database connection failed'));
prismaMock.vpg_payrolls.findMany.mockRejectedValue(new Error('Database query timeout'));
```

### Shared Setup File (Currently Unused)

`src/backend/src/__tests__/setup/prisma-mock.ts` exists as a shared mock factory:

```typescript
// src/backend/src/__tests__/setup/prisma-mock.ts
export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});
```

The existing `PayrollService.test.ts` does not import from this file — it duplicates the setup inline. New test files should import from `prisma-mock.ts` to keep setup DRY.

### What Is Mocked

- `@prisma/client` → `PrismaClient` — all DB interactions mocked
- No network calls, no filesystem I/O

### What Is NOT Mocked

- The actual service code under test — real `PayrollService` logic executes

---

## Async Testing Patterns

### Happy Path

```typescript
const result = await PayrollService.createPayroll(payrollData);
expect(result).toEqual(expectedOutput);
```

### Error Path

```typescript
prismaMock.vpg_payrolls.create.mockRejectedValue(new Error('Database connection failed'));

await expect(PayrollService.createPayroll(payrollData)).rejects.toThrow('Database connection failed');
expect(prismaMock.vpg_payrolls.create).toHaveBeenCalledTimes(1);
```

### Verifying DB Calls

Always assert both WHAT was called and HOW MANY TIMES:

```typescript
expect(prismaMock.vpg_payrolls.create).toHaveBeenCalledWith({
  data: {
    payrolls_payroll_type_id: 1,
    payrolls_period_start: new Date('2026-02-01'),
    payrolls_status: 'PENDIENTE',
    payrolls_version: 1,
  },
});
expect(prismaMock.vpg_payrolls.create).toHaveBeenCalledTimes(1);
```

Use `expect.objectContaining(...)` for partial matching when exact shape is not the focus:

```typescript
expect(prismaMock.vpg_payrolls.create).toHaveBeenCalledWith(
  expect.objectContaining({
    data: expect.objectContaining({ payrolls_version: 1 }),
  })
);
```

---

## Fixtures and Test Data

No factory helpers or fixture files exist. All test data is defined inline within each test case as typed object literals:

```typescript
const payrollData: Payroll = {
  id: 0,
  payroll_type: 1,
  period_start: new Date('2026-02-01'),
  period_end: new Date('2026-02-28'),
  payment_date: new Date('2026-03-05'),
  status: 'PENDIENTE',
  version: 1,
};

const mockCreatedPayroll = {
  payrolls_id: 1,
  payrolls_payroll_type_id: 1,
  payrolls_period_start: new Date('2026-02-01'),
  payrolls_period_end: new Date('2026-02-28'),
  payrolls_payment_date: new Date('2026-03-05'),
  payrolls_status: 'PENDIENTE',
  payrolls_version: 1,
};
```

Note the naming convention difference: domain model uses `snake_case` (e.g. `period_start`), Prisma DB row uses `tablename_fieldname` (e.g. `payrolls_period_start`).

---

## Coverage Status

**No coverage thresholds enforced** — `jest.config.js` has no `coverageThreshold` setting.

### What Is Tested

Only `PayrollService` in `src/backend/src/service/PayrollService.ts`:
- `createPayroll` — 3 test cases (success, DB error, default version)
- `getAllPayrolls` — 4 test cases (ordered list, empty list, field mapping, DB error)
- Edge cases — 2 test cases (multiple statuses, same-date period)

### Untested Methods in PayrollService

- `getPayrollById`
- `updatePayroll`
- `getPayrollEmployees`

### Entirely Untested Services

- `src/backend/src/service/EmployeeService.ts`
- `src/backend/src/service/NomineeService.ts`
- `src/backend/src/service/AuthService.ts`
- `src/backend/src/service/ReportsService.ts`
- `src/backend/src/service/BonusesService.ts`
- `src/backend/src/service/DeductionsService.ts`
- `src/backend/src/service/ClockLogsService.ts`
- `src/backend/src/service/VacationService.ts`
- `src/backend/src/service/LaborEventsService.ts`
- `src/backend/src/service/UserService.ts`
- `src/backend/src/service/PaymentReceiptService.ts`
- `src/backend/src/service/AuditLogsService.ts`
- `src/backend/src/service/PayrollTypeService.ts`
- `src/backend/src/service/PositionService.ts`
- `src/backend/src/service/EmployeeDeductions.ts`

### Entirely Untested Layers

- All controllers (`src/backend/src/controller/`)
- All middleware (`src/backend/src/middleware/AuthMiddleware.ts`, `src/backend/src/middleware/validateBody.ts`)
- All utility functions (`src/backend/src/utils/payrollUtils.ts`) — highest-risk untested code
- All frontend (`src/frontend/`) — no testing framework installed

---

## Test Types

| Type | Present | Notes |
|------|---------|-------|
| Unit (service layer) | Yes | Only `PayrollService`, 9 test cases |
| Unit (utils/payrollUtils) | No | High priority — contains Costa Rica labor law math |
| Unit (middleware) | No | `validateBody` and `AuthMiddleware` untested |
| Integration | No | `supertest` installed but unused |
| E2E | No | Not applicable |
| Frontend component tests | No | No test framework installed on frontend |

---

## Adding New Tests

### New Service Test File

1. Create `src/backend/src/__tests__/unit/services/<ServiceName>.test.ts`
2. Set up prisma mock at the top of the file (see Mocking section above)
3. Import the service AFTER the `jest.mock('@prisma/client', ...)` call
4. Structure: `describe('<ServiceName>')` → `describe('<methodName>')` → `it('should ...')`
5. Every test uses Arrange/Act/Assert comments
6. Assert both result shape AND Prisma call arguments + call count

### Priority Areas for New Tests

1. `src/backend/src/utils/payrollUtils.ts` — pure functions, no DB, easy to test, critical for correct payroll
2. `src/backend/src/middleware/validateBody.ts` — pure middleware, testable with mock req/res/next
3. `src/backend/src/service/NomineeService.ts` — most complex service (payroll calculation)
4. `src/backend/src/service/EmployeeService.ts` — core domain entity

---

*Testing analysis: 2026-03-26*
