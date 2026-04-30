---
phase: 66
reviewers: [opencode, generalist (architectural review)]
reviewed_at: 2026-04-30T05:32:00Z
plans_reviewed: [66-01-PLAN.md, 66-02-PLAN.md, 66-03-PLAN.md, 66-04-PLAN.md]
---

# Cross-AI Plan Review — Phase 66: Soporte Jornadas Mixtas y Nocturnas

## OpenCode Review (Implementation Perspective)

### Summary
Plan 66 establishes a solid foundation for per-employee shift overrides. The separation of concerns between schema, business logic, and testing is well-maintained. The use of `USE_ENTERPRISE_DEFAULT` ensures zero breaking changes for existing data.

### Strengths
- Clear separation between `ShiftType` (enterprise) and `EmployeeShiftType` (employee override).
- Proper default handling ensures backward compatibility.
- Comprehensive test matrix covering all 6 required scenarios.
- Frontend implementation follows established project patterns.

### Concerns
- **MEDIUM**: Explicit verification that existing employee rows get `USE_ENTERPRISE_DEFAULT` during migration is missing from the plan.
- **MEDIUM**: Modification of `getParamSetAtDate` signature might affect other call sites (mitigated by default parameter but needs audit).
- **LOW**: Tooltip implementation details (title vs component) could lead to UX inconsistencies.

### Suggestions
- Add a task to verify existing data after migration.
- Audit all `getParamSetAtDate` call sites.
- Specify the tooltip component to be used in the frontend.

---

## Generalist Review (Architectural/Performance Perspective)

### Summary
The implementation plan is legally accurate and functionally complete. The hierarchical resolution logic (Employee > Enterprise) is sound. However, there is a critical performance risk in the payroll calculation loop.

### Strengths
- Decoupling of hour caps from hardcoded values to DB-backed params.
- Graceful degradation using `USE_ENTERPRISE_DEFAULT`.
- Test plan (66-03) correctly captures the nuance of Costa Rican labor law.

### Concerns
- **HIGH: N+1 Query Problem**: Calling `getParamSetAtDate` inside the employee processing loop will trigger hundreds of database queries per payroll generation.
- **MEDIUM: Naming Inconsistency**: `shift_type` (backend) vs `employee_shift_type` (frontend types) will cause mapping issues.
- **LOW: Static vs Dynamic Shift Detection**: Relies on manual assignment; doesn't auto-calculate if a shift legally becomes nocturnal (though acceptable within scope).

### Suggestions
- **Optimize Fetching**: Pre-calculate a map of the three possible `LegalParamSet` objects outside the loop.
- **Align Property Names**: Standardize on `shift_type` across the `Employee` interface in both backend and frontend.

---

## Consensus Summary

The plans for Phase 66 are technically sound and legally compliant but require **immediate architectural refinement** before execution to avoid performance degradation.

### Agreed Strengths
- **Backward Compatibility**: The use of `USE_ENTERPRISE_DEFAULT` is universally praised as a safe way to roll out the feature.
- **Domain Accuracy**: Both reviewers agree the logic correctly implements the required shift types and their impact on OT.
- **Test Coverage**: The 6 test scenarios are identified as a strong point for ensuring correctness.

### Agreed Concerns
- **Performance (Highest Priority)**: The current plan for `NomineeService` (66-02) introduces an N+1 query pattern. This MUST be fixed by fetching legal params for all 3 shift types once before the loop.
- **Type/Name Alignment**: There is a risk of naming mismatch between frontend and backend models (`shift_type` vs `employee_shift_type`).
- **Migration Verification**: More explicit steps are needed to ensure the data migration behaves as expected for existing employees.

### Divergent Views
- **Manual vs Automatic Assignment**: One reviewer noted that the shift type could be auto-detected based on worked hours, but both agreed that manual override is acceptable for this phase's scope.

---

## Recommendation for Planner

Proceed to implementation with the following adjustments to **Plan 66-02**:
1. Refactor `calculatePayrollForPeriod` to pre-fetch legal params for DIURNA, MIXTA, and NOCTURNA into a map before the employee loop.
2. Standardize model field names to `shift_type` consistently.
3. Ensure Task 1 in 66-01 includes a verification check for existing data.

To incorporate feedback into planning:
  `/gsd-plan-phase 66 --reviews`
