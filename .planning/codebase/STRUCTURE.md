# Codebase Structure

**Analysis Date:** 2026-03-26

## Directory Layout

```
VP-Planilla/
├── src/
│   ├── backend/                  # Express 5 REST API (Node.js 22, TypeScript 5.8)
│   │   ├── prisma/               # Prisma schema and migrations
│   │   │   └── schema.prisma     # Single source of truth for DB schema
│   │   └── src/
│   │       ├── index.ts          # Express app entry point, route registration, CORS
│   │       ├── controller/       # HTTP request/response handlers (static classes)
│   │       ├── service/          # Business logic + Prisma queries (static classes)
│   │       ├── routes/           # Express Routers — auth + validation middleware applied here
│   │       ├── middleware/       # AuthMiddleware.ts, validateBody.ts
│   │       ├── schemas/          # Zod schemas for request body validation
│   │       ├── model/            # Plain TypeScript interfaces (no logic)
│   │       ├── types/            # Domain types (payroll.types.ts)
│   │       ├── lib/              # Singleton Prisma client
│   │       ├── utils/            # asyncHandler, payrollUtils, docs
│   │       ├── scripts/          # One-off scripts (not called at runtime)
│   │       └── __tests__/        # Jest unit tests
│   │           ├── setup/        # Test setup files
│   │           └── unit/
│   │               └── services/ # Service-level unit tests
│   ├── frontend/                 # Next.js 15 app (TypeScript 5.9, React 19)
│   │   └── src/
│   │       ├── app/              # Next.js App Router
│   │       │   ├── page.tsx      # Root redirect to /pages/auth
│   │       │   ├── layout.tsx    # Root layout (mounts ClientLayout)
│   │       │   └── pages/        # Feature pages (all "use client")
│   │       │       ├── auth/     # Login page
│   │       │       ├── main/     # Dashboard
│   │       │       ├── employee/ # Employee list, edit, events
│   │       │       ├── payroll/  # Payroll list, calculate, detail
│   │       │       ├── vacations/
│   │       │       ├── clocklogs/
│   │       │       ├── bonuses/
│   │       │       ├── deductions/
│   │       │       ├── employee-deductions/
│   │       │       ├── payroll-types/
│   │       │       ├── positions/
│   │       │       ├── branches/
│   │       │       ├── attendance/
│   │       │       ├── audit-logs/
│   │       │       ├── reports/
│   │       │       └── users/
│   │       ├── layouts/          # ClientLayout (auth guard, sidebar, header)
│   │       ├── components/       # Reusable UI components and modals
│   │       │   └── ui/           # Low-level UI primitives
│   │       ├── hooks/            # Data/state hooks (use<Domain>.ts)
│   │       ├── services/         # API call wrappers + http.ts
│   │       ├── schemas/          # Zod schemas for form validation
│   │       ├── types/            # Shared TypeScript interfaces
│   │       ├── constants/        # SCREAMING_SNAKE_CASE constants
│   │       ├── config/           # App configuration (API base URL)
│   │       ├── utils/            # Pure utility functions
│   │       └── styles/           # Global CSS
│   └── Java/                     # Standalone clock-log parser (not called by API at runtime)
├── design/                       # Design assets
├── docs/                         # Project documentation
└── CLAUDE.md                     # Operating manual for Claude Code
```

---

## Directory Purposes

### Backend

**`src/backend/src/routes/`:**
- One file per domain: `EmployeeRoute.ts`, `PayrollRoutes.ts`, `NomineeRoute.ts`, etc.
- Pattern: Apply `router.use(AuthMiddleware.verifyToken)` at the top, then declare routes with `asyncHandler` wrapper
- Validated routes compose `validateBody(schema)` as a middleware step before the handler
- All 16 route files registered in `src/backend/src/index.ts` under the `/api` prefix

**`src/backend/src/schemas/`:**
- `EmployeeSchema.ts` — create and update schemas; update schema accepts both `employee_`-prefixed and unprefixed field names
- `DeductionSchema.ts` — create and update schemas with optional `percentage` and `fixed_amount`
- `PayrollSchema.ts` — create and update schemas
- `ClockLogSchema.ts` — bulk create schema (array of log items)
- `UserSchema.ts` — update permissions (role field only)
- Each file exports: Zod schema object + `z.infer<>` TypeScript type

