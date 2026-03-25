# Architecture

**Analysis Date:** 2026-03-25

## System Overview

VP-Planilla is a full-stack payroll management system (planilla = payroll in Spanish) for Costa Rican labor law compliance. It consists of a Next.js frontend, an Express/TypeScript REST API backend, a PostgreSQL database accessed via Prisma ORM, and a legacy Java utility for processing clock-log files from physical time-attendance hardware.

## Architecture Pattern

**Overall:** Layered monorepo with separated frontend and backend applications communicating over REST.

**Key Characteristics:**
- Backend follows strict 4-layer MVC: Routes → Controllers → Services → Models/Prisma
- Frontend follows a feature-page-based pattern: Pages consume custom Hooks, which call Service modules, which call the shared `http` client
- Both apps are TypeScript; the Java module is a standalone utility (not part of the main API)
- Database table names are prefixed `vpg_` and field names use `tablename_fieldname` snake_case convention (Prisma handles mapping)

## Layers

**Routes Layer:**
- Purpose: Defines Express Router endpoints and applies middleware
- Location: `src/backend/src/routes/`
- Contains: One file per domain (e.g., `PayrollRoutes.ts`, `AuthRoute.ts`)
- Depends on: Controllers, AuthMiddleware, asyncHandler utility
- Used by: `src/backend/src/index.ts` — all routes are mounted at `/api`

**Controller Layer:**
- Purpose: Parses HTTP request/response, maps field names, delegates to Service
- Location: `src/backend/src/controller/`
- Contains: Static class methods (e.g., `PayrollController`, `AuthController`)
- Depends on: Service layer
- Used by: Routes layer

**Service Layer:**
- Purpose: Business logic, calculations, data transformation, external integrations
- Location: `src/backend/src/service/`
- Contains: Static class methods using Prisma directly (e.g., `PayrollService`, `NomineeService`, `ReportsService`)
- Depends on: Prisma client (`src/backend/src/lib/prisma.ts`), model types, utils
- Used by: Controllers

**Model Layer:**
- Purpose: TypeScript interface definitions for domain entities
- Location: `src/backend/src/model/`
- Contains: Plain interface files (e.g., `payroll.ts`, `employee.ts`, `user.ts`)
- Depends on: Nothing
- Used by: Services and Controllers

**Middleware:**
- Purpose: JWT verification and role-based access control
- Location: `src/backend/src/middleware/AuthMiddleware.ts`
- Contains: `verifyToken`, `requireRole`, `optionalAuth` static methods
- Applied: Selectively per route in route definitions (not globally on all routes)

**Frontend Pages:**
- Purpose: Next.js App Router page components, one file per route segment
- Location: `src/frontend/src/app/pages/`
- Contains: `page.tsx` files (all `"use client"`)
- Depends on: Custom hooks, shared components

**Frontend Hooks:**
- Purpose: Data fetching and local state encapsulation for each domain
- Location: `src/frontend/src/hooks/`
- Contains: Custom hooks (e.g., `usePayroll.ts`, `useNominee.ts`, `useEmployeeList.ts`)
- Depends on: Service layer
- Used by: Page components

**Frontend Services:**
- Purpose: HTTP API calls per domain
- Location: `src/frontend/src/services/`
- Contains: One service class per domain (e.g., `payrollService.ts`, `employeeService.ts`)
- Depends on: `src/frontend/src/services/http.ts` (centralized fetch wrapper)
- Used by: Hooks

## Data Flow

**Standard CRUD Request:**

1. User interacts with a Next.js page component (`src/frontend/src/app/pages/<domain>/page.tsx`)
2. Page delegates to a custom hook (`src/frontend/src/hooks/use<Domain>.ts`)
3. Hook calls a domain service method (`src/frontend/src/services/<domain>Service.ts`)
4. Service calls `http.get/post/put/delete` from `src/frontend/src/services/http.ts`
5. `http` attaches JWT Bearer token from `localStorage` and sends `fetch` to the backend
6. Backend Express router matches route and calls the Controller method
7. Controller parses `req.body`/`req.params`, calls Service method
8. Service executes Prisma query against PostgreSQL and maps results to domain model
9. Controller sends JSON response; `http.ts` unwraps `{ data: ... }` envelope automatically

**Payroll Calculation Flow:**

1. User selects period and payroll type on `src/frontend/src/app/pages/payroll/calculate/page.tsx`
2. `useNominee` hook calls `NomineeService.calculatePayroll` in the backend
3. `NomineeService` (`src/backend/src/service/NomineeService.ts`) orchestrates:
   - Fetches clock logs via `ClockLogsService`
   - Fetches vacations via `VacationService`
   - Fetches labor events via `LaborEventsService`
   - Fetches deductions via `DeductionsService`
   - Fetches bonuses via `BonusesService`
   - Uses pure utility functions from `src/backend/src/utils/payrollUtils.ts` to apply Costa Rica labor law (8h/day, 1.5× overtime, weekly rest pay)
