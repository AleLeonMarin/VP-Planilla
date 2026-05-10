---
phase: 15-ui-polish-skeletons-y-error-banners-en-todas-las-vistas
verified: 2026-04-01T00:00:00Z
status: gaps_found
score: 14/16 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 7/8
  gaps_closed: []
  gaps_remaining:
    - "payroll/[id]/employees/page.tsx: error div uses minimal styling without ExclamationTriangleIcon or Reintentar button"
    - "payroll/calculate/page.tsx: error div has ExclamationTriangleIcon but no retry button"
    - "employee/edit/[id]/page.tsx: error page uses inline SVG instead of ExclamationTriangleIcon, no Reintentar button"
  regressions: []
gaps:
  - truth: "Payroll employees page shows full error banner with retry when API fails"
    status: partial
    reason: "Error div exists (lines 66-70) but uses minimal styling (bg-red-100, border-red-400) without ExclamationTriangleIcon, ArrowPathIcon, or Reintentar button. No retry wired to fetchPayrollEmployees."
    artifacts:
      - path: "src/frontend/src/app/pages/payroll/[id]/employees/page.tsx"
        issue: "Lines 66-70: Minimal error div — raw text only, no icon, no retry button"
    missing:
      - "Add ExclamationTriangleIcon to error display"
      - "Add retry button calling fetchPayrollEmployees(payrollId)"
      - "Wrap in standard banner structure (border-red-200, bg-red-50, etc.)"
  - truth: "Payroll calculate page shows error banner with retry when calculation fails"
    status: partial
    reason: "Error div at lines 365-370 has ExclamationTriangleIcon but no ArrowPathIcon or Reintentar button. User cannot retry without navigating away."
    artifacts:
      - path: "src/frontend/src/app/pages/payroll/calculate/page.tsx"
        issue: "Lines 365-370: Error div with icon but no retry button"
    missing:
      - "Add retry button that re-triggers handleCalculate"
  - truth: "Employee edit page error state includes retry button to reload data"
    status: partial
    reason: "Error page (lines 167-202) has inline SVG icon and error message but only offers 'Volver a la lista' navigation — no retry button to re-fetch the employee data."
    artifacts:
      - path: "src/frontend/src/app/pages/employee/edit/[id]/page.tsx"
        issue: "Lines 167-202: Inline SVG instead of ExclamationTriangleIcon component; no Reintentar button"
    missing:
      - "Replace inline SVG with ExclamationTriangleIcon component"
      - "Add 'Reintentar' button that calls the employee load function again"
---

# Phase 15: UI Polish — Skeletons y Error Banners en Todas las Vistas

**Phase Goal:** Add skeleton loading states and error banners to all data-fetching pages in the frontend
**Verified:** 2026-04-01T00:00:00Z
**Status:** gaps_found
**Re-verification:** Yes — re-verification after gap closure (plans 15-03 and 15-04). Previous gaps from plans 15-03/15-04 all confirmed fixed. 3 residual gaps remain unchanged from previous verification.

## Goal Achievement

