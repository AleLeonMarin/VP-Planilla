# External Integrations

**Analysis Date:** 2026-03-25

## Databases

**PostgreSQL:**
- Provider: PostgreSQL (declared in `src/backend/prisma/schema.prisma`)
- ORM/Client: Prisma 6.14.0 (`@prisma/client`)
- Singleton client: `src/backend/src/lib/prisma.ts`
- Connection: `DATABASE_URL` environment variable
- Schema file: `src/backend/prisma/schema.prisma`
- Models (15 tables, all prefixed `vpg_`):
  - `vpg_users` - System users / admin accounts
  - `vpg_employees` - Employee records
  - `vpg_positions` - Job positions with base salary
  - `vpg_branches` - Company branches
  - `vpg_enterprise` - Enterprise/company profile (stores logo as bytes)
  - `vpg_payrolls` - Payroll runs
  - `vpg_payroll_types` - Payroll type definitions
  - `vpg_payroll_employee` - Per-employee payroll calculation rows
  - `vpg_bonuses` - Employee bonuses per payroll
  - `vpg_deductions` - Deduction definitions
  - `vpg_employee_deductions` - Deductions applied per employee per payroll
  - `vpg_deductions_per_employee` - Deductions assigned to employees
  - `vpg_clock_logs` - Employee clock-in/clock-out records
  - `vpg_vacations` - Vacation requests
  - `vpg_labor_events` - Labor event types (e.g., leave, suspension)
  - `vpg_employee_labor_event` - Per-employee labor events
  - `vpg_employee_documents` - Employee document file references
  - `vpg_mail_server_settings` - SMTP configuration stored in DB
  - `vpg_report_logs` - Report generation and dispatch audit trail
  - `vpg_report_versions` - Versioned report file references
  - `vpg_report_targets` - External institution report dispatch targets
  - `vpg_audit_logs` - User action audit trail

**File Storage:**
- Local filesystem only
- Report XML files stored under `storage/reports/payroll-{id}/` relative to backend cwd
- Path controlled by `REPORTS_OUTPUT_DIR` environment variable
- Template HTML files: `src/backend/templates/payment-receipt-template.html`, `payment-receipt-dynamic.html`

## Authentication

**Strategy:** Custom JWT (stateless, no third-party provider)
- Implementation: `src/backend/src/service/AuthService.ts`
- Middleware: `src/backend/src/middleware/AuthMiddleware.ts`
- Library: `jsonwebtoken` ^9.0.2
- Password hashing: `bcrypt` ^6.0.0 (bcrypt hash detection + plain-text fallback for migration)
- Token storage: `localStorage` on frontend (`vp_access_token`, `vp_refresh_token` keys)
- Token passing: `Authorization: Bearer <token>` header
- Token lifespan: 24 hours default; configurable via `JWT_EXPIRES_IN` env var
- Secret: `JWT_SECRET` environment variable (falls back to hardcoded default in dev — must be set in production)
- Role-based access: `AuthMiddleware.requireRole(allowedRoles[])` checks `req.user.role`
- Refresh token flow: implemented client-side in `src/frontend/src/services/http.ts` via `/api/refresh` endpoint

## Email (SMTP)

**Library:** nodemailer ^8.0.1
- Used by: `src/backend/src/service/ReportsService.ts`
- Config resolution order (falls back to DB if env vars missing):
  1. Environment variables: `REPORTS_SMTP_HOST` / `SMTP_HOST` / `EMAIL_HOST`, `REPORTS_SMTP_PORT`, `REPORTS_SMTP_USER`, `REPORTS_SMTP_PASS`, `REPORTS_FROM`
  2. Database table: `vpg_mail_server_settings` (last record by ID)
- Use case: Send XML payroll reports (CCSS and Hacienda formats) as attachments to employee email addresses

## PDF Generation

**Libraries:**
- `puppeteer` ^24.37.5 - Headless Chromium renders HTML templates to PDF
  - Used in: `src/backend/src/service/PaymentReceiptService.ts`
  - Launch flags: `--no-sandbox`, `--disable-setuid-sandbox`
