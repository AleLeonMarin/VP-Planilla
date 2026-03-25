# Codebase Concerns

**Analysis Date:** 2026-03-25

---

## Critical Issues

### Authentication Gap — Most API Routes Have No Auth Middleware
- **Issue:** Only 3 of 16 route files apply `AuthMiddleware.verifyToken`. The other 13 route files (`EmployeeRoute.ts`, `PayrollRoutes.ts`, `BonusesRoute.ts`, `ClockLogsRoute.ts`, `DeductionsRoute.ts`, `EmployeeDeductionsRoute.ts`, `LaborEventsRoute.ts`, `NomineeRoute.ts`, `PaymentReceiptRoute.ts`, `PayrollTypeRoute.ts`, `PositionRoute.ts`, `VacationRoute.ts`, `AuditLogsRoute.ts`) expose all their endpoints to unauthenticated callers.
- **Files:** `src/backend/src/routes/EmployeeRoute.ts`, `src/backend/src/routes/PayrollRoutes.ts`, and all remaining route files except `ReportsRoute.ts` and `UserRoute.ts`.
- **Impact:** Any actor with network access can read/write all employee records, payroll data, deductions, bonuses, clock logs, and audit logs without logging in. This is a critical data-integrity and privacy risk for a payroll system.
- **Fix approach:** Add `asyncHandler(AuthMiddleware.verifyToken)` to every router or register a global `app.use(AuthMiddleware.verifyToken)` before the `/api` routes (with an allow-list for `/api/login`, `/api/validate`, `/health`).

### Plain-Text Password Support in AuthService
- **Issue:** `AuthService.verifyPassword()` detects whether the stored password is a bcrypt hash and, if it is not, falls back to direct string equality comparison. This means any user whose password was saved as plain text can log in without hashing.
- **File:** `src/backend/src/service/AuthService.ts` lines 119–138
- **Impact:** Plain-text passwords in the database are exposed if the DB is compromised. The fallback comparison also prevents the system from enforcing bcrypt for all accounts.
- **Fix approach:** Remove the plain-text fallback. Run a one-time migration to hash any legacy plain-text passwords before dropping the branch.

### SMTP Password Stored Plain Text in Database
- **Issue:** `vpg_mail_server_settings.mail_server_settings_password` is a `VarChar(255)` column with no indication of encryption. `ReportsService` reads it directly and passes it to `nodemailer`.
- **Files:** `src/backend/prisma/schema.prisma` line 186, `src/backend/src/service/ReportsService.ts` lines 773–791.
- **Impact:** Anyone with DB read access can extract the SMTP credentials.
- **Fix approach:** Prefer env-var configuration (`REPORTS_SMTP_PASS`) over DB storage. If DB storage is required, encrypt the value before persisting and decrypt at runtime using an application-level secret.

### JWT Secret Falls Back to Hardcoded Default
- **Issue:** `AuthService.generateToken()` and `AuthService.verifyToken()` both fall back to `'your-default-secret-key'` when `process.env.JWT_SECRET` is not set.
- **File:** `src/backend/src/service/AuthService.ts` lines 150 and 163.
- **Impact:** If the env var is unset in any environment, tokens signed with the default secret are trivially forgeable.
- **Fix approach:** Replace the fallback with a startup assertion that throws if `JWT_SECRET` is absent.

---

## Technical Debt

### Multiple PrismaClient Instances (Connection Pool Exhaustion)
- **Issue:** Every service file creates its own `new PrismaClient()` at module load time — 16 separate instances found. A singleton `prisma` is exported from `src/backend/src/lib/prisma.ts` but is ignored by all services except `NomineeService`.
- **Files:** `src/backend/src/service/AuthService.ts`, `src/backend/src/service/EmployeeService.ts`, `src/backend/src/service/PayrollService.ts`, and 13 more service files.
- **Impact:** Under load the database receives up to 16 × the connection pool limit. This can exhaust PostgreSQL max connections and cause request failures.
- **Fix approach:** Replace every `const prisma = new PrismaClient()` in service files with `import { prisma } from '../lib/prisma'`.

### Bad Import in PayrollService — `import { error } from 'console'`
- **Issue:** `PayrollService.ts` imports `error` from the Node `console` module and uses it in a throw expression: `throw error("Payroll not found")`. `console.error` returns `undefined`, so this `throw undefined` never produces a meaningful error object.
- **File:** `src/backend/src/service/PayrollService.ts` lines 3 and 134.
- **Impact:** When a payroll update targets a non-existent ID, the caller receives `throw undefined` instead of a real `Error`, making debugging and HTTP error handling incorrect.
- **Fix approach:** Remove the import and replace with `throw new Error('Payroll not found')`.

