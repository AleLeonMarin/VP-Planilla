---
status: complete
phase: 13-integracion-frontend-backend
source:
  - 13-01-SUMMARY.md
  - 13-02-SUMMARY.md
  - 13-03-SUMMARY.md
started: "2026-04-01T21:30:00.000Z"
updated: "2026-04-01T22:45:00.000Z"
---

## Current Test

[testing complete]

## Tests

### 1. Error Toast on API Failure
expected: When an API call fails (e.g., creating a deduction with invalid data), a toast.error notification appears with the specific backend error message in Spanish. Network errors show a helpful connectivity message.
result: issue
reported: "lo que me sale es un mensaje coomo hecho por el sistema con la opcion de entendido"
severity: major
root_cause: Pages use `modal.showSuccess()`/`modal.showError()` which renders a custom Modal dialog with "Entendido" button, NOT sonner toasts. The Toaster IS mounted in `src/frontend/src/layouts/main.tsx` but no page code calls `toast.success()` or `toast.error()`.
fix_required: Replace `modal.showSuccess(title, message)` → `toast.success(message)` and `modal.showError(title, message)` → `toast.error(message)` in all page files.

### 2. Table Loading Skeletons
expected: When loading data on the positions or bonuses list page, skeleton rows with animate-pulse appear before the data loads, matching the column structure of the table.
result: issue
reported: "en la modal de psociones por ejemplo lo unico que sale es un mensaje de cargando posiciones..."
severity: minor
root_cause: The skeleton logic in Table.tsx is correct, but `isLoading` is set to true during CRUD mutations (create/update/delete), not just initial fetch. This causes skeleton to replace existing data during mutations, which is jarring. The "Cargando posiciones..." text is likely from a separate loading pattern outside the Table component.
fix_required: Add separate `isFetching` vs `isMutating` state. Skeletons should only show during initial data fetch, not during CRUD operations.

### 3. Table Error State with Retry
expected: When data loading fails on the positions or bonuses list page, a red error banner appears with an error message and a "Reintentar" (Retry) button that re-triggers the data fetch.
result: issue
reported: "en el modal de posiciones sale un No hay posiciones registradas, en bpnificaciones sale un error al cargar datos reitentar"
severity: major
root_cause: Positions page shows empty state ("No hay posiciones registradas") instead of error banner when backend is unavailable. The Table component checks `error` BEFORE `isLoading` and data, but the hook may not be setting `error` correctly when backend returns empty array instead of throwing. Bonuses page works correctly.
fix_required: Ensure hook distinguishes between "fetch failed" (error state) and "fetch succeeded with no data" (empty state). Check positionsService.ts to verify it throws on non-2xx responses.

### 4. Labor Event Creation with event_type
expected: When creating a new labor event, the event_type field is sent in the payload and the event is created successfully without validation errors.
result: issue
reported: "PrismaClientValidationError: employee_labor_event_labor_event_id: undefined"
severity: blocker
root_cause: Field name mismatch — frontend sends `labor_event_ids` (plural, array) but backend controller destructures `labor_event_id` (singular). Backend receives undefined, Prisma fails.
fix_required: Change frontend `laborEventsService.ts` line 44 from `labor_event_ids: [data.labor_event_id]` to `labor_event_id: data.labor_event_id` (singular).

### 5. Payroll Type Creation with frequency
expected: When creating a new payroll type, the frequency field is sent in the payload and the payroll type is created successfully without validation errors.
result: issue
reported: "se crea, sale un mensaje modal todavia hecho por el sistema que dice entendido"
severity: minor
root_cause: Same as Test 1 — success message uses modal dialog instead of toast notification.
fix_required: Same as Test 1 — replace `modal.showSuccess()` with `toast.success()`.

## Summary

total: 5
passed: 0
issues: 5
pending: 0
skipped: 0

## Gaps

- truth: "Error/success notifications should use toast (sonner) not modal dialogs"
  status: failed
  reason: "User reported: modal del sistema con botón entendido en vez de toast notifications"
  severity: major
  test: 1
  root_cause: "Pages use modal.showSuccess()/modal.showError() which renders custom Modal dialog, not sonner toasts"
  artifacts:
    - src/frontend/src/hooks/useModal.tsx
    - src/frontend/src/app/pages/positions/list/page.tsx
    - src/frontend/src/app/pages/bonuses/list/page.tsx
    - src/frontend/src/app/pages/employee/events/page.tsx
  missing:
    - Replace modal.showSuccess() → toast.success()
    - Replace modal.showError() → toast.error()

- truth: "Table should show animated skeleton rows during initial data load"
  status: failed
  reason: "User reported: solo muestra texto 'Cargando posiciones...' en vez de skeleton rows"
  severity: minor
  test: 2
  root_cause: "isLoading is true during CRUD mutations, causing skeleton to replace existing data. Separate isFetching vs isMutating state needed."
  artifacts:
    - src/frontend/src/hooks/usePositions.ts
    - src/frontend/src/hooks/useBonuses.ts
    - src/frontend/src/components/ui/Table.tsx
  missing:
    - Add isFetching vs isMutating state separation
    - Only show skeletons during initial fetch

- truth: "Table should show error banner with retry button when data loading fails"
  status: failed
  reason: "User reported: positions shows 'No hay posiciones registradas' instead of error banner; bonuses works correctly"
  severity: major
  test: 3
  root_cause: "Hook doesn't distinguish between fetch failed (error) and fetch succeeded with empty data. Backend may return empty array instead of throwing."
  artifacts:
    - src/frontend/src/hooks/usePositions.ts
    - src/frontend/src/services/positionsService.ts
  missing:
    - Ensure service throws on non-2xx responses
    - Hook should set error state on network failures

- truth: "Labor event assignment should succeed with valid labor_event_id"
  status: failed
  reason: "PrismaClientValidationError: employee_labor_event_labor_event_id: undefined"
  severity: blocker
  test: 4
  root_cause: "Field name mismatch: frontend sends labor_event_ids (plural), backend reads labor_event_id (singular)"
  artifacts:
    - src/frontend/src/services/laborEventsService.ts
    - src/backend/src/controller/LaborEventsController.ts
  missing:
    - Fix frontend to send labor_event_id (singular) to match backend

- truth: "Success messages should use toast notifications"
  status: failed
  reason: "User reported: modal del sistema con entendido en vez de toast"
  severity: minor
  test: 5
  root_cause: "Same as gap 1 — pages use modal.showSuccess() instead of toast.success()"
  artifacts:
    - src/frontend/src/app/pages/payroll-types/list/page.tsx
  missing:
    - Replace modal.showSuccess() → toast.success()