- `pdf-lib` ^1.17.1 - PDF document manipulation and merging
  - Used in: `src/backend/src/service/PaymentReceiptService.ts`
- `handlebars` ^4.7.8 - HTML template engine for receipt data binding
  - Templates: `src/backend/templates/payment-receipt-template.html`, `payment-receipt-dynamic.html`

## Report Formats

**XML Generation (custom, no library):**
- CCSS (Caja Costarricense de Seguro Social) payroll XML reports
- Hacienda (Costa Rica Ministry of Finance) income XML reports
- Built by: `src/backend/src/service/ReportsService.ts` (`buildReportXml` method)
- Files persisted to local filesystem before email dispatch

## Excel Export

**Library:** exceljs ^4.4.0
- Used by: frontend (`src/frontend/src/services/`)
- Use case: Export payroll/employee data to `.xlsx` files

## API Documentation

- swagger-jsdoc ^6.2.8 generates OpenAPI 3.0 spec from JSDoc annotations in `src/backend/src/routes/*.ts`
- `@scalar/express-api-reference` ^0.8.16 serves interactive UI at `/api/docs`
- Spec available at `/api/docs/swagger.json`

## Frontend → Backend Communication

**HTTP client:** Native `fetch` wrapped in `src/frontend/src/services/http.ts`
- Base URL: `NEXT_PUBLIC_API_URL` environment variable (default: `http://localhost:3001`)
- Config: `src/frontend/src/config/index.ts`
- Automatic Bearer token injection from localStorage
- 401 auto-retry with refresh token before forcing logout
- Auth failure callback hooks for UI logout redirect

## External APIs

**None detected.** The system does not integrate with third-party external APIs (no Stripe, Twilio, AWS SDK, Supabase, Firebase, etc. found in dependencies or source code).

## Caching

**None.** No Redis, Memcached, or in-memory caching layer detected.

## Monitoring & Observability

**Error Tracking:** None detected (no Sentry, Datadog, etc.)
**Logs:** `console.log` / `console.error` only
**Prisma query logging:** Enabled in development via `log: ['query', 'error', 'warn']` in `src/backend/src/lib/prisma.ts`

## Environment Variables Required

**Backend (`src/backend/`):**
- `DATABASE_URL` - PostgreSQL connection string (required)
- `JWT_SECRET` - JWT signing secret (required in production)
- `JWT_EXPIRES_IN` - Token expiry in seconds (optional, default 86400)
- `PORT` - Server port (optional, default 3001)
- `REPORTS_OUTPUT_DIR` - Storage path for XML report files (optional)
- `REPORTS_ENTERPRISE_NAME` - Fallback enterprise name for reports (optional)
- `REPORTS_ENTERPRISE_TAX_ID` - Employer tax ID for reports (optional)
- `REPORTS_SMTP_HOST` / `SMTP_HOST` / `EMAIL_HOST` - SMTP server (optional if DB configured)
- `REPORTS_SMTP_PORT` / `SMTP_PORT` / `EMAIL_PORT` - SMTP port (optional if DB configured)
- `REPORTS_SMTP_USER` / `SMTP_USER` / `EMAIL_USER` - SMTP username (optional if DB configured)
- `REPORTS_SMTP_PASS` / `SMTP_PASS` / `EMAIL_PASS` - SMTP password (optional if DB configured)
- `REPORTS_FROM` / `SMTP_FROM` / `EMAIL_FROM` - From address (optional if DB configured)
- `REPORTS_SMTP_SECURE` / `SMTP_SECURE` - Use SSL (optional, default false)
- `REPORTS_SMTP_TLS` / `SMTP_TLS` - Require TLS (optional, default false)

**Frontend (`src/frontend/`):**
- `NEXT_PUBLIC_API_URL` - Backend API base URL (optional, default `http://localhost:3001`)

---

*Integration audit: 2026-03-25*
