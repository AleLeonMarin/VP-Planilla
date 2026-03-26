# External Integrations

**Analysis Date:** 2026-03-26

## APIs & External Services

**None.** No third-party external APIs detected (no Stripe, Twilio, AWS SDK, Supabase, Firebase, Sendgrid, or similar). All integrations are with self-hosted infrastructure.

## Data Storage

**Primary Database:**
- PostgreSQL via Prisma 6.14.0
- Connection: `DATABASE_URL` environment variable
- Client singleton: `src/backend/src/lib/prisma.ts`
- Schema: `src/backend/prisma/schema.prisma`
- 22 models, all prefixed `vpg_`:

| Model | Purpose |
|---|---|
| `vpg_users` | System admin users |
| `vpg_employees` | Employee records |
| `vpg_positions` | Job positions with base salary |
| `vpg_branches` | Company branch offices |
| `vpg_enterprise` | Enterprise profile (stores logo as bytes) |
| `vpg_payrolls` | Payroll run records |
| `vpg_payroll_types` | Payroll period type definitions |
| `vpg_payroll_employee` | Per-employee payroll calculation rows |
| `vpg_bonuses` | Employee bonuses per payroll |
| `vpg_deductions` | Deduction definitions (CCSS, fixed amounts) |
| `vpg_employee_deductions` | Deductions applied per employee per payroll |
| `vpg_deductions_per_employee` | Deductions assigned to an employee |
| `vpg_clock_logs` | Clock-in/clock-out records |
| `vpg_vacations` | Vacation requests |
| `vpg_labor_events` | Labor event types |
| `vpg_employee_labor_event` | Per-employee labor event instances |
| `vpg_employee_documents` | Document file path references |
| `vpg_mail_server_settings` | SMTP configuration stored in DB |
| `vpg_report_logs` | Report generation and dispatch audit trail |
| `vpg_report_versions` | Versioned report file references |
| `vpg_report_targets` | External institution dispatch targets (CCSS, Hacienda) |
| `vpg_audit_logs` | User action audit trail |

**File Storage:**
- Local filesystem only — no cloud storage
- XML report files written to `storage/reports/payroll-{id}/` relative to backend cwd
- Directory controlled by `REPORTS_OUTPUT_DIR` environment variable
- Payment receipt HTML templates: `src/backend/templates/payment-receipt-template.html`, `src/backend/templates/payment-receipt-dynamic.html`

**Caching:** None detected.

## Authentication & Identity

**Strategy:** Custom stateless JWT — no third-party auth provider.

**Implementation:**
- Service: `src/backend/src/service/AuthService.ts`
- Middleware: `src/backend/src/middleware/AuthMiddleware.ts`
- Library: `jsonwebtoken ^9.0.2`
- Password hashing: `bcrypt ^6.0.0` (auto-detects bcrypt hash vs. plain-text for migration compatibility)

**Token mechanics:**
- Access token: signed with `JWT_SECRET`, expires in 24h by default (override via `JWT_EXPIRES_IN`)
- Refresh token: separate JWT, used by frontend to silently re-acquire an access token
- Frontend storage: `localStorage` keys `vp_access_token` and `vp_refresh_token`
- Transport: `Authorization: Bearer <token>` header on every request
- Auto-refresh: implemented in `src/frontend/src/services/http.ts` — retries 401 once with refresh token, then forces logout

**Roles:** Stored in `vpg_users.user_role`. Role gate: `AuthMiddleware.requireRole(allowedRoles[])`.

**Known gap:** Only 3 of 16 route files apply `AuthMiddleware.verifyToken`. Most routes are currently unauthenticated. See `CONCERNS.md`.

## Email (SMTP)

**Library:** nodemailer ^8.0.1
- Used by: `src/backend/src/service/ReportsService.ts`
- Purpose: Send XML payroll reports (CCSS and Hacienda format) as email attachments

**Configuration resolution order** (first match wins):
1. Environment variables: `REPORTS_SMTP_HOST` / `SMTP_HOST` / `EMAIL_HOST`, port, user, pass, from address, SSL/TLS flags
2. Database table: `vpg_mail_server_settings` (last record by ID)

**Trigger:** `POST /api/reports/payroll/:id/send` — authenticated endpoint

## PDF Generation (Server-Side)

**Libraries:**
- `puppeteer ^24.37.5` — Headless Chromium renders Handlebars HTML to PDF
  - Used in: `src/backend/src/service/PaymentReceiptService.ts`
  - Chromium flags: `--no-sandbox`, `--disable-setuid-sandbox`
- `pdf-lib ^1.17.1` — PDF document merging (combines per-employee receipts into one file)
- `handlebars ^4.7.8` — Template rendering: binds payroll data into HTML templates before PDF conversion

**Templates:** `src/backend/templates/payment-receipt-template.html`, `payment-receipt-dynamic.html`
**Trigger:** `POST /api/reports/payroll/:id/payment-receipts/pdf`

## Report Formats (XML, Self-Generated)

No external library — XML built by string construction in `src/backend/src/service/ReportsService.ts`:
- **CCSS** — Caja Costarricense de Seguro Social employee contribution report
- **Hacienda** — Ministerio de Hacienda income declaration report

Files persisted to local filesystem before email dispatch. Dispatch target endpoints and auth tokens are stored in `vpg_report_targets` table.

