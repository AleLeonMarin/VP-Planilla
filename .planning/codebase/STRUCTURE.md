# Codebase Structure

**Analysis Date:** 2026-03-26

## Directory Layout

```
Vp-Planilla/                        # Repo root
├── src/
│   ├── backend/                    # Express 5 + TypeScript REST API
│   │   ├── prisma/                 # Prisma schema and migrations
│   │   │   └── schema.prisma       # Single source of truth for DB schema
│   │   ├── src/
│   │   │   ├── index.ts            # App entry point — Express bootstrap
│   │   │   ├── routes/             # Express Router definitions (16 files)
│   │   │   ├── controller/         # Request/response handlers (16 files)
│   │   │   ├── service/            # Business logic + Prisma queries (16 files)
│   │   │   ├── model/              # TypeScript interfaces only (24 files)
│   │   │   ├── middleware/         # AuthMiddleware, validateBody
│   │   │   ├── lib/                # Prisma singleton (prisma.ts)
│   │   │   ├── schemas/            # Zod schemas for request validation (5 files)
│   │   │   ├── types/              # Shared domain types (payroll.types.ts)
│   │   │   ├── utils/              # Pure utilities (asyncHandler, payrollUtils, docs)
│   │   │   └── scripts/            # DB seed scripts (seedDeductions.ts)
│   │   ├── templates/              # Handlebars HTML for PDF generation
│   │   ├── __tests__/              # Jest unit tests
│   │   │   └── unit/services/      # Service-level unit tests
│   │   ├── dist/                   # TypeScript build output (gitignored)
│   │   ├── coverage/               # Jest coverage output (gitignored)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── frontend/                   # Next.js 15 + React 19 SPA
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx      # Root layout — imports ClientLayout
│   │   │   │   ├── page.tsx        # Root redirect → /pages/auth
│   │   │   │   ├── not-found.tsx   # 404 page
│   │   │   │   └── pages/          # All application pages (26 page.tsx files)
│   │   │   │       ├── auth/       # Login page
│   │   │   │       ├── main/       # Dashboard
│   │   │   │       ├── employee/   # list/, edit/[id]/, events/
│   │   │   │       ├── payroll/    # list/, [id]/, [id]/employees/, calculate/
│   │   │   │       ├── vacations/  # list/, create/, [id]/
│   │   │   │       ├── bonuses/list/
│   │   │   │       ├── deductions/list/
│   │   │   │       ├── employee-deductions/list/
│   │   │   │       ├── payroll-types/list/
│   │   │   │       ├── positions/list/
│   │   │   │       ├── clocklogs/list/
│   │   │   │       ├── branches/list/
│   │   │   │       ├── attendance/
│   │   │   │       ├── audit-logs/
│   │   │   │       ├── reports/
│   │   │   │       └── users/
│   │   │   ├── components/         # Reusable React components
│   │   │   │   ├── ui/             # Generic UI primitives
│   │   │   │   └── *.tsx           # Domain-specific components
│   │   │   ├── hooks/              # Custom React hooks (21 files)
│   │   │   ├── services/           # API call functions + http.ts (18 files)
│   │   │   ├── layouts/            # main.tsx — shell layout + AuthProvider
│   │   │   ├── schemas/            # Frontend Zod schemas (form validation)
│   │   │   ├── types/              # Shared TypeScript interfaces
│   │   │   ├── constants/          # SCREAMING_SNAKE_CASE constants (index.ts)
│   │   │   ├── config/             # App config (API URLs, UI colors)
│   │   │   ├── styles/             # globals.css (Tailwind base)
│   │   │   └── utils/              # Pure utility functions
│   │   ├── public/                 # Static assets (fonts, images)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── next.config.ts
│   │
│   ├── Java/clocklogs/             # Standalone Java clock-log parser (NOT called by Node API)
│   ├── API/                        # Legacy API reference docs
│   └── DB/                         # DB reference files
│
├── docs/                           # Formal documentation (LaTeX, contracts, reports)
├── design/                         # UI design assets
├── .planning/                      # GSD planning files
│   ├── codebase/                   # Architecture, stack, conventions documents
│   └── phases/                     # Per-phase implementation plans
└── CLAUDE.md                       # Project operating manual for Claude Code
```

