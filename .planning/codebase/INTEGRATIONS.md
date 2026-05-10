# External Integrations

**Analysis Date:** 2026-04-09

## APIs & External Services

**Weather API:**
- OpenWeatherMap - Fetches current weather for UI display (`src/frontend/src/utils/weather.ts`)
  - SDK/Client: Native `fetch` (no dedicated SDK) (`src/frontend/src/utils/weather.ts`)
  - Auth: `NEXT_PUBLIC_OPENWEATHER_API_KEY` (`src/frontend/src/utils/weather.ts`)

**Email/SMTP Delivery:**
- SMTP provider (hosted mail server, provider-agnostic) - Sends payroll report emails with XML attachments (`src/backend/src/service/ReportsService.ts`)
  - SDK/Client: `nodemailer` (`src/backend/src/service/ReportsService.ts`)
  - Auth: `REPORTS_SMTP_USER` / `REPORTS_SMTP_PASS` (fallbacks: `SMTP_USER` / `SMTP_PASS`, `EMAIL_USER` / `EMAIL_PASS`) (`src/backend/src/service/ReportsService.ts`)

**Documentation UI:**
- Scalar API Reference UI - Serves interactive API docs (`src/backend/src/index.ts`)
  - SDK/Client: `@scalar/express-api-reference` + `swagger-jsdoc` (`src/backend/src/index.ts`, `src/backend/src/utils/docs.ts`)
  - Auth: Not applicable

## Data Storage

**Databases:**
- PostgreSQL (application primary database)
  - Connection: `DATABASE_URL` (`src/backend/prisma/schema.prisma`)
  - Client: Prisma Client singleton (`src/backend/src/lib/prisma.ts`)
- PostgreSQL (Java importer direct JDBC access)
  - Connection: `DB_URL` (`src/Java/clocklogs/src/main/java/com/verde/pradera/utils/dbConnector.java`)
  - Client: JDBC (`org.postgresql:postgresql`) (`src/Java/clocklogs/pom.xml`, `src/Java/clocklogs/src/main/java/com/verde/pradera/utils/QueryManager.java`)

**File Storage:**
- Local filesystem only
  - Generated report XML files under `storage/reports` or `REPORTS_OUTPUT_DIR` (`src/backend/src/service/ReportsService.ts`)
  - Payment receipt template/logo loaded from local paths (`src/backend/src/service/PaymentReceiptService.ts`)

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- Custom JWT auth
  - Implementation: Login/refresh/validate/logout handled in backend auth routes and service (`src/backend/src/routes/AuthRoute.ts`, `src/backend/src/service/AuthService.ts`, `src/backend/src/middleware/AuthMiddleware.ts`)

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry/Bugsnag/etc. packages or config files)

**Logs:**
- Console logging across backend services/middleware (`src/backend/src/index.ts`, `src/backend/src/service/AuthService.ts`, `src/backend/src/service/PaymentReceiptService.ts`)
- Prisma query event logging enabled in singleton client (`src/backend/src/lib/prisma.ts`)

## CI/CD & Deployment

**Hosting:**
- Frontend hosting target inferred as Vercel from CORS allowlist (`src/backend/src/index.ts`)
- Backend hosting platform not explicitly configured in repository files

**CI Pipeline:**
- None detected (`.github/workflows/` not present)

## Environment Configuration

**Required env vars:**
- Backend core: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `ALLOWED_ORIGINS` (`src/backend/prisma/schema.prisma`, `src/backend/src/index.ts`, `README.md`)
- Backend auth: `JWT_EXPIRES_IN` (`src/backend/src/service/AuthService.ts`)
- Backend reports/mail: `REPORTS_OUTPUT_DIR`, `REPORTS_SMTP_HOST`, `REPORTS_SMTP_PORT`, `REPORTS_SMTP_USER`, `REPORTS_SMTP_PASS`, `REPORTS_FROM`, `REPORTS_SMTP_SECURE`, `REPORTS_SMTP_TLS` (fallback families `SMTP_*`, `EMAIL_*`) (`src/backend/src/service/ReportsService.ts`)
- Backend enterprise report metadata: `REPORTS_ENTERPRISE_NAME`, `REPORTS_ENTERPRISE_TAX_ID` (`src/backend/src/service/ReportsService.ts`)
- Frontend public env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_OPENWEATHER_API_KEY`, `NEXT_PUBLIC_DEFAULT_LATITUDE`, `NEXT_PUBLIC_DEFAULT_LONGITUDE`, `NEXT_PUBLIC_DEFAULT_CITY` (`src/frontend/src/config/index.ts`, `src/frontend/src/utils/weather.ts`)
- Java importer: `DB_URL` (`src/Java/clocklogs/src/main/java/com/verde/pradera/utils/dbConnector.java`)

**Secrets location:**
- Local `.env` files detected at `src/backend/.env` and `src/frontend/.env` (contents not inspected)
- Additional secret-capable storage in DB table `vpg_mail_server_settings` (`src/backend/prisma/schema.prisma`, `src/backend/src/service/ReportsService.ts`)

## Webhooks & Callbacks

**Incoming:**
- None (no webhook endpoints detected in backend routes under `src/backend/src/routes/`)

**Outgoing:**
- SMTP email delivery to employee recipients and optional CC list (not HTTP webhook callbacks) (`src/backend/src/service/ReportsService.ts`)

---

*Integration audit: 2026-04-09*
