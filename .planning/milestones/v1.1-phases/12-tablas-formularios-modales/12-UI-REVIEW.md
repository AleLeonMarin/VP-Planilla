# Phase 12 — UI Review

**Audited:** 2026-04-01
**Baseline:** Abstract 6-pillar standards (no UI-SPEC.md for this phase)
**Screenshots:** Not captured (no dev server detected at ports 3000, 5173, 8080)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Empty states are contextual; minor generic labels remain in Table.tsx base component |
| 2. Visuals | 2/4 | EmployeeProfileModal (13 residual hex) and EmployeeAttendanceTable (9 residual hex) still break visual unity; gradient-heavy pages diverge from zinc-flat system |
| 3. Color | 2/4 | 39 `dark:*-gray-*` classes (should be zinc), 39 focus-ring hex instances, multiple pages never fully migrated — 3 competing palette strategies remain |
| 4. Typography | 3/4 | 8 distinct font sizes in use (acceptable range); 3 weight classes dominate; `text-[10px]` and `text-[11px]` arbitrary sizes appear in 7+ places |
| 5. Spacing | 3/4 | Core scale is p-{2,3,4,5,6,8} with consistent gap-{2,3,4}; `p-16` used for empty states only (appropriate); no breaking arbitrary values |
| 6. Experience Design | 3/4 | Loading states, error states, disabled states all present; ConfirmDialog wired for logout; validation feedback complete; no skeleton loaders (spinner-only pattern) |

**Overall: 16/24**

---

## Top 3 Priority Fixes

1. **EmployeeProfileModal.tsx and EmployeeAttendanceTable.tsx retain light-mode hex colors** — Users in dark mode see jarring beige/tan surfaces inside the employee profile and attendance table, breaking the otherwise consistent zinc-900 interface — replace all `bg-[#F5F0E8]`, `bg-[#E6DCC6]`, `bg-[#D4BD80]`, `bg-[#D5CDB3]`, `bg-[#B5AF9A]` and matching text/border hex values with their zinc equivalents (zinc-900/800/700/600/500).

2. **39 `dark:*-gray-*` classes across 8+ files need replacing with `dark:*-zinc-*`** — When the app runs in dark mode, elements styled with `gray-700`, `gray-800`, `gray-600` render at a visually distinct shade from the primary zinc scale — this is most visible in `users/page.tsx` (10 instances), `payroll-types/list/page.tsx` (6 instances), `payroll/list/page.tsx` (2 instances), `positions/list/page.tsx` (2 instances), and `DatePicker.tsx` (1 instance) — do a targeted replacement: `dark:bg-gray-` → `dark:bg-zinc-`, `dark:text-gray-` → `dark:text-zinc-`, `dark:border-gray-` → `dark:border-zinc-`.

3. **39 focus-ring hex instances (`focus:ring-[#6F7153]`) should be replaced with a Tailwind token** — Form inputs across pages use `focus:ring-[#6F7153]` for the keyboard focus ring — this is the only remaining per-property arbitrary value that spans the entire app, and it makes the codebase non-refactorable for theming — replace with `focus:ring-green-700` (the equivalent hex maps to that token).

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**Strengths:**
- Empty states are consistently contextual in Spanish: "No hay planillas guardadas", "No hay empleados en esta planilla", "No hay solicitudes de vacaciones", "No hay sucursales registradas" — all domain-specific, none generic.
- Error messages use domain language: "Archivo sin marcas", "Sin marcas — No se encontraron registros en el rango seleccionado".
- Destructive action confirmation message is well-worded: "¿Estás seguro de que deseas cerrar sesión?" with async handler.
- Form validation errors are contextual per field (react-hook-form errors at field level).

**Minor issues:**
- `components/ui/Table.tsx:64` — base Table component empty state reads "No hay datos disponibles" — acceptable as a fallback but several callers do not override it, meaning pages that use the base Table component without a custom empty state show this generic message.
- `components/ui/Table.tsx:49,52` — generic labels "Editar" and "Eliminar" on action buttons are fine for this domain; no issue.
- `PayrollCreateModal.tsx:244` — single label "Guardar" on a create action is appropriate given the form context.

**No generic English copy found.** No "Submit", "OK", "Click Here", "Something went wrong" patterns detected.

---

### Pillar 2: Visuals (2/4)

**Visual hierarchy (code-inferred):**
- Dashboard page (`pages/main/page.tsx`) uses `text-3xl font-bold` headings, `text-sm` body — clear hierarchy.
- Stats cards use `border-l-4 border-l-green-600` accent pattern — consistent visual anchor.
- Table headers use `uppercase tracking-wider text-xs` — standard pattern, good scan hierarchy.
- Sidebar uses `border-l-2 border-green-500` for active nav items — clear without being noisy.

