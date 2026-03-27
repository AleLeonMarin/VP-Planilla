# Codebase Concerns

**Analysis Date:** 2026-03-26

---

## Status of CLAUDE.md Known Debt Items

| # | Item | Status |
|---|------|--------|
| 1 | Auth gap — 13/16 routes unprotected | **RESOLVED** — all 16 route files now apply `AuthMiddleware.verifyToken` |
| 2 | Multiple `new PrismaClient()` instances | **PARTIALLY RESOLVED** — 1 stray instance remains (see Tech Debt) |
| 3 | `PayrollService` bad `import { error } from 'console'` | **RESOLVED** — `PayrollService.ts` uses prisma singleton with no console import |
| 4 | No backend input validation | **PARTIALLY RESOLVED** — `validateBody` exists and is applied to employee, deduction, payroll, clock-log bulk, and user-permission routes; 8 mutation routes still have no validation |
| 5 | Wildcard CORS | **RESOLVED** — `cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') })` in `src/backend/src/index.ts:33` |
| 6 | JWT fallback secret | **RESOLVED** — startup assertion at `src/backend/src/index.ts:24-27`; `process.exit(1)` if `JWT_SECRET` is unset |
| 7 | `bcrypt@6.0.0` pre-release | **STILL OPEN** — `"bcrypt": "^6.0.0"` in `src/backend/package.json:20` |
| 8 | Credentials in query params | **RESOLVED** — `AuthController.login` reads only `req.body` |
| 9 | `@prisma/client` in devDependencies | **STILL OPEN** — `@prisma/client` is under `devDependencies` in `src/backend/package.json:33` |

---

## Tech Debt

**Stray `new PrismaClient()` in ClockLogsController:**
- Issue: `ClockLogsController.ts` instantiates its own Prisma client at module scope, bypassing the singleton. This creates a second connection pool that is never closed.
- Files: `src/backend/src/controller/ClockLogsController.ts:5`
- Impact: Extra idle DB connections; the query-log counter in `src/backend/src/lib/prisma.ts` under-counts actual queries from this controller.
- Fix approach: Replace `const prisma = new PrismaClient()` with `import { prisma } from '../lib/prisma'`.

**`@prisma/client` in devDependencies:**
- Issue: `@prisma/client` is listed under `devDependencies`. A production `npm install --production` omits it, causing a runtime import failure.
- Files: `src/backend/package.json:33`
- Impact: Application cannot start in any production deployment that strips devDependencies.
- Fix approach: Move `"@prisma/client": "^6.14.0"` to `dependencies`.

**`bcrypt@6.0.0` pre-release in production:**
- Issue: `^6.0.0` accepts all future 6.x releases automatically; bcrypt 6 is still pre-release with no stable API guarantee.
- Files: `src/backend/package.json:20`
- Impact: Risk of unexpected behaviour in password hashing and comparison after an upstream bcrypt release.
- Fix approach: Pin to `"bcrypt": "^5.1.1"` (latest stable) or lock to an exact pre-release version.

**Missing Zod validation on 8 mutation routes:**
- Issue: `validateBody` middleware is applied only to employee, deduction, payroll, clock-log bulk, and user-permission routes. The following routes accept unvalidated POST/PUT bodies.
- Files (unvalidated): `src/backend/src/routes/BonusesRoute.ts:67,149`, `src/backend/src/routes/VacationRoute.ts:63,166`, `src/backend/src/routes/LaborEventsRoute.ts:54,121,194`, `src/backend/src/routes/PositionRoute.ts:51,148`, `src/backend/src/routes/PayrollTypeRoute.ts:54,100`, `src/backend/src/routes/EmployeeDeductionsRoute.ts`
- Impact: Malformed payloads reach controllers and may cause unhandled Prisma errors or persist corrupt data.
- Fix approach: Add Zod schemas in `src/backend/src/schemas/` for each entity and wire `validateBody` on each POST/PUT handler.

**`NomineeController` instantiates `NomineeService` on every request:**
- Issue: All four `NomineeController` handlers call `new NomineeService()` inside the handler body, contradicting the codebase convention of static-method classes with no instantiation.
- Files: `src/backend/src/controller/NomineeController.ts:11,40,62,116`
- Impact: Minor correctness issue — NomineeService holds no state so behaviour is unaffected — but violates architecture conventions.
- Fix approach: Convert `NomineeService` to a static-method class consistent with `PayrollService`, `EmployeeService`, and others. Phase 5 backlog.

