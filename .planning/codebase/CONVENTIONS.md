# Coding Conventions

**Analysis Date:** 2026-04-09

## Naming Patterns

**Files:**
- Use `PascalCase.ts` for backend controllers/services/routes in `src/backend/src/controller/`, `src/backend/src/service/`, and `src/backend/src/routes/` (for example `src/backend/src/service/EmployeeService.ts`, `src/backend/src/controller/UserController.ts`, `src/backend/src/routes/AuthRoute.ts`).
- Use `lowercase.ts` for backend model interfaces in `src/backend/src/model/` (for example `src/backend/src/model/employee.ts`, `src/backend/src/model/user.ts`).
- Use `PascalCase.tsx` for frontend components in `src/frontend/src/components/` and `src/frontend/src/components/ui/` (for example `src/frontend/src/components/AddEmployeeModal.tsx`, `src/frontend/src/components/ui/FormModal.tsx`).
- Use `camelCase` with `use` prefix for hooks in `src/frontend/src/hooks/` (for example `src/frontend/src/hooks/useVacations.ts`, `src/frontend/src/hooks/useClockLogs.ts`).
- Use `camelCase` service filenames in `src/frontend/src/services/` (for example `src/frontend/src/services/clockLogsService.ts`, `src/frontend/src/services/authService.ts`).

**Functions:**
- Use `camelCase` for functions/methods across backend and frontend (for example `createEmployee` in `src/backend/src/controller/EmployeeController.ts`, `setFilters` in `src/frontend/src/hooks/useClockLogs.ts`).
- Use static class methods for backend service/controller entrypoints (for example `EmployeeService.updateEmployee` in `src/backend/src/service/EmployeeService.ts`, `UserController.updatePermissions` in `src/backend/src/controller/UserController.ts`).

**Variables:**
- Use `snake_case` for domain/database-aligned fields (for example `employee_first_name`, `employee_required_hours_biweekly` in `src/backend/src/schemas/EmployeeSchema.ts`; `employee_id`, `log_type` in `src/frontend/src/services/clockLogsService.ts`).
- Use `camelCase` for local variables and helper names (for example `mockPrismaEmployee` and `makeEmployee` in `src/backend/src/__tests__/unit/services/EmployeeService.test.ts`).
- Use `SCREAMING_SNAKE_CASE` for module constants (for example `STORAGE_KEYS` in `src/frontend/src/services/http.ts`, `PAGE_SIZE` in `src/frontend/src/hooks/useClockLogs.ts`).

**Types:**
- Use `PascalCase` for interfaces/types (for example `Employee` in `src/backend/src/model/employee.ts`, `ClockLogPaginated` in `src/frontend/src/services/clockLogsService.ts`, `FormData` in `src/frontend/src/components/LaborEventModal.tsx`).

## Code Style

**Formatting:**
- Formatting tool: Not detected as enforced formatter config (`.prettierrc*` not detected in repository root).
- TypeScript strict mode is enabled in both apps (`"strict": true` in `src/backend/tsconfig.json` and `src/frontend/tsconfig.json`).
- Use single quotes heavily in source files (for example `src/frontend/src/hooks/useVacations.ts`, `src/backend/src/service/EmployeeService.ts`), with occasional double quotes in older backend files (for example `src/backend/src/controller/EmployeeController.ts`).

**Linting:**
- Frontend linting is configured with ESLint flat config in `src/frontend/eslint.config.mjs` using `next/core-web-vitals` and `next/typescript`.
- For test files, allow `any` and downgrade unused vars to warning in `src/frontend/eslint.config.mjs` (`files: ["src/__tests__/**/*.{ts,tsx}"]`).
- Backend ESLint config: Not detected.

## Import Organization

**Order:**
1. Framework/external packages first (for example `express`, `zod`, `react-hook-form` in `src/backend/src/routes/AuthRoute.ts` and `src/frontend/src/components/AddEmployeeModal.tsx`).
2. Internal modules second (backend relative imports like `../service/EmployeeService` in `src/backend/src/controller/EmployeeController.ts`; frontend alias imports like `@/services/clockLogsService` in `src/frontend/src/hooks/useClockLogs.ts`).
3. Types/interfaces colocated with usage (for example `Employee` import in `src/backend/src/service/EmployeeService.ts`, `ClockLogPaginated` import in `src/frontend/src/app/pages/clock-logs/page.tsx`).

