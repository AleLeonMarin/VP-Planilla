# Code Conventions

**Analysis Date:** 2026-03-25

## Language Style

**Backend:**
- TypeScript 5.8.x, targeting ES2020, Node16 module resolution
- Strict mode enabled (`"strict": true` in `src/backend/tsconfig.json`)
- `esModuleInterop: true`; no barrel `index.ts` exports in backend

**Frontend:**
- TypeScript 5.9.x, targeting ES2017 with `lib: ["dom", "dom.iterable", "esnext"]`
- Strict mode enabled (`src/frontend/tsconfig.json`)
- Path alias: `@/*` → `./src/*` (used throughout all frontend imports)
- JSX: preserved for Next.js 15 with Turbopack
- Mix of Spanish and English in comments and identifiers (Spanish dominates in UI-facing code; English in core logic)

## Naming Conventions

**Files:**
- Backend: `PascalCase` for all TypeScript modules (e.g., `PayrollService.ts`, `PayrollController.ts`, `PayrollRoutes.ts`, `employee.ts` for models)
- Frontend components: `PascalCase` (e.g., `EmployeeTable.tsx`, `AddEmployeeModal.tsx`)
- Frontend hooks: `camelCase` prefixed with `use` (e.g., `usePayroll.ts`, `useEmployeeTable.ts`)
- Frontend services: `camelCase` (e.g., `payrollService.ts`, `employeeService.ts`)
- Frontend schemas: `camelCase` (e.g., `employee.ts`, `vacationSchema.ts`)
- Frontend utils: `camelCase` (e.g., `employeeUtils.ts`, `formatters.ts`)

**Classes:**
- `PascalCase` for all classes (e.g., `PayrollService`, `PayrollController`, `AuthMiddleware`)
- Backend services and controllers are always static-method classes (no instantiation for most)

**Functions and Methods:**
- `camelCase` for all functions and methods (e.g., `createPayroll`, `getAllPayrolls`, `formatSalary`)
- Backend service methods: always `static async`
- Frontend util functions: named arrow function exports (`export const formatSalary = ...`)
- Frontend hook functions: wrapped in `useCallback` for async operations

**Variables and Parameters:**
- `camelCase` everywhere
- Database field mappings use `snake_case` to mirror Prisma-generated names (e.g., `payrolls_period_start`)
- Model/domain fields use `snake_case` (e.g., `period_start`, `payroll_type`, `national_id`)
- Frontend form field names use the prefix pattern `entity_field_name` (e.g., `employee_first_name`, `employee_position_id`)

**Types and Interfaces:**
- `PascalCase` (e.g., `Employee`, `Payroll`, `EmployeeStatus`, `SortColumn`)
- Zod schema type exports use `SchemaType` / `SchemaInputType` suffix (e.g., `EmployeeSchemaType`, `EmployeeSchemaInputType`)
- Union literal types named with the domain they describe (e.g., `EmployeeStatus`, `SortDirection`)

**Constants:**
- `SCREAMING_SNAKE_CASE` for top-level constants (e.g., `REGULAR_HOURS_PER_DAY`, `OVERTIME_MULTIPLIER`, `EMPLOYEE_STATUS`, `STATUS_BADGE_CONFIG`)

## File Organization

**Backend file internals (`src/backend/src/`):**
```
1. Imports (external packages first, then internal)
2. Module-level constants (PrismaClient instance: `const prisma = new PrismaClient()`)
3. Class declaration with static methods in logical CRUD order: create → getAll → getById → update → delete
4. Each method preceded by a JSDoc block
```

**Frontend component internals (`src/frontend/src/components/`):**
```
1. "use client" directive (when needed)
2. React and external library imports
3. Internal @/ alias imports (types, utils, hooks, services)
4. Interface/type definitions for props
5. Component function with destructured props
6. Hook calls (useCallback, useState, custom hooks)
7. Helper functions / handlers inside component
8. JSX return
```

**Frontend hook internals (`src/frontend/src/hooks/`):**
```
1. useState declarations (data, isLoading, error)
2. useCallback-wrapped async functions with try/catch/finally pattern
3. return object with state and action functions
```

## Component Patterns

