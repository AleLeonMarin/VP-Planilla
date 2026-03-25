# Codebase Structure

**Analysis Date:** 2026-03-25

## Root Layout

```
VP-Planilla/                        # Project root
├── src/                            # All source code
│   ├── frontend/                   # Next.js 15 frontend application
│   ├── backend/                    # Express/TypeScript REST API
│   ├── Java/                       # Legacy Java clock-log processor utility
│   ├── API/                        # API documentation / contract files
│   ├── DB/                         # Root-level database scripts (SQL)
│   └── env/                        # Environment file references (not secrets)
├── docs/                           # Project documentation (LaTeX formal docs, reports)
├── design/                         # Design assets
├── .planning/                      # GSD planning documents
│   └── codebase/                   # Codebase analysis documents
├── FLUJO_GUARDADO_PLANILLA.md      # Payroll flow documentation (Spanish)
├── parse_tmp.js                    # Scratch utility script
├── temp_script.py                  # Scratch utility script
└── test_hours.js                   # Ad-hoc hour calculation test
```

## Frontend Structure

```
src/frontend/
├── public/
│   ├── fonts/                      # Local font files
│   └── images/layout/              # Layout images (logo, etc.)
├── src/
│   ├── app/                        # Next.js App Router root
│   │   ├── layout.tsx              # Root layout — wraps all pages in ClientLayout
│   │   ├── page.tsx                # Root redirect page (/)
│   │   ├── not-found.tsx           # 404 page
│   │   ├── main.tsx                # Main app shell
│   │   └── pages/                  # Application routes (all "use client")
│   │       ├── attendance/         # Attendance overview page
│   │       ├── audit-logs/         # Audit log viewer
│   │       ├── auth/               # Login page
│   │       ├── bonuses/list/       # Bonuses list
│   │       ├── branches/list/      # Branches list
│   │       ├── clocklogs/list/     # Clock logs list
│   │       ├── deductions/list/    # Deduction catalog
│   │       ├── employee/
│   │       │   ├── list/           # Employee list with stats and modals
│   │       │   ├── edit/[id]/      # Employee edit (dynamic route)
│   │       │   └── events/         # Labor events calendar
│   │       ├── employee-deductions/list/  # Per-employee deduction assignments
│   │       ├── main/               # Dashboard home page
│   │       ├── payroll/
│   │       │   ├── list/           # Payroll history list
│   │       │   ├── calculate/      # Payroll calculation wizard
│   │       │   └── [id]/employees/ # Payroll detail with employee breakdown
│   │       ├── payroll-types/list/ # Payroll type catalog
│   │       ├── positions/list/     # Job positions catalog
│   │       ├── reports/            # Official report generation (CCSS/Hacienda)
│   │       ├── users/              # User management
│   │       └── vacations/
│   │           ├── list/           # Vacation list
│   │           ├── create/         # Create vacation request
│   │           └── [id]/           # Vacation detail
│   ├── components/                 # Shared React components
│   │   ├── ui/                     # Generic UI primitives
│   │   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   │   ├── Header.tsx          # Top header bar
│   │   │   ├── Table.tsx           # Generic data table
│   │   │   ├── Modal.tsx           # Generic modal wrapper
│   │   │   ├── FormModal.tsx       # Modal with form support
│   │   │   ├── ConfirmDialog.tsx   # Confirmation dialog
│   │   │   ├── StatsCards.tsx      # Statistics card layout
│   │   │   └── EmployeeTabs.tsx    # Employee section tab bar
│   │   ├── AddEmployeeModal.tsx
│   │   ├── EditEmployeeModal.tsx
│   │   ├── DismissEmployeeModal.tsx
│   │   ├── EmployeeTable.tsx
│   │   ├── EmployeeStatsCards.tsx
│   │   ├── EmployeeProfileCard.tsx
│   │   ├── EmployeeProfileModal.tsx
│   │   ├── EmployeeAttendanceTable.tsx
│   │   ├── EmployeeIncidenceCard.tsx
│   │   ├── LaborEventsCalendar.tsx
│   │   ├── LaborEventModal.tsx
│   │   ├── PayrollCalendar.tsx
│   │   ├── PayrollCreateModal.tsx
│   │   ├── PayrollResults.tsx
│   │   ├── DatePicker.tsx
│   │   ├── DashboardStats.tsx
│   │   ├── QuickActions.tsx
│   │   ├── RecentEmployees.tsx
│   │   ├── PositionsModal.tsx
│   │   └── SidebarItem.tsx
│   ├── config/
│   │   └── index.ts                # APP_CONFIG, API_CONFIG (baseUrl), UI_CONFIG
│   ├── constants/
│   │   └── index.ts                # Shared constant values
│   ├── hooks/                      # Custom React hooks (data fetching + state)
│   │   ├── useAuth.tsx             # AuthContext provider + useAuth hook
│   │   ├── user.ts                 # User state hook
│   │   ├── useModal.tsx            # Generic modal open/close state
│   │   ├── useLogin.ts
│   │   ├── useDashboard.ts
│   │   ├── useEmployeeList.ts
│   │   ├── useEmployeeEdit.ts
│   │   ├── useEmployeeTable.ts
│   │   ├── useAddEmployeeModal.ts
│   │   ├── useBranches.ts
│   │   ├── usePositions.ts
│   │   ├── useBonuses.ts
│   │   ├── useDeductions.ts
│   │   ├── useEmployeeDeductions.ts
│   │   ├── useLaborEvents.ts
│   │   ├── useAuditLogs.ts
│   │   ├── useNominee.ts           # Payroll calculation hook
│   │   ├── usePayroll.ts
│   │   ├── usePayrollEmployees.ts
│   │   ├── usePayrollTypes.ts
│   │   ├── useVacations.ts
│   │   └── useClockLogs.ts (implied)
│   ├── layouts/
│   │   └── main.tsx                # ClientLayout: AuthProvider + Sidebar + Header shell
│   ├── schemas/                    # Zod validation schemas for forms
│   │   ├── employee.ts
│   │   └── vacationSchema.ts
│   ├── services/                   # API client modules
│   │   ├── http.ts                 # Central fetch wrapper with JWT attach + refresh logic
│   │   ├── index.ts                # Barrel export for all services
│   │   ├── authService.ts
│   │   ├── employeeService.ts
│   │   ├── positionsService.ts
│   │   ├── branchService.ts
│   │   ├── bonusesService.ts
│   │   ├── deductionsService.ts
│   │   ├── employeeDeductionsService.ts
│   │   ├── clockLogsService.ts
│   │   ├── laborEventsService.ts
│   │   ├── vacationsService.ts
│   │   ├── nomineeService.ts       # Payroll calculation API calls
│   │   ├── payrollService.ts
│   │   ├── payrollEmployeesService.ts
│   │   ├── payrollTypesService.ts
│   │   ├── reportsService.ts
│   │   ├── auditLogsService.ts
│   │   └── userService.ts
│   ├── styles/
│   │   └── globals.css             # Global Tailwind CSS styles
│   ├── types/                      # Shared TypeScript types for frontend
│   │   ├── index.ts
│   │   ├── auditLog.ts
│   │   ├── branch.ts
│   │   ├── employee.ts
│   │   ├── employeeDeductions.ts
│   │   ├── laborEvent.ts
│   │   ├── payrollEmployee.ts
│   │   ├── payrollTypes.ts
│   │   └── reports.ts
│   └── utils/                      # Frontend utility functions
│       ├── index.ts
│       ├── employeeUtils.ts
│       ├── formatters.ts
│       ├── number.ts
│       ├── time.ts
│       └── weather.ts
├── next.config.ts                  # Minimal Next.js config (no customization)
└── package.json
```

