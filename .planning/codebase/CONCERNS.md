# Codebase Concerns

**Analysis Date:** 2026-03-26

---

## Security Issues

### JWT Fallback Secret in AuthService
- **Severity:** HIGH
- **Status:** PARTIAL — startup assertion fixed in `index.ts`, but `AuthService` still has fallback
- **Details:** `src/backend/src/index.ts` now calls `process.exit(1)` if `JWT_SECRET` is unset. However, `src/backend/src/service/AuthService.ts` lines 148 and 161 still contain `process.env.JWT_SECRET || 'your-default-secret-key'` in both `generateToken` and `verifyToken`. If `AuthService` methods are ever called outside the `index.ts` startup path (tests, scripts, imported modules), a known weak secret is used.
- **Files:** `src/backend/src/service/AuthService.ts` (lines 148, 161)
- **Fix:** Replace the fallback with `process.env.JWT_SECRET!` and let Node throw, or add a module-level assertion: `if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET must be set')`.

### CORS — ALLOWED_ORIGINS Not Set by Default
- **Severity:** HIGH
- **Status:** PARTIAL — no longer wildcard `cors()`, but silently permissive when env var is absent
- **Details:** `src/backend/src/index.ts` line 33 uses `cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') })`. When `ALLOWED_ORIGINS` is undefined, the optional chain returns `undefined`, and `cors` with `origin: undefined` allows all origins — functionally identical to the old `cors()` wildcard.
- **Files:** `src/backend/src/index.ts` (line 33)
- **Fix:** Add a startup guard: `if (!process.env.ALLOWED_ORIGINS) { console.error('FATAL: ALLOWED_ORIGINS not set'); process.exit(1); }` before the `cors()` call, or default to a safe restrictive value in non-development.

### Unprotected API Documentation Endpoints
- **Severity:** MEDIUM
- **Status:** OPEN
- **Details:** `/api/docs/swagger.json` and `/api/docs` (Scalar UI) are mounted in `src/backend/src/index.ts` without any authentication middleware. These expose the full API surface — all routes, request/response shapes, and field names — to unauthenticated callers. `/health` and `/` (root) are also public.
- **Files:** `src/backend/src/index.ts` (lines 73–88)
- **Fix:** Wrap `/api/docs` routes with `AuthMiddleware.verifyToken` or restrict them to non-production environments via `process.env.NODE_ENV`.

### No Rate Limiting on Login or Any Endpoint
- **Severity:** HIGH
- **Status:** OPEN
- **Details:** No rate-limiting middleware (`express-rate-limit` or equivalent) is installed. The `/api/login` endpoint is completely unbounded, enabling brute-force credential attacks. No other endpoint is throttled either.
- **Files:** `src/backend/src/routes/AuthRoute.ts` (line 55), `src/backend/src/index.ts`
- **Fix:** Install `express-rate-limit`, apply a strict limiter (`max: 10, windowMs: 15 * 60 * 1000`) to `/api/login`, and a general limiter to all `/api/*` routes.

