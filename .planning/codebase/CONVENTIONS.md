# Coding Conventions

**Analysis Date:** 2026-03-26

## Naming Patterns

**Backend Files:**
- Services: `PascalCase` — `EmployeeService.ts`, `NomineeService.ts`, `PayrollService.ts`
- Controllers: `PascalCase` — `EmployeeController.ts`, `PayrollController.ts`
- Routes: `PascalCase` — `EmployeeRoute.ts`, `PayrollRoutes.ts` (inconsistent: most are `Route.ts`, payroll is `Routes.ts`)
- Schemas: `PascalCase` — `EmployeeSchema.ts`, `PayrollSchema.ts`, `ClockLogSchema.ts`
- Models: lowercase `camelCase` file names — `employee.ts`, `payroll.ts` (not PascalCase like services)

**Frontend Files:**
- Components: `PascalCase.tsx` — `AddEmployeeModal.tsx`, `EmployeeTable.tsx`
- Hooks: `camelCase` with `use` prefix — `useEmployeeList.ts`, `usePayroll.ts`
- Services: `camelCase` — `employeeService.ts`, `payrollService.ts`
- Schemas: mixed — `employee.ts` (no suffix), `vacationSchema.ts` (has suffix)
- Types: `camelCase` — `employee.ts`, `laborEvent.ts`

**Functions / Methods:**
- Backend: `camelCase` static methods — `createEmployee`, `getAllEmployees`, `getEmployeeById`
- Frontend hook actions: `handleX` prefix for event handlers — `handleAddEmployee`, `handleUpdateEmployee`
- Modal controls: `openX` / `closeX` naming — `openAddEmployeeModal`, `closeEditEmployeeModal`

**Variables:**
- `camelCase` throughout both backend and frontend
- `snake_case` for domain / DB field names — `employee_first_name`, `period_start`, `national_id`

**Types / Interfaces:**
- `PascalCase` — `Employee`, `Payroll`, `EmployeeFormData`, `PayrollCalculationResult`
- Exported type aliases: `PascalCase` — `EmployeeStatus`, `CreateEmployeeInput`, `UpdateEmployeeInput`

**Constants:**
- `SCREAMING_SNAKE_CASE` — `REGULAR_HOURS_PER_DAY`, `OVERTIME_MULTIPLIER`, `EMPLOYEE_STATUS`, `STATUS_BADGE_CONFIG`
- Frontend constants: `src/frontend/src/constants/index.ts`
- Backend constants: module-level in `src/backend/src/utils/payrollUtils.ts`

**DB / Form Field Names:**
- All DB fields follow `tablename_fieldname` snake_case — `employee_first_name`, `payrolls_period_start`
- All HTML form input names follow `entity_field_name` — `employee_first_name`, `employee_email`
- The `employee_` prefix convention is respected by both frontend forms and backend Zod schemas

## Code Style

**Formatting:**
- No `.prettierrc` or `biome.json` detected — formatting is manual / editor-enforced
- Indentation: 2 spaces throughout both backend and frontend

**Linting (Frontend):**
- ESLint via Next.js: `next/core-web-vitals` + `next/typescript`
- Run: `npx next lint` from `src/frontend/`
- Active suppression example in `useEmployeeList.ts`: `// eslint-disable-next-line react-hooks/exhaustive-deps`

**TypeScript:**
- Backend: `tsconfig.json` at `src/backend/`; 27 active type errors (see CONCERNS.md for details)
- Frontend: `tsconfig.json` at `src/frontend/`; uses `@/` path alias configured via `paths`
- `any` used in controller layer (`createPayload: any` in `EmployeeService.ts`) and in `NomineeService.ts`

## Import Organization

**Backend:**
1. External packages — `import { Router } from 'express'`
2. Internal services / controllers — `import { EmployeeService } from '../service/EmployeeService'`
3. Middleware / utils — `import { asyncHandler } from '../utils/asyncHandler'`
4. Schemas — `import { createEmployeeSchema } from '../schemas/EmployeeSchema'`

**Frontend:**
- Path alias `@/` used throughout — `import { http } from '@/services/http'`
- Never use relative imports deeper than one level (`../../`)
- External packages first, then `@/` imports

**Path Aliases:**
- Frontend: `@/` maps to `src/frontend/src/`
- Backend: no path aliases; uses relative `../` imports

## Error Handling

**Backend Controller Pattern:**
```typescript
try {
  const result = await SomeService.method(data);
  return res.status(200).json(result);
} catch (error) {
  console.error("Error doing X:", error);
  return res.status(500).json({ error: "Failed to do X" });
}
```

**Zod Validation Errors (via `validateBody` middleware):**
- Returns `400` with `{ success: false, error: "<comma-joined messages>" }`
- Located at `src/backend/src/middleware/validateBody.ts`

**`asyncHandler` wrapping:**
- All routes must use `asyncHandler` from `src/backend/src/utils/asyncHandler.ts`
- Wraps handler in `Promise.resolve(fn()).catch(next)` to forward unhandled rejections

**Frontend Service Pattern:**
```typescript
export const getEmployees = async (): Promise<Employee[]> => {
  try {
    return await http.get('/employee');
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch employees');
  }
};
```

**Frontend Hook Error Handling:**
- Hooks catch service errors with `console.error` + `alert()` — no toast library in use
- Errors are not stored in hook state by default

## Logging

**Backend:**
- `console.log` / `console.error` directly — no structured logging library
- Singleton Prisma (`src/backend/src/lib/prisma.ts`) logs every SQL query via `$on('query')` with a running counter
- Source-identified prefix pattern: `console.log('[Payroll] ...')`, `console.log('[QUERY N] ...')`
- Debug-level logs remain in production code (deduction loading, payroll record saves in `NomineeService.ts`)

