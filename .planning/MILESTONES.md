# Milestones

## v1.4 — Stability and Integration Hardening (Shipped: 2026-04-12)

**Phases completed:** 8 phases (24-31), 15 plans
**Timeline:** 2026-04-09 → 2026-04-12 (4 days)
**Status:** Archived

**Key accomplishments:**
1. **Auth Hardening:** Unified token lifecycle (refresh/revocation/logout) with consistent error mapping.
2. **HTTP Enforcement:** Unified frontend client (`http.ts`) for all business services.
3. **Repository Hygiene:** Clean git index (removed IDE/build artifacts) and tracked `package-lock.json`.
4. **Modularization:** Monolith decomposition into `ClockLogsService`, `ImportSessionService`, etc.
5. **Security:** Secure email-verified password reset flow with bcrypt hashing.
6. **Code Quality:** Centralized environment configuration validated with Zod.
7. **Java Automation:** Introduced JUnit 5 and Mockito baseline for the clock-log utility.

**Archive:** `.planning/milestones/v1.4-ROADMAP.md`

---

## v1.3 — Sistema de Marcas de Reloj Robusto (Shipped: 2026-04-09)

**Phases completed:** 6 phases (18-23), 14 plans
**Timeline:** 2026-04-05 → 2026-04-09 (4 dias)
**Status:** User-confirmed milestone closure

**Key accomplishments:**
1. Pipeline robusto de marcas con normalizacion canonica IN/OUT y trazabilidad status/source
2. Sesiones de importacion con vinculo a marcas y endpoints de consulta operativos
3. Deteccion automatica de huerfanas/anomalias + endpoints de resolucion
4. Correccion manual con auditoria y proteccion de rutas administrativas
5. Dashboard UI de marcas con filtros, badges, modal de detalle y sesiones recientes

**Archive:** `.planning/milestones/v1.3-ROADMAP.md`

---

## v1.2 — Cobertura de Tests y Mejoras UI (Shipped: 2026-04-04)

**Phases completed:** 1 phase (17), 3 plans + 2 quick tasks
**Timeline:** 2026-04-02 → 2026-04-04 (2 días)
**Tests:** 104 → 287 (+183), 17 suites, 0 failures, cobertura 42.49%

**Key accomplishments:**
1. 9 nuevas suites de tests unitarios
2. payrollUtils.test.ts extendido a 103 casos (97% cobertura)
3. sessionStorage cache (TTL 5 min) implementado en 8 hooks
4. Sidebar modernizado — zinc-950, animaciones, dot status

**Archive:** `.planning/milestones/v1.2-ROADMAP.md`

---