### Observable Truths

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1 | Usuario ve skeleton loading (no spinner genérico) mientras cargan datos en las 6 vistas wave-1 | ✓ VERIFIED | All 6 pages have `animate-pulse` skeleton layouts: deductions (line 123), vacations (137), branches (134), payroll-types (162), employee/events (134, 151), users (175) |
| 2 | Usuario ve banner de error rojo con botón 'Reintentar' si la petición falla (wave 1) | ✓ VERIFIED | All 6 pages have full error banners with ExclamationTriangleIcon + Reintentar: deductions (103, 111), vacations (117, 125), branches (114, 122), payroll-types (141, 149), employee/events (113, 121), users (146, 154) |
| 3 | Ninguna vista queda en blanco indefinidamente si el backend no responde | ✓ VERIFIED | All pages have `isLoading` guards rendering skeleton content; all have error state handling |
| 4 | Usuario ve skeleton loading en vistas complejas (planilla, asistencia, auditoría) mientras cargan datos | ✓ VERIFIED | All 12+ complex pages have animate-pulse: payroll/list (15 elements), payroll/[id] (22 elements), payroll/[id]/employees (line 127), payroll/calculate (lines 376-411), attendance (lines 891-921), clocklogs (line 216), employee/edit (17 elements), audit-logs (line 202), notifications (line 128), reports (lines 411-425), employee-deductions (line 189) |
| 5 | Usuario ve error banner con retry en vistas que usan fetch directo (payroll detail, asistencia, clocklogs, reports) | ✓ VERIFIED | All 4 gap-closure pages have full error banners: payroll/[id] (lines 284-318), attendance (lines 800-815), clocklogs (lines 140-155), reports (lines 318-333) — all with ExclamationTriangleIcon + Reintentar + wired retry |
| 6 | Vistas de formulario (employee edit) muestran skeleton del formulario, no spinner genérico | ✓ VERIFIED | employee/edit/[id]/page.tsx has 17 animate-pulse elements matching form sections (lines 84-164) |
| 7 | employee-deductions error banner shows on actual error state, not during loading | ✓ VERIFIED | Line 109: `(deductionsError || employeeDeductionsError)` — correct error condition |
| 8 | employee-deductions error banner includes retry button | ✓ VERIFIED | Lines 116-126: Retry button calls `refetchDeductions()` + `fetchEmployeeDeductions(selectedEmployeeId)` |
| 9 | notifications page shows only one error banner (no duplicate) | ✓ VERIFIED | Exactly one `{error &&` block at lines 107-122 |
| 10 | Payroll detail page shows persistent error banner with retry when API fails | ✓ VERIFIED | Lines 284-318: Independent early return with ExclamationTriangleIcon, error message, and "Reintentar" button calling `loadPayrollDetails(payrollId)` |
| 11 | Attendance page shows error banner with retry when fetch fails | ✓ VERIFIED | Lines 800-815: Full error banner with ExclamationTriangleIcon and retry calling `handleFetch` |
| 12 | Clocklogs page shows error banner with retry when fetch fails | ✓ VERIFIED | Lines 140-155: Full error banner with ExclamationTriangleIcon and retry calling `handleFetch` |
| 13 | Reports page shows error banner with retry when dashboard/dataset fetch fails | ✓ VERIFIED | Lines 318-333: Full error banner with ExclamationTriangleIcon and retry calling `loadDashboard` |
| 14 | Dark mode variants consistent on all skeleton and error elements | ✓ VERIFIED | All skeleton elements use `bg-zinc-200 dark:bg-zinc-700`; all error banners use `dark:border-red-800`, `dark:bg-red-950/50`, `dark:text-red-400` |
| 15 | ALL pages with data fetch show full error banner pattern (ExclamationTriangleIcon + Reintentar) | ⚠️ PARTIAL | 15/18 pages have full pattern. 3 pages partial: payroll/[id]/employees (minimal div, no icon, no retry), payroll/calculate (has icon, no retry), employee/edit (inline SVG, no retry) |
| 16 | Conditional rendering order: error first, then loading/skeletons, then data | ✓ VERIFIED | All pages render error before loading state |

