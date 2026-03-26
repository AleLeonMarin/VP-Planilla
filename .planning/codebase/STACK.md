# Technology Stack

**Analysis Date:** 2026-03-26

## Languages

**Primary:**
- TypeScript 5.8.3 — Backend (`src/backend/`)
- TypeScript 5.9.3 — Frontend (`src/frontend/`)
- HTML (Handlebars templates) — PDF receipt generation (`src/backend/templates/`)

**Secondary:**
- JavaScript — Config files: `src/frontend/tailwind.config.js`, `src/backend/jest.config.js`
- Java (Maven) — Standalone clock-log parser (`src/Java/clocklogs/`). NOT called by the Node API at runtime.

## Runtime

**Environment:**
- Node.js 22.14.0

**Package Manager:**
- npm — both backend and frontend
- Lockfiles: `src/backend/package-lock.json`, `src/frontend/package-lock.json` (both present, lockfileVersion 3)

## Frameworks

**Backend:**
- Express 5.1.0 — HTTP REST API server (`src/backend/src/index.ts`)
- Prisma 6.14.0 — ORM, schema management, and query client

**Frontend:**
- Next.js 15.5.6 — React framework, Turbopack dev server (`src/frontend/`)
- React 19.0.0 — UI library
- Tailwind CSS 4 — Utility-first CSS (via `@tailwindcss/postcss ^4`)

**Testing:**
- Jest 29.7.0 — Backend test runner (`src/backend/jest.config.js`)
- ts-jest 29.1.2 — TypeScript transformer for Jest
- jest-mock-extended 3.0.5 — Deep mock proxy for PrismaClient
- supertest 6.3.4 — HTTP integration test helper

**Build/Dev:**
- tsx 4.20.6 — TypeScript execution for `npm run dev` watch mode (`src/backend/`)
- tsc — Production build to `src/backend/dist/`
- cpx 1.2.1 — Asset copying during backend builds
- Turbopack — Frontend bundler in dev (`next dev --turbopack`)
- PostCSS — CSS processing (`src/frontend/postcss.config.mjs`)
- ESLint 9 + `eslint-config-next` 15.3.3 — Frontend linting (`src/frontend/eslint.config.mjs`)

## TypeScript Configuration

**Backend** (`src/backend/tsconfig.json`):
- `target: ES2020`, `module: Node16`, `moduleResolution: node16`
- Strict mode enabled
- `rootDir: ./src`, `outDir: ./dist`

**Frontend** (`src/frontend/tsconfig.json`):
- `target: ES2017`, `module: esnext`, `moduleResolution: bundler`
- Strict mode enabled, `noEmit: true`
- Path alias: `@/*` maps to `./src/*`
- JSX: `preserve` (handled by Next.js)

## Key Dependencies

**Backend — Critical:**

| Package | Version | Purpose |
|---|---|---|
| `@prisma/client` | ^6.14.0 | DB query client — **currently in `devDependencies`, must move to `dependencies` for production** |
| `prisma` | ^6.14.0 | CLI: migrations, codegen |
| `express` | ^5.1.0 | HTTP server |
| `jsonwebtoken` | ^9.0.2 | JWT signing/verification (`src/backend/src/service/AuthService.ts`) |
| `bcrypt` | ^6.0.0 | Password hashing — **pre-release, prefer `^5.1.1`** |
| `zod` | ^4.3.6 | Backend request body validation via `validateBody` middleware (`src/backend/src/schemas/`) |
| `cors` | ^2.8.5 | CORS handling — configured with `ALLOWED_ORIGINS` env var in `src/backend/src/index.ts` |
| `dotenv` | ^16.5.0 | `.env` loading |

**Backend — Feature:**

| Package | Version | Purpose |
|---|---|---|
| `nodemailer` | ^8.0.1 | SMTP email dispatch for payroll reports (`src/backend/src/service/ReportsService.ts`) |
| `puppeteer` | ^24.37.5 | Headless Chrome PDF generation (`src/backend/src/service/PaymentReceiptService.ts`) |
| `pdf-lib` | ^1.17.1 | PDF merging and manipulation |
| `handlebars` | ^4.7.8 | HTML template rendering for payment receipts |
| `swagger-jsdoc` | ^6.2.8 | OpenAPI 3.0 spec from JSDoc (`src/backend/src/utils/docs.ts`) |
| `@scalar/express-api-reference` | ^0.8.16 | Interactive API docs UI at `/api/docs` |

**Frontend — Critical:**

| Package | Version | Purpose |
|---|---|---|
| `next` | ^15.5.6 | Framework |
| `react` + `react-dom` | ^19.0.0 | UI runtime |
| `react-hook-form` | ^7.62.0 | Form state management |
| `@hookform/resolvers` | ^5.2.1 | Zod integration with react-hook-form |
| `zod` | ^4.0.17 | Frontend form schema validation (`src/frontend/src/schemas/`) |

