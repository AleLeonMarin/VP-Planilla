# Codebase Structure

**Analysis Date:** 2026-04-09

## Directory Layout

```text
VP-Planilla/
├── .planning/                    # GSD planning state and generated codebase maps
├── docs/                         # Project documentation
├── scripts/                      # Root-level automation scripts
├── src/
│   ├── backend/                  # Express + Prisma backend application
│   │   ├── prisma/               # Prisma schema and SQL migrations
│   │   ├── src/                  # Backend TypeScript source
│   │   ├── templates/            # HTML templates for payment receipts
│   │   ├── dist/                 # Compiled backend output (generated)
│   │   └── node_modules/         # Backend dependencies
│   ├── frontend/                 # Next.js frontend application
│   │   ├── public/               # Static assets (icons, fonts, sample files)
│   │   ├── scripts/              # Frontend-specific scripts
│   │   ├── src/                  # Frontend TypeScript source
│   │   ├── .next/                # Next build/cache output (generated)
│   │   └── node_modules/         # Frontend dependencies
│   ├── Java/                     # Standalone Java utility workspace
│   ├── DB/                       # SQL/manual database artifacts
│   ├── API/                      # Reserved API-related workspace
│   └── env/                      # Environment folder placeholder
├── CLAUDE.md                     # Project operating manual and architecture rules
├── README.md                     # Setup, conventions, and high-level architecture
└── WORKFLOW.md                   # Process/workflow guidance
```

## Directory Purposes

**`src/backend/src/routes/`:**
- Purpose: Declare API routes and middleware composition.
- Contains: Route modules named `*Route.ts` (for example `src/backend/src/routes/EmployeeRoute.ts`, `src/backend/src/routes/ReportsRoute.ts`).
- Key files: `src/backend/src/routes/AuthRoute.ts`, `src/backend/src/routes/NomineeRoute.ts`, `src/backend/src/routes/PayrollRoutes.ts`.

**`src/backend/src/controller/`:**
- Purpose: Translate HTTP request/response to service calls.
- Contains: Controller classes named `*Controller.ts`.
- Key files: `src/backend/src/controller/NomineeController.ts`, `src/backend/src/controller/PayrollController.ts`, `src/backend/src/controller/ReportsController.ts`.

**`src/backend/src/service/`:**
- Purpose: Centralize business logic and database operations.
- Contains: Service classes named `*Service.ts` plus one legacy file `src/backend/src/service/EmployeeDeductions.ts`.
- Key files: `src/backend/src/service/NomineeService.ts`, `src/backend/src/service/PayrollService.ts`, `src/backend/src/service/ReportsService.ts`.

**`src/backend/src/model/`:**
- Purpose: TypeScript entity/interface contracts used by backend services/controllers.
- Contains: Domain model files in lower camel/snake mix (e.g., `employee.ts`, `payrollType.ts`, `ImportSession.ts`).
- Key files: `src/backend/src/model/employee.ts`, `src/backend/src/model/payroll.ts`, `src/backend/src/model/user.ts`.

**`src/backend/src/middleware/`:**
- Purpose: Reusable HTTP middleware.
- Contains: Auth and body-validation middleware.
- Key files: `src/backend/src/middleware/AuthMiddleware.ts`, `src/backend/src/middleware/validateBody.ts`.

**`src/backend/src/utils/`:**
- Purpose: Shared utility functions for request handling and payroll math.
- Contains: Async wrapper, Swagger docs builder, payroll calculators.
- Key files: `src/backend/src/utils/asyncHandler.ts`, `src/backend/src/utils/payrollUtils.ts`, `src/backend/src/utils/docs.ts`.

**`src/backend/prisma/`:**
- Purpose: Database schema and migration history.
- Contains: `schema.prisma` and timestamped migration directories.
- Key files: `src/backend/prisma/schema.prisma`, `src/backend/prisma/migrations/20260405_add_clock_log_enums_and_tracing/migration.sql`.

