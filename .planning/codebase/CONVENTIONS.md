# Coding Conventions

**Analysis Date:** 2026-03-26

---

## File Naming

### Backend (`src/backend/src/`)

| Layer | Convention | Examples |
|---|---|---|
| Services | `PascalCase.ts` | `PayrollService.ts`, `DeductionsService.ts`, `EmployeeService.ts` |
| Controllers | `PascalCase.ts` | `PayrollController.ts`, `DeductionsController.ts` |
| Routes | `PascalCase.ts` | `PayrollRoutes.ts`, `DeductionsRoute.ts` |
| Models | `camelCase.ts` | `payroll.ts`, `employee.ts`, `deduction.ts` |
| Zod Schemas | `PascalCase.ts` | `PayrollSchema.ts`, `EmployeeSchema.ts`, `DeductionSchema.ts` |
| Middleware | `PascalCase.ts` | `AuthMiddleware.ts`, `validateBody.ts` |
| Utils | `camelCase.ts` | `asyncHandler.ts`, `payrollUtils.ts`, `docs.ts` |

**Note:** Model files are `camelCase` while all other backend modules are `PascalCase`. This is intentional and consistent throughout the codebase.

### Frontend (`src/frontend/src/`)

| Layer | Convention | Examples |
|---|---|---|
| Components | `PascalCase.tsx` | `AddEmployeeModal.tsx`, `EmployeeTable.tsx` |
| UI sub-components | `PascalCase.tsx` under `components/ui/` | `FormModal.tsx`, `ConfirmDialog.tsx` |
| Pages (Next.js) | `page.tsx` | `src/app/pages/payroll/list/page.tsx` |
| Hooks | `camelCase.ts` with `use` prefix | `useDeductions.ts`, `usePayroll.ts`, `useEmployeeList.ts` |
| Services | `camelCase.ts` | `deductionsService.ts`, `payrollService.ts` |
| Schemas | `camelCase.ts` | `employee.ts`, `vacationSchema.ts` |
| Types | `camelCase.ts` | `employee.ts`, `payrollTypes.ts`, `auditLog.ts` |
| Utils | `camelCase.ts` | `formatters.ts`, `time.ts`, `number.ts`, `employeeUtils.ts` |

**Anomaly:** `src/frontend/src/hooks/user.ts` lacks the `use` prefix — this is an outlier; all other hooks follow the `use<Domain>.ts` pattern.

---

## TypeScript Config

**Backend:** Strict mode, `ES2020` target, `Node16` module resolution, `esModuleInterop: true`

**Frontend:** Strict mode, `ES2017` target, `lib: ["dom", "dom.iterable", "esnext"]`, path alias `@/*` → `./src/*`

---

## Class Design

### Backend — Static-Only Classes

All backend services, controllers, and middleware use static-only classes. Never instantiate them.

```typescript
// src/backend/src/service/PayrollService.ts
export class PayrollService {
  static async createPayroll(data: Payroll): Promise<Payroll> { ... }
  static async getAllPayrolls(): Promise<any[]> { ... }
  static async getPayrollById(id: number): Promise<Payroll | null> { ... }
  static async updatePayroll(id: number, data: Payroll): Promise<Payroll | null> { ... }
}

// src/backend/src/controller/PayrollController.ts
export class PayrollController {
  static async getAllPayrolls(req: Request, res: Response) { ... }
  static async createPayroll(req: Request, res: Response) { ... }
}
```

**Method order in service classes:** create → getAll → getById → update → delete

### Frontend — Object Literal Services

Frontend services are plain object literals with async methods, not classes:

```typescript
// src/frontend/src/services/deductionsService.ts
export const DeductionsService = {
  async createDeduction(payload: Partial<Deduction>): Promise<Deduction> { ... },
  async getAllDeductions(): Promise<Deduction[]> { ... },
  async updateDeduction(id: number, payload: Partial<Deduction>): Promise<Deduction> { ... },
  async deleteDeduction(id: number): Promise<void> { ... },
};
```

### Frontend — React Components

All components are typed as `React.FC<PropsInterface>` with the props interface defined in the same file, above the component:

