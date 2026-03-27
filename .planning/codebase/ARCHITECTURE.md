# Architecture

**Analysis Date:** 2026-03-26

## Pattern Overview

**Overall:** Layered monolith — Express REST API backend + Next.js frontend, strictly separated into discrete layers. No shared code between backend and frontend at runtime.

**Key Characteristics:**
- Mandatory layer ordering: Route → Controller → Service → Prisma. No layer may be skipped.
- All services use the singleton Prisma client from `src/backend/src/lib/prisma.ts`. `new PrismaClient()` is forbidden.
- All frontend HTTP traffic flows through `src/frontend/src/services/http.ts`. No raw `fetch` in components or hooks.
- Every backend route is protected by `AuthMiddleware.verifyToken` (applied as `router.use(...)` on 14 of 16 routers; `UserRoute.ts` applies it per-endpoint alongside `requireRole`).
- Body validation on mutation routes uses `validateBody(schema)` middleware composed inline in the route file.

---

## Backend Layers

**Routes** (`src/backend/src/routes/`):
- Purpose: Express Router setup — apply auth middleware, compose `validateBody`, wrap handlers in `asyncHandler`, define HTTP verb/path
- Pattern: Most routers open with `router.use(AuthMiddleware.verifyToken)` to protect every endpoint in the file. `UserRoute.ts` applies auth per-route along with `AuthMiddleware.requireRole(["admin"])`.
- Depends on: Middleware, Controller, schemas
- Does NOT contain: Business logic, Prisma queries

**Controllers** (`src/backend/src/controller/`):
- Purpose: Parse `req.body` / `req.params` / `req.query`, map field names, call the corresponding Service method, return HTTP response
- Pattern: Static class with static async methods. Thin — all logic delegated to Service.
- Example: `EmployeeController.createEmployee` maps `employee_first_name` / `name` field-name variants then calls `EmployeeService.createEmployee`
- Depends on: Service layer, model types

**Services** (`src/backend/src/service/`):
- Purpose: All business logic and all Prisma queries
- Pattern: Static class with static async methods (or instance class for `NomineeService` which has both static preload helpers and instance calculation methods)
- All services import: `import { prisma } from '../lib/prisma'`
- Depends on: `lib/prisma`, model interfaces, `utils/payrollUtils.ts` (in NomineeService)

**Models** (`src/backend/src/model/`):
- Purpose: Plain TypeScript interfaces — shape definitions only, no logic
- Examples: `employee.ts`, `payroll.ts`, `user.ts`
- Consumed by controllers and services for type safety

**Middleware** (`src/backend/src/middleware/`):
- `AuthMiddleware.ts` — JWT verification (`verifyToken`), role enforcement (`requireRole`), optional auth (`optionalAuth`). Extends `req.user` via global Express namespace augmentation.
- `validateBody.ts` — Generic Zod validation middleware factory. Calls `schema.safeParse(req.body)`, replaces `req.body` with parsed/coerced value on success, returns `400 { success: false, error: "..." }` on failure.

**Schemas** (`src/backend/src/schemas/`):
- Purpose: Zod schemas used by `validateBody` middleware for request body validation
- Files:
  - `EmployeeSchema.ts` — `createEmployeeSchema`, `updateEmployeeSchema` (handles both `employee_` prefixed and unprefixed field names for backward compat)
  - `DeductionSchema.ts` — `createDeductionSchema`, `updateDeductionSchema`
  - `PayrollSchema.ts` — `createPayrollSchema`, `updatePayrollSchema`
  - `ClockLogSchema.ts` — `bulkCreateClockLogSchema` (nested array of log items)
  - `UserSchema.ts` — `updatePermissionsSchema`
- All schemas export both the Zod schema and the inferred TypeScript type

**Types** (`src/backend/src/types/`):
- `payroll.types.ts` — Central payroll domain interfaces: `PayrollPeriod`, `DayWork`, `DeductionBreakdown`, `Inconsistency`, `EmployeePayroll`, `PayrollSummary`, `PayrollCalculationResult`. Both `NomineeService` and the frontend depend on this shape.