**Score:** 14/16 truths verified (2 partial)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `deductions/list/page.tsx` | Skeleton loading + error banner | ✓ VERIFIED | 6 skeleton cards, full error banner with retry |
| `vacations/list/page.tsx` | Skeleton loading + error banner | ✓ VERIFIED | 5 skeleton rows, full error banner with retry |
| `branches/list/page.tsx` | Skeleton loading + error banner | ✓ VERIFIED | 4 skeleton cards, full error banner with retry |
| `payroll-types/list/page.tsx` | Skeleton loading + error banner | ✓ VERIFIED | 5 skeleton cards, full error banner with retry |
| `employee/events/page.tsx` | Skeleton loading + error banner | ✓ VERIFIED | Calendar + sidebar skeletons, full error banner with refreshEvents retry |
| `users/page.tsx` | Skeleton loading + error banner | ✓ VERIFIED | 5 skeleton table rows, full error banner with retry |
| `payroll/list/page.tsx` | Skeleton grid cards + error banner | ✓ VERIFIED | Stat + payroll card skeletons, error banner with icon |
| `payroll/[id]/page.tsx` | Skeleton detail + error banner | ✓ VERIFIED | Full skeleton layout, error early return with retry (fixed in 15-04) |
| `payroll/[id]/employees/page.tsx` | Skeleton table rows + error banner | ⚠️ PARTIAL | Skeleton rows ✓, but error is minimal inline div (no icon, no retry, no banner pattern) |
| `payroll/calculate/page.tsx` | Skeleton results + error banner | ⚠️ PARTIAL | Result card skeletons ✓, error banner with icon but no retry button |
| `attendance/page.tsx` | Skeleton table + error banner | ✓ VERIFIED | 8 skeleton rows, full error banner with retry (fixed in 15-04) |
| `clocklogs/list/page.tsx` | Skeleton table + error banner | ✓ VERIFIED | 6 skeleton rows, full error banner with retry (fixed in 15-04) |
| `employee/list/page.tsx` | Error banner for positions | ✓ VERIFIED | Positions error banner with retry |
| `employee-deductions/list/page.tsx` | Error banner + skeleton | ✓ VERIFIED | Error banner with retry (fixed in 15-03), skeleton cards |
| `employee/edit/[id]/page.tsx` | Skeleton form + error page | ⚠️ PARTIAL | Skeleton form ✓, error page has inline SVG but no retry button |
| `audit-logs/page.tsx` | Skeleton entries + error banner | ✓ VERIFIED | 6 skeleton entries, full error banner with retry |
| `notifications/page.tsx` | Skeleton + single error banner | ✓ VERIFIED | 5 skeleton cards, single error banner with retry (fixed in 15-03) |
| `reports/page.tsx` | Skeleton + error banner | ✓ VERIFIED | 5 skeleton rows, full error banner with retry (fixed in 15-04) |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| deductions/list/page.tsx | useDeductions hook | `{ error, refetch }` destructured | ✓ WIRED | Line 21: `const { data, isLoading, error, refetch, ... }` |
| vacations/list/page.tsx | useVacations hook | `{ error, refetch }` destructured | ✓ WIRED | Line 23: `const { data, isLoading, error, refetch, ... }` |
| branches/list/page.tsx | useBranches hook | `{ error, refetch }` destructured | ✓ WIRED | Line 21: `const { data: branches, isLoading, error, ..., refetch }` |
| payroll-types/list/page.tsx | usePayrollTypes hook | `{ error, refetch }` destructured | ✓ WIRED | Line 25: `const { data, isLoading, error, refetch, ... }` |
| employee/events/page.tsx | useLaborEvents hook | `{ error, refreshEvents }` destructured | ✓ WIRED | Line 19: `const { events, isLoading, error, ..., refreshEvents }` |
| users/page.tsx | fetchData function | `error` state + `fetchData` retry | ✓ WIRED | Lines 29, 33-57: `setError` in catch, retry calls `fetchData()` |
| payroll/[id]/page.tsx | loadPayrollDetails | `error` state + retry button | ✓ WIRED | Lines 35, 49-63: `setError` in catch, retry calls `loadPayrollDetails(payrollId)` |
| payroll/[id]/employees/page.tsx | usePayrollEmployees hook | `{ error, fetchPayrollEmployees }` destructured | ⚠️ PARTIAL | Line 27: error destructured but only displayed inline, no retry button wired |
| attendance/page.tsx | handleFetch | `error` state + retry button | ✓ WIRED | Lines 271, 691-740: `setError` in catch, retry calls `handleFetch` |
| clocklogs/list/page.tsx | handleFetch | `error` state + retry button | ✓ WIRED | Lines 26, 31-48: `setError` in catch, retry calls `handleFetch` |
| reports/page.tsx | loadDashboard | `error` state + retry button | ✓ WIRED | Lines 95, 97-108: `setError` in catch, retry calls `loadDashboard` |
| employee-deductions/list/page.tsx | useDeductions + useEmployeeDeductions | `{ deductionsError, employeeDeductionsError }` | ✓ WIRED | Lines 25-33: Both errors destructured, retry calls both refetch functions |
| notifications/page.tsx | useNotifications hook | `{ error, fetchNotifications }` destructured | ✓ WIRED | Lines 38-47: error destructured, retry calls `fetchNotifications(page, limit)` |
| audit-logs/page.tsx | useAuditLogs hook | `{ error, fetchAuditLogs }` destructured | ✓ WIRED | Line 17: error destructured, retry calls `fetchAuditLogs(filters)` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| deductions/list/page.tsx | `data` from useDeductions | API via hook | ✓ Real API call | ✓ FLOWING |
| vacations/list/page.tsx | `data` from useVacations | API via hook | ✓ Real API call | ✓ FLOWING |
| branches/list/page.tsx | `branches` from useBranches | API via hook | ✓ Real API call | ✓ FLOWING |
| payroll-types/list/page.tsx | `data` from usePayrollTypes | API via hook | ✓ Real API call | ✓ FLOWING |
| employee/events/page.tsx | `events` from useLaborEvents | API via hook | ✓ Real API call | ✓ FLOWING |
| users/page.tsx | `users` from UserService.getUsers | API via service | ✓ Real API call | ✓ FLOWING |
| payroll/list/page.tsx | `payrolls` from getAllPayrolls | API via hook | ✓ Real API call | ✓ FLOWING |
| payroll/[id]/page.tsx | `payroll`, `employees` | PayrollService.getPayrollById | ✓ Real API call | ✓ FLOWING |
| payroll/[id]/employees/page.tsx | `error` from usePayrollEmployees | API via hook | ✓ Real API errors captured | ⚠️ STATIC — error captured but displayed in minimal div without retry |
| attendance/page.tsx | `data` from ClockLogsService | API via service | ✓ Real API call | ✓ FLOWING |
| clocklogs/list/page.tsx | `data` from ClockLogsService | API via service | ✓ Real API call | ✓ FLOWING |
| reports/page.tsx | `dashboard`, `dataset` | ReportsService | ✓ Real API call | ✓ FLOWING |
| notifications/page.tsx | `data` from useNotifications | API via hook | ✓ Real API call | ✓ FLOWING |
| audit-logs/page.tsx | `logs` from useAuditLogs | API via hook | ✓ Real API call | ✓ FLOWING |
| employee/edit/[id]/page.tsx | `error` from useEmployeeEdit | API via hook | ✓ Real API errors captured | ⚠️ STATIC — error captured, displayed with inline SVG, no retry |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| employee-deductions error condition uses actual error state | grep `(deductionsError \|\| employeeDeductionsError)` | Found at line 109 | ✓ PASS |
| employee-deductions has retry button | grep `refetchDeductions\|fetchEmployeeDeductions` in error banner | Both called in onClick (lines 117-119) | ✓ PASS |
| notifications has exactly one error banner | grep -c `{error &&` notifications/page.tsx | Count = 1 | ✓ PASS |
| payroll/[id] has error state + banner | grep `setError\|ExclamationTriangleIcon` payroll/[id]/page.tsx | Both present, banner at line 284 | ✓ PASS |
| attendance has error state + banner | grep `setError\|ExclamationTriangleIcon` attendance/page.tsx | Both present, banner at line 800 | ✓ PASS |
| clocklogs has error state + banner | grep `setError\|ExclamationTriangleIcon` clocklogs/list/page.tsx | Both present, banner at line 140 | ✓ PASS |
| reports has error state + banner | grep `setError\|ExclamationTriangleIcon` reports/page.tsx | Both present, banner at line 318 | ✓ PASS |
| payroll/[id]/employees has full banner pattern | grep `ExclamationTriangleIcon\|Reintentar` payroll/[id]/employees/page.tsx | Neither found — only minimal div | ✗ FAIL |
| payroll/calculate has retry button | grep `Reintentar` payroll/calculate/page.tsx | Not found | ✗ FAIL |
| employee/edit has Reintentar button | grep `Reintentar` employee/edit/[id]/page.tsx | Not found | ✗ FAIL |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| UI-POLISH-01 | 15-01, 15-02 | Skeleton loading states on all data-fetching pages | ✓ SATISFIED | All 18 pages have `animate-pulse` skeleton loading matching content structure |
| UI-POLISH-02 | 15-01, 15-02, 15-03, 15-04 | Error banners with retry on all data-fetching pages | ⚠️ PARTIAL | 15/18 pages have full error banners with retry; 3 pages have partial error feedback without retry |
| UI-POLISH-03 | 15-01, 15-02 | Dark mode consistency on all new UI elements | ✓ SATISFIED | All skeleton and error elements have `dark:` variants |