```typescript
// src/frontend/src/components/AddEmployeeModal.tsx
interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employeeData: EmployeeSchemaType) => Promise<void> | void;
  positions?: Position[] | null;
  positionsLoading?: boolean;
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose, ... }) => {
  ...
};

export default AddEmployeeModal;
```

---

## Import Conventions

### Backend — Prisma Singleton

Always import the singleton. Never call `new PrismaClient()` in services or controllers.

```typescript
// Correct — 15 service/controller files use this
import { prisma } from '../lib/prisma';

// Wrong — only src/backend/src/controller/ClockLogsController.ts does this (known tech debt)
const prisma = new PrismaClient();
```

The singleton is defined at `src/backend/src/lib/prisma.ts` and uses `globalThis` to prevent multiple instances during hot reload.

### Backend — Import Order

```typescript
// 1. External packages
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
// 2. Internal modules (relative paths)
import { PayrollService } from "../service/PayrollService";
import { Payroll } from "../model/payroll";
```

### Frontend — Path Alias

Always use the `@/` alias for all internal imports. Never use relative paths more than one level deep.

```typescript
// Correct
import { http } from '@/services/http';
import { employeeSchema } from '@/schemas/employee';
import { useDeductions } from '@/hooks/useDeductions';
import { Employee } from '@/types/employee';

// Wrong — do not use deep relative paths
import { http } from '../../services/http';
```

### Frontend — Import Order

```typescript
// 1. "use client" directive (first line if needed)
// 2. React and external packages
import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
// 3. Internal @/ alias imports (types, schemas, services, hooks)
import { employeeSchema, EmployeeSchemaType } from '@/schemas/employee';
import { Position } from '@/services/positionsService';
```

---

## Response Format Conventions

### Backend Success Responses

Preferred format for new endpoints uses the wrapper:

```typescript
res.json({ success: true, data: payrolls });
res.status(201).json({ success: true, data: created });
```

Some older/inconsistent controller methods return the object directly (no wrapper):

```typescript
res.json(payroll);           // direct object — found in PayrollController.getPayrollById
res.status(201).json(payroll);
```

**Prefer `{ success: true, data: ... }` for all new endpoints.** The frontend `http.ts` client transparently unwraps `{ data }` responses.

### Backend Error Responses

```typescript
// Standard error shape
res.status(500).json({ success: false, error: "Failed to retrieve payrolls" });
res.status(404).json({ error: "Payroll not found" });  // some older endpoints omit success key

// AuthMiddleware uses `message` instead of `error`
res.status(401).json({ success: false, message: 'Token de acceso requerido' });

// validateBody middleware
res.status(400).json({ success: false, error: "Field is required, Another field error" });
```

### Frontend — http.ts Unwrapping

`src/frontend/src/services/http.ts` automatically extracts `parsed.data` when the response has a `data` property. Services and hooks receive the unwrapped data directly.

---

## JSDoc Patterns

### Backend — Required on All Public Methods

Every public service and controller method requires JSDoc with `@param`, `@returns`, `@throws`:

```typescript
/**
 * Create a new payroll record in the system
 * @param data - Payroll data to create
 * @returns Promise<Payroll> - The created payroll with assigned ID and version
 * @throws Error if payroll creation fails
 */
static async createPayroll(data: Payroll): Promise<Payroll> { ... }
```

Utility functions in `src/backend/src/utils/payrollUtils.ts` also have JSDoc with `@param` and `@returns`.

### Backend — Route Swagger JSDoc

Route files have two comment blocks per route — a plain `@route` comment and a full `@swagger` block:

```typescript
/**
 * @route   POST /payroll/create
 * @desc    Create a new payroll
 * @access  Private
 */
/**
 * @swagger
 * /api/payroll/create:
 *   post:
 *     tags:
 *       - Payroll
 *     summary: Create a new payroll
 *     requestBody: ...
 *     responses: ...
 */
router.post("/payroll/create", validateBody(createPayrollSchema), asyncHandler(PayrollController.createPayroll));
```

### Frontend — Optional JSDoc

Frontend files generally do not require JSDoc. Brief inline comments in Spanish are acceptable for business logic.

---

## Route Registration Pattern

All route files follow this structure:

```typescript
// 1. Create router
const router = Router();

// 2. Apply auth to all routes in this file
router.use(AuthMiddleware.verifyToken);

// 3. Each route: validateBody (if mutating) + asyncHandler wrapping
router.post("/deduction/create",
  validateBody(createDeductionSchema),
  asyncHandler(DeductionsController.createDeduction)
);
router.get("/deductions", asyncHandler(DeductionsController.getAllDeductions));
router.put("/deductions/:id", validateBody(updateDeductionSchema), asyncHandler(DeductionsController.updateDeduction));
router.delete("/deductions/:id", asyncHandler(DeductionsController.deleteDeduction));

export default router;
```

Routes are registered in `src/backend/src/index.ts` all under the `/api` prefix:

```typescript
app.use("/api", payrollRoutes);
app.use("/api", deductionsRoutes);
```

---

## Zod Schema Conventions

### Backend Schemas (`src/backend/src/schemas/`)

- Use `z.coerce.number()` for ID fields to handle JSON string-to-number coercion
- Derive update schemas via `.partial()` on the create schema
- Export both schema and inferred types

```typescript
// src/backend/src/schemas/PayrollSchema.ts
export const createPayrollSchema = z.object({
  payroll_type_id: z.coerce.number().int().positive('Tipo de planilla requerido'),
  period_start: z.string().min(1, 'Fecha inicio requerida'),
  status: z.string().optional().default('PENDIENTE'),
});

export const updatePayrollSchema = createPayrollSchema.partial();

export type CreatePayrollInput = z.infer<typeof createPayrollSchema>;
export type UpdatePayrollInput = z.infer<typeof updatePayrollSchema>;
```

### Frontend Schemas (`src/frontend/src/schemas/`)

- Use `.transform()` on optional fields to normalize `undefined` → `''` (avoids uncontrolled-to-controlled input warnings)
- Export both output type (`z.infer`) and input type (`z.input`) when transforms are used

```typescript
// src/frontend/src/schemas/employee.ts
export const employeeSchema = z.object({
  employee_first_name: z.string().min(1, 'El primer nombre es requerido'),
  employee_middle_name: z.string().optional().transform((v) => v ?? ''),
  employee_email: z.string().email('Correo inválido'),
});

export type EmployeeSchemaType = z.infer<typeof employeeSchema>;
export type EmployeeSchemaInputType = z.input<typeof employeeSchema>;
```

---

## Form Handling Pattern

**Rule:** Always use `react-hook-form` + `zodResolver`. Never use raw `useState` for form fields.

```typescript
// src/frontend/src/components/AddEmployeeModal.tsx
const { register, handleSubmit, formState: { errors, isSubmitting }, reset } =
  useForm<EmployeeSchemaInputType, unknown, EmployeeSchemaType>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employee_first_name: '',
      employee_middle_name: '',
      employee_national_id: '',
      employee_position_id: '',
      // all fields must be initialized to avoid uncontrolled warnings
    }
  });
```

When input and output types differ (due to `.transform()` in the schema), use the three-type-parameter form:
`useForm<InputType, unknown, OutputType>`

**Form reset + focus on open:**

```typescript
useEffect(() => {
  if (!isOpen) return;
  reset();
  const firstInput = modalRef.current?.querySelector('input, select, textarea') as HTMLElement;
  if (firstInput) setTimeout(() => firstInput.focus(), 100);
}, [isOpen, reset]);
```

**Form field naming:** `entity_field_name` snake_case — e.g. `employee_first_name`, `employee_position_id`, `period_start`, `payroll_type_id`.

---

## Modal Animation Pattern

All modals use `AnimatePresence` + `motion.div` with named variant objects.

```typescript
// src/frontend/src/components/AddEmployeeModal.tsx — canonical example
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};
const modalVariants = {
  hidden: { scale: 0.9, opacity: 0, y: 30 },
  visible: {
    scale: 1, opacity: 1, y: 0,
    transition: { type: 'spring' as const, damping: 20, stiffness: 250 }
  },
  exit: { scale: 0.9, opacity: 0, y: 30, transition: { duration: 0.2 } }
};

return (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          variants={backdropVariants}
          initial="hidden" animate="visible" exit="hidden"
          onClick={onClose}
        />
        <motion.div
          variants={modalVariants}
          initial="hidden" animate="visible" exit="exit"
        >
          {/* modal content */}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);
```