**`src/backend/src/middleware/`:**
- `AuthMiddleware.ts` — `verifyToken` (required), `requireRole(roles[])` (admin gate), `optionalAuth` (never fails)
- `validateBody.ts` — factory `(schema: ZodSchema) => RequestHandler` — replaces `req.body` with parsed value

**`src/backend/src/service/`:**
- All files are static classes except `NomineeService.ts` (instance class with static preload methods)
- `NomineeService.ts` is the most complex: contains `calculatePayrollForPeriod`, 6 private static preload methods, and `savePayrollEmployees`
- `PayrollService.ts` handles CRUD for payroll records
- `AuthService.ts` handles bcrypt verification, JWT signing/verification, token refresh

**`src/backend/src/types/`:**
- `payroll.types.ts` — the only file; defines all payroll calculation interfaces consumed by both backend services and frontend

**`src/backend/src/lib/`:**
- `prisma.ts` — exports `prisma` (singleton), `getQueryCount()`, `resetQueryCount()`

**`src/backend/src/__tests__/`:**
- `unit/services/PayrollService.test.ts` — only test file currently present
- `setup/` — Jest setup configuration

### Frontend

**`src/frontend/src/app/pages/`:**
- Each domain gets a subdirectory. Most have a `list/page.tsx`; some have nested routes like `payroll/[id]/employees` or `employee/edit/[id]`
- All pages are `"use client"` and consume hooks — they do not import from `services/` directly

**`src/frontend/src/layouts/main.tsx`:**
- Single layout file. Wraps all non-auth pages with Sidebar + Header.
- Contains auth guard: redirects to `/pages/auth` if `!isAuthenticated && !loading`

**`src/frontend/src/hooks/`:**
- Collocated with services (same directory): hooks are named `use<Domain>.ts`
- Notable: `useAuth.ts` and `useAuth.tsx` both exist — `useAuth.tsx` provides `AuthProvider` context; `useAuth.ts` provides the hook
- `useTheme.tsx` provides `ThemeProvider` + `useTheme` hook (dark mode)

**`src/frontend/src/services/`:**
- `http.ts` — central HTTP client (never bypass)
- `index.ts` — barrel re-export of all service functions
- One file per domain: `employeeService.ts`, `payrollService.ts`, `nomineeService.ts`, etc.
- `branchService.ts` exists in services but has no corresponding backend route (frontend-only or placeholder)

**`src/frontend/src/schemas/`:**
- `employee.ts` — `employeeSchema` used in `AddEmployeeModal`
- `vacationSchema.ts` — used in vacation creation form

**`src/frontend/src/types/`:**
- `index.ts` — barrel re-export
- Domain files: `employee.ts`, `branch.ts`, `laborEvent.ts`, `payrollEmployee.ts`, `payrollTypes.ts`, `reports.ts`, `employeeDeductions.ts`, `auditLog.ts`

**`src/frontend/src/constants/`:**
- `index.ts` — exports SCREAMING_SNAKE_CASE constants (e.g., `EMPLOYEE_STATUS`)

**`src/frontend/src/utils/`:**
- `employeeUtils.ts` — `calculateEmployeeStats`, `filterEmployees`, `formatSalary`, `getStatusBadgeConfig`, etc.
- `formatters.ts` — display formatting helpers
- `number.ts` — numeric formatting
- `time.ts` — date/time utilities
- `weather.ts` — weather-related utilities

**`src/frontend/src/components/`:**
- Feature components: `EmployeeTable.tsx`, `AddEmployeeModal.tsx`, `EditEmployeeModal.tsx`, `DismissEmployeeModal.tsx`, `PayrollCreateModal.tsx`, `PayrollResults.tsx`, `PositionsModal.tsx`, etc.
- `ui/` subdirectory: low-level UI primitives (Sidebar, Header, DatePicker, EmployeeTabs, etc.)

---

## Key File Locations

**Entry Points:**
- Backend: `src/backend/src/index.ts` — Express app, all route registrations
- Frontend: `src/frontend/src/app/page.tsx` — redirects to auth; `src/frontend/src/app/layout.tsx` — mounts `ClientLayout`
- Frontend layout + auth guard: `src/frontend/src/layouts/main.tsx`

**Configuration:**
- Backend: `src/backend/prisma/schema.prisma` — database schema
- Backend: `src/backend/src/lib/prisma.ts` — singleton Prisma client
- Frontend: `src/frontend/src/config/index.ts` — `API_CONFIG.baseUrl` from `NEXT_PUBLIC_API_URL`
- Frontend: `src/frontend/src/services/http.ts` — central HTTP client