**Issues:**
- `components/EmployeeProfileModal.tsx` still has 13+ hardcoded hex colors with `dark:` variants that use matching zinc pairs — BUT the light-mode hex colors remain (e.g. `bg-[#F5F0E8]`, `bg-[#E6DCC6]`, `bg-[#D4BD80]`, `bg-[#F0EBD8]`, `bg-[#F8F4E6]`). The modal has a dual-tone sidebar navigation and gallery-style layout that introduces unintended visual complexity; the light-side hex creates a mismatched layered look.
- `components/EmployeeAttendanceTable.tsx` retains `bg-[#D5CDB3]`, `bg-[#B5AF9A]`, `bg-[#D2B48C]` for pagination buttons — these appear as warm-tan elements surrounded by cool-zinc surfaces.
- Multiple pages use `bg-gradient-to-r from-[#6F7153] to-[#3B4D36]` for headers (clocklogs, vacations, attendance, payrollCreateModal) — 33 gradient instances total. While individually intentional, this creates inconsistency: some page headers are flat zinc, others are green gradients. There is no single rule for when a header earns a gradient.
- `app/not-found.tsx` is entirely light-mode (`bg-[#E7DCC1]`, `text-[#3B4D36]`) with no dark variants — the 404 page is a jarring light island if a user navigates to an unknown route in dark mode.
- Icon-only interactive controls (close buttons on modals) have `aria-label="Cerrar"` in some components (`DismissEmployeeModal.tsx:65`, `Modal.tsx:103`) — good accessibility baseline.

---

### Pillar 3: Color (2/4)

**Accent usage — green:**
- 218 occurrences of `green-600`/`green-700`/`green-500` across the codebase. This includes: primary CTAs (correct), sidebar active border (correct), stats card left border (correct), spinner borders in loading states (correct). The accent is semantically bounded — not applied decoratively to non-interactive elements.

**Semantic color (red/blue):**
- 144 occurrences of `bg-blue-600`/`text-blue-*`/`bg-red-600`/`text-red-*`. Blue is used exclusively on the "Editar" action buttons in `Table.tsx` — this is semantically correct. Red is used for validation error states and delete actions — correct.

**Palette contamination — gray-* in dark:**
- 39 `dark:*-gray-*` instances remain. Key locations:
  - `app/pages/users/page.tsx` — `dark:bg-gray-800` (3x), `dark:bg-gray-700` (6x), `dark:text-gray-400`, `dark:border-zinc-700` mixed with `dark:bg-gray-800` in the same file
  - `app/pages/payroll-types/list/page.tsx` — `dark:bg-gray-800` (3x), `dark:bg-gray-700` (4x)
  - `app/pages/positions/list/page.tsx` — `dark:bg-gray-700` (3x)
  - `app/pages/audit-logs/page.tsx` — `dark:bg-gray-600`, `dark:bg-gray-700` (4x)
  - `app/pages/auth/page.tsx` — `dark:bg-gray-600` in disabled button state
  - `components/DatePicker.tsx:219` — `dark:bg-gray-700`
  - `app/pages/bonuses/list/page.tsx` — `dark:bg-gray-700`, `dark:bg-gray-600`
  - `app/pages/main/page.tsx:416` — `dark:bg-gray-800`

- `gray-800` = `#1f2937`, `zinc-800` = `#27272a` — a 7-unit hue shift that is perceptible on calibrated displays and on high-DPI screens.

**Hardcoded hex without dark variants (non-attendance, non-audit-logs, non-auth):**
- `app/not-found.tsx` — 6 hex values, zero dark variants (full page)
- `app/pages/payroll/list/page.tsx:57` — `border-[#5D614A]` on a badge
- `app/pages/payroll/[id]/page.tsx:224` — `border-[#6F7153]` on spinner
- `app/pages/vacations/[id]/page.tsx` — 7 hex instances in gradient headers (no dark: variants on any)
- `components/EmployeeIncidenceCard.tsx:16` — `bg-[#FCF1D5] dark:bg-[#2d2d2d]` — still uses non-zinc dark hex
- `components/EmployeeProfileCard.tsx:15` — `bg-[#FCF1D5] dark:bg-zinc-900` — light mode hex remains
- `components/PayrollCreateModal.tsx:234` — `from-[#6F7153] to-[#3B4D36]` gradient CTA, no dark variant
- `components/PositionsModal.tsx:247` — `focus:ring-[#6F7153]`
- `components/LaborEventsCalendar.tsx:110,132-134` — hex color strings in FullCalendar event config (programmatic, not Tailwind) — these are acceptable as they are JavaScript object values, not className strings

**Focus ring hex:**
- 39 occurrences of `focus:ring-[#6F7153]` spread across pages and components. This is the single most pervasive arbitrary value remaining.

