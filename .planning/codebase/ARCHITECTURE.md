# Architecture

**Analysis Date:** 2026-04-11

## Pattern Overview

**Overall:** Layered monolith with domain-oriented modules across backend and frontend.

**Key Characteristics:**
- Enforce backend request pipeline as `Route → Controller → Service → Prisma` using route modules in `src/backend/src/routes/` and service modules in `src/backend/src/service/`.
- Enforce frontend request pipeline as `Page → Hook/Service → http client → Backend API` using app pages in `src/frontend/src/app/pages/`, hooks in `src/frontend/src/hooks/`, and API adapters in `src/frontend/src/services/`.
- Keep database access centralized through Prisma singleton in `src/backend/src/lib/prisma.ts`; call Prisma only from services in `src/backend/src/service/`.
- **Strict HTTP client enforcement:** All internal backend calls must use `src/frontend/src/services/http.ts`. All third-party/external API calls must use `src/frontend/src/services/externalHttp.ts` to prevent internal token leakage.

## Layers

**Backend HTTP Layer (Routes):**
- Purpose: Define API endpoints, attach middleware, and delegate handlers.
- Location: `src/backend/src/routes/`
- Contains: `*Route.ts` modules such as `src/backend/src/routes/PayrollRoutes.ts`, `src/backend/src/routes/EmployeeRoute.ts`, `src/backend/src/routes/ReportsRoute.ts`.
- Depends on: Controllers in `src/backend/src/controller/`, middleware in `src/backend/src/middleware/`, wrapper in `src/backend/src/utils/asyncHandler.ts`.
- Used by: Express app bootstrap in `src/backend/src/index.ts`.

**Backend Transport Layer (Controllers):**
- Purpose: Parse `req`, validate route-level assumptions, convert payload shapes, and format responses.
- Location: `src/backend/src/controller/`
- Contains: Controller classes like `src/backend/src/controller/PayrollController.ts`, `src/backend/src/controller/NomineeController.ts`, `src/backend/src/controller/ReportsController.ts`.
- Depends on: Services in `src/backend/src/service/`.
- Used by: Route modules in `src/backend/src/routes/`.

**Backend Domain/Application Layer (Services):**
- Purpose: Execute business rules, orchestrate queries, compose domain results.
- Location: `src/backend/src/service/`
- Contains: Domain services such as `src/backend/src/service/NomineeService.ts`, `src/backend/src/service/PayrollService.ts`, `src/backend/src/service/ReportsService.ts`.
- Depends on: Prisma singleton `src/backend/src/lib/prisma.ts`, utilities in `src/backend/src/utils/`, models in `src/backend/src/model/`.
- Used by: Controllers in `src/backend/src/controller/`.

**Backend Data/Contract Layer:**
- Purpose: Define schema and data contracts.
- Location: `src/backend/prisma/schema.prisma`, `src/backend/src/model/`, `src/backend/src/types/`, `src/backend/src/schemas/`.
- Contains: Prisma models/tables (`vpg_*`), TypeScript interfaces, shared payroll types, Zod request schemas.
- Depends on: Prisma generator and TypeScript compilation.
- Used by: Services/controllers/routes.

**Frontend Route/View Layer (Next App Router):**
- Purpose: Render pages, collect user input, and trigger domain actions.
- Location: `src/frontend/src/app/` and `src/frontend/src/app/pages/`
- Contains: Root layout `src/frontend/src/app/layout.tsx`, redirect entry `src/frontend/src/app/page.tsx`, feature pages like `src/frontend/src/app/pages/payroll/calculate/page.tsx` and `src/frontend/src/app/pages/reports/page.tsx`.
- Depends on: Hooks in `src/frontend/src/hooks/`, components in `src/frontend/src/components/`.
- Used by: Next.js runtime.