### No Security Headers (Helmet)
- **Severity:** MEDIUM
- **Status:** OPEN
- **Details:** No `helmet` or equivalent middleware is applied in `src/backend/src/index.ts`. The API returns no `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, or `Strict-Transport-Security` headers.
- **Files:** `src/backend/src/index.ts`
- **Fix:** Install `helmet` and add `app.use(helmet())` before route registration.

### Credentials Read from `req.query` (Historical)
- **Severity:** HIGH
- **Status:** FIXED — `src/backend/src/controller/AuthController.ts` now reads only `req.body.username` and `req.body.password`. No `req.query` fallback exists.
- **Files:** `src/backend/src/controller/AuthController.ts`

---

## Authentication / Authorization Issues

### Auth Gap: Router-Level vs Per-Route `verifyToken`
- **Severity:** MEDIUM
- **Status:** PARTIAL — all 16 route files now apply `AuthMiddleware.verifyToken`; the original 13/16 gap is closed. However two files apply it per-route rather than with `router.use()`:
  - `src/backend/src/routes/AuthRoute.ts` — intentional for public endpoints (`/login`, `/logout`, `/refresh`, `/validate`); private routes protect themselves per-route.
  - `src/backend/src/routes/UserRoute.ts` — applies `verifyToken` per-route, meaning any new route added to this file could miss it.
- **Files:** `src/backend/src/routes/UserRoute.ts`, `src/backend/src/routes/AuthRoute.ts`
- **Fix:** For `UserRoute.ts`, switch to `router.use(asyncHandler(AuthMiddleware.verifyToken))` at the top to make auth opt-out rather than opt-in. Document intentional public endpoints explicitly in `AuthRoute.ts`.

### Refresh Token Endpoint Not Implemented
- **Severity:** MEDIUM
- **Status:** OPEN
- **Details:** `POST /api/refresh` is registered and documented in Swagger but `AuthController.refreshToken` returns a 200 with the placeholder message `'Refresh token funcionando (pendiente implementar)'`. The frontend `src/frontend/src/services/authService.ts` calls this endpoint and handles the response — clients silently receive a success with no new token issued.
- **Files:** `src/backend/src/controller/AuthController.ts` (lines 201–213), `src/backend/src/routes/AuthRoute.ts` (line 193), `src/frontend/src/services/authService.ts` (lines 60–71)
- **Fix:** Implement `AuthService.generateRefreshToken()` and `AuthService.verifyRefreshToken()`, then complete the controller method. Store refresh tokens in the DB or a Redis cache.

### Change Password Endpoint Not Implemented
- **Severity:** LOW
- **Status:** OPEN
- **Details:** `POST /api/change-password` returns a placeholder 200. The frontend `authService.ts` calls it.
- **Files:** `src/backend/src/controller/AuthController.ts` (lines 220–233)
- **Fix:** Implement: verify current password, hash new password with bcrypt, update `vpg_users.user_password`.

---

## Performance Concerns

### Multiple PrismaClient Instances (Resolved in Services, Remaining in Controller)
- **Severity:** HIGH
- **Status:** PARTIAL — all 16 service files now import the singleton `{ prisma }` from `../lib/prisma`. One violation remains:
  - `src/backend/src/controller/ClockLogsController.ts` (line 5): `const prisma = new PrismaClient()` — creates a new connection pool on every server start.
  - `src/backend/src/scripts/seedDeductions.ts` (line 3): acceptable in a standalone script.
- **Files:** `src/backend/src/controller/ClockLogsController.ts` (line 5)
- **Fix:** Replace `const prisma = new PrismaClient()` with `import { prisma } from '../lib/prisma'`.

### NomineeService and ClockLogsService Use Instance Methods (Not Static)
- **Severity:** MEDIUM
- **Status:** OPEN
- **Details:** Both services define instance methods (no `static` keyword), contradicting the project convention. `NomineeController` calls `new NomineeService()` four times (lines 11, 40, 62, 116), and `ClockLogsController` calls `new ClockLogsService()` twice per request (lines 71, 133). Each instantiation is throwaway — no state is preserved.
- **Files:** `src/backend/src/service/NomineeService.ts`, `src/backend/src/service/ClockLogsService.ts`, `src/backend/src/controller/NomineeController.ts`, `src/backend/src/controller/ClockLogsController.ts`
- **Fix:** Convert all methods in both services to `static`. Update callers to use `NomineeService.methodName()` and `ClockLogsService.methodName()` directly.

### NomineeService and ReportsService Are Oversized
- **Severity:** MEDIUM
- **Status:** OPEN
- **Details:** `src/backend/src/service/NomineeService.ts` is 867 lines and `src/backend/src/service/ReportsService.ts` is 895 lines. Both mix multiple business concerns, making isolated testing and modification difficult.
- **Files:** `src/backend/src/service/NomineeService.ts`, `src/backend/src/service/ReportsService.ts`
- **Fix:** Extract sub-responsibilities into focused helper services or utility modules. Candidate extractions: payroll calculation logic → `PayrollCalculationService`, deduction calculation → `DeductionCalculationService`, CCSS report generation → `CCSReportService`.

### ClockLogs Bulk Import Does Full Employee Table Scan Per Row
- **Severity:** MEDIUM
- **Status:** OPEN
- **Details:** `resolveEmployeeId()` in `src/backend/src/controller/ClockLogsController.ts` calls `prisma.vpg_employees.findMany()` for every log entry that lacks a numeric `employee_id`. For a bulk import of N entries without IDs, this issues N full table scans.
- **Files:** `src/backend/src/controller/ClockLogsController.ts` (lines 16–53, 100–116)
- **Fix:** Load the full active employee list once before the `for...of` loop, then perform name matching against the in-memory array. Move this logic into `ClockLogsService`.

---

## Code Quality Issues

### `@prisma/client` in `devDependencies`
- **Severity:** HIGH
- **Status:** OPEN
- **Details:** `src/backend/package.json` lists `@prisma/client: "^6.14.0"` under `devDependencies`. Production deployments that skip dev dependencies (`npm install --production`) will fail at runtime because `@prisma/client` is the generated ORM client required at runtime.
- **Files:** `src/backend/package.json`
- **Fix:** Move `@prisma/client` from `devDependencies` to `dependencies`.

### `bcrypt@6.0.0` Pre-Release
- **Severity:** MEDIUM
- **Status:** OPEN
- **Details:** `src/backend/package.json` depends on `bcrypt: "^6.0.0"`. Version 6.x is pre-release with native binding changes. The stable production-recommended version is `bcrypt@^5.1.1`.
- **Files:** `src/backend/package.json`
- **Fix:** Downgrade to `bcrypt@^5.1.1` or replace with the pure-JS `bcryptjs@^2.4.3`.

### `any` Types in Controllers
- **Severity:** MEDIUM
- **Status:** OPEN
- **Details:** 13 uses of `: any`, `as any`, or `any[]` exist across controller files:
  - `src/backend/src/controller/ClockLogsController.ts` (lines 17–18): function parameters `employee_id: any, employee_name: any`
  - `src/backend/src/controller/AuditLogsController.ts` (line 11): `const filters: any = {}`
  - `src/backend/src/controller/ReportsController.ts` (line 76): `.map((value: any) => Number(value))`
  - `src/backend/src/controller/EmployeeDeductionsController.ts`, `LaborEventsController.ts`, `PaymentReceiptController.ts`, `UserController.ts`: various `error: any` catch clauses
- **Fix:** Define proper TypeScript interfaces. Start with `ClockLogsController.resolveEmployeeId` and `AuditLogsController` filters.

### Business Logic in ClockLogsController (Layer Violation)
- **Severity:** MEDIUM
- **Status:** OPEN
- **Details:** `src/backend/src/controller/ClockLogsController.ts` contains `normalizeName()` and `resolveEmployeeId()` — functions that perform business logic (fuzzy employee name matching and DB queries) directly in a controller file. These belong in `ClockLogsService`. The controller also instantiates its own `PrismaClient` to execute these queries.
- **Files:** `src/backend/src/controller/ClockLogsController.ts`
- **Fix:** Move `normalizeName` and `resolveEmployeeId` into `ClockLogsService` as a static method. Remove the direct Prisma instantiation from the controller.

### NomineeService Mixes Service and Controller Responsibilities
- **Severity:** MEDIUM
- **Status:** OPEN
- **Details:** `src/backend/src/service/NomineeService.ts` line 41 defines `async getClockLogs(req: Request, res: Response): Promise<Response>` — a method that accepts Express `Request`/`Response` objects and writes the HTTP response directly. Services must never interact with `req`/`res`. `NomineeController` calls `nomineeService.getClockLogs(req, res)` passing through HTTP objects.
- **Files:** `src/backend/src/service/NomineeService.ts` (line 41), `src/backend/src/controller/NomineeController.ts` (line 11)
- **Fix:** Refactor `NomineeService.getClockLogs` to accept typed parameters (e.g., `initDate: Date, endDate: Date`) and return data. Move `req`/`res` parsing back into the controller.

### Dead / Unreachable Code in ClockLogsController
- **Severity:** LOW
- **Status:** OPEN
- **Details:** `src/backend/src/controller/ClockLogsController.ts` lines 65–83: `let nomineeLogs` is declared, but `return res.json(logs)` at line 77 executes before `nomineeLogs = logs` at line 78. The assignment is unreachable and the variable is never used.
- **Files:** `src/backend/src/controller/ClockLogsController.ts` (lines 65, 77–78)
- **Fix:** Remove the `let nomineeLogs` declaration and the unreachable assignment.

### Excessive `console.log` in Production Code
- **Severity:** LOW
- **Status:** OPEN
- **Details:** 119 `console.log` / `console.error` statements exist across the backend with no log-level abstraction. Login attempts log the username (`AuthController.ts` lines 17–19). Sensitive operational details are mixed with debug output.
- **Files:** `src/backend/src/controller/AuthController.ts` (lines 17–48), `src/backend/src/index.ts` (line 36), throughout `src/backend/src/controller/`
- **Fix:** Introduce a structured logger (`pino` or `winston`) with configurable log levels. Gate verbose logs behind `process.env.NODE_ENV === 'development'`.

### Frontend Services Bypass `http.ts` Central Client
- **Severity:** MEDIUM
- **Status:** OPEN
- **Details:** Three frontend services use raw `fetch` instead of the central `http.ts` client, bypassing token injection, refresh logic, and error normalization:
  - `src/frontend/src/services/auditLogsService.ts` — all methods use raw `fetch` with no `Authorization` header sent
  - `src/frontend/src/services/branchService.ts` — all CRUD methods use raw `fetch` with no `Authorization` header sent
  - `src/frontend/src/services/authService.ts` — intentional for auth flows, acceptable but should be documented
- **Files:** `src/frontend/src/services/auditLogsService.ts`, `src/frontend/src/services/branchService.ts`
- **Fix:** Migrate `auditLogsService.ts` and `branchService.ts` to use `http.ts` methods. The `auditLogsService.ts` bypass means audit log requests are also sent unauthenticated.

### Frontend Pages Manage Data State Directly Instead of Through Hooks
- **Severity:** LOW
- **Status:** OPEN
- **Details:** Several pages hold API data in raw `useState` and call services inline, violating the Page → Hook → Service rule:
  - `src/frontend/src/app/pages/attendance/page.tsx` (1091 lines) — `useState<AttendanceData[]>`, `useState<Employee[]>`, fetch logic inline
  - `src/frontend/src/app/pages/payroll/list/page.tsx` — `useState<Payroll[]>` with inline fetch
  - `src/frontend/src/app/pages/users/page.tsx` — `useState<UserAccountSummary[]>`, `useState<RoleDefinition[]>` with inline fetch
  - `src/frontend/src/app/pages/vacations/create/page.tsx` — `useState<Employee[]>` with inline fetch
- **Fix:** Extract data-fetching into dedicated hooks with `{ data, isLoading, error, ...actions }` return shape. The attendance page (1091 lines) is highest priority.

---

## Missing Functionality

### Branches Backend Does Not Exist
- **Severity:** HIGH
- **Status:** OPEN
- **Details:** A complete Branches frontend feature exists — `src/frontend/src/app/pages/branches/list/page.tsx`, `src/frontend/src/hooks/useBranches.ts`, `src/frontend/src/services/branchService.ts`, `src/frontend/src/types/branch.ts` — calling `GET/POST/PUT/DELETE /api/branches`. No backend route, controller, or service for branches exists at all. The `vpg_branches` table is defined in `src/backend/prisma/schema.prisma`.
- **Files:** `src/frontend/src/services/branchService.ts`, `src/backend/prisma/schema.prisma` (model `vpg_branches`)
- **Fix:** Implement `src/backend/src/routes/BranchesRoute.ts`, `src/backend/src/controller/BranchesController.ts`, `src/backend/src/service/BranchesService.ts` following the standard layer pattern.

### Attendance Records Are Hardcoded Mock Data
- **Severity:** LOW
- **Status:** OPEN
- **Details:** `src/frontend/src/hooks/useEmployeeTable.ts` `getSampleAttendanceRecords()` (line 84) returns a hardcoded array of 10 rows. A TODO at line 82 reads: "Reemplazar con datos reales de la base de datos". The function is consumed by the employee profile modal.
- **Files:** `src/frontend/src/hooks/useEmployeeTable.ts` (lines 82–95)
- **Fix:** Replace with a hook or service call to `/api/clock-logs` filtered by employee ID and date range.

---

## Test Coverage Gaps

### Only One Service Has Unit Tests
- **Severity:** HIGH
- **Status:** OPEN
- **Details:** The only test file is `src/backend/src/__tests__/unit/services/PayrollService.test.ts`. All other services — including the highest-risk ones (`NomineeService`, `ReportsService`, `AuthService`, `payrollUtils`) — have zero automated test coverage.
- **Files:** `src/backend/src/__tests__/unit/services/PayrollService.test.ts`
- **Risk:** Payroll calculation bugs (OT rates, CCSS deductions, vacation accrual) go undetected. Changes to `NomineeService.calculatePayrollForPeriod` have no safety net.
- **Priority:** HIGH — start with `src/backend/src/utils/payrollUtils.ts` (pure functions, easy to test in isolation) and `src/backend/src/service/AuthService.ts`.

### No Integration or End-to-End Tests
- **Severity:** MEDIUM
- **Status:** OPEN
- **Details:** No supertest-based integration tests for the Express router exist. No frontend E2E tests (Playwright/Cypress) are present.
- **Fix:** Add supertest integration tests for at minimum the auth flow (`/api/login`, `/api/me`) and the payroll calculation endpoints.

---

## Dependencies at Risk

| Package | Location | Version | Risk | Action |
|---|---|---|---|---|
| `bcrypt` | `src/backend/package.json` | `^6.0.0` | Pre-release; unstable native bindings | Downgrade to `^5.1.1` or switch to `bcryptjs` |
| `@prisma/client` | `src/backend/package.json` | `^6.14.0` in `devDependencies` | Missing from production bundle | Move to `dependencies` |
| `puppeteer` | `src/backend/package.json` | `^24.37.5` | Downloads ~300MB Chromium at install; bloats CI and Docker images | Use `puppeteer-core` + explicit Chromium binary path |

---

## Known Fixed Issues (Verified in Current Code)

These items appeared in historical documentation but are confirmed resolved:

| Issue | Status | Evidence |
|---|---|---|
| Multiple PrismaClient in services | FIXED | All 16 service files use `import { prisma } from '../lib/prisma'` |
| `import { error } from 'console'` in PayrollService | FIXED | `PayrollService.ts` uses `throw new Error(...)` correctly |
| Credentials in query params (AuthController) | FIXED | Only `req.body.username` / `req.body.password` used |
| Auth gap: 13/16 routes without verifyToken | FIXED | All 16 route files apply `AuthMiddleware.verifyToken` |

---

*Concerns audit: 2026-03-26*
