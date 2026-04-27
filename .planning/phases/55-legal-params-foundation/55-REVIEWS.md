---
phase: 55
reviewers: [gemini]
reviewed_at: 2026-04-27T00:44:00Z
plans_reviewed:
  - 55-01-PLAN.md
  - 55-02-PLAN.md
  - 55-03-PLAN.md
codex_status: failed (gpt-5.1-codex not supported with ChatGPT account)
---

# Cross-AI Plan Review — Phase 55

## Gemini Review

# Review: Phase 55 — Fundación vpg_legal_params

## 1. Summary
The plan is well-structured, follows the project's strict architectural layers (Service -> Controller -> Route), and correctly implements a temporal versioning pattern for legal parameters. The use of static methods and the `vpg_` table prefix aligns with established conventions. The inclusion of deterministic seeding and specific Costa Rican labor law constants (CCSS, OT factors, Jornadas) ensures the system is grounded in the local regulatory context from the start.

## 2. Strengths
- **Temporal Versioning:** The `validFrom`/`validUntil` pattern is the industry standard for legal/financial parameters that change over time (e.g., annual CCSS rate adjustments).
- **Deterministic Seeding:** Using `seed-${key}` for IDs ensures that running the seed multiple times (idempotency) won't result in duplicate initial records while still allowing for the "open-ended" (`validUntil: null`) logic to function.
- **Comprehensive Coverage:** The 20+ initial parameters cover nearly all critical hardcoded values currently in `payrollUtils.ts`.
- **Strict Security:** Enforcing `adminOnly` for mutations and role-based access for history/all-lists is appropriate for sensitive system configuration.
- **Atomic Upsert Logic:** The `upsertParam` strategy (close old, open new) correctly preserves an audit trail rather than overwriting historical data.

## 3. Concerns
- **Missing Unique Constraint (HIGH):** The schema lacks a unique constraint on `(key, validFrom)`. Without this, the database could technically allow two records for the same parameter starting on the same day, which would break the `findFirst` logic in `getParamAtDate`.
- **Lack of Overlap Protection (MEDIUM):** While `upsertParam` is designed to "close" the previous record, the logic needs to be robust against "back-dating" parameters. If a user inserts a parameter with a `validFrom` that is earlier than an existing record's `validFrom`, the current "close open-ended" logic will fail or create overlapping valid periods.
- **Decimal Precision & Scale (LOW):** Prisma's `Decimal` type on PostgreSQL defaults to a high precision, but for Costa Rican colones and percentages (e.g., 9.25%), it's safer to explicitly define it (e.g., `@db.Decimal(18, 4)`) to avoid rounding issues in financial calculations.
- **`adminOnly` Middleware Location (LOW):** The plan suggests defining `adminOnly` as an inline function in the route file. Per senior standards, this should ideally be a reusable middleware in `src/backend/src/middleware/AuthMiddleware.ts` to maintain consistency across other admin-only modules.
- **Boolean as Decimal (LOW):** `MIN_WAGE_CHECK_ENABLED` is stored as `1` or `0` in a `Decimal` field. While functional, the Service should ideally provide a `getBooleanParam` helper to avoid `val.equals(1)` checks throughout the business logic.

## 4. Suggestions
- **Database Constraint:** Add `@@unique([key, validFrom])` to the `VpgLegalParam` model in `schema.prisma`.
- **Validation Logic:** In `LegalParamService.upsertParam`, add a check to ensure `newValidFrom` is strictly greater than the current record's `validFrom`.
- **Date Normalization:** Ensure all `validFrom` dates are normalized to `00:00:00.000` UTC (or the start of the day) to avoid time-of-day edge cases where a parameter might not be "active" at 8:00 AM but is active at 11:59 PM.
- **Cache Strategy:** Since legal parameters change infrequently but are read on every payroll calculation, consider adding a simple in-memory cache (or singleton Map) in the Service that is cleared on `upsertParam`.
- **Refined Seed:** For the CCSS parameters, use the actual official decree dates (e.g., the last CCSS adjustment date) rather than a generic `2024-07-01` if possible, to ensure historical consistency if old payrolls are re-run.

## 5. Risk Assessment: LOW
The overall risk is low because this is a foundational, non-breaking addition. The primary risk is **Data Integrity** (preventing overlapping validity periods). If the `upsert` logic is implemented carefully and the unique constraint is added, the system will be robust. The impact on existing 500+ tests should be zero as this phase does not yet modify `payrollUtils.ts` to consume these values.

---

## Codex Review

**Status: FAILED** — Model `gpt-5.1-codex` is not supported with ChatGPT account. Only 1 of 2 external reviewers succeeded.

---

## Consensus Summary

*Only Gemini completed a review. Consensus derived from single reviewer + internal plan-checker findings.*

### Agreed Strengths
- Temporal `validFrom`/`validUntil` versioning is correct for legal parameter management
- Deterministic seed IDs (`seed-${key}`) ensure idempotent re-runs
- Security model is correctly layered: `AuthMiddleware.verifyToken` + `adminOnly` for write/admin-read endpoints
- Insert-only upsert pattern preserves full audit trail — correct for compliance domain

### Top Concerns (Priority Order)

| # | Severity | Concern | Source |
|---|----------|---------|--------|
| 1 | **HIGH** | Schema missing `@@unique([key, validFrom])` constraint — DB allows duplicate parameter records for same key+date, breaking `findFirst` correctness | Gemini |
| 2 | **MEDIUM** | `upsertParam` has no guard against back-dated `validFrom` (earlier than existing record's `validFrom`) — could create overlapping validity periods | Gemini |
| 3 | **LOW** | `adminOnly` defined inline in route file — should be shared middleware in `AuthMiddleware.ts` for reuse across future admin-only routes | Gemini |
| 4 | **LOW** | `MIN_WAGE_CHECK_ENABLED` stored as Decimal (1/0) — a `getBooleanParam` helper would clean up Phase 56+ call sites | Gemini |
| 5 | **LOW** | No explicit `@db.Decimal(18, 4)` precision — relying on PostgreSQL defaults for financial percentages | Gemini |

### Action Items for Planner (`/gsd:plan-phase 55 --reviews`)

If replanning with these findings, prioritize:

1. **Add `@@unique([key, validFrom])`** to the schema model (HIGH — data integrity guard)
2. **Add back-date validation** in `upsertParam`: reject if `newValidFrom <= existing.validFrom` (MEDIUM — prevents overlap bugs)
3. **Extract `adminOnly` to AuthMiddleware** (LOW — deferred to Phase 63 or future cleanup, not blocking)
4. **Add `getParamAsBoolean` helper** (LOW — deferred to Phase 56 when it's actually needed)
5. **Explicit Decimal precision** (LOW — can add in Phase 55 or defer)

### Divergent Views

No divergent views (only 1 reviewer completed).