**Frontend State/Use-Case Layer (Hooks):**
- Purpose: Manage view state, loading/error lifecycle, and action orchestration.
- Location: `src/frontend/src/hooks/`
- Contains: Hooks such as `src/frontend/src/hooks/useNominee.ts`, `src/frontend/src/hooks/usePayroll.ts`, `src/frontend/src/hooks/useEmployeeList.ts`.
- Depends on: Services in `src/frontend/src/services/`, shared types in `src/frontend/src/types/`, utilities in `src/frontend/src/utils/`.
- Used by: Pages/components.

**Frontend API Access Layer (Services + HTTP client):**
- Purpose: Encapsulate endpoint paths and transport details.
- Location: `src/frontend/src/services/`
- Contains: Domain services (`src/frontend/src/services/nomineeService.ts`, `src/frontend/src/services/reportsService.ts`, `src/frontend/src/services/payrollService.ts`) and shared clients `src/frontend/src/services/http.ts` (internal) and `src/frontend/src/services/externalHttp.ts` (external).
- Depends on: Runtime config `src/frontend/src/config/index.ts` and browser storage for token lifecycle.
- Used by: Hooks and some pages.

## Data Flow

**Backend request flow (standard endpoint):**

1. Request enters Express app in `src/backend/src/index.ts` under `/api`.
2. Router in `src/backend/src/routes/*.ts` applies `AuthMiddleware.verifyToken` from `src/backend/src/middleware/AuthMiddleware.ts` and wraps handlers with `asyncHandler` from `src/backend/src/utils/asyncHandler.ts`.
3. Controller in `src/backend/src/controller/*.ts` parses params/body and calls service methods.
4. Service in `src/backend/src/service/*.ts` executes business logic and Prisma queries via `src/backend/src/lib/prisma.ts`.
5. Controller sends JSON response, usually `{ success, data }` or entity payload.

**Frontend API flow (standard page action):**

1. Page in `src/frontend/src/app/pages/*/page.tsx` triggers action from a hook (example: `src/frontend/src/app/pages/payroll/calculate/page.tsx` uses `src/frontend/src/hooks/useNominee.ts`).
2. Hook calls domain service in `src/frontend/src/services/*.ts`.
3. Service calls shared HTTP client `src/frontend/src/services/http.ts` for backend data or `src/frontend/src/services/externalHttp.ts` for third-party integrations (like OpenWeatherMap).
4. HTTP client composes URL, injects tokens (internal only), handles refresh/retries (internal only), and returns parsed data.
5. Parsed data returns to hook and page renders updated UI.

**Payroll calculation flow (end-to-end):**

1. `src/frontend/src/app/pages/payroll/calculate/page.tsx` submits date range.
2. `src/frontend/src/hooks/useNominee.ts` calls `NomineeService.calculatePayrollForPeriod` in `src/frontend/src/services/nomineeService.ts`.
3. Backend route `src/backend/src/routes/NomineeRoute.ts` delegates to `src/backend/src/controller/NomineeController.ts`.
4. `src/backend/src/service/NomineeService.ts` preloads logs/vacations/labor events/bonuses/deductions/positions, computes per-employee results, and optionally persists into `vpg_payroll_employee` and `vpg_employee_deductions`.
5. Result returns as summary + employee breakdown and is rendered in frontend components like `src/frontend/src/components/PayrollResults.tsx`.

**State Management:**
- Use local component/hook state (`useState`, `useEffect`, `useCallback`) in `src/frontend/src/hooks/` and pages.
- Use context providers in `src/frontend/src/layouts/main.tsx` (`AuthProvider`, `ThemeProvider`, `TooltipProvider`) for cross-page concerns.
- Use session cache helper `src/frontend/src/utils/sessionCache.ts` for short-lived front-end data cache in selected hooks.

## Key Abstractions

**Service class abstraction (backend):**
- Purpose: Keep business rules and persistence orchestration outside controllers.
- Examples: `src/backend/src/service/EmployeeService.ts`, `src/backend/src/service/NomineeService.ts`, `src/backend/src/service/ReportsService.ts`.
- Pattern: Static methods in most services; `NomineeService` mixes instance methods and static preload helpers.

