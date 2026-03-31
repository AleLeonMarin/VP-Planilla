# Milestones

## v1.0 Estabilización y Completitud (Shipped: 2026-03-27)

**Phases completed:** 8 phases, 22 plans
**Timeline:** 2026-03-25 → 2026-03-27 (3 días)
**Tests:** 45 pasando (42 unit + 3 integration), 0 failures

**Key accomplishments:**

1. Migrados 16 servicios al singleton Prisma — eliminados pools de conexión duplicados
2. 13 rutas API desprotegidas aseguradas con JWT AuthMiddleware
3. CORS wildcard restringido + validación Zod en 5 dominios (Employee, Payroll, ClockLog, Deduction, User)
4. Cálculo de planilla optimizado de O(N×5) a O(6) queries con métodos preload
5. Feriados nacionales CR integrados al cálculo de días laborales
6. Rate limiting en login, Helmet headers, revocación de tokens via DB blocklist
7. 45 tests unitarios/integración para NomineeService y PayrollService

**Known gaps at close:**
- REQ 5.3: `prisma db push` en vez de `migrate dev` — user_last_login no reproducible en deploy limpio
- REQ 8.8: Sin tests de integración para POST /api/nominee/payroll (Should, no Must)

**Archive:** `.planning/milestones/v1.0-ROADMAP.md`

---