**Path Aliases:**
- Use `@/*` alias in frontend (`src/frontend/tsconfig.json`, `paths` section).
- Use alias imports for frontend app code (for example `@/hooks/useClockLogs` in `src/frontend/src/app/pages/clock-logs/page.tsx`, `@/types/reports` in `src/frontend/src/services/index.ts`).
- Backend path aliases: Not detected; use relative imports from `src/backend/src/*`.

## Error Handling

**Patterns:**
- Wrap backend route handlers with `asyncHandler` to forward rejected promises (`src/backend/src/utils/asyncHandler.ts`, route usage in `src/backend/src/routes/EmployeeRoute.ts` and `src/backend/src/routes/AuthRoute.ts`).
- Validate request body via Zod middleware before controller logic (`validateBody` in `src/backend/src/middleware/validateBody.ts`; usage in `src/backend/src/routes/EmployeeRoute.ts`).
- Use controller-level `try/catch` with explicit HTTP status and JSON error payload (for example `src/backend/src/controller/UserController.ts`, `src/backend/src/controller/EmployeeController.ts`).
- When writing new endpoints, keep response shape consistent per route family: either `{ success, data/error }` (for example `src/backend/src/controller/UserController.ts`) or plain entity/error (for example `src/backend/src/controller/EmployeeController.ts`) to avoid client parsing drift.

## Logging

**Framework:** console

**Patterns:**
- Use `console.error` in backend controllers/services for failures (for example `src/backend/src/controller/UserController.ts`, `src/backend/src/service/AuthService.ts`).
- Use `console.warn`/`console.error` in frontend hooks/services for recoverable API issues (for example `src/frontend/src/hooks/useClockLogs.ts`, `src/frontend/src/services/clockLogsService.ts`).
- Use debug `console.log` sparingly for runtime diagnostics (for example API base URL log in `src/frontend/src/services/http.ts`, auth trace logs in `src/backend/src/service/AuthService.ts`).

## Comments

**When to Comment:**
- Add intent-focused inline comments for transformations and compatibility mapping (for example field mapping comments in `src/backend/src/controller/EmployeeController.ts`; API wrapper comments in `src/frontend/src/services/http.ts`).
- Add route purpose and access comments near endpoint declarations (for example `@route/@desc/@access` blocks in `src/backend/src/routes/AuthRoute.ts`).

**JSDoc/TSDoc:**
- Backend utility and service methods frequently include JSDoc with `@param` and `@returns` (for example `src/backend/src/middleware/validateBody.ts`, `src/backend/src/service/EmployeeService.ts`).
- Frontend uses fewer formal docblocks; prefer clear function names and targeted inline comments (`src/frontend/src/hooks/useClockLogs.ts`).

## Function Design

**Size:**
- Keep backend service methods focused on one data operation plus mapping (for example `getEmployeeById` in `src/backend/src/service/EmployeeService.ts`).
- For complex UI workflows, separate orchestration into hooks and keep page components declarative (for example `useClockLogs` in `src/frontend/src/hooks/useClockLogs.ts` consumed by `src/frontend/src/app/pages/clock-logs/page.tsx`).

**Parameters:**
- Prefer typed input objects and explicit interfaces for service and hook boundaries (for example `LoginCredentials` in `src/backend/src/service/AuthService.ts`, filter object in `src/frontend/src/services/clockLogsService.ts#getClockLogsPaginated`).

**Return Values:**
- Hooks should return a stable object shape with state + actions (`{ data, isLoading, error, ...actions }` pattern in `src/frontend/src/hooks/useVacations.ts`, expanded variant in `src/frontend/src/hooks/useClockLogs.ts`).
- Service methods should return typed entities or typed envelopes, not `any` (for example `PaginatedResponse<T>` in `src/frontend/src/services/clockLogsService.ts`, `Promise<Employee | null>` in `src/backend/src/service/EmployeeService.ts`).

## Module Design

**Exports:**
- Backend modules primarily export classes with static methods (for example `export class AuthService` in `src/backend/src/service/AuthService.ts`).
- Frontend modules export either service objects (`ClockLogsService` in `src/frontend/src/services/clockLogsService.ts`) or default component/hook exports (for example `src/frontend/src/components/ui/FormModal.tsx`, `src/frontend/src/hooks/useVacations.ts`).

**Barrel Files:**
- Use barrel exports for frontend services in `src/frontend/src/services/index.ts`.
- Use minimal barrel export for frontend types in `src/frontend/src/types/index.ts`.
- Backend barrel files: Not detected; import from concrete files directly.

---

*Convention analysis: 2026-04-09*
