# Architecture

**Analysis Date:** 2026-03-26

## Pattern Overview

**Overall:** Layered monorepo — separate backend API and frontend SPA communicating over HTTP/JSON.

**Key Characteristics:**
- Backend is a REST API with strict 4-layer pipeline: Route → Controller → Service → Prisma
- Frontend is a Next.js App Router SPA with a strict 4-layer pipeline: Page → Hook → Service → http.ts
- No layer may skip the one below it — controllers never call Prisma directly, pages never call services directly
- All data access goes through a single Prisma singleton (`src/backend/src/lib/prisma.ts`)
- All frontend HTTP traffic goes through a single client (`src/frontend/src/services/http.ts`)

---

## Backend Layers

**Routes — `src/backend/src/routes/`**
- Purpose: Define Express Router endpoints, apply middleware, wrap handlers
- Contains: One `*Route.ts` file per domain (16 route files total)
- Pattern: `router.use(AuthMiddleware.verifyToken)` applied at router level for protected domains; individual `validateBody(schema)` per write endpoint; every handler wrapped in `asyncHandler()`
- Depends on: Controllers, Middleware, Schemas, Utils
- Used by: `src/backend/src/index.ts` (all routers mounted under `/api`)

**Controllers — `src/backend/src/controller/`**
- Purpose: Parse `req`/`res`, map frontend field names to domain model fields, call service methods, return HTTP responses
- Contains: One `*Controller.ts` per domain (16 controllers), all static methods only
- Pattern: Controller reads `req.body` / `req.params`, remaps fields (e.g., `employee_first_name` → `name`), delegates to service, returns JSON. Zero business logic.
- Depends on: Services, Models
- Used by: Routes

**Services — `src/backend/src/service/`**
- Purpose: All business logic, Prisma queries, domain rules
- Contains: One `*Service.ts` per domain (16 services), all static methods only
- Pattern: Import `{ prisma }` singleton; query `prisma.vpg_*` models; return typed model interfaces
- Special: `NomineeService.ts` orchestrates payroll calculation by calling `PayrollUtils`, `ClockLogsService`, `VacationService`, `DeductionsService`, `EmployeeService`, `BonusesService`
- Depends on: `src/backend/src/lib/prisma.ts`, Models, Types, Utils
- Used by: Controllers

**Models — `src/backend/src/model/`**
- Purpose: Plain TypeScript interfaces only — no logic, no Prisma types
- Contains: One interface file per domain entity (24 model files)
- Pattern: Flat `export interface Foo { field: type; ... }` with `snake_case` field names matching Prisma schema
- Used by: Controllers and Services for typing

---

## Frontend Layers

**Pages — `src/frontend/src/app/pages/<domain>/page.tsx`**
- Purpose: `"use client"` React components; compose UI from components; consume one primary hook per page
- Contains: 26 page files under `src/frontend/src/app/pages/`
- Pattern: Destructure all state and actions from hook; render layout + components + modals; never call services directly
- Depends on: Hooks, Components

**Hooks — `src/frontend/src/hooks/`**
- Purpose: Data fetching, local state management, action handlers
- Contains: 21 hook files (`use*.ts`)
- Pattern: `useState` + `useEffect` for data loading; all async actions wrapped in `useCallback`; return shape always `{ data, isLoading, error, ...actions }`
- Depends on: Services
- Used by: Pages

**Services — `src/frontend/src/services/`**
- Purpose: Typed wrappers around HTTP calls; payload normalization before sending to backend
- Contains: 18 service files (`*Service.ts` or named exports); barrel re-exported from `src/frontend/src/services/index.ts`
- Pattern: Functions call `http.get/post/put/delete(path, payload)`; field names mapped from `employee_*` form names to plain backend names (`name`, `last_name`)
- Depends on: `http.ts`
- Used by: Hooks