---

## Directory Purposes

**`src/backend/src/routes/`**
- One `*Route.ts` file per domain
- Declares HTTP method + path, applies middleware chain, calls controller
- Files: `AuthRoute.ts`, `EmployeeRoute.ts`, `PayrollRoutes.ts`, `NomineeRoute.ts`, `VacationRoute.ts`, `DeductionsRoute.ts`, `EmployeeDeductionsRoute.ts`, `BonusesRoute.ts`, `ClockLogsRoute.ts`, `LaborEventsRoute.ts`, `PayrollTypeRoute.ts`, `PositionRoute.ts`, `ReportsRoute.ts`, `AuditLogsRoute.ts`, `UserRoute.ts`, `PaymentReceiptRoute.ts`

**`src/backend/src/controller/`**
- One `*Controller.ts` per domain with static methods only
- Responsibility: parse req, remap fields, call service, return res
- Never contains business logic or direct Prisma calls

**`src/backend/src/service/`**
- One `*Service.ts` per domain with static methods only
- Key files:
  - `NomineeService.ts` — payroll calculation orchestrator (imports from 6+ other services)
  - `AuthService.ts` — JWT generation, verification, bcrypt password handling
  - `PayrollService.ts` — payroll CRUD
  - `ReportsService.ts` — report generation using Puppeteer + pdf-lib
- All must use `import { prisma } from '../lib/prisma'`

**`src/backend/src/model/`**
- Plain TypeScript interfaces, no logic
- Field names use `snake_case` and match Prisma schema column names
- Key files: `employee.ts`, `payroll.ts`, `payrollEmployee.ts`, `user.ts`, `vacations.ts`

**`src/backend/src/middleware/`**
- `AuthMiddleware.ts` — `verifyToken`, `requireRole`, `optionalAuth` static methods
- `validateBody.ts` — factory returning Express middleware that validates `req.body` against a Zod schema

**`src/backend/src/lib/`**
- `prisma.ts` — exports the singleton `prisma` instance. The only place `new PrismaClient()` is called.

**`src/backend/src/schemas/`**
- Zod schemas for backend request validation
- Files: `EmployeeSchema.ts`, `DeductionSchema.ts`, `ClockLogSchema.ts`, `PayrollSchema.ts`, `UserSchema.ts`
- Each exports a schema + inferred TypeScript type via `z.infer<>`

**`src/backend/src/types/`**
- `payroll.types.ts` — shared payroll calculation interfaces: `PayrollPeriod`, `DayWork`, `DeductionBreakdown`, `Inconsistency`, `EmployeePayroll`, `PayrollSummary`, `PayrollCalculationResult`
- Both `NomineeService` and frontend types depend on this shape — do not change without updating both

**`src/backend/src/utils/`**
- `asyncHandler.ts` — Express error boundary wrapper for async route handlers
- `payrollUtils.ts` — Pure Costa Rica labor law math functions (unit tested)
- `docs.ts` — Swagger spec generation via `swagger-jsdoc`

**`src/backend/templates/`**
- `payment-receipt-template.html` — Handlebars template for payment receipt PDFs
- `payment-receipt-dynamic.html` — Dynamic variant
- Used by `PaymentReceiptService.ts` via Puppeteer

**`src/backend/src/__tests__/`**
- `unit/services/` — Jest unit tests for service-level logic
- `setup/` — Jest global setup (e.g., Prisma mock setup)

**`src/frontend/src/app/pages/`**
- All pages are `"use client"` components
- Route corresponds to URL: `pages/employee/list/page.tsx` → `/pages/employee/list`
- Dynamic routes use Next.js `[id]` bracket syntax: `pages/payroll/[id]/page.tsx`
- Each page imports exactly one hook to drive its logic