**Note:** Requirement IDs UI-POLISH-01, UI-POLISH-02, UI-POLISH-03 are plan-local requirement IDs declared in plan frontmatters. They do NOT exist in `.planning/REQUIREMENTS.md` as global requirements. All three are accounted for above.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `payroll/[id]/employees/page.tsx` | 66-70 | Error div with minimal styling — no ExclamationTriangleIcon, no ArrowPathIcon, no "Reintentar" | ⚠️ Warning | Error feedback exists but doesn't match established banner pattern; no retry option |
| `payroll/calculate/page.tsx` | 365-370 | Error div has ExclamationTriangleIcon but no retry button | ⚠️ Warning | User sees error but cannot retry without navigating away |
| `employee/edit/[id]/page.tsx` | 184-186 | Inline SVG instead of ExclamationTriangleIcon component; no retry button | ⚠️ Warning | Inconsistent with established pattern; user cannot retry without navigating away |
| `attendance/page.tsx` | 104-223 | Excessive console.log statements in buildDateTimeFromParts | ℹ️ Info | Debug logging left in code; not a phase 15 concern |
| `attendance/page.tsx` | 669 | Pre-existing TS error: `skipped_count` property not in type | ℹ️ Info | Pre-existing issue, not introduced by phase 15 |

### Human Verification Required