**http.ts — `src/frontend/src/services/http.ts`**
- Purpose: Central HTTP client — all API calls in the entire frontend go through this single file
- Contains: Token storage, automatic JWT refresh on 401, error parsing, `http.get/post/put/delete/raw` methods
- Pattern: `rawRequest()` attaches `Authorization: Bearer <token>` header from `localStorage`; on 401 calls `tryRefreshToken()` once then retries; on second 401 clears tokens and calls `onAuthFailureCallback`; `requestJson()` unwraps `{ data: ... }` wrapper responses automatically
- Token keys: `vp_access_token` / `vp_refresh_token` in `localStorage` — never change these keys
- Used by: All frontend services

---

## Entry Points

**Backend API — `src/backend/src/index.ts`**
- Triggers: `npm run dev` (tsx watch) or `node dist/index.js`
- Responsibilities:
  1. Assert `JWT_SECRET` is set or exit process
  2. Configure Express: `cors({ origin: ALLOWED_ORIGINS })`, `express.json()`
  3. Mount all 16 route modules under `/api`
  4. Serve Swagger JSON at `GET /api/docs/swagger.json`
  5. Serve Scalar API reference UI at `GET /api/docs`
  6. Listen on `PORT` (default 3001)

**Frontend Root — `src/frontend/src/app/layout.tsx`**
- Triggers: Next.js App Router root layout (server component)
- Responsibilities: Import global CSS, wrap all pages in `ClientLayout` (`src/frontend/src/layouts/main.tsx`)
- `ClientLayout` wraps in `<AuthProvider>`, renders `<Sidebar>` + `<Header>` + `<main>` for authenticated routes; renders bare layout for `/pages/auth`

**Frontend Root Redirect — `src/frontend/src/app/page.tsx`**
- Redirects `/` → `/pages/auth` unconditionally on first load

---

## Data Flow

**Authenticated API Request (Frontend to Backend):**
1. Page calls action handler from hook (e.g., `handleAddEmployee`)
2. Hook calls service function (e.g., `apiCreateEmployee(data)` from `employeeService.ts`)
3. Service normalizes payload, calls `http.post('/employee/create', payload)`
4. `http.ts` attaches `Authorization: Bearer <token>` header, calls `fetch`
5. On 401: auto-refreshes token via `POST /api/refresh`, retries once
6. Backend `EmployeeRoute.ts` receives request, runs `AuthMiddleware.verifyToken`, then `validateBody(createEmployeeSchema)`, then `asyncHandler(EmployeeController.createEmployee)`
7. `AuthMiddleware.verifyToken` verifies JWT, fetches user via `AuthService.getUserById`, attaches to `req.user`
8. `validateBody` runs Zod schema against `req.body`; on failure returns `400 { success: false, error: "..." }`
9. `EmployeeController.createEmployee` maps `employee_first_name` → `name` etc., calls `EmployeeService.createEmployee(data)`
10. `EmployeeService` builds Prisma payload, calls `prisma.vpg_employees.create(...)`, maps result back to `Employee` interface
11. Controller returns `201` with employee JSON
12. `http.ts` unwraps `{ data: ... }` wrapper if present; hook updates state

**Payroll Calculation Flow:**
1. Frontend calls `POST /api/nominee/calculate` with `{ payroll_id, period_start, period_end }`
2. `NomineeService.calculatePayrollForPeriod` fetches clock logs, vacations, deductions, bonuses **once** outside the employee loop
3. For each employee: calls `PayrollUtils.*` pure functions to compute regular hours, overtime (1.5x up to 10h total, 2x above), weekly rest (0.5x daily), gross salary, deductions
4. Returns `PayrollCalculationResult` with per-employee breakdown and summary totals
5. Frontend `useNominee` hook surfaces results to `PayrollResults` component

**Authentication Flow:**
1. User submits credentials to `POST /api/login`
2. `AuthController.login` calls `AuthService` which verifies username/password (bcrypt), generates JWT + refresh token
3. `http.ts` stores tokens: `localStorage.setItem('vp_access_token', ...)` / `vp_refresh_token`
4. `AuthProvider` in `src/frontend/src/layouts/main.tsx` checks token presence; redirects to `/pages/auth` if absent

---

## Middleware Pipeline