4. Results are returned as `PayrollCalculationResult` typed in `src/backend/src/types/payroll.types.ts`
5. Frontend displays results via `src/frontend/src/components/PayrollResults.tsx`

**Authentication Flow:**

1. User submits credentials on `/pages/auth` page
2. `AuthService.login` sends `POST /api/login`
3. Backend `AuthService` verifies password with bcrypt, returns JWT access + refresh tokens
4. `useAuth` context (`src/frontend/src/hooks/useAuth.tsx`) stores tokens in `localStorage` under keys `vp_access_token` / `vp_refresh_token`
5. All subsequent API calls via `http.ts` automatically attach the `Authorization: Bearer` header
6. On 401 responses, `http.ts` automatically attempts token refresh via `POST /api/refresh`; on failure it calls the registered `onAuthFailure` callback which redirects to `/pages/auth`

**State Management:**
- No global state library (no Redux, no Zustand). State is managed via:
  - `AuthContext` (React Context in `src/frontend/src/hooks/useAuth.tsx`) for user session
  - Local `useState` within hooks for per-page data
  - `localStorage` for token persistence

## Key Design Decisions

**No global state manager:** Each page fetches its own data via dedicated hooks. Pages are isolated. Sharing data between pages happens through URL params or by re-fetching.

**Service layer owns Prisma:** Each service instantiates its own `new PrismaClient()` inline rather than using the shared singleton from `src/backend/src/lib/prisma.ts`. This is inconsistent — the singleton exists but is not universally used.

**JWT with refresh tokens:** The backend implements dual-token auth (access + refresh). The frontend `http.ts` handles silent refresh automatically on 401 errors.

**asyncHandler wrapper:** `src/backend/src/utils/asyncHandler.ts` wraps all route handlers to catch async errors and forward them to Express error handling without needing explicit try/catch in routes.

**Response envelope normalization:** Backend responses that include a `{ success: true, data: [...] }` wrapper are automatically unwrapped in `http.ts` (`requestJson` extracts `.data`). Older endpoints return bare objects.

**Java clock-log processor:** `src/Java/clocklogs/` is a standalone Maven Java application for parsing clock-log files from time-attendance hardware into a format importable to the database. It is not called by the Node.js API at runtime.

**Report generation:** `ReportsService` (`src/backend/src/service/ReportsService.ts`) generates official payroll reports for CCSS (social security) and Hacienda (tax authority). Reports are rendered via Puppeteer + Handlebars HTML templates in `src/backend/templates/` and can be emailed via Nodemailer.

**Swagger/OpenAPI docs:** The backend exposes `GET /api/docs` (Scalar UI) and `GET /api/docs/swagger.json`. Route files carry inline JSDoc `@swagger` annotations processed by `swagger-jsdoc`.

## Entry Points

**Backend:**
- Location: `src/backend/src/index.ts`
- Triggers: `npm run dev` (tsx watch) or `npm start` (compiled dist)
- Responsibilities: Creates Express app, registers CORS + JSON middleware, mounts all route modules at `/api`, starts HTTP listener on port 3001 (or `PORT` env var)

**Frontend:**
- Location: `src/frontend/src/app/layout.tsx` (Next.js App Router root layout)
- Triggers: `npm run dev` (Next.js dev server with Turbopack) or `npm start`
- Responsibilities: Wraps all pages in `ClientLayout` which provides `AuthProvider` context and conditionally renders `Sidebar` + `Header`

## Error Handling

**Strategy:** Per-layer try/catch; errors logged to console; HTTP status codes used semantically.

**Patterns:**
- Backend services throw on fatal errors; controllers catch and return `{ error: "..." }` with 4xx/5xx status
- `asyncHandler` utility ensures unhandled promise rejections in route handlers propagate to Express error middleware
- Frontend `http.ts` throws `Error` objects with message text from the API error body; hooks catch and set local `error` state
- Auth failures trigger forced logout and redirect via the registered `onAuthFailure` callback in `http.ts`

## Cross-Cutting Concerns

**Logging:** `console.error` / `console.log` throughout backend; no structured logging library.
**Validation:** Input validation is ad-hoc in controllers (manual field checks). Frontend uses Zod schemas in `src/frontend/src/schemas/` for form validation via `react-hook-form`.
**Authentication:** JWT Bearer tokens; `AuthMiddleware.verifyToken` applied per-route in route files. Some routes have no auth guard (e.g., `GET /payrolls`).

---

*Architecture analysis: 2026-03-25*
