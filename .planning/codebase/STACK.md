# Technology Stack

**Analysis Date:** 2026-03-25

## Languages

**Primary:**
- TypeScript 5.8.3 (backend) / 5.9.3 (frontend) - All application logic in both layers
- HTML - Handlebars templates for PDF generation (`src/backend/templates/`)

**Secondary:**
- JavaScript - Config files (e.g., `src/frontend/tailwind.config.js`, `src/backend/jest.config.js`, root `parse_tmp.js`, `test_hours.js`)
- Python - Root-level utility script (`temp_script.py`)

## Runtime Environment

**Backend:**
- Node.js v22.14.0
- Target: ES2020 (`src/backend/tsconfig.json`)
- Module system: Node16 ESM/CJS hybrid (`src/backend/tsconfig.json`)

**Frontend:**
- Browser (React/Next.js SSR + CSR)
- Target: ES2017, DOM + ESNext libs (`src/frontend/tsconfig.json`)

## Package Manager

- npm
- Lockfile: `package-lock.json` present in both `src/backend/` and `src/frontend/` (lockfileVersion 3)

## Frameworks

**Backend:**
- Express 5.1.0 - HTTP server, REST API (`src/backend/src/index.ts`)

**Frontend:**
- Next.js 15.5.6 - React framework with Turbopack dev server (`src/frontend/`)
- React 19.0.0 - UI rendering (`src/frontend/`)

## Key Libraries

**Backend:**
- `prisma` ^6.14.0 - ORM and schema management (`src/backend/prisma/schema.prisma`)
- `@prisma/client` ^6.14.0 - Database query client (`src/backend/src/lib/prisma.ts`)
- `jsonwebtoken` ^9.0.2 - JWT token generation and verification (`src/backend/src/service/AuthService.ts`)
- `bcrypt` ^6.0.0 - Password hashing (`src/backend/src/service/AuthService.ts`)
- `cors` ^2.8.5 - Cross-origin request handling (`src/backend/src/index.ts`)
- `dotenv` ^16.5.0 - Environment variable loading (`src/backend/src/index.ts`)
- `nodemailer` ^8.0.1 - SMTP email dispatch for reports (`src/backend/src/service/ReportsService.ts`)
- `handlebars` ^4.7.8 - HTML template rendering for PDF receipts (`src/backend/src/service/PaymentReceiptService.ts`)
- `puppeteer` ^24.37.5 - Headless browser PDF generation (`src/backend/src/service/PaymentReceiptService.ts`)
- `pdf-lib` ^1.17.1 - PDF manipulation/merging (`src/backend/src/service/PaymentReceiptService.ts`)
- `swagger-jsdoc` ^6.2.8 - OpenAPI spec generation (`src/backend/src/utils/docs.ts`)
- `@scalar/express-api-reference` ^0.8.16 - Swagger UI renderer at `/api/docs`

**Frontend:**
- `react-hook-form` ^7.62.0 - Form state management
- `@hookform/resolvers` ^5.2.1 - Zod integration with react-hook-form
- `zod` ^4.0.17 - Schema validation (`src/frontend/src/schemas/`)
- `framer-motion` ^12.23.12 - UI animations
- `@heroicons/react` ^2.2.0 - Icon library
- `@fullcalendar/react` ^6.1.10 + `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`, `@fullcalendar/core` ^6.1.10 - Calendar UI components
- `react-draggable` ^4.5.0 - Draggable UI elements
- `exceljs` ^4.4.0 - Excel file export
- `tailwindcss` ^4 - Utility-first CSS (`src/frontend/tailwind.config.js`)

## Build Tools

**Backend:**
- `typescript` (tsc) - Compiles `src/` → `dist/` (`src/backend/tsconfig.json`)
- `tsx` ^4.20.6 - TypeScript execution for development watch mode (`src/backend/package.json` dev script)
- `cpx` ^1.2.1 - Asset copying during builds

**Frontend:**
- Next.js build pipeline with Turbopack (`next dev --turbopack`)
- `@tailwindcss/postcss` ^4 - PostCSS integration (`src/frontend/postcss.config.mjs`)
- ESLint 9 with `eslint-config-next` 15.3.3 (`src/frontend/eslint.config.mjs`)

## Testing Stack

**Backend:**
- Jest ^29.7.0 - Test runner (`src/backend/jest.config.js`)
- ts-jest ^29.1.2 - TypeScript preset for Jest
- `jest-mock-extended` ^3.0.5 - Extended mock utilities
- `supertest` ^6.3.4 - HTTP integration testing
- Test files: `src/backend/src/__tests__/`
- Coverage output: `src/backend/coverage/`

## API Documentation

- OpenAPI 3.0 spec auto-generated from JSDoc (`src/backend/src/utils/docs.ts`)
- Served at `GET /api/docs/swagger.json`
- Interactive UI at `GET /api/docs` via `@scalar/express-api-reference`

## Configuration Files

- `src/backend/tsconfig.json` - Backend TypeScript config
- `src/frontend/tsconfig.json` - Frontend TypeScript config (path alias `@/*` → `./src/*`)
- `src/frontend/next.config.ts` - Next.js config (minimal, no overrides)
- `src/frontend/tailwind.config.js` - Tailwind config
- `src/frontend/postcss.config.mjs` - PostCSS config
- `src/frontend/eslint.config.mjs` - ESLint config
- `src/backend/jest.config.js` - Jest config

---

*Stack analysis: 2026-03-25*