## Backend Structure

```
src/backend/
├── src/
│   ├── index.ts                    # Express app entry point; mounts all routes at /api
│   ├── controller/                 # HTTP request handlers (one class per domain)
│   │   ├── AuthController.ts
│   │   ├── EmployeeController.ts
│   │   ├── PayrollController.ts
│   │   ├── NomineeController.ts    # Payroll calculation endpoint
│   │   ├── ReportsController.ts
│   │   ├── PayrollTypesController.ts
│   │   ├── BonusesController.ts
│   │   ├── DeductionsController.ts
│   │   ├── EmployeeDeductionsController.ts
│   │   ├── ClockLogsController.ts
│   │   ├── LaborEventsController.ts
│   │   ├── VacationController.ts
│   │   ├── AuditLogsController.ts
│   │   ├── PositionController.ts
│   │   ├── UserController.ts
│   │   └── PaymentReceiptController.ts
│   ├── service/                    # Business logic (one class per domain)
│   │   ├── AuthService.ts          # bcrypt + JWT; login/logout/refresh
│   │   ├── EmployeeService.ts
│   │   ├── PayrollService.ts
│   │   ├── NomineeService.ts       # Payroll calculation orchestrator (uses payrollUtils)
│   │   ├── ReportsService.ts       # CCSS/Hacienda report generation; Puppeteer PDF; Nodemailer
│   │   ├── PayrollTypeService.ts
│   │   ├── BonusesService.ts
│   │   ├── DeductionsService.ts
│   │   ├── EmployeeDeductions.ts
│   │   ├── ClockLogsService.ts
│   │   ├── LaborEventsService.ts
│   │   ├── VacationService.ts
│   │   ├── AuditLogsService.ts
│   │   ├── PositionService.ts
│   │   ├── UserService.ts
│   │   └── PaymentReceiptService.ts
│   ├── routes/                     # Express Router definitions (one file per domain)
│   │   ├── AuthRoute.ts            # POST /login, GET /me, POST /logout, POST /refresh, POST /validate
│   │   ├── EmployeeRoute.ts
│   │   ├── PayrollRoutes.ts        # GET /payrolls, POST /payroll/create, GET /payroll/:id, etc.
│   │   ├── NomineeRoute.ts
│   │   ├── ReportsRoute.ts
│   │   ├── PayrollTypeRoute.ts
│   │   ├── BonusesRoute.ts
│   │   ├── DeductionsRoute.ts
│   │   ├── EmployeeDeductionsRoute.ts
│   │   ├── ClockLogsRoute.ts
│   │   ├── LaborEventsRoute.ts
│   │   ├── VacationRoute.ts
│   │   ├── AuditLogsRoute.ts
│   │   ├── PositionRoute.ts
│   │   ├── UserRoute.ts
│   │   └── PaymentReceiptRoute.ts
│   ├── model/                      # TypeScript interfaces for domain entities
│   │   ├── employee.ts
│   │   ├── payroll.ts
│   │   ├── payrollEmployee.ts
│   │   ├── payrollType.ts
│   │   ├── user.ts
│   │   ├── bonus.ts
│   │   ├── branch.ts
│   │   ├── clockLog.ts
│   │   ├── deduction.ts
│   │   ├── deductionsPerEmployee.ts
│   │   ├── employeeDeductions.ts
│   │   ├── employeeDocuments.ts
│   │   ├── employeeLaborEvent.ts
│   │   ├── enterprise.ts
│   │   ├── laborEvent.ts
│   │   ├── position.ts
│   │   ├── vacations.ts
│   │   ├── auditLog.ts
│   │   ├── mailSender.ts
│   │   ├── reportLog.ts
│   │   ├── reportTarget.ts
│   │   ├── reportVersion.ts
│   │   └── relations.ts
│   ├── middleware/
│   │   └── AuthMiddleware.ts       # verifyToken, requireRole, optionalAuth
│   ├── lib/
│   │   └── prisma.ts               # Singleton PrismaClient (not always used — see CONCERNS)
│   ├── types/
│   │   └── payroll.types.ts        # Shared payroll domain types (PayrollPeriod, EmployeePayroll, etc.)
│   ├── utils/
│   │   ├── asyncHandler.ts         # Wraps async route handlers for error propagation
│   │   ├── payrollUtils.ts         # Pure payroll math functions (CR labor law constants)
│   │   └── docs.ts                 # swagger-jsdoc spec builder
│   ├── scripts/
│   │   └── seedDeductions.ts       # DB seed script for deduction catalog
│   └── __tests__/
│       ├── setup/                  # Jest setup files
│       └── unit/services/          # Unit tests for service classes
├── prisma/
│   └── schema.prisma               # Prisma schema — PostgreSQL datasource; all vpg_ models
├── templates/
│   ├── payment-receipt-template.html     # Handlebars HTML template for payment receipts
│   └── payment-receipt-dynamic.html      # Alternate payment receipt template
├── DB/
│   └── seed_payroll_test.sql       # Test payroll seed data SQL
├── dist/                           # TypeScript compiled output (gitignored)
├── coverage/                       # Jest coverage reports (gitignored)
├── tsconfig.json                   # TypeScript config for backend
└── package.json
```

