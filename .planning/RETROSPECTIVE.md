# Retrospective — VP-Planilla

---

## Milestone: v1.4 — Stability and Integration Hardening

**Shipped:** 2026-04-12
**Phases:** 8 | **Plans:** 15 | **Timeline:** 4 dias

### What Was Built

1. **Auth Lifecycle:** Unified token refresh/revocation/logout flow with consistent error mapping across stacks.
2. **HTTP Layer:** Enforced unified client (`http.ts`) for all business services, eliminating direct fetch bypasses.
3. **Repository Hygiene:** Purged git index of build artifacts/OS noise and standardized lock file policies (`package-lock.json` tracked).
4. **Modularization:** Monolith decomposition into specialized services (`ClockLogsService`, `ImportSessionService`, etc.).
5. **Security:** Email-verified password reset flow with bcrypt hashing and 15-min expiry.
6. **Code Quality:** Centralized environment validation using **Zod** in the backend for fail-fast startup.
7. **Java Automation:** Introduced **JUnit 5** and **Mockito** testing baseline for the Java clock-log utility.

### What Worked

- **Zod for Config:** Catching missing environment variables at startup prevented several "undefined" runtime errors during development.
- **Unit Testing Java:** Decoupling `fileReader` from the database via DI made the Java logic verifiable for the first time.
- **Surgical Git Purge:** Using `git rm --cached` cleaned the repo without affecting local dev environments.

### What Was Inefficient

- **Interrupted Milestone Cierre:** Sequential shell commands and script errors led to inconsistent initial state updates during closure.
- **Java Testing Complexity:** Mocking ByteBuddy on Java 25 required specific Surefire flags that were not immediately obvious.
- **Traceability Updates:** Keeping `STATE.md` and `ROADMAP.md` in sync during rapid phase execution requires constant manual attention.

### Patterns Established

- **Fail-Fast Configuration:** All critical backend dependencies (DB, JWT, Resend) are validated at import-time.
- **Unified HTTP Handling:** Frontend services never call raw fetch; they use the centralized client to ensure token persistence.
- **App-Level Lock Files:** Tracking `package-lock.json` in application directories is now the project standard for deterministic builds.

### Key Lessons

- **Validate Config Early:** Moving from `process.env` to a validated `env.ts` object significantly improved system reliability.
- **Automate Multi-Stack Tests:** Having JUnit 5 alongside Jest ensures that core logic in both Java and TS is held to the same quality standard.
- **Consolidate Planning Documents:** Closing a milestone requires a holistic check of all master documents to ensure the "source of truth" is consistent.

---

## Milestone: v1.3 — Sistema de Marcas de Reloj Robusto

**Shipped:** 2026-04-09
**Phases:** 6 | **Plans:** 14 | **Timeline:** 4 dias
...