**Utils** (`src/backend/src/utils/`):
- `asyncHandler.ts` — Express error boundary: wraps async route handlers, routes uncaught rejections to Express error middleware via `Promise.resolve(fn).catch(next)`
- `payrollUtils.ts` — Pure Costa Rica labor law math functions (hours calculation, overtime, weekly rest)
- `docs.ts` — Swagger spec generation

**lib** (`src/backend/src/lib/`):
- `prisma.ts` — Singleton `PrismaClient` with query logging and an exported query counter (`getQueryCount`, `resetQueryCount`) for debugging

---

## Frontend Layers

**Pages** (`src/frontend/src/app/pages/<domain>/page.tsx`):
- All are `"use client"` components
- Consume one or more domain hooks, pass actions and data to components
- Do not call services directly; do not contain business logic
- Root `src/frontend/src/app/page.tsx` redirects to `/pages/auth`

**Hooks** (`src/frontend/src/hooks/`):
- Encapsulate all data fetching, local state, and action callbacks
- Return shape: `{ data, isLoading, error, ...actions }`
- Async operations wrapped in `useCallback`
- Examples: `useEmployeeList.ts`, `usePayroll.ts`, `useNominee.ts`, `useAuth.ts`

**Services** (`src/frontend/src/services/`):
- Named export functions that call `http.get/post/put/delete`
- No business logic — pure API call wrappers
- Examples: `employeeService.ts`, `payrollService.ts`, `nomineeService.ts`

**http.ts** (`src/frontend/src/services/http.ts`):
- Central HTTP client — the ONLY place `fetch` is called
- Automatically attaches `Authorization: Bearer <token>` from `localStorage`
- Token refresh logic: on 401, attempts one silent refresh via `POST /api/refresh`; on second 401, clears tokens and invokes `onAuthFailureCallback`
- Token storage keys: `vp_access_token`, `vp_refresh_token` (never change these)
- Unwraps `{ success, data }` envelope: if response has a `data` key, returns `data` directly
- Exposes `http.get`, `http.post`, `http.put`, `http.delete`, `http.raw`

**Schemas** (`src/frontend/src/schemas/`):
- Zod schemas for frontend form validation (separate from backend schemas)
- Used with `react-hook-form` + `zodResolver`
- Examples: `employee.ts`, `vacationSchema.ts`

**Components** (`src/frontend/src/components/`):
- Reusable UI. Props interface defined in the same file.
- Typed as `React.FC<PropsInterface>`
- Modals use `AnimatePresence` + `motion.div` (framer-motion)

**Layouts** (`src/frontend/src/layouts/`):
- `main.tsx` — `ClientLayout` wraps every page with `AuthProvider`, `ThemeProvider`, `Sidebar`, and `Header`. Redirects unauthenticated users to `/pages/auth` via `useEffect`.

---

## Auth Flow

1. User submits credentials to `POST /api/login` (public endpoint, no auth middleware)
2. `AuthController.login` calls `AuthService.authenticate` — bcrypt verify — sign JWT — return `{ token, refresh_token, user }`
3. Frontend `authService.login` stores tokens via `http.setTokens(access, refresh)` into `localStorage`
4. Subsequent requests: `http.ts` attaches `Authorization: Bearer <access_token>` automatically
5. On 401: `http.ts` calls `POST /api/refresh` with refresh token and retries original request once
6. On second 401: `clearStoredTokens()` + `onAuthFailureCallback()` triggers redirect to login

**Public endpoints** (no `AuthMiddleware.verifyToken`):
- `POST /api/login`
- `POST /api/validate`
- `POST /api/refresh`

**Protected endpoints:** All others. Most route files apply `router.use(AuthMiddleware.verifyToken)` at the top. `UserRoute.ts` additionally applies `AuthMiddleware.requireRole(["admin"])` on every endpoint.