**`src/frontend/src/app/`:**
- Purpose: Next.js App Router entry and global layout shell wiring.
- Contains: `layout.tsx`, root redirect page, `not-found.tsx`, and `pages/` feature routes.
- Key files: `src/frontend/src/app/layout.tsx`, `src/frontend/src/app/page.tsx`, `src/frontend/src/app/pages/reports/page.tsx`.

**`src/frontend/src/app/pages/`:**
- Purpose: Feature route groups.
- Contains: Domain folders (`payroll/`, `employee/`, `reports/`, `clock-logs/`, `vacations/`, etc.) with nested `page.tsx` files.
- Key files: `src/frontend/src/app/pages/payroll/calculate/page.tsx`, `src/frontend/src/app/pages/employee/list/page.tsx`, `src/frontend/src/app/pages/auth/page.tsx`.

**`src/frontend/src/hooks/`:**
- Purpose: Page/use-case state management and orchestration.
- Contains: Hooks prefixed with `use` and a few provider hooks (`useAuth.tsx`, `useTheme.tsx`).
- Key files: `src/frontend/src/hooks/useNominee.ts`, `src/frontend/src/hooks/useEmployeeList.ts`, `src/frontend/src/hooks/usePayroll.ts`.

**`src/frontend/src/services/`:**
- Purpose: HTTP-facing API adapters and transport abstraction.
- Contains: Domain services (`*Service.ts`) and centralized client `http.ts`.
- Key files: `src/frontend/src/services/http.ts`, `src/frontend/src/services/nomineeService.ts`, `src/frontend/src/services/reportsService.ts`.

**`src/frontend/src/components/`:**
- Purpose: Reusable feature components and modal/table views.
- Contains: PascalCase React components and nested UI primitives in `src/frontend/src/components/ui/`.
- Key files: `src/frontend/src/components/PayrollResults.tsx`, `src/frontend/src/components/EmployeeTable.tsx`, `src/frontend/src/components/ui/Sidebar.tsx`.

**`src/frontend/src/types/`:**
- Purpose: Frontend TypeScript contracts for APIs and UI entities.
- Contains: Domain type modules and index barrel.
- Key files: `src/frontend/src/types/reports.ts`, `src/frontend/src/types/employee.ts`, `src/frontend/src/types/index.ts`.

**`src/frontend/src/schemas/`:**
- Purpose: Frontend Zod/form schemas.
- Contains: Validation schemas by domain.
- Key files: `src/frontend/src/schemas/vacationSchema.ts`, `src/frontend/src/schemas/employee.ts`.

## Key File Locations

**Entry Points:**
- `src/backend/src/index.ts`: Express server bootstrap, middleware wiring, and route mounting.
- `src/frontend/src/app/layout.tsx`: Root Next layout and client shell hook-in.
- `src/frontend/src/app/page.tsx`: Root route redirect to authentication page.

**Configuration:**
- `src/backend/package.json`: Backend scripts/dependencies.
- `src/backend/tsconfig.json`: Backend TypeScript compile settings (`src` → `dist`).
- `src/frontend/package.json`: Frontend scripts/dependencies.
- `src/frontend/tsconfig.json`: Frontend TS config including alias `@/*`.
- `src/frontend/next.config.ts`: Next runtime optimization config.
- `src/frontend/eslint.config.mjs`: Frontend lint baseline.
- `src/backend/.env`: Environment file present for backend configuration (do not read/commit secrets).
- `src/frontend/.env`: Environment file present for frontend configuration (do not read/commit secrets).

**Core Logic:**
- `src/backend/src/service/NomineeService.ts`: Payroll calculation orchestration and persistence.
- `src/backend/src/service/PayrollService.ts`: Payroll CRUD and payroll-employee aggregation.
- `src/backend/src/service/ReportsService.ts`: Official report generation/logging/email dispatch.
- `src/backend/src/utils/payrollUtils.ts`: Payroll math primitives.
- `src/frontend/src/hooks/useEmployeeList.ts`: Employee list state/workflow.
- `src/frontend/src/services/http.ts`: Auth-aware HTTP transport used by frontend services.