Each protected route processes requests in this order:

```
Request
  → cors()                              # Origin check
  → express.json()                      # Body parsing
  → AuthMiddleware.verifyToken           # JWT verification + user DB fetch
  → validateBody(zodSchema)              # Input validation (write endpoints only)
  → asyncHandler(Controller.method)      # Handler with automatic error catch
  → Response
```

`asyncHandler` wraps every handler: `Promise.resolve(fn).catch(next)`. This prevents unhandled promise rejections from crashing the server and routes errors to Express's error middleware.

---

## Key Design Decisions

**Singleton Prisma client (`src/backend/src/lib/prisma.ts`):**
Global instance stored on the `global` object to survive hot-reloads in development. Never call `new PrismaClient()` directly in services — always `import { prisma } from '../lib/prisma'`.

**Static-only classes:**
All controllers and services use `static async` methods. No instantiation. This groups related functions under a namespace without OOP inheritance. Method order within each class: `create` → `getAll` → `getById` → `update` → `delete`.

**Field name mapping at the controller boundary:**
Frontend form fields use `entity_field_name` convention (e.g., `employee_first_name`). DB fields use `tablename_fieldname` (e.g., `employee_first_name` in Prisma). Model interfaces use plain names (`name`, `last_name`). Controllers perform the remapping; services always receive clean model interfaces.

**`{ data: ... }` response unwrapping in http.ts:**
`requestJson()` automatically returns `response.data` when the response has a top-level `data` key. Frontend services consuming results receive the inner payload directly without further unwrapping.

**`validateBody` middleware:**
Placed in the route file, not the controller. On success it replaces `req.body` with the Zod-parsed (coerced) value, so controllers always receive valid typed inputs. On failure returns `400 { success: false, error: "<messages>" }` before the controller runs.

**Swagger/Scalar docs:**
All route files contain `@swagger` JSDoc annotations. `src/backend/src/utils/docs.ts` compiles them via `swagger-jsdoc`. UI served at `/api/docs` using `@scalar/express-api-reference` loaded dynamically (ESM-only package under CJS runtime).

**JWT refresh in http.ts:**
On first 401, `http.ts` calls `POST /api/refresh`, stores new access token, retries original request. On second 401, clears all tokens and calls the registered `onAuthFailureCallback` (typically redirects to login). This is transparent to all callers.

---

## Error Handling

**Backend strategy:**
`asyncHandler` routes all thrown errors to Express's error middleware. Controllers also catch locally and return structured responses:
- `{ success: false, error: "message" }` with status 400/404/500

**Frontend strategy:**
Services throw `Error` objects. Hooks catch them and expose via `error` in the return object. Some pages use `alert()` for user-visible errors (tech debt — no centralized toast or error UI).

---

## Cross-Cutting Concerns

**Auth:**
`AuthMiddleware.verifyToken` verifies JWT and fetches full user from DB on every protected request. `req.user` is typed as `User` from `src/backend/src/model/user.ts`. Role-based access is available via `AuthMiddleware.requireRole(roles[])` but not widely applied (tech debt).

**Validation:**
`validateBody(zodSchema)` middleware applied per write route in `src/backend/src/routes/`. Schemas live in `src/backend/src/schemas/`. Currently applied to Employee, Deductions, ClockLogs, Payroll, User routes — other routes are unvalidated (tech debt).

**API Documentation:**
Swagger annotations in route files, compiled by `docs.ts`, served via Scalar UI at `/api/docs`.

**Payroll math:**
Pure functions in `src/backend/src/utils/payrollUtils.ts`. Only called from `NomineeService`. Covered by Jest unit tests. Never modify without updating tests and verifying Costa Rica labor law compliance.

**Layout and auth guard (frontend):**
`src/frontend/src/layouts/main.tsx` renders the shell (`<Sidebar>`, `<Header>`, `<main>`) for all authenticated pages. Auth guard lives in `useAuth` hook + `AuthProvider` context. Unauthenticated users are redirected to `/pages/auth`.

---

*Architecture analysis: 2026-03-26*
