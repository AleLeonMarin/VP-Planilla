# Technology Stack

**Analysis Date:** 2026-04-09

## Languages

**Primary:**
- TypeScript - Backend API and frontend application (`src/backend/src/**/*.ts`, `src/frontend/src/**/*.ts`, `src/frontend/src/**/*.tsx`, `src/backend/package.json`, `src/frontend/package.json`)
- SQL (via Prisma schema) - Relational data modeling for PostgreSQL (`src/backend/prisma/schema.prisma`)

**Secondary:**
- JavaScript - Runtime/config files (`src/backend/jest.config.js`, `src/frontend/jest.config.js`, `src/frontend/tailwind.config.js`)
- Java 17 - Standalone clock-log ingestion utility (`src/Java/clocklogs/pom.xml`, `src/Java/clocklogs/src/main/java/com/verde/pradera/Main.java`)

## Runtime

**Environment:**
- Node.js 22.14.0 for backend/frontend runtime and tooling (`CLAUDE.md`, `src/backend/package.json`, `src/frontend/package.json`)
- Java 17 for standalone importer (`src/Java/clocklogs/pom.xml`)

**Package Manager:**
- npm (backend/frontend via `package.json` scripts) (`src/backend/package.json`, `src/frontend/package.json`)
- Lockfile: present (`src/backend/package-lock.json`, `src/frontend/package-lock.json`)

## Frameworks

**Core:**
- Express 5 (`express`) - HTTP API server and routing (`src/backend/package.json`, `src/backend/src/index.ts`)
- Next.js 15 (`next`) - Frontend application framework (`src/frontend/package.json`, `src/frontend/next.config.ts`)
- React 19 (`react`, `react-dom`) - UI rendering layer (`src/frontend/package.json`)
- Prisma ORM (`@prisma/client`, `prisma`) - Database access and schema management (`src/backend/package.json`, `src/backend/src/lib/prisma.ts`, `src/backend/prisma/schema.prisma`)

**Testing:**
- Jest 29 + ts-jest - Backend unit tests (`src/backend/package.json`, `src/backend/jest.config.js`)
- Jest + next/jest + jsdom - Frontend component/unit tests (`src/frontend/package.json`, `src/frontend/jest.config.js`)

**Build/Dev:**
- TypeScript compiler (`tsc`) - Build/type checking (`src/backend/package.json`, `src/frontend/tsconfig.json`, `src/backend/tsconfig.json`)
- tsx watch - Backend dev runtime (`src/backend/package.json`)
- Turbopack via `next dev --turbopack` - Frontend dev bundling (`src/frontend/package.json`)
- Tailwind CSS 4 + PostCSS - Styling pipeline (`src/frontend/package.json`, `src/frontend/tailwind.config.js`, `src/frontend/postcss.config.mjs`)
- ESLint (Next presets) - Frontend linting (`src/frontend/eslint.config.mjs`, `src/frontend/package.json`)

## Key Dependencies

**Critical:**
- `@prisma/client` / `prisma` - Required for all persistence operations (`src/backend/src/lib/prisma.ts`, `src/backend/prisma/schema.prisma`)
- `jsonwebtoken` + `bcrypt` - Authentication/token + password verification (`src/backend/src/service/AuthService.ts`)
- `zod` - Input validation across backend and frontend (`src/backend/package.json`, `src/frontend/package.json`)
- `react-hook-form` + `@hookform/resolvers` - Form state and schema integration (`src/frontend/package.json`)

**Infrastructure:**
- `cors`, `helmet`, `express-rate-limit` - API security hardening (`src/backend/src/index.ts`, `src/backend/src/routes/AuthRoute.ts`)
- `swagger-jsdoc` + `@scalar/express-api-reference` - API docs generation and UI (`src/backend/src/utils/docs.ts`, `src/backend/src/index.ts`)
- `nodemailer` - SMTP email delivery for report dispatch (`src/backend/src/service/ReportsService.ts`)
- `puppeteer` + `pdf-lib` + `handlebars` - Receipt rendering and PDF generation (`src/backend/src/service/PaymentReceiptService.ts`)
- `exceljs` - Frontend spreadsheet export (`src/frontend/package.json`, `src/frontend/src/components/PayrollResults.tsx`)
- `@fullcalendar/*`, `framer-motion`, `@heroicons/react`, `lucide-react` - Calendar/UI and motion stack (`src/frontend/package.json`, `src/frontend/next.config.ts`)

## Configuration

**Environment:**
- Backend env config is loaded through `dotenv` (`src/backend/src/index.ts`), with DB URL defined for Prisma datasource (`src/backend/prisma/schema.prisma`).
- Frontend env usage is through `process.env.NEXT_PUBLIC_*` for API base URL and weather integration (`src/frontend/src/config/index.ts`, `src/frontend/src/utils/weather.ts`).
- Java importer loads env via `dotenv-java` and expects DB URL from env (`src/Java/clocklogs/src/main/java/com/verde/pradera/utils/dbConnector.java`).
- Environment files exist for backend/frontend (`src/backend/.env`, `src/frontend/.env`) but contents are not inspected.

**Build:**
- Backend TypeScript build config: `src/backend/tsconfig.json`
- Frontend TypeScript/build config: `src/frontend/tsconfig.json`, `src/frontend/next.config.ts`
- Frontend style build config: `src/frontend/tailwind.config.js`, `src/frontend/postcss.config.mjs`
- Test config: `src/backend/jest.config.js`, `src/frontend/jest.config.js`
- Frontend lint config: `src/frontend/eslint.config.mjs`

## Platform Requirements

**Development:**
- Node.js + npm for backend/frontend (`src/backend/package.json`, `src/frontend/package.json`)
- PostgreSQL reachable via `DATABASE_URL` for backend runtime (`src/backend/prisma/schema.prisma`)
- Java 17 + Maven for standalone importer (`src/Java/clocklogs/pom.xml`)

**Production:**
- Backend: Node.js service exposing Express API (binds to `0.0.0.0:${PORT}`) (`src/backend/src/index.ts`)
- Database: PostgreSQL (`src/backend/prisma/schema.prisma`)
- Frontend: Next.js deployment target not codified in repo config; backend CORS allowlist includes Vercel domain (`src/backend/src/index.ts`)

---

*Stack analysis: 2026-04-09*