**Frontend — UI/Utilities:**

| Package | Version | Purpose |
|---|---|---|
| `framer-motion` | ^12.23.12 | Animations (modals use `AnimatePresence` + `motion.div`) |
| `@fullcalendar/react` + plugins | ^6.1.10 | Calendar UI (daygrid, timegrid, interaction, core) |
| `@heroicons/react` | ^2.2.0 | Icon set |
| `exceljs` | ^4.4.0 | Client-side Excel workbook generation and parsing |
| `react-draggable` | ^4.5.0 | Draggable UI elements |

## Database and ORM

**Database:** PostgreSQL

**ORM:** Prisma 6.14.0
- Schema: `src/backend/prisma/schema.prisma`
- Singleton client: `src/backend/src/lib/prisma.ts` — import as `import { prisma } from '../lib/prisma'`
- All services must use the singleton. One remaining violation: `src/backend/src/controller/ClockLogsController.ts` still calls `new PrismaClient()` directly.
- 22 models defined, all using `vpg_` table prefix and `snake_case` field naming convention
- Connection via `DATABASE_URL` environment variable
- Query logging enabled in singleton — emits query events with count tracking via `getQueryCount()` / `resetQueryCount()`

## Middleware Stack (Backend)

Applied in `src/backend/src/index.ts`:
1. `cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') })` — Phase 3: CORS restricted to env-configured origins
2. `express.json()` — Body parsing

Per-route middleware (applied at router level):
- `AuthMiddleware.verifyToken` — JWT verification. Applied via `router.use(...)` in all 15 protected route files, and via individual route handlers in `AuthRoute.ts` and `UserRoute.ts`. Entry point asserts `JWT_SECRET` is set or exits.
- `validateBody(schema)` — Zod schema validation from `src/backend/src/middleware/validateBody.ts`. Applied to 5 route files: `EmployeeRoute.ts`, `DeductionsRoute.ts`, `ClockLogsRoute.ts`, `PayrollRoutes.ts`, `UserRoute.ts`.

## Testing Details

**Config:** `src/backend/jest.config.js`
- Preset: `ts-jest`
- Environment: `node`
- Test match: `src/backend/src/__tests__/**/*.test.ts`
- `clearMocks`, `resetMocks`, `restoreMocks` all enabled
- Timeout: 10 seconds per test

**Test structure:**
```
src/backend/src/__tests__/
├── setup/
│   └── prisma-mock.ts    # Deep-mock PrismaClient with jest-mock-extended
└── unit/
    └── services/
        └── PayrollService.test.ts
```

**Coverage:**
- Collected from `src/**/*.ts`, excluding `*.d.ts` and `src/index.ts`
- Output: `src/backend/coverage/` (text, lcov, html formats)

**Frontend testing:** No test framework configured in `src/frontend/package.json`.

## Zod Schemas

**Backend** (`src/backend/src/schemas/`):
- `EmployeeSchema.ts` — `createEmployeeSchema`, `updateEmployeeSchema`
- `DeductionSchema.ts` — create/update deduction schemas
- `ClockLogSchema.ts` — `bulkCreateClockLogSchema`
- `PayrollSchema.ts` — `createPayrollSchema`, `updatePayrollSchema`
- `UserSchema.ts` — `updatePermissionsSchema`
- `index.ts` — re-exports all schemas

**Frontend** (`src/frontend/src/schemas/`):
- `employee.ts` — employee form schema
- `vacationSchema.ts` — vacation form schema

## API Documentation

- OpenAPI 3.0 spec generated from `@swagger` JSDoc in `src/backend/src/routes/*.ts`
- Spec endpoint: `GET /api/docs/swagger.json`
- Interactive UI: `GET /api/docs` (Scalar UI, loaded dynamically as ESM)

## Configuration Files

| File | Purpose |
|---|---|
| `src/backend/tsconfig.json` | Backend TypeScript compiler options |
| `src/backend/jest.config.js` | Jest test runner config |
| `src/frontend/tsconfig.json` | Frontend TypeScript + `@/*` path alias |
| `src/frontend/next.config.ts` | Next.js config |
| `src/frontend/postcss.config.mjs` | PostCSS pipeline |
| `src/frontend/eslint.config.mjs` | ESLint rules (next/core-web-vitals) |

## Commands

```bash
# Backend (from src/backend/)
npm run dev           # tsx watch mode — dev server on port 3001
npm test              # Jest unit tests
npm run test:watch    # Jest watch mode
npm run test:coverage # Jest with coverage report
npm run build         # Compile TypeScript to dist/
npx tsc --noEmit      # Type check without compiling

# Frontend (from src/frontend/)
npm run dev           # Next.js dev server with Turbopack
npm run build         # Production build
npx tsc --noEmit      # Type check
npx next lint         # ESLint
```

---

*Stack analysis: 2026-03-26*