**Frontend:**
- `console.error` in hook catch blocks
- `console.log` for debug traces left in `useEmployeeList.ts`
- `src/frontend/src/services/http.ts` logs `[http] API_BASE =` on every page load when `window` is defined

## Comments

**When to Comment:**
- Every public backend method has JSDoc with `@param`, `@returns`, `@throws`
- Every route has a `@swagger` JSDoc annotation
- Business logic comments: Spanish — `// Formato cédula: X-XXXX-XXXX`
- Infrastructure comments: English — `// Build API_BASE defensively`

**JSDoc Example (backend service):**
```typescript
/**
 * Create a new employee
 * @param data - Employee data to create
 * @returns The created employee
 * @throws Error if the employee creation fails
 */
static async createEmployee(data: Employee): Promise<Employee>
```

**Swagger JSDoc Example (route):**
```typescript
/**
 * @swagger
 * /api/employee/create:
 *   post:
 *     tags: [Employees]
 *     summary: Create a new employee
 */
router.post("/employee/create", validateBody(createEmployeeSchema), asyncHandler(EmployeeController.createEmployee));
```

## Function Design

**Backend Services:**
- Static methods only — service classes are never instantiated
- Method ordering within each class: `create` → `getAll` → `getById` → `update` → `delete`
- No `any` in method signatures — use types from `src/backend/src/model/`
- Exception: `NomineeService.ts` still uses instance methods (`async getClockLogs`) — legacy design, not replicated

**Frontend Hooks:**
- Async operations wrapped in `useCallback` (convention; some hooks use inline `async` inside `useEffect`)
- Return shape: `{ data, isLoading, error, ...actions }` — always a plain object, never a tuple
- Modal open/close exposed as plain functions: `openAddEmployeeModal`, `closeEditEmployeeModal`

**Frontend Components:**
- All components: `React.FC<PropsInterface>` with interface defined in the same file
- `"use client"` directive required at top of every file that uses hooks or browser APIs

## Form Pattern

**Required stack:** `react-hook-form` + `zodResolver` — never raw `useState` for form fields.

**Typing pattern:**
```typescript
const { register, handleSubmit, formState, reset } =
  useForm<EmployeeSchemaInputType, unknown, EmployeeSchemaType>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { ... }
  });
```

**useEffect reset on modal open:**
```typescript
useEffect(() => {
  if (!isOpen) return;
  reset();
  // focus first input via ref
}, [isOpen, reset]);
```

Example: `src/frontend/src/components/AddEmployeeModal.tsx`

## Modal Animation Pattern

All modals use `framer-motion` `AnimatePresence` + `motion.div`. Use exactly these variant names for consistency:

```typescript
const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = {
  hidden: { scale: 0.9, opacity: 0, y: 30 },
  visible: {
    scale: 1, opacity: 1, y: 0,
    transition: { type: 'spring' as const, damping: 20, stiffness: 250 }
  },
  exit: { scale: 0.9, opacity: 0, y: 30, transition: { duration: 0.2 } }
};
```

Backdrop: `bg-black/30 dark:bg-black/60 z-40`

Example: `src/frontend/src/components/AddEmployeeModal.tsx`

## Status Mapping Pattern (EmployeeService)

The `statusMap` in `src/backend/src/service/EmployeeService.ts` translates frontend string values to the DB `Char(1)` values. This pattern is duplicated in **both** `createEmployee` and `updateEmployee`:

```typescript
const statusMap: Record<string, string> = {
    active: 'A',
    vacation: 'V',
    incomplete_assistance: 'I',
    incapacity_maternity: 'M'
};
// Pass through if already Char(1), otherwise map, fallback to 'A'
const statusChar = (typeof data.status === 'string' && data.status.length === 1)
    ? data.status
    : statusMap[data.status as string] ?? 'A';
```

The reverse mapping (DB `Char(1)` → frontend constant) lives in `useEmployeeList.ts` inside `mapApiEmployees()`.

## Zod Schema Conventions

**Backend schemas** (`src/backend/src/schemas/`):
- File per domain: `EmployeeSchema.ts`, `PayrollSchema.ts`, `DeductionSchema.ts`, `ClockLogSchema.ts`, `UserSchema.ts`
- Export `createXSchema` + `updateXSchema` (usually `createXSchema.partial()`)
- Export `CreateXInput` / `UpdateXInput` via `z.infer<typeof schema>`
- Use `z.coerce.number()` for numeric IDs received as strings from HTTP bodies
- Error messages in Spanish: `'El primer nombre es requerido'`
- `updateEmployeeSchema` accepts both `employee_`-prefixed and non-prefixed fields for backward compatibility

**Frontend schemas** (`src/frontend/src/schemas/`):
- Optional string fields: `.optional().transform((v) => v ?? '')` to guarantee `string` output type
- Export both `SchemaType` (output) and `SchemaInputType` (input = `z.input<typeof schema>`) for `useForm` typing

## Module Design

**Backend:**
- Each domain: one file per layer (route, controller, service, schema)
- Services export a class with static methods only
- Models export plain interfaces — zero logic allowed in `src/backend/src/model/`

**Frontend:**
- Services export named async functions (not classes)
- `src/frontend/src/services/index.ts` re-exports from all services
- `src/frontend/src/types/index.ts` re-exports from all type files
- No barrel file for hooks or components

---

*Convention analysis: 2026-03-26*