### Legacy `calculateNominee` Method Still Exposed as a Route
- **Issue:** `NomineeService.calculateNominee()` is marked `@deprecated` and uses a hardcoded salary of `1000` for percentage deduction calculations. It is still registered at `POST /api/nominee/calculate`.
- **Files:** `src/backend/src/service/NomineeService.ts` lines 108–163, `src/backend/src/routes/NomineeRoute.ts` line 94.
- **Impact:** Calling this route produces meaningless results. It also keeps dead code alive in production.
- **Fix approach:** Remove the route and delete `calculateNominee()`, or at minimum block the route from production builds.

### Excessive `any` Usage in Backend
- **Issue:** 85 occurrences of `any` type in backend TypeScript source files. Heavy use in `NomineeService.ts` (`employee: any`, `clockLogs: any[]`, `laborEvents: any[]`) and in controllers (`error: any`).
- **Files:** `src/backend/src/service/NomineeService.ts`, `src/backend/src/controller/*Controller.ts`.
- **Impact:** Type errors in payroll calculations are silenced at compile time. Regressions that should be caught by the type system pass undetected.
- **Fix approach:** Define proper interfaces for `Employee`, `ClockLog`, and `LaborEvent` in the payroll calculation path. Replace `error: any` with `error instanceof Error` guards.

### Temp / Debug Files Committed to Repo Root
- **Issue:** `parse_tmp.js`, `temp_script.py`, `test_hours.js`, `check_employee.ts`, and `query_emp.mjs` exist at the project root or in `src/backend/`.
- **Files:** `parse_tmp.js`, `temp_script.py`, `test_hours.js` (root), `src/backend/check_employee.ts`, `src/backend/query_emp.mjs`.
- **Impact:** These files may expose internal logic, DB queries, or credentials if the repo is shared. They bloat the repository and cause confusion.
- **Fix approach:** Delete all five files. Add patterns to `.gitignore` to prevent re-committing ad-hoc scripts.

---

## Missing Functionality

### No Input Validation on Backend Controllers
- **Issue:** No validation library (zod, joi, express-validator) is imported or used in any backend controller or route. Request bodies are consumed directly from `req.body` without schema validation.
- **Files:** All files in `src/backend/src/controller/`.
- **Impact:** Malformed requests (wrong types, missing required fields, oversized strings) reach the database layer directly, risking Prisma errors or unexpected behavior.
- **Fix approach:** Add zod schemas per route or use a shared `validate` middleware. The frontend already uses zod for forms; the same schemas can be shared or replicated on the backend.

### No Rate Limiting or Brute-Force Protection on Login
- **Issue:** `POST /api/login` has no rate limiting. `express-rate-limit` and `helmet` are absent from `package.json` and the middleware stack.
- **Files:** `src/backend/src/index.ts`, `src/backend/src/routes/AuthRoute.ts`.
- **Impact:** The login endpoint can be brute-forced indefinitely without any slowdown or lockout.
- **Fix approach:** Add `express-rate-limit` to the login route (e.g., 10 attempts per 15 minutes per IP) and add `helmet` to the global middleware stack.

### No Token Revocation / Logout Mechanism
- **Issue:** `POST /api/logout` calls `AuthController.logout` but JWT tokens are stateless — there is no blocklist or session store. A stolen token remains valid until its 24-hour expiry.
- **Files:** `src/backend/src/routes/AuthRoute.ts` line 109, `src/backend/src/service/AuthService.ts`.
- **Impact:** Logging out provides no real security guarantee.
- **Fix approach:** Implement a Redis-backed or DB-backed token blocklist checked in `AuthMiddleware.verifyToken`, or switch to short-lived access tokens (15 min) with refresh tokens.

### `updateLastLogin` Is a No-Op Stub
- **Issue:** `AuthService.updateLastLogin()` only logs to the console and does not update any database field. The schema has no `last_login` column.
- **File:** `src/backend/src/service/AuthService.ts` lines 283–289.
- **Impact:** Audit requirements for tracking user logins cannot be met.
- **Fix approach:** Either add a `last_login` column to `vpg_users` and implement the update, or delete the method and its callers.