---

### Pillar 4: Typography (3/4)

**Font size distribution (8 distinct sizes):**

| Size | Count | Usage |
|------|-------|-------|
| text-sm | 357 | Body, table cells, labels |
| text-xs | 235 | Badges, helper text, captions |
| text-lg | 53 | Section headers, modal titles |
| text-2xl | 43 | Page titles, stat numbers |
| text-xl | 42 | Card headings, secondary page titles |
| text-base | 32 | Form inputs, prominent body |
| text-3xl | 14 | Dashboard hero stats |
| text-4xl | 3 | Large dashboard numbers |

8 sizes in use exceeds the abstract 4-size guideline. In practice, the scale is sensible (xs/sm cover micro-type, base/lg/xl/2xl/3xl/4xl cover hierarchy), but `text-xl` and `text-2xl` serve similar visual weight in many contexts — there is no consistent rule separating them.

**Arbitrary text sizes:**
- `text-[10px]` — 7 instances (`pages/main/page.tsx` for calendar labels and mini-stats, `components/EmployeeTable.tsx` for sub-labels). These are micro-annotations where `text-xs` (12px) would be too large — acceptable use.
- `text-[11px]` — 3 instances (`pages/reports/page.tsx` for audit log badges). Acceptable for dense badge contexts.

**Font weight distribution (4 distinct weights):**

| Weight | Count | Usage |
|--------|-------|-------|
| font-medium | 225 | Default interactive elements, secondary labels |
| font-semibold | 207 | Headings, table headers, emphasis |
| font-bold | 170 | Page titles, stat numbers, CTAs |
| font-normal | 4 | Sub-labels only |

4 weights are within range. The font-normal/medium/semibold/bold progression is semantically consistent. No `font-thin`, `font-light`, or `font-extrabold` found.

**Issue:** The near-equal usage of `font-medium` (225) and `font-semibold` (207) suggests these weights are applied interchangeably in some contexts rather than following a clear hierarchy rule. This is a minor consistency issue, not a rendering problem.

---

### Pillar 5: Spacing (3/4)

**Spacing class distribution (top values):**
- `px-4` (181), `py-2` (167), `gap-2` (148), `py-3` (127), `px-6` (106) — these top 5 classes form the consistent core scale.
- `p-4` (80), `p-6` (59), `gap-4` (59) — secondary standard values.
- `py-12` (7) and `p-16` (7) — used exclusively for empty state containers and page-level padding. Appropriate contextual use.

**Arbitrary spacing values found:**
- `min-h-[600px]` — `pages/employee/events/page.tsx:116,135` — height constraint on calendar section. No spacing scale violation (height is not spacing).
- `min-w-[640px]` — `pages/main/page.tsx:480` — table minimum width for horizontal scroll. Not a spacing token concern.
- `min-w-[40px]` — `pages/employee/events/page.tsx:176` — icon column minimum width. Acceptable.
- `max-h-[320px]` — `pages/main/page.tsx:386` — events panel max height. Acceptable.
- `h-[750px]` — `components/EmployeeAttendanceTable.tsx:156` — fixed height for attendance table container. This is the only value that feels arbitrary; a `max-h-screen` or viewport-relative value would be more responsive.

**No arbitrary `px` or `rem` spacing values in padding/margin classes.** The `p-16` pattern for empty states is consistent across 6 pages — this is a documented convention, not inconsistency.

**Minor issue:** `py-2.5` appears in multiple pages (attendance, clocklogs, payrollCreateModal) alongside `py-2` and `py-3`. Tailwind's 2.5 step (10px) is a valid half-step but mixing it with the 2/3 neighbors (8px/12px) in the same component creates visual jitter in button height.

---

### Pillar 6: Experience Design (3/4)

**Loading states (120 instances):**
- All major data pages implement `isLoading` guards: employees, payroll, deductions, clocklogs, branches, vacations, audit logs.
- Pattern: `isLoading && <div className="flex justify-center..."><div className="animate-spin...">` — spinner-only, no skeleton loaders.
- Submit buttons use `disabled={isSubmitting}` in all form modals (AddEmployeeModal, EditEmployeeModal, DismissEmployeeModal, LaborEventModal).
- `ArrowPathIcon` with `animate-spin` used as a "reload" loading indicator on some list pages.

**Error states (149 instances):**
- Error boundaries: not found at the component level — error handling is done via `error` state from hooks displayed as inline messages. No React `ErrorBoundary` component found.
- Form validation errors: well-implemented — `formState.errors` from react-hook-form renders at field level with `text-red-600 dark:text-red-400`.
- API errors: hooks expose `error` state; pages render inline error messages.