**Testing:**
- `src/backend/src/__tests__/unit/`: Backend unit tests.
- `src/backend/src/__tests__/integration/`: Backend integration tests.
- `src/backend/src/__tests__/setup/prisma-mock.ts`: Prisma test mock setup.
- `src/frontend/src/__tests__/components/`: Frontend component tests.
- `src/frontend/src/__tests__/hooks/`: Frontend hook tests.
- `src/frontend/src/__tests__/services/`: Frontend service tests.

## Naming Conventions

**Files:**
- Backend routes/controllers/services use PascalCase with role suffix: `PayrollRoutes.ts`, `PayrollController.ts`, `PayrollService.ts`.
- Frontend components use PascalCase: `EmployeeTable.tsx`, `PayrollCreateModal.tsx`.
- Frontend hooks use `use*` naming: `useNominee.ts`, `useEmployeeList.ts`.
- Frontend services use lower camel names ending in `Service.ts` plus `http.ts`: `payrollService.ts`, `reportsService.ts`, `http.ts`.
- Page route files are always `page.tsx` under domain folders in `src/frontend/src/app/pages/`.

**Directories:**
- Backend organizes by technical layer under `src/backend/src/` (`routes`, `controller`, `service`, `middleware`, `utils`, `model`, `schemas`, `types`).
- Frontend organizes by UI/runtime role under `src/frontend/src/` (`app`, `components`, `hooks`, `services`, `schemas`, `types`, `utils`).

## Where to Add New Code

**New Feature:**
- Primary code:
  - Backend endpoint surface: add route in `src/backend/src/routes/`, controller in `src/backend/src/controller/`, service logic in `src/backend/src/service/`.
  - Frontend UI route: add `page.tsx` under matching domain in `src/frontend/src/app/pages/<domain>/`.
  - Frontend data flow: add hook in `src/frontend/src/hooks/` and service adapter in `src/frontend/src/services/`.
- Tests:
  - Backend unit/integration tests in `src/backend/src/__tests__/unit/` or `src/backend/src/__tests__/integration/`.
  - Frontend tests in `src/frontend/src/__tests__/components/`, `src/frontend/src/__tests__/hooks/`, or `src/frontend/src/__tests__/services/`.

**New Component/Module:**
- Implementation:
  - Reusable UI component in `src/frontend/src/components/` (or primitive in `src/frontend/src/components/ui/`).
  - Backend helper module in `src/backend/src/utils/` when logic is cross-service and side-effect free.

**Utilities:**
- Shared helpers:
  - Backend helpers in `src/backend/src/utils/`.
  - Frontend helpers in `src/frontend/src/utils/`.
  - Shared frontend constants/config in `src/frontend/src/constants/` and `src/frontend/src/config/`.

## Special Directories

**`src/backend/dist/`:**
- Purpose: Compiled JavaScript output from backend TypeScript build.
- Generated: Yes.
- Committed: Yes (present in repository snapshot).

**`src/frontend/.next/`:**
- Purpose: Next.js build artifacts and cache.
- Generated: Yes.
- Committed: No (workspace artifact; should stay uncommitted).

**`src/backend/node_modules/` and `src/frontend/node_modules/`:**
- Purpose: Installed package dependencies.
- Generated: Yes.
- Committed: No.

**`src/backend/prisma/migrations/`:**
- Purpose: Versioned database migration history.
- Generated: Yes (via Prisma migration tooling).
- Committed: Yes.

**`.planning/`:**
- Purpose: GSD planning state, milestone records, and generated codebase mapping docs.
- Generated: Mixed (manual + generated by workflow commands).
- Committed: Yes (project workflow metadata).

---

*Structure analysis: 2026-04-09*