---

## NomineeService Preload Architecture

`NomineeService.calculatePayrollForPeriod` implements an O(6-queries) preload pattern to avoid N+1 database queries when calculating payroll for all employees.

```
calculatePayrollForPeriod(startDate, endDate, payrollId?)
  |
  +-- EmployeeService.getActiveEmployeesForPeriod(...)    [query 1]
  |
  +-- Promise.all([                                       [queries 2-7, parallel]
        preloadClockLogs(startDate, endDate)   -> Map<employeeId, clockLog[]>
        preloadVacations()                     -> Map<employeeId, vacation[]>
        preloadLaborEvents(startDate, endDate) -> Map<employeeId, laborEvent[]>
        preloadBonuses(startDate, endDate)     -> Map<employeeId, bonus[]>
        preloadDeductions()                    -> Map<employeeId, deduction[]>
        preloadPositions()                     -> Map<positionId, position>
      ])
  |
  +-- for each employee: (pure in-memory, zero DB queries)
        calculateEmployeePayroll(employee, startDate, endDate,
          clockLogsMap.get(id), vacationsMap.get(id), ...)
```

All six preload methods are `private static` on `NomineeService`. The helper `groupByEmployee<T>(items, getIdFn)` produces `Map<number, T[]>` groupings used throughout.

---

## Payroll Calculation Data Flow

1. Frontend `useNominee.ts` hook calls `nomineeService.calculatePayroll(start, end, payrollId)`
2. Service calls `POST /api/nominee/calculate`
3. `NomineeRoute.ts` applies `AuthMiddleware.verifyToken`, then calls `NomineeController`
4. Controller calls `nomineeService.calculatePayrollForPeriod(startDate, endDate, payrollId)`
5. Service preloads all data in parallel (6 queries), iterates employees, runs `calculateEmployeePayroll` (pure in-memory)
6. Payroll math via `utils/payrollUtils.ts`: regular hours (up to biweekly requirement), overtime (×1.5), weekly rest (proportional), net salary
7. Persistence: `savePayrollEmployees(payrollId, employees)` upserts `vpg_payroll_employee` + `vpg_employee_deductions` rows
8. Response shape: `PayrollCalculationResult` — `{ period, employees: EmployeePayroll[], summary }`

---

## Error Handling

**Backend strategy:**
- `asyncHandler` catches all async errors and passes them to Express error middleware
- Services throw `Error` instances; controllers catch and return `{ error: "..." }` with HTTP 4xx/5xx
- `validateBody` returns `400 { success: false, error: "<zod messages>" }` before the handler runs
- Auth failures return `401 { success: false, message: "..." }`

**Frontend strategy:**
- `http.ts` throws `Error` with the API error message on non-OK responses
- Hooks catch errors and expose them via the `error` field in the return shape
- Network errors produce the message: "No se pudo conectar con la API..."

---

## Cross-Cutting Concerns

**Logging:** `console.log`/`console.error` directly throughout. Prisma query logging via `prisma.$on('query', ...)` in `src/backend/src/lib/prisma.ts` with a global query counter.

**Validation (backend):** `validateBody(zodSchema)` middleware applied per-route in route files for mutation endpoints. Query param validation is ad-hoc inside controllers/services.

**Validation (frontend):** Zod schemas in `src/frontend/src/schemas/` consumed by `react-hook-form` + `zodResolver`.

**Authentication:** JWT Bearer tokens. Access token short-lived; refresh token enables silent re-auth. Server enforces via `AuthMiddleware.verifyToken`. Client enforces redirect in `src/frontend/src/layouts/main.tsx`.

**CORS:** `cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') })` in `src/backend/src/index.ts` — origin-restricted, configured via environment variable.

**API docs:** Swagger spec generated via `src/backend/src/utils/docs.ts`. Served at `GET /api/docs/swagger.json`; rendered at `GET /api/docs` via `@scalar/express-api-reference`.

---

*Architecture analysis: 2026-03-26*
