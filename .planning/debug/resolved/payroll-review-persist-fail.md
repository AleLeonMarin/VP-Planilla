---
status: resolved
trigger: "Changes during Review of a payroll are not persistent, if i change or modify any hours values and save, that cvhanges doesnt persist"
created: 2026-04-26
updated: 2026-04-26
root_cause: |
  1. Backend (NomineeService.ts): The global calculation process was unconditionally overwriting manual overrides.
  2. Backend (PayrollService.ts): The manual adjustment didn't recalculate gross/net salary correctly (only hours).
  3. Frontend (PayrollWizardPage): The wizard was creating a new payroll record on every recalculation, losing references to the existing record and its adjustments.
  4. Validation: A 24-hour validation rule was blocking realistic biweekly/weekly hour adjustments.
fix: |
  1. Modified NomineeService.ts to skip auto-calculation updates if payroll_employee_is_manually_adjusted is true.
  2. Modified PayrollService.ts to correctly calculate gross and net salary using the employee's position base salary during manual overrides.
  3. Removed 24-hour validation from frontend modal and backend service.
  4. Modified PayrollWizardPage to reuse the existing payrollId.
  5. Added the missing "Descanso Semanal" column to the review table.
verification: |
  1. Verified with unit tests (PayrollService.Override.test.ts and NomineeService.test.ts).
  2. Type checked both frontend and backend (npx tsc --noEmit).
files_changed:
  - src/backend/src/service/PayrollService.ts
  - src/backend/src/service/NomineeService.ts
  - src/frontend/src/components/PayrollEmployeeAdjustModal.tsx
  - src/frontend/src/app/pages/payroll/wizard/page.tsx
---

# Debug Session: payroll-review-persist-fail

## Symptoms
- **Expected behavior**: Modifying employee hours (regular, overtime, weekly rest) should persist and update net/gross salary.
- **Actual behavior**: Changes are not persisted or applied even though a success message is shown.
- **Error messages**: None (success message shown).
- **Timeline**: Current phase (payroll review).
- **Reproduction**: Step 1 (Period) -> Step 2 (Employees) -> Step 3 (Review). Modify hours, click save.

## Current Focus
- **status**: RESOLVED
- **hypothesis**: (Resolved)
- **next_action**: (None)

## Evidence
- 2026-04-26: Session started.
- 2026-04-26: Identified that NomineeService was overwriting manual adjustments during recalculation.
- 2026-04-26: Identified that PayrollService wasn't recalculating salaries on manual override.
- 2026-04-26: Identified that Wizard page was creating new payroll records unnecessarily.
- 2026-04-26: Applied fixes to all identified points.
- 2026-04-26: Verified with existing and new tests.

## Eliminated
- Hypothesis: DB connection issue (Eliminated: Success message was shown and manual adjustments were saved before being overwritten).