## Excel Export (Client-Side)

**Library:** exceljs ^4.4.0 (frontend dependency)
- Used in: `src/frontend/src/components/PayrollResults.tsx`, `src/frontend/src/app/pages/attendance/page.tsx`
- Purpose: Generate `.xlsx` payroll exports and parse uploaded attendance Excel files in-browser

## API Documentation

**Libraries:**
- `swagger-jsdoc ^6.2.8` — Generates OpenAPI 3.0 spec from `@swagger` JSDoc in `src/backend/src/routes/*.ts`
- `@scalar/express-api-reference ^0.8.16` — Interactive Swagger UI

**Endpoints:**
- `GET /api/docs/swagger.json` — Raw OpenAPI spec
- `GET /api/docs` — Interactive Scalar UI

## Frontend → Backend HTTP Layer

**Client:** Native `fetch` wrapped by `src/frontend/src/services/http.ts`
- Base URL: `NEXT_PUBLIC_API_URL` env var (default: `http://localhost:3001`)
- Config: `src/frontend/src/config/index.ts`
- Automatic `Authorization: Bearer` injection from localStorage
- Auto-refresh on 401 before forcing logout
- All API calls must go through `http.ts` — never raw `fetch` in components or hooks

## Exposed API Endpoints

All prefixed with `/api`. Most require `Authorization: Bearer <token>` header.

| Route group | Path prefix | Auth required |
|---|---|---|
| Auth | `/api/login`, `/api/logout`, `/api/me`, `/api/refresh`, `/api/validate`, `/api/change-password` | Partial (login/refresh are public) |
| Employees | `/api/employees` | Yes (middleware gap — see CONCERNS.md) |
| Positions | `/api/positions` | Yes (middleware gap) |
| Payroll | `/api/payrolls` | Yes (middleware gap) |
| Payroll Types | `/api/payroll-types` | Yes (middleware gap) |
| Clock Logs | `/api/clock-logs` | Yes (middleware gap) |
| Vacations | `/api/vacations` | Yes (middleware gap) |
| Deductions | `/api/deductions` | Yes (middleware gap) |
| Employee Deductions | `/api/employee-deductions` | Yes (middleware gap) |
| Bonuses | `/api/bonuses` | Yes (middleware gap) |
| Labor Events | `/api/labor-events` | Yes (middleware gap) |
| Nominees | `/api/nominees` | Yes (middleware gap) |
| Users | `/api/users` | Yes (middleware gap) |
| Audit Logs | `/api/audit-logs` | Yes (middleware gap) |
| Reports | `/api/reports` | Yes — route-level `router.use(AuthMiddleware.verifyToken)` |
| Payment Receipts | `/api/payment-receipts` | Yes (middleware gap) |
| Docs | `/api/docs`, `/api/docs/swagger.json` | Public |
| Health | `/health`, `/` | Public |

## Webhooks & Callbacks

**Incoming:** None detected.
**Outgoing:** Reports can be dispatched to external institution URLs stored in `vpg_report_targets.report_targets_endpoint_url` — the mechanism for this dispatch is defined in the schema but the HTTP dispatch implementation is not yet confirmed in the service layer.

## Monitoring & Observability

**Error Tracking:** None (no Sentry, Datadog, Rollbar, etc.)
**Logs:** `console.log` / `console.error` only
**Prisma query logging:** Enabled in development — `log: ['query', 'error', 'warn']` in `src/backend/src/lib/prisma.ts`

## Environment Variables

**Backend (`src/backend/`) — required at startup:**
- `DATABASE_URL` — PostgreSQL connection string (**required**)
- `JWT_SECRET` — JWT signing secret (**required** — server exits with non-zero code if missing, see `src/backend/src/index.ts`)

**Backend — optional:**
- `PORT` — HTTP port (default: `3001`)
- `JWT_EXPIRES_IN` — Token expiry in seconds (default: `86400`)
- `ALLOWED_ORIGINS` — Comma-separated CORS allowed origins (unset = no origin restriction)
- `REPORTS_OUTPUT_DIR` — Filesystem path for XML report storage (default: `{cwd}/storage/reports`)
- `REPORTS_ENTERPRISE_NAME` — Fallback enterprise name for XML reports
- `REPORTS_ENTERPRISE_TAX_ID` — Employer tax ID for XML reports
- `REPORTS_SMTP_HOST` / `SMTP_HOST` / `EMAIL_HOST` — SMTP server (falls back to DB if unset)
- `REPORTS_SMTP_PORT` / `SMTP_PORT` / `EMAIL_PORT`
- `REPORTS_SMTP_USER` / `SMTP_USER` / `EMAIL_USER`
- `REPORTS_SMTP_PASS` / `SMTP_PASS` / `EMAIL_PASS`
- `REPORTS_FROM` / `SMTP_FROM` / `EMAIL_FROM`
- `REPORTS_SMTP_SECURE` / `SMTP_SECURE` — Use SSL (default: `false`)
- `REPORTS_SMTP_TLS` / `SMTP_TLS` — Require TLS (default: `false`)
- `NODE_ENV` — Controls Prisma query log level (`development` = verbose)

**Frontend (`src/frontend/`) — optional:**
- `NEXT_PUBLIC_API_URL` — Backend API base URL (default: `http://localhost:3001`)

---

*Integration audit: 2026-03-26*