**Core Logic:**
- Payroll math: `src/backend/src/utils/payrollUtils.ts`
- Payroll types: `src/backend/src/types/payroll.types.ts`
- Payroll calculation: `src/backend/src/service/NomineeService.ts`
- Auth: `src/backend/src/service/AuthService.ts`, `src/backend/src/middleware/AuthMiddleware.ts`

**Validation:**
- Backend schemas: `src/backend/src/schemas/` (5 files)
- Backend middleware: `src/backend/src/middleware/validateBody.ts`
- Frontend schemas: `src/frontend/src/schemas/` (2 files)

**Testing:**
- `src/backend/src/__tests__/unit/services/PayrollService.test.ts`
- Jest config: `src/backend/jest.config.*`

---

## Naming Conventions

**Backend files:**
- Routes, Controllers, Services: `PascalCase.ts` — e.g., `EmployeeRoute.ts`, `EmployeeController.ts`, `EmployeeService.ts`
- Schemas: `PascalCase + Schema.ts` — e.g., `EmployeeSchema.ts`
- Models: `camelCase.ts` — e.g., `employee.ts`, `payroll.ts`

**Frontend files:**
- Pages: `page.tsx` (Next.js convention) inside domain subdirectory
- Components: `PascalCase.tsx` — e.g., `EmployeeTable.tsx`
- Hooks: `use<Domain>.ts` or `use<Domain>.tsx` — e.g., `useEmployeeList.ts`
- Services: `camelCase.ts` — e.g., `employeeService.ts`
- Schemas: `camelCase.ts` — e.g., `employee.ts`, `vacationSchema.ts`
- Types: `camelCase.ts` — e.g., `employee.ts`, `laborEvent.ts`

**Database / Prisma:**
- All table names: `vpg_` prefix + `snake_case` — e.g., `vpg_employees`, `vpg_payroll_employee`
- All column names: `tablename_fieldname` pattern — e.g., `employee_first_name`, `payrolls_period_start`

---

## Where to Add New Code

**New backend domain (e.g., "Benefits"):**
1. Model interface: `src/backend/src/model/benefit.ts`
2. Zod schemas: `src/backend/src/schemas/BenefitSchema.ts`
3. Service: `src/backend/src/service/BenefitService.ts` (static class, import singleton prisma)
4. Controller: `src/backend/src/controller/BenefitController.ts` (static class, calls service)
5. Route: `src/backend/src/routes/BenefitRoute.ts` (start with `router.use(AuthMiddleware.verifyToken)`)
6. Register: add `app.use("/api", benefitRoutes)` in `src/backend/src/index.ts`

**New frontend domain page:**
1. Page: `src/frontend/src/app/pages/benefits/list/page.tsx` (`"use client"`, consumes hook)
2. Hook: `src/frontend/src/hooks/useBenefits.ts` (returns `{ data, isLoading, error, ...actions }`)
3. Service: `src/frontend/src/services/benefitsService.ts` (calls `http.get/post/put/delete`)
4. Types: `src/frontend/src/types/benefit.ts`
5. Components: `src/frontend/src/components/BenefitModal.tsx` (if modal needed)

**New backend validation schema:**
- Create in `src/backend/src/schemas/BenefitSchema.ts`
- Import and apply in route: `validateBody(createBenefitSchema)` as middleware before the handler

**New frontend form:**
- Zod schema in `src/frontend/src/schemas/benefitSchema.ts`
- Use `useForm<InputType, unknown, OutputType>({ resolver: zodResolver(schema), defaultValues })`

**New shared utility:**
- Backend pure function: `src/backend/src/utils/` (only if truly generic — do not put business logic here)
- Frontend pure function: `src/frontend/src/utils/` (appropriate file by concern)

---

## Special Directories

**`src/backend/prisma/`:**
- Purpose: Prisma schema and migration history
- Generated: Migrations are generated by `npx prisma migrate dev`
- Committed: Yes — both schema and migrations must be committed

**`src/Java/`:**
- Purpose: Standalone Java utility for parsing clock-log exports
- Generated: No
- Runtime: Not called by the Node.js API at runtime; run independently

**`src/backend/src/scripts/`:**
- Purpose: One-off database or data scripts
- Runtime: Run manually, not imported by the application

**`src/backend/src/__tests__/`:**
- Purpose: Jest unit tests; only services layer is currently tested
- Test files: co-located under `__tests__/unit/services/`

---

*Structure analysis: 2026-03-26*