## Java Module Structure

```
src/Java/clocklogs/                         # Standalone Maven Java utility
├── src/main/java/com/verde/pradera/
│   ├── controller/
│   │   └── ClockLogProcessor.java          # Main entry point — processes hardware files
│   ├── models/
│   │   ├── MarkType.java                   # Enum for clock mark types (IN/OUT)
│   │   ├── Serializer.java                 # Serialization utilities
│   │   ├── clockLogsDB.java                # DB connectivity for importing logs
│   │   └── clockLogsFiles.java             # File parser for time-attendance hardware format
│   └── utils/
└── pom.xml                                 # Maven build config
```

## Shared Code

**Backend shared types:**
- `src/backend/src/types/payroll.types.ts` — `PayrollPeriod`, `DayWork`, `DeductionBreakdown`, `EmployeePayroll`, `PayrollSummary`, `PayrollCalculationResult`
- `src/backend/src/model/` — per-entity interface files used across controller and service layers

**Frontend shared types:**
- `src/frontend/src/types/` — domain interfaces for API response shapes (employee, payroll, reports, etc.)
- `src/frontend/src/services/index.ts` — barrel export for all service classes and their types

**Frontend utilities:**
- `src/frontend/src/utils/formatters.ts` — display formatting
- `src/frontend/src/utils/number.ts` — number/currency helpers
- `src/frontend/src/utils/time.ts` — date/time helpers
- `src/frontend/src/utils/employeeUtils.ts` — employee-specific helpers
- `src/frontend/src/constants/index.ts` — shared string/number constants