### Holiday Calendar Not Considered in Payroll Calculations
- **Issue:** `payrollUtils.ts` counts all Mon–Sat days as working days. Costa Rican public holidays are not subtracted from the scheduled-hours calculation, so employees working on a holiday may have those hours counted as regular rather than holiday pay.
- **File:** `src/backend/src/utils/payrollUtils.ts` lines 306–320.
- **Fix approach:** Integrate a CR holiday calendar (static list or an external library) and exclude those days from `countWorkingDaysInPeriod`.

---

## Performance Concerns

### `VacationService.getAllVacations()` Called Once Per Payroll Employee
- **Issue:** `NomineeService.calculateEmployeePayroll()` calls `VacationService.getAllVacations()` (full table scan with no filter) inside a per-employee loop at line 473.
- **Files:** `src/backend/src/service/NomineeService.ts` line 473, `src/backend/src/service/VacationService.ts`.
- **Impact:** For N employees, this executes N full-table queries on `vpg_vacations`. With 50 employees this is 50 unfiltered DB reads per payroll run.
- **Fix approach:** Fetch all vacations once before the employee loop in `calculatePayrollForPeriod` and pass the pre-loaded set into `calculateEmployeePayroll`.

### `ClockLogsService.getClockLogs()` Called Once Per Employee
- **Issue:** Similarly, `calculateEmployeePayroll` at line 464 instantiates a new `ClockLogsService` and fetches all clock logs for the period on every employee iteration, then filters in memory (`clockLogs.filter(log => log.employee_id === employee.id)`).
- **Files:** `src/backend/src/service/NomineeService.ts` lines 464–470.
- **Impact:** For N employees, this runs N queries on `vpg_clock_logs` that return the same full dataset each time. The in-memory filter is O(M×N) where M is clock log count.
- **Fix approach:** Fetch all clock logs for the period once at the top of `calculatePayrollForPeriod`, then group by `employee_id` before the loop.

### `ReportsService.getDashboard()` Issues N Queries for Last-Log per Payroll
- **Issue:** The dashboard loops over up to 15 payrolls and issues one `findFirst` on `vpg_report_logs` per payroll inside the loop (line 180).
- **File:** `src/backend/src/service/ReportsService.ts` lines 173–207.
- **Fix approach:** Replace with a single query using `groupBy` or a raw SQL `DISTINCT ON` to get the latest log per payroll in one roundtrip.

---

## Security Concerns

### Wildcard CORS (`app.use(cors())`)
- **Issue:** CORS is configured with no origin restriction, allowing any domain to make authenticated cross-origin requests to the API.
- **File:** `src/backend/src/index.ts` line 28.
- **Impact:** Any malicious website can make API calls in the context of a logged-in user.
- **Fix approach:** Pass an explicit origin list: `cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') })`.

### Credentials Accepted from Query Parameters
- **Issue:** `AuthController.login` reads `username` and `password` from `req.query` as a fallback (`req.query.username`, `req.query.password`). Query parameters are logged by most web servers, proxies, and CDNs.
- **File:** `src/backend/src/controller/AuthController.ts` lines 12–15.
- **Impact:** Credentials may appear in server access logs in plain text.
- **Fix approach:** Remove the `req.query` fallback. Require credentials only in `req.body`.

### Audit Log Written Only for Permission Changes
- **Issue:** The audit log (`vpg_audit_logs`) is only written when a user's role is changed via `UserService.updatePermissions`. All other destructive or sensitive operations (payroll creation, employee deletion, deduction assignment) produce no audit entries.
- **Files:** `src/backend/src/service/UserService.ts` lines 151–164. All other service files lack audit writes.
- **Impact:** Post-incident investigation has no record of who performed critical payroll mutations.
- **Fix approach:** Integrate `AuditLogsService` calls in at minimum: payroll create/update, employee create/update, deduction assign/remove, clock log bulk import.

---

## Dependency Concerns

### `@prisma/client` Listed as devDependency
- **Issue:** `@prisma/client` and `prisma` are in `devDependencies` rather than `dependencies` in `src/backend/package.json`. The generated client is required at runtime.
- **File:** `src/backend/package.json`.
- **Impact:** A production install with `npm install --production` will fail to find the Prisma client.
- **Fix approach:** Move `@prisma/client` to `dependencies`. Keep `prisma` (the CLI) in `devDependencies`.