**HTTP client abstraction (frontend):**
- Purpose: Centralize auth headers, token refresh, and error normalization for internal API calls.
- Examples: `src/frontend/src/services/http.ts`, used by `src/frontend/src/services/payrollService.ts` and `src/frontend/src/services/reportsService.ts`.
- Pattern: Internal domain service methods MUST call `http.get/post/put/delete`.

**External HTTP client abstraction (frontend):**
- Purpose: Securely call third-party APIs without leaking internal tokens.
- Examples: `src/frontend/src/services/externalHttp.ts`.
- Pattern: Used for services like `src/frontend/src/utils/weather.ts` that fetch data from public APIs.

**Schema-validation abstraction (backend):**
- Purpose: Validate request body before controller logic.
- Examples: `src/backend/src/middleware/validateBody.ts` + schemas in `src/backend/src/schemas/EmployeeSchema.ts` and `src/backend/src/schemas/PayrollSchema.ts`.
- Pattern: Attach `validateBody(schema)` in route definitions before controller handlers.

**Domain types abstraction (shared intent):**
- Purpose: Define strongly-typed payroll and entity contracts.
- Examples: `src/backend/src/types/payroll.types.ts`, `src/backend/src/model/*.ts`, `src/frontend/src/types/*.ts`.
- Pattern: Convert DB naming (`snake_case`) to UI-facing fields in controllers/services and frontend hooks.

## Entry Points

**Backend API bootstrap:**
- Location: `src/backend/src/index.ts`
- Triggers: Node runtime (`npm run dev` / `npm run start` in `src/backend/`).
- Responsibilities: Load env, enforce `JWT_SECRET`, configure CORS/helmet/json parser, register all route modules, expose Swagger JSON/UI, start server.

**Frontend app bootstrap:**
- Location: `src/frontend/src/app/layout.tsx`
- Triggers: Next.js App Router runtime.
- Responsibilities: Global metadata/styles and wrapping client shell from `src/frontend/src/layouts/main.tsx`.

**Frontend root redirect:**
- Location: `src/frontend/src/app/page.tsx`
- Triggers: Navigation to `/`.
- Responsibilities: Redirect to `/pages/auth`.

**Domain batch/utility entry points:**
- Location: `src/backend/src/scripts/seedDeductions.ts`
- Triggers: Script execution in backend environment.
- Responsibilities: Seed deduction catalog data through Prisma.

## Error Handling

**Strategy:** Layered, defensive try/catch with normalized API errors on frontend.

**Patterns:**
- Wrap async route handlers with `asyncHandler` (`src/backend/src/utils/asyncHandler.ts`) to forward rejected promises.
- In controllers/services, catch exceptions and return 4xx/5xx JSON payloads (examples in `src/backend/src/controller/PayrollController.ts`, `src/backend/src/controller/NomineeController.ts`).
- In frontend, throw/catch `ApiError` from `src/frontend/src/services/http.ts` and expose message through hooks/pages via `error` state and toasts.

## Cross-Cutting Concerns

**Logging:** Console logging in backend bootstrap and services/controllers (`src/backend/src/index.ts`, `src/backend/src/service/NomineeService.ts`, `src/backend/src/service/ReportsService.ts`) plus Prisma query logging in `src/backend/src/lib/prisma.ts`.

**Validation:**
- Backend: Zod body validation middleware in `src/backend/src/middleware/validateBody.ts` and schema modules in `src/backend/src/schemas/`.
- Frontend: Form and payload validation schema modules in `src/frontend/src/schemas/`.

**Authentication:**
- Backend JWT verification middleware in `src/backend/src/middleware/AuthMiddleware.ts` applied globally per router (`router.use(AuthMiddleware.verifyToken)` in routes like `src/backend/src/routes/EmployeeRoute.ts`).
- Frontend token storage/refresh/logout lifecycle centralized in `src/frontend/src/services/http.ts` and auth context in `src/frontend/src/hooks/useAuth.tsx`.

---

*Architecture analysis: 2026-04-11*