**Frontend config:**
- `src/frontend/src/config/index.ts` — `API_CONFIG.baseUrl` defaults to `http://localhost:3001`; override via `NEXT_PUBLIC_API_URL` env var

## Configuration Files

| File | Purpose |
|------|---------|
| `src/backend/prisma/schema.prisma` | Prisma ORM schema; PostgreSQL datasource; all `vpg_` table models |
| `src/backend/package.json` | Backend dependencies (Express 5, Prisma, bcrypt, jsonwebtoken, Puppeteer, Nodemailer) |
| `src/frontend/package.json` | Frontend dependencies (Next.js 15, React 19, Tailwind 4, react-hook-form, zod, FullCalendar) |
| `src/frontend/next.config.ts` | Minimal Next.js config (no customizations currently) |
| `src/backend/tsconfig.json` | TypeScript config for backend compilation |
| `src/frontend/src/config/index.ts` | Centralized app/API/UI config constants |
| `.gitignore` | Ignores node_modules, .next, dist, coverage, .env files |

## Naming Conventions

**Files:**
- Backend: PascalCase for all classes (`PayrollController.ts`, `AuthService.ts`, `PayrollRoutes.ts`)
- Frontend pages: lowercase `page.tsx` (Next.js convention)
- Frontend components: PascalCase (`EmployeeTable.tsx`, `PayrollResults.tsx`)
- Frontend hooks: camelCase prefixed with `use` (`usePayroll.ts`, `useNominee.ts`)
- Frontend services: camelCase suffixed with `Service` (`payrollService.ts`, `employeeService.ts`)

**Directories:**
- Backend layers: lowercase singular (`controller`, `service`, `routes`, `model`, `middleware`)
- Frontend pages: kebab-case matching URL segments (`employee-deductions`, `payroll-types`, `audit-logs`)
- Frontend components: flat under `src/components/` (domain components) and `src/components/ui/` (primitives)

**Database:**
- All table names: `vpg_<entity>` (e.g., `vpg_payrolls`, `vpg_employees`)
- All column names: `<tablename_singular>_<fieldname>` (e.g., `payrolls_status`, `employee_first_name`)

## Where to Add New Code

**New domain feature (end-to-end):**
1. Backend model interface: `src/backend/src/model/<entity>.ts`
2. Backend service: `src/backend/src/service/<Entity>Service.ts`
3. Backend controller: `src/backend/src/controller/<Entity>Controller.ts`
4. Backend routes: `src/backend/src/routes/<Entity>Route.ts`, then import and mount in `src/backend/src/index.ts`
5. Frontend service: `src/frontend/src/services/<entity>Service.ts`, export from `src/frontend/src/services/index.ts`
6. Frontend hook: `src/frontend/src/hooks/use<Entity>.ts`
7. Frontend page: `src/frontend/src/app/pages/<entity>/list/page.tsx` (and other sub-pages as needed)
8. Add navigation entry in `src/frontend/src/components/ui/Sidebar.tsx`

**New reusable UI component:**
- Generic/primitive: `src/frontend/src/components/ui/<ComponentName>.tsx`
- Domain-specific: `src/frontend/src/components/<ComponentName>.tsx`

**New utility function:**
- Backend: `src/backend/src/utils/payrollUtils.ts` (payroll math) or create a new file in `src/backend/src/utils/`
- Frontend: `src/frontend/src/utils/` — add to existing file by category or create a new file

**New Zod form schema:**
- `src/frontend/src/schemas/<entity>.ts`

**New shared frontend type:**
- `src/frontend/src/types/<entity>.ts`, export from `src/frontend/src/types/index.ts`

## Special Directories

**`src/backend/dist/`:**
- Purpose: TypeScript compiled JavaScript output
- Generated: Yes (by `tsc`)
- Committed: No (gitignored)

**`src/backend/coverage/`:**
- Purpose: Jest test coverage reports
- Generated: Yes (by `jest --coverage`)
- Committed: No (gitignored)

**`src/frontend/.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes
- Committed: No (gitignored)

**`src/backend/templates/`:**
- Purpose: Handlebars HTML templates for Puppeteer PDF generation (payment receipts, reports)
- Generated: No (source files)
- Committed: Yes

**`src/backend/prisma/`:**
- Purpose: Prisma schema and migrations
- Generated: No (schema is source); `@prisma/client` is generated to `node_modules`
- Committed: Yes

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents for AI-assisted development
- Generated: Yes (by GSD map-codebase command)
- Committed: Yes

---

*Structure analysis: 2026-03-25*