### `bcrypt` Version 6.0.0 Is a Pre-Release
- **Issue:** `bcrypt@^6.0.0` is used. As of this analysis, v6 is not a stable GA release of the `bcrypt` npm package (the stable line is `5.x`). This may introduce breaking changes without notice.
- **File:** `src/backend/package.json`.
- **Fix approach:** Pin to `bcrypt@^5.1.1` until v6 reaches a stable release.

### `puppeteer@^24.37.5` in Production Dependencies
- **Issue:** Puppeteer (a headless Chromium driver) is a `dependency` (not `devDependency`). It is ~300 MB and downloads a bundled Chromium binary on install, significantly inflating the Docker/deployment image.
- **File:** `src/backend/package.json`.
- **Impact:** Longer CI times, larger container images, and increased attack surface from a full browser engine in production.
- **Fix approach:** If PDF generation is required in production, evaluate lighter alternatives (`pdf-lib` is already a dependency). If puppeteer stays, move it to a separate worker or microservice and add it to an explicitly stripped Docker layer.

---

## Testing Gaps

### Only PayrollService Has Unit Tests
- **Issue:** The entire backend test suite consists of one file: `src/backend/src/__tests__/unit/services/PayrollService.test.ts`. This covers `createPayroll`, `getAllPayrolls`, and a few edge cases. All other services — `NomineeService`, `AuthService`, `EmployeeService`, `ReportsService`, `VacationService`, `DeductionsService`, etc. — have zero automated tests.
- **Coverage:** Critically, the payroll calculation logic in `NomineeService.calculatePayrollForPeriod` (the core business logic of the entire system) is completely untested.
- **Risk:** Any refactor of payroll math, deduction application, overtime calculation, or weekly rest hours can silently break production payroll runs.
- **Priority:** High. Start with `NomineeService` unit tests and `AuthService` integration tests.

### PayrollService Test Has a Mismatch with Actual Behavior
- **Issue:** The `getAllPayrolls` test mocks `findMany` without the `include: { vpg_payroll_employee: true }` clause, but the real implementation includes that relation to compute aggregate statistics. The mock returns plain payroll objects, so the test passes but does not exercise the aggregation logic.
- **File:** `src/backend/src/__tests__/unit/services/PayrollService.test.ts` lines 164–234.
- **Risk:** Aggregation bugs (wrong totals shown on the payroll list) are invisible to the test suite.

### No Frontend Tests of Any Kind
- **Issue:** The frontend (`src/frontend`) has no test files, no testing framework configured (no `jest.config.*`, no `vitest.config.*`), and no test scripts beyond `next lint`.
- **Files:** `src/frontend/package.json` — no test runner listed.
- **Impact:** Zero automated coverage of form validation schemas (zod), service calls, or UI interaction paths.

### No Integration or E2E Tests
- **Issue:** No integration test suite (e.g., supertest against a real or seeded DB) and no E2E framework (Playwright, Cypress) is configured anywhere in the project.
- **Impact:** The only validation that the API + DB integration works correctly is manual testing.

---

## Opportunities

### Consolidate to Shared Prisma Singleton Immediately
The fix is mechanical and low-risk: replace `const prisma = new PrismaClient()` in each service file with `import { prisma } from '../lib/prisma'`. This should be done before any feature work to prevent connection pool issues in production.

### Add `helmet` and CORS Origin to Index.ts in One Line
Adding `app.use(helmet())` and setting `cors({ origin: allowList })` is a ~5-line change that closes several security concerns simultaneously.

### Move JWT Secret Assertion to Startup
Add a startup guard in `src/backend/src/index.ts` that calls `process.exit(1)` if `JWT_SECRET` is absent. This is a one-line check that prevents silent insecurity.

### Extract Employee + Vacation Pre-Fetch Out of the Per-Employee Loop
Refactoring `calculatePayrollForPeriod` to fetch `getAllVacations` and all clock logs once, then pass filtered data into `calculateEmployeePayroll`, would reduce DB queries from O(N) to O(1) per payroll run and is a self-contained change in `src/backend/src/service/NomineeService.ts`.

### Delete Temp/Debug Files
`parse_tmp.js`, `temp_script.py`, `test_hours.js`, `check_employee.ts`, and `query_emp.mjs` can be deleted immediately with no impact on the system.

### Deprecate and Remove the Legacy `/api/nominee/calculate` Route
The method is already `@deprecated` in its JSDoc. Removing the route and the method body is a safe, bounded cleanup.

---

*Concerns audit: 2026-03-25*