**`NomineeService.savePayrollEmployees` runs without a database transaction:**
- Issue: The method loops over all employees and performs per-employee upserts on `vpg_payroll_employee` and `vpg_employee_deductions`. If the process crashes mid-loop, the database is left in a partially-saved state.
- Files: `src/backend/src/service/NomineeService.ts:166-266`
- Impact: Partial payroll saves produce incorrect aggregate totals visible in the payroll list page and any CCSS/Hacienda reports derived from saved data.
- Fix approach: Wrap the loop in `prisma.$transaction(async (tx) => { ... })`.

**Pervasive `any` types in `NomineeService`:**
- Issue: `calculateEmployeePayroll`, `processDailyWork`, and `calculateDailyHours` accept `any` / `any[]` for all domain objects (employees, clock logs, vacations, labor events, bonuses, deductions).
- Files: `src/backend/src/service/NomineeService.ts:418-426, 595-597, 702-703`
- Impact: TypeScript provides no safety on the most complex, payroll-critical code path. Field renames from Prisma schema changes will not be caught at compile time.
- Fix approach: Define typed interfaces in `src/backend/src/model/` for each Prisma row shape and replace `any` with those types.

---

## Security Considerations

**Plaintext password comparison still enabled:**
- Risk: `AuthService.verifyPassword` silently falls back to `inputPassword === storedPassword` when the stored value is not a bcrypt hash. Any user seeded with a plaintext password can authenticate without a hash.
- Files: `src/backend/src/service/AuthService.ts:117-135`
- Current mitigation: None — the code path executes with only a `console.log('Using plain text verification')` and no warning to the caller.
- Recommendations: Remove the plaintext branch entirely. Add a migration script to bcrypt-hash any existing plaintext rows before deploying the removal.

**`updateLastLogin` is a no-op stub:**
- Risk: Login timestamps are never persisted. There is no way to detect credential-stuffing patterns or audit when users last authenticated.
- Files: `src/backend/src/service/AuthService.ts:281-287`
- Current mitigation: None — the method body only calls `console.log`.
- Recommendations: Implement the DB write using `prisma.vpg_users.update`. Requires a schema migration if `user_last_login` column is absent. Phase 5 backlog.

**No rate limiting on login endpoint:**
- Risk: `POST /api/login` is publicly accessible with no request-rate control, leaving it open to brute-force and credential-stuffing attacks.
- Files: `src/backend/src/routes/AuthRoute.ts:55`, `src/backend/src/index.ts`
- Current mitigation: None.
- Recommendations: Apply `express-rate-limit` (e.g. 10 attempts per 15 minutes per IP) scoped to auth routes. Phase 7 backlog.

**No security headers (helmet missing):**
- Risk: API responses carry no `X-Content-Type-Options`, `Strict-Transport-Security`, `X-Frame-Options`, or `Content-Security-Policy` headers.
- Files: `src/backend/src/index.ts`
- Current mitigation: None.
- Recommendations: `app.use(helmet())` at server startup. Phase 7 backlog.

**No token revocation on logout:**
- Risk: `POST /api/logout` returns 200 but performs no server-side action. A stolen access token remains valid for its full 24-hour TTL after the user logs out.
- Files: `src/backend/src/controller/AuthController.ts:129-145`
- Current mitigation: None — code comment acknowledges the gap but no short-TTL + refresh-token strategy is in place.
- Recommendations: Shorten access-token TTL to 15 minutes and implement the refresh-token flow (currently stubbed at `AuthController.refreshToken`), or maintain a token-revocation table keyed by `jti`. Phase 7 backlog.

**Verbose query logging enabled in all environments:**
- Risk: The singleton Prisma client logs every SQL query to `console.log` unconditionally. In production this leaks partial query structure to log aggregators and adds unnecessary I/O.
- Files: `src/backend/src/lib/prisma.ts:4-13`
- Current mitigation: None — no environment check before registering the `query` event listener.
- Recommendations: Gate behind `if (process.env.NODE_ENV !== 'production')` or remove; the query counter export can remain for debugging.

---

## Domain Correctness Issues

**Costa Rica national holidays not excluded from working-day count:**
- Problem: `countWorkingDaysInPeriod` and `calculateScheduledHours` exclude only Sundays (`getDay() !== 0`). Costa Rica has 12 statutory public holidays that are not regular working days.
- Files: `src/backend/src/utils/payrollUtils.ts:306-321`
- Impact: Scheduled hours are over-counted for any period containing a national holiday. An employee working that period shows a deficit against scheduled hours, potentially suppressing legitimate overtime.
- Fix approach: Add a `CR_NATIONAL_HOLIDAYS` constant (array of `MM-DD` strings representing fixed-date holidays) and subtract matching calendar dates in `countWorkingDaysInPeriod`. Moveable dates (Holy Thursday/Friday) require year-calculation logic. Phase 6 backlog.