**Empty states (32 instances):**
- All major list pages have explicit empty state handling with icons and contextual messages.
- `components/ui/Table.tsx:64` provides a fallback generic empty state for pages that use the base Table without overriding it.

**Confirmation for destructive actions:**
- Logout: ConfirmDialog wired in Sidebar with message "¿Estás seguro de que deseas cerrar sesión?" — complete with async handler and loading state.
- Employee dismissal: `DismissEmployeeModal.tsx` has internal `handleConfirm` flow.
- Delete actions in Table.tsx: direct `onDelete(row)` — no confirmation step for table row deletions. This is the most significant UX gap in this pillar: deleting a record from any generic Table invocation has no "are you sure?" gate.
- 20 usages of ConfirmDialog spread across the app suggest it IS used in some delete flows, but the base Table component's delete button (`components/ui/Table.tsx:52`) fires directly without a dialog.

**Disabled states:**
- 51 `disabled=` bindings found — form buttons, reload buttons, and submit CTAs are properly disabled during async operations.

**Accessibility baseline:**
- 24 `aria-label` / `aria-describedby` / `role=` attributes found — adequate for close buttons and icon-only interactive controls. No comprehensive ARIA landmark structure detected in page components, but this is out of scope for this phase.

---

## Files Audited

**Components (from Phase 12 SUMMARY.md):**
- `src/frontend/src/components/ui/Modal.tsx`
- `src/frontend/src/components/ui/Table.tsx`
- `src/frontend/src/components/ui/FormModal.tsx`
- `src/frontend/src/components/ui/ConfirmDialog.tsx`
- `src/frontend/src/components/ui/StatsCards.tsx`
- `src/frontend/src/components/ui/EmployeeTabs.tsx`
- `src/frontend/src/components/ui/Sidebar.tsx`
- `src/frontend/src/components/ui/Header.tsx`
- `src/frontend/src/components/AddEmployeeModal.tsx`
- `src/frontend/src/components/EditEmployeeModal.tsx`
- `src/frontend/src/components/DismissEmployeeModal.tsx`
- `src/frontend/src/components/EmployeeTable.tsx`
- `src/frontend/src/components/EmployeeProfileModal.tsx`
- `src/frontend/src/components/EmployeeProfileCard.tsx`
- `src/frontend/src/components/EmployeeIncidenceCard.tsx`
- `src/frontend/src/components/EmployeeAttendanceTable.tsx`
- `src/frontend/src/components/LaborEventModal.tsx`
- `src/frontend/src/components/LaborEventsCalendar.tsx`
- `src/frontend/src/components/PayrollCreateModal.tsx`
- `src/frontend/src/components/PayrollResults.tsx`
- `src/frontend/src/components/PayrollCalendar.tsx`
- `src/frontend/src/components/PositionsModal.tsx`
- `src/frontend/src/components/DashboardStats.tsx`
- `src/frontend/src/components/QuickActions.tsx`
- `src/frontend/src/components/RecentEmployees.tsx`
- `src/frontend/src/components/DatePicker.tsx`
- `src/frontend/src/components/SidebarItem.tsx`

**Pages (grep-audited):**
- `src/frontend/src/app/pages/main/page.tsx`
- `src/frontend/src/app/pages/employee/list/page.tsx`
- `src/frontend/src/app/pages/employee/edit/[id]/page.tsx`
- `src/frontend/src/app/pages/employee/events/page.tsx`
- `src/frontend/src/app/pages/payroll/list/page.tsx`
- `src/frontend/src/app/pages/payroll/[id]/page.tsx`
- `src/frontend/src/app/pages/payroll/[id]/employees/page.tsx`
- `src/frontend/src/app/pages/payroll-types/list/page.tsx`
- `src/frontend/src/app/pages/deductions/list/page.tsx`
- `src/frontend/src/app/pages/employee-deductions/list/page.tsx`
- `src/frontend/src/app/pages/clocklogs/list/page.tsx`
- `src/frontend/src/app/pages/reports/page.tsx`
- `src/frontend/src/app/pages/users/page.tsx`
- `src/frontend/src/app/pages/vacations/list/page.tsx`
- `src/frontend/src/app/pages/vacations/[id]/page.tsx`
- `src/frontend/src/app/pages/vacations/create/page.tsx`
- `src/frontend/src/app/pages/branches/list/page.tsx`
- `src/frontend/src/app/pages/attendance/page.tsx`
- `src/frontend/src/app/pages/positions/list/page.tsx`
- `src/frontend/src/app/pages/bonuses/list/page.tsx`
- `src/frontend/src/app/pages/audit-logs/page.tsx`
- `src/frontend/src/app/pages/auth/page.tsx`
- `src/frontend/src/app/not-found.tsx`

**Registry audit:** shadcn not initialized — skipped.
