---
phase: 13-integracion-frontend-backend
plan: 05
subsystem: api
tags: [loading-states, isFetching, isMutating, skeleton-fix]

# Dependency graph
requires:
  - phase: 13-03
    provides: Table component with skeleton support
provides:
  - Separate isFetching/isMutating state in usePositions and useBonuses hooks
  - Skeletons only show during initial data fetch, not during CRUD mutations
affects: [positions-page, bonuses-page, user-experience]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - isFetching: initial data load and refetch
    - isMutating: create/update/delete operations
    - isLoading: backward-compatible alias for isFetching

key-files:
  created: []
  modified:
    - src/frontend/src/hooks/usePositions.ts
    - src/frontend/src/hooks/useBonuses.ts

key-decisions:
  - "isLoading kept as external name mapped to isFetching for backward compatibility"
  - "isMutating exposed in return shape for pages that want to show loading indicators during mutations"

patterns-established:
  - "Separate fetch vs mutation loading states"
  - "Skeletons only during initial fetch"

requirements-completed: [INTEG-03]

# Metrics
duration: 10min
completed: 2026-04-01
---

# Phase 13 Plan 05: Loading States Fix Summary

**Separated isFetching/isMutating state in positions and bonuses hooks**

## Performance

- **Duration:** 10 min
- **Files modified:** 2

## Accomplishments

- usePositions: replaced single isLoading with isFetching + isMutating
- useBonuses: replaced single isLoading with isFetching + isMutating
- Both hooks return isLoading: isFetching for backward compatibility
- Both hooks expose isMutating for pages that need it

## Task Commits

1. **Task 1: usePositions hook** - `0e676f3` (fix)
2. **Task 2: useBonuses hook** - `0e676f3` (fix)

## Files Modified

- `src/frontend/src/hooks/usePositions.ts` - isFetching/isMutating separation
- `src/frontend/src/hooks/useBonuses.ts` - isFetching/isMutating separation

## Decisions Made

- isLoading maps to isFetching (backward compatible with consuming components)
- isMutating exposed separately for future use

## Deviations from Plan

None

## Issues Encountered

None

## Next Phase Readiness

- TypeScript compiles cleanly
- Ready for Phase 14

---

*Phase: 13-integracion-frontend-backend*
*Completed: 2026-04-01*