**React components:**
- Functional components only (no class components)
- Always explicitly typed as `React.FC<PropsInterface>` or `React.FC<PropsType>`
- Props interface defined in the same file, immediately above the component
- Framer Motion (`framer-motion`) used for modal/dialog animations with `AnimatePresence` + `motion.div`
- `react-hook-form` + `zodResolver` used for all forms — never uncontrolled raw state for form inputs

**Form pattern:**
```typescript
const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<InputType, unknown, OutputType>({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});
```

**Modal pattern:**
- Modals use `AnimatePresence` with `backdropVariants` and `modalVariants` for consistent animation
- `useRef<HTMLDivElement | null>` for focus management
- `useEffect` with `isOpen` dependency to reset form and focus first input

**Custom hooks:**
- Each domain area has a dedicated hook (e.g., `usePayroll`, `useEmployeeList`, `usePositions`)
- Hooks manage `data`, `isLoading`, and `error` state uniformly
- All async operations wrapped in `useCallback`

**Service layer (frontend):**
- Plain object exports with async methods (e.g., `export const PayrollService = { ... }`)
- All calls go through `src/frontend/src/services/http.ts` — never raw `fetch` in components or hooks
- The `http` module automatically attaches Bearer tokens and handles 401 token refresh

## Error Handling

**Backend:**
- Controllers wrap all logic in `try/catch` blocks
- Errors logged via `console.error("description:", error)` before sending HTTP response
- HTTP error responses return JSON `{ success: false, error: "message" }` or `{ error: "message" }`
- Success responses return JSON `{ success: true, data: ... }` or direct object (inconsistent, see CONCERNS.md)
- Services propagate errors upward by default (no swallowing); only `getPayrollEmployees` wraps in try/catch and rethrows with a generic message
- Route handlers use `asyncHandler` wrapper (`src/backend/src/utils/asyncHandler.ts`) to catch unhandled promise rejections

**Frontend:**
- Hooks catch errors with `err instanceof Error ? err.message : 'fallback message'` pattern
- Error state stored in hook's `error: string | null`
- Service functions rethrow with `new Error(err instanceof Error ? err.message : 'fallback')`
- `http.ts` throws typed `Error` objects for all failure modes (network, 4xx, 5xx, auth failure)

## Code Quality Tools

**Backend:**
- No ESLint or Prettier config detected at project or backend level
- TypeScript strict mode acts as primary quality gate
- `ts-jest` for type-checked test execution

**Frontend:**
- ESLint 9.x with flat config format: `src/frontend/eslint.config.mjs`
- Extends: `next/core-web-vitals` and `next/typescript`
- No Prettier config detected — formatting appears manual/editor-driven
- No Husky or lint-staged hooks detected
- No CI/CD pipeline config (no `.github/workflows/`)

**Shared:**
- Both packages use `typescript` with strict mode as the primary code quality enforcement
- No pre-commit hooks; no automated formatting on commit

## Import Organization

**Backend pattern:**
```typescript
// 1. External packages
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
// 2. Internal modules (relative paths)
import { PayrollService } from "../service/PayrollService";
import { Payroll } from "../model/payroll";
```

**Frontend pattern:**
```typescript
// 1. React and external packages
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// 2. Internal @/ alias imports
import { Employee } from '@/types';
import { formatSalary } from '@/utils/employeeUtils';
import useEmployeeTable from '@/hooks/useEmployeeTable';
```

## Logging

- `console.error(...)` in catch blocks throughout backend (no structured logger)
- `console.log(...)` used for informational messages in server startup and middleware
- Frontend: `console.log('[http] API_BASE =', API_BASE)` for debug in development; no logging library

## JSDoc Comments

- Backend: JSDoc on every public service method and controller method. Format:
  ```typescript
  /**
   * Brief description
   * @param name - Description
   * @returns Return description
   * @throws Error condition
   */
  ```
- Backend utility functions also have JSDoc with `@param` and `@returns`
- Frontend: JSDoc on utility functions. Components have brief JSDoc summary above definition.
- Spanish comments used in business logic (e.g., `// Calcular estadísticas...`); English in core infrastructure

---

*Convention analysis: 2026-03-25*