1. **Visual skeleton fidelity** — Verify that skeleton layouts on all 18 pages actually match their content structure when rendered (not just that animate-pulse classes exist)
   - **Expected:** Skeletons should look like ghost versions of the actual content
   - **Why human:** Automated checks confirm `animate-pulse` exists but can't verify visual fidelity

2. **Error banner appearance on actual API failure** — Trigger API failures on the 3 remaining partial pages (payroll/[id]/employees, payroll/calculate, employee/edit) to confirm error feedback is shown
   - **Expected:** Error feedback visible in all 3 pages
   - **Why human:** Requires runtime API failure simulation

3. **payroll/calculate error behavior** — The error state on payroll/calculate appears during calculation; verify whether a retry button makes sense here (user may need to fix input and re-calculate rather than retry the same request)
   - **Expected:** Decision on whether retry is appropriate for action pages
   - **Why human:** UX judgment call on action vs. data-fetch pages

### Gaps Summary

**Re-verification after gap closure (plans 15-03 and 15-04): ALL 6 PREVIOUS GAPS CONFIRMED FIXED.**

- ✅ employee-deductions: Error banner now uses `(deductionsError || employeeDeductionsError)` condition with ExclamationTriangleIcon and retry button
- ✅ notifications: Single error banner added with ExclamationTriangleIcon and retry button (was missing entirely)
- ✅ payroll/[id]/page.tsx: Full error banner with ExclamationTriangleIcon + Reintentar + loadPayrollDetails retry
- ✅ attendance/page.tsx: Full error banner with ExclamationTriangleIcon + Reintentar + handleFetch retry
- ✅ clocklogs/list/page.tsx: Full error banner with ExclamationTriangleIcon + Reintentar + handleFetch retry
- ✅ reports/page.tsx: Full error banner with ExclamationTriangleIcon + Reintentar + loadDashboard retry

**3 residual gaps remain unchanged from previous verification:**

1. `payroll/[id]/employees/page.tsx`: Has error div but minimal styling, no icon, no retry
2. `payroll/calculate/page.tsx`: Has error div with icon but no retry button
3. `employee/edit/[id]/page.tsx`: Has error page with inline SVG and "Volver" button but no "Reintentar"

These 3 pages are edge cases: payroll/[id]/employees is a sub-page of an already-protected detail view, payroll/calculate is an action page (not pure data-fetch), and employee/edit is a form page with navigation fallback. The phase goal is substantially achieved at 15/18 pages with full banners.

---

_Verified: 2026-04-01T00:00:00Z_
_Verifier: the agent (gsd-verifier)_
