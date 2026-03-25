# Testing

**Analysis Date:** 2026-03-25

## Test Strategy

Testing is limited to the backend only. The frontend has zero test files. Backend testing is unit-only, focused on service-layer logic with a mocked Prisma client. There are no integration tests, no end-to-end tests, and no API-level tests using `supertest` (despite `supertest` being installed as a dev dependency).

The single test file covers `PayrollService` — one of 16+ service files. All other services (`EmployeeService`, `NomineeService`, `AuthService`, `ReportsService`, etc.) are untested.

## Test Types Present

| Type | Present | Location |
|------|---------|----------|
| Unit (service layer) | Yes | `src/backend/src/__tests__/unit/services/` |
| Integration | No | — |
| E2E | No | — |
| Component tests (frontend) | No | — |
| API/HTTP tests | No | — |

## Testing Tools

**Backend:**
- **Test runner:** Jest 29.7.0 — config at `src/backend/jest.config.js`
- **TypeScript transformer:** ts-jest 29.1.2 (`preset: 'ts-jest'`)
- **Mocking library:** jest-mock-extended 3.0.5 — used for deep mocking of `PrismaClient`
- **Assertion library:** Jest built-in (`expect`)
- **HTTP testing:** supertest 6.3.4 (installed but not currently used in any test file)

**Frontend:**
- No testing framework installed or configured

## Test File Organization

**Location:** Co-located under `src/backend/src/__tests__/` (separate from source, not co-located per file)

**Directory structure:**
```
src/backend/src/__tests__/
├── setup/
│   └── prisma-mock.ts        # Shared Prisma mock factory
└── unit/
    └── services/
        └── PayrollService.test.ts   # Only test file
```

**Jest config (`src/backend/jest.config.js`):**
- `roots`: `['<rootDir>/src']`
- `testMatch`: `['**/__tests__/**/*.test.ts']`
- Coverage collected from `src/**/*.ts`, excluding `*.d.ts` and `src/index.ts`
- `testEnvironment`: `node`
- `testTimeout`: 10000ms
- `clearMocks`, `resetMocks`, `restoreMocks`: all `true` (full mock isolation per test)
- Coverage reports: `text`, `lcov`, `html` → output to `src/backend/coverage/`

## Test Patterns

**Suite structure using Arrange/Act/Assert:**
```typescript
describe('PayrollService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayroll', () => {
    it('should create a payroll successfully with valid data', async () => {
      // Arrange
      const payrollData: Payroll = { ... };
      prismaMock.vpg_payrolls.create.mockResolvedValue(mockCreatedPayroll);

      // Act
      const result = await PayrollService.createPayroll(payrollData);

      // Assert
      expect(result).toEqual({ ... });
      expect(prismaMock.vpg_payrolls.create).toHaveBeenCalledWith({ ... });
      expect(prismaMock.vpg_payrolls.create).toHaveBeenCalledTimes(1);
    });
  });
});
```

**Test grouping pattern:**
- Top-level `describe` by class name (e.g., `PayrollService`)
- Nested `describe` per method (e.g., `createPayroll`, `getAllPayrolls`)
- A final `describe('Edge Cases and Validation', ...)` block for boundary tests
- Test names follow `should [expected outcome] [given condition]`

**Async testing:**
```typescript
// Happy path
const result = await ServiceClass.method(input);
expect(result).toEqual(expected);

// Error path
await expect(ServiceClass.method(input)).rejects.toThrow('Error message');
```

## Mocking

**Framework:** `jest-mock-extended` (`mockDeep<PrismaClient>()`)

**Pattern used in test files:**
```typescript
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

const prismaMock = mockDeep<PrismaClient>();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock),
}));

// In tests:
prismaMock.vpg_payrolls.create.mockResolvedValue(mockDbRecord);
prismaMock.vpg_payrolls.findMany.mockRejectedValue(new Error('DB error'));
```

**Shared setup file:** `src/backend/src/__tests__/setup/prisma-mock.ts` provides a reusable `prismaMock` export and a global `beforeEach(() => mockReset(prismaMock))`. The current test file replicates this setup inline rather than importing from the shared file.

**What is mocked:**
- `PrismaClient` — all database interactions mocked via `jest.mock('@prisma/client')`
- No network calls, no filesystem I/O

**What is NOT mocked:**
- Internal service logic — the real `PayrollService` code is executed

## Fixtures and Factories

No dedicated factory helpers or fixture files exist. Test data is defined inline as object literals within each test case:

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
```

Mock DB return values are also defined inline per test.

## Coverage

**Enforced requirements:** None — no coverage thresholds configured in `jest.config.js`

**Actual coverage:** Extremely low. Only `PayrollService` has tests, covering:
- `createPayroll` (3 test cases)
- `getAllPayrolls` (4 test cases)
- Edge cases (2 test cases)

Untested methods in `PayrollService` alone: `getPayrollById`, `updatePayroll`, `getPayrollEmployees`

**Entirely untested files:**
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
- All controllers (`src/backend/src/controller/`)
- All middleware (`src/backend/src/middleware/`)
- All utility functions (`src/backend/src/utils/payrollUtils.ts`)
- Entire frontend (`src/frontend/`)

## Running Tests

```bash
# From src/backend/
npm test                  # Run all tests once
npm run test:watch        # Watch mode (re-runs on file change)
npm run test:coverage     # Run with coverage report → src/backend/coverage/
```

Coverage HTML report is generated at `src/backend/coverage/index.html`.

---

*Testing analysis: 2026-03-25*