**`src/frontend/src/components/`**
- Domain-specific components: `EmployeeTable.tsx`, `AddEmployeeModal.tsx`, `PayrollResults.tsx`, etc.
- `ui/` subdirectory: generic primitives used across domains: `Sidebar.tsx`, `Header.tsx`, `Modal.tsx`, `Table.tsx`, `FormModal.tsx`, `ConfirmDialog.tsx`, `EmployeeTabs.tsx`, `StatsCards.tsx`

**`src/frontend/src/hooks/`**
- One hook per domain/page
- Key files:
  - `useAuth.ts` / `useAuth.tsx` — authentication state + `AuthProvider` context
  - `useEmployeeList.ts` — employee list with search, filter, modal state
  - `usePayroll.ts` — payroll CRUD
  - `useNominee.ts` — payroll calculation
  - `useVacations.ts`, `useBonuses.ts`, `useDeductions.ts`, etc.

**`src/frontend/src/services/`**
- `http.ts` — central HTTP client (never bypass)
- `index.ts` — barrel file re-exporting all services
- Per-domain: `employeeService.ts`, `payrollService.ts`, `nomineeService.ts`, `vacationsService.ts`, etc.

**`src/frontend/src/layouts/`**
- `main.tsx` — `ClientLayout` component: wraps app in `AuthProvider`, conditionally renders `<Sidebar>` + `<Header>` (skipped on auth page)

**`src/frontend/src/schemas/`**
- Frontend Zod schemas for form validation
- `employee.ts` — employee form schema (used with `zodResolver` in `react-hook-form`)
- `vacationSchema.ts`

**`src/frontend/src/types/`**
- Shared TypeScript interfaces consumed by hooks, services, components
- `index.ts` — barrel re-export
- Key files: `employee.ts`, `branch.ts`, `laborEvent.ts`, `payrollEmployee.ts`, `payrollTypes.ts`, `reports.ts`

**`src/frontend/src/constants/`**
- `index.ts` — all app-wide constants in `SCREAMING_SNAKE_CASE`
- Includes: `EMPLOYEE_STATUS` (maps status codes to display values)

**`src/frontend/src/config/`**
- `index.ts` — `API_CONFIG` (base URL from `NEXT_PUBLIC_API_URL`), `APP_CONFIG`, `UI_CONFIG`

**`src/frontend/src/utils/`**
- Pure helper functions: `employeeUtils.ts`, `formatters.ts`, `number.ts`, `time.ts`, `weather.ts`

---

## Key Files

**Backend:**
- `src/backend/src/index.ts` — Express app setup and route mounting
- `src/backend/src/lib/prisma.ts` — Prisma singleton export
- `src/backend/src/middleware/AuthMiddleware.ts` — JWT verification
- `src/backend/src/middleware/validateBody.ts` — Zod body validation middleware
- `src/backend/src/utils/asyncHandler.ts` — async error boundary
- `src/backend/src/utils/payrollUtils.ts` — Costa Rica labor law math (unit tested)
- `src/backend/src/types/payroll.types.ts` — payroll calculation return types
- `src/backend/src/service/NomineeService.ts` — payroll calculation orchestrator
- `src/backend/prisma/schema.prisma` — database schema (all tables use `vpg_` prefix)

**Frontend:**
- `src/frontend/src/services/http.ts` — central HTTP client with JWT refresh
- `src/frontend/src/services/index.ts` — barrel re-export of all services
- `src/frontend/src/layouts/main.tsx` — auth guard + shell layout
- `src/frontend/src/app/layout.tsx` — Next.js root layout
- `src/frontend/src/config/index.ts` — API base URL configuration

---

## Naming Conventions

**Backend files:**
- Routes, Controllers, Services: `PascalCase` — `EmployeeRoute.ts`, `EmployeeController.ts`, `EmployeeService.ts`
- Models: `camelCase` — `employee.ts`, `payrollEmployee.ts`
- Schemas: `PascalCase` — `EmployeeSchema.ts`
- Exception: `EmployeeDeductions.ts` (service) — inconsistent with others