---

## Hook Design Pattern

### State Shape

All hooks expose a consistent state object:

```typescript
const [data, setData] = useState<T | null>(null);
const [isLoading, setIsLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
```

### Return Shape

```typescript
return { data, isLoading, error, refetch: fetchAll, create, update, remove };
```

### Async Operations — useCallback Required

All async actions inside hooks must be wrapped in `useCallback`:

```typescript
// src/frontend/src/hooks/useDeductions.ts
const fetchAll = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  try {
    const res = await DeductionsService.getAllDeductions();
    setData(res);
  } catch (e: unknown) {
    setError(e instanceof Error ? e.message : 'Error cargando deducciones');
  } finally {
    setIsLoading(false);
  }
}, []);

useEffect(() => { fetchAll(); }, [fetchAll]);
```

### Auto-Fetch on Mount

List hooks (those with a `fetchAll`) call it in a `useEffect` with the `fetchAll` callback as dependency, so data loads on component mount.

---

## Error Handling Patterns

### Backend — Controllers

Controllers use try/catch, log with `console.error`, and return structured JSON. Services are not wrapped in try/catch by default — errors propagate upward.

```typescript
// src/backend/src/controller/PayrollController.ts
static async getAllPayrolls(req: Request, res: Response) {
  try {
    const payrolls = await PayrollService.getAllPayrolls();
    res.json({ success: true, data: payrolls });
  } catch (error) {
    console.error("Failed to retrieve payrolls:", error);
    res.status(500).json({ success: false, error: "Failed to retrieve payrolls" });
  }
}
```

### Backend — Services

Service methods let errors propagate naturally. Only complex methods (e.g. `getPayrollEmployees`) wrap with try/catch and rethrow with a user-friendly message:

```typescript
} catch (error) {
  console.error('Error fetching payroll employees:', error);
  throw new Error('Failed to retrieve payroll employees');
}
```

### Frontend — Services

Services re-wrap errors with a friendly message before rethrowing:

```typescript
async getAllDeductions(): Promise<Deduction[]> {
  try {
    return await http.get('/deductions');
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Error al cargar deducciones');
  }
}
```

### Frontend — Hooks

Hooks capture the error message into state and expose it:

```typescript
} catch (e: unknown) {
  setError(e instanceof Error ? e.message : 'Error message fallback');
}
```

---

## Constants Pattern

Top-level constants use `SCREAMING_SNAKE_CASE` with `as const`:

```typescript
// src/frontend/src/constants/index.ts
export const EMPLOYEE_STATUS = {
  ACTIVE: 'active' as const,
  VACATION: 'vacation' as const,
} as const;

export const STATUS_BADGE_CONFIG = { ... } as const;

// src/backend/src/utils/payrollUtils.ts
const REGULAR_HOURS_PER_DAY  = 8;
const OVERTIME_MULTIPLIER    = 1.5;
const WORKING_DAYS_PER_WEEK  = 6;
```

---

## Language Conventions

- **User-facing validation messages:** Spanish — e.g. `'El primer nombre es requerido'`, `'Cédula de identidad *'`
- **Developer-facing logs and errors:** English — e.g. `console.error("Failed to retrieve payrolls:", error)`
- **Business logic comments:** Spanish acceptable — e.g. `// Calcular estadísticas agregadas`
- **Infrastructure comments:** English — e.g. `// Build API_BASE defensively`

---

## Code Quality Tools

**Backend:**
- No ESLint or Prettier config — TypeScript strict mode is the only automated quality gate
- No pre-commit hooks

**Frontend:**
- ESLint 9.x flat config at `src/frontend/eslint.config.mjs`
- Extends `next/core-web-vitals` and `next/typescript`
- No Prettier config — formatting is editor-driven
- No Husky or lint-staged
- Run with: `npx next lint` from `src/frontend/`

---

## Logging

- Backend uses `console.error(...)` in catch blocks and `console.log(...)` for server startup messages
- Frontend uses `console.log('[http] API_BASE =', API_BASE)` in `http.ts` during development
- No structured logging library in either layer

---

*Convention analysis: 2026-03-26*