**Audit logs are written by only one service:**
- Problem: The `vpg_audit_logs` table and read-capable `AuditLogsService` exist, but only `UserService.updatePermissions` at line 150 ever writes a log entry. All other mutation operations — employee create/update/dismiss, payroll creation, vacation approval, deduction changes, clock-log bulk import — produce no audit trail.
- Files: `src/backend/src/service/AuditLogsService.ts` (read-only in practice), `src/backend/src/service/UserService.ts:150` (sole writer)
- Impact: The audit log UI page shows near-empty results. Compliance with CCSS and Ministerio de Hacienda may require a full mutation audit trail.
- Fix approach: Add a `static async writeLog(userId, action, entity, entityId, details)` method to `AuditLogsService` and call it from `EmployeeService`, `PayrollService`, `VacationService`, and `NomineeService.savePayrollEmployees`. Phase 5 backlog.

---

## Fragile Areas

**Legacy `POST /api/nominee/calculate` route:**
- Files: `src/backend/src/routes/NomineeRoute.ts:97`, `src/backend/src/service/NomineeService.ts:107-158`
- Why fragile: The legacy `calculateNominee()` method uses a hardcoded salary of `1000` for percentage-deduction math. The frontend `NomineeService.calculateNominee()` client method at `src/frontend/src/services/nomineeService.ts:36-42` still exists and will call this endpoint if invoked. Any accidental invocation produces completely incorrect deduction figures with no error.
- Safe modification: Do not call this endpoint from any UI. Remove `NomineeService.calculateNominee()` from the frontend service once confirmed unused across all pages.
- Test coverage: None.

**`AuthController.refreshToken` and `changePassword` are stubs returning 200:**
- Files: `src/backend/src/controller/AuthController.ts:201-213, 220-233`
- Why fragile: Both endpoints are registered, protected by `verifyToken`, and return `{ success: true, message: "...pendiente implementar" }` for any valid input. Any frontend code relying on these endpoints for real behaviour will silently succeed with no effect.
- Safe modification: Do not call from production UI until implemented. Phase 5/future backlog.

---

## Test Coverage Gaps

**`NomineeService` — zero test coverage:**
- What's not tested: `calculatePayrollForPeriod`, `calculateEmployeePayroll`, `processDailyWork`, `calculateDailyHours`, `savePayrollEmployees`, all six `preload*` static methods.
- Files: `src/backend/src/service/NomineeService.ts` (889 lines, no test file)
- Risk: Any regression in overtime calculation, vacation-day handling, labor-event exclusion, or weekly-rest computation goes undetected. This is the highest-risk service because errors directly affect employee pay.
- Priority: **High** — Phase 8 backlog.

**`payrollUtils.ts` — zero test coverage:**
- What's not tested: `calculateOvertimeHoursBiweekly`, `calculateWeeklyRestHours`, `validateClockLogPairs`, `hasOverlappingPairs`, `countWorkingDaysInPeriod`, `calculateScheduledHours`.
- Files: `src/backend/src/utils/payrollUtils.ts`
- Risk: Pure-function math errors in Costa Rica labor law calculations go undetected. These are the easiest functions in the codebase to unit-test.
- Priority: **High** — Phase 8 backlog.

**Only one test file exists for the entire backend:**
- What's not tested: All controllers, all services except `PayrollService` (partial — create + getAll only), all middleware, all route handlers.
- Files: `src/backend/src/__tests__/unit/services/PayrollService.test.ts` (sole test file)
- Risk: Near-zero regression safety for any refactor.
- Priority: **Medium** — grow incrementally; prioritise `NomineeService` and `payrollUtils`.

---

## Performance Bottlenecks

**`preloadVacations` fetches all historical paid vacations with no date filter:**
- Problem: `NomineeService.preloadVacations()` returns every `vpg_vacations` row where `vacations_paid = true` with no period date constraint.
- Files: `src/backend/src/service/NomineeService.ts:781-788`
- Cause: Missing date range predicate — contrast with `preloadLaborEvents` which filters by period dates.
- Improvement path: Add `vacations_end_date: { gte: startDate }` and `vacations_start_date: { lte: endDate }` predicates, consistent with the pattern used in `preloadLaborEvents` at line 790.

**Verbose Prisma query logging unconditionally writes to stdout:**
- Problem: Every SQL query emits a `console.log` via the `query` event listener on the singleton Prisma client. A payroll calculation for 100 employees triggers hundreds of log lines.
- Files: `src/backend/src/lib/prisma.ts:4-13`
- Cause: No environment check — listener fires in all environments.
- Improvement path: Gate behind `process.env.NODE_ENV !== 'production'`.

---

*Concerns audit: 2026-03-26*