**Frontend files:**
- Pages: `page.tsx` (Next.js convention)
- Components: `PascalCase.tsx` — `EmployeeTable.tsx`, `AddEmployeeModal.tsx`
- Hooks: `camelCase` with `use` prefix — `useEmployeeList.ts`
- Services: `camelCase` — `employeeService.ts`, `payrollService.ts`
- Schemas: `camelCase` — `employee.ts`, `vacationSchema.ts`

**DB tables:** All use `vpg_` prefix + `snake_case` — `vpg_employees`, `vpg_payrolls`
**DB columns:** `tablename_fieldname` pattern — `employee_first_name`, `payrolls_id`

---

## Where to Add New Code

**New domain (e.g., "benefits"):**
1. Backend model: `src/backend/src/model/benefit.ts` — TypeScript interface
2. Backend service: `src/backend/src/service/BenefitService.ts` — static class, import `{ prisma }`
3. Backend controller: `src/backend/src/controller/BenefitController.ts` — static class, delegate to service
4. Backend route: `src/backend/src/routes/BenefitRoute.ts` — `router.use(AuthMiddleware.verifyToken)`, `validateBody`, `asyncHandler`
5. Mount route in `src/backend/src/index.ts`: `app.use('/api', benefitRoutes)`
6. Backend schema (if write endpoints): `src/backend/src/schemas/BenefitSchema.ts`
7. Frontend service: `src/frontend/src/services/benefitService.ts` — functions calling `http.*`
8. Export from: `src/frontend/src/services/index.ts`
9. Frontend hook: `src/frontend/src/hooks/useBenefits.ts`
10. Frontend types: `src/frontend/src/types/benefit.ts` + add to `src/frontend/src/types/index.ts`
11. Frontend page: `src/frontend/src/app/pages/benefits/list/page.tsx`

**New API endpoint on existing domain:**
1. Add Zod schema (if write) to `src/backend/src/schemas/<Domain>Schema.ts`
2. Add static method to `src/backend/src/service/<Domain>Service.ts`
3. Add static method to `src/backend/src/controller/<Domain>Controller.ts`
4. Add route + `@swagger` annotation to `src/backend/src/routes/<Domain>Route.ts`

**New frontend component:**
- Domain-specific: `src/frontend/src/components/<ComponentName>.tsx`
- Generic UI primitive: `src/frontend/src/components/ui/<ComponentName>.tsx`

**New frontend modal:**
- Add to `src/frontend/src/components/<ActionName>Modal.tsx`
- Use `AnimatePresence` + `motion.div` animation pattern
- Form must use `react-hook-form` + `zodResolver` with schema from `src/frontend/src/schemas/`

**New Zod schema (frontend):**
- `src/frontend/src/schemas/<domain>.ts`

**New constant:**
- Add to `src/frontend/src/constants/index.ts` in `SCREAMING_SNAKE_CASE`

**DB schema change:**
- Edit `src/backend/prisma/schema.prisma`
- Run `npx prisma migrate dev --name <description>` from `src/backend/`
- Run `npx prisma generate` after migration

---

## Special Directories

**`src/Java/clocklogs/`**
- Purpose: Standalone Java utility that parses physical clock-log files and outputs structured data
- Generated: No — source code only (`src/main/java/`)
- Runtime: Never called by the Node.js API at runtime; output is imported manually into the DB
- Build: Maven (`pom.xml`)

**`src/backend/dist/`**
- Purpose: TypeScript compiled output
- Generated: Yes (by `tsc`)
- Committed: No

**`src/backend/coverage/`**
- Purpose: Jest code coverage reports
- Generated: Yes
- Committed: No

**`src/frontend/.next/`**
- Purpose: Next.js build cache and output
- Generated: Yes
- Committed: No

**`.planning/`**
- Purpose: GSD (Get Shit Done) workflow documents — phase plans, codebase analysis, project state
- Generated: Partially (by Claude Code agents)
- Committed: Yes

---

*Structure analysis: 2026-03-26*
