# Retrospective — VP-Planilla

---

## Milestone: v1.0 — Estabilización y Completitud

**Shipped:** 2026-03-27
**Phases:** 8 | **Plans:** 22 | **Timeline:** 3 días

### What Was Built

1. Singleton Prisma en todos los servicios — eliminados 16 `new PrismaClient()` duplicados
2. AuthMiddleware aplicado a todas las rutas — 13 rutas antes desprotegidas
3. Validación Zod + CORS restringido en backend
4. Cálculo de planilla O(6) queries — preload de todos los datos antes del loop de empleados
5. Feriados nacionales CR en cálculo de días laborales
6. Rate limiting (login), Helmet, token revocation via DB blocklist
7. 45 tests (42 unit + 3 integration) para NomineeService y PayrollService

### What Worked

- **GSD con subagentes paralelos** aceleró las fases de ejecución considerablemente
- **Claude + OpenCode como alternativa** cuando el contexto estaba alto — `pause-work` / `resume-work` funcionó bien
- **Phases pequeñas y atómicas** (1-3 planes cada una) permitieron avanzar sin perder el hilo
- **Audit milestone antes de cerrar** detectó REQ 5.3 y REQ 8.8 — buena práctica

### What Was Inefficient

- SUMMARY.md sin campo `one_liner` estructurado — gsd-tools no pudo extraer accomplishments automáticamente
- Phase 06 tiene un `PLAN.md` sin número (no `06-04-PLAN.md`) que confunde a gsd-tools → reporta phase in_progress
- Phase 08 usa `08-SUMMARY.md` en vez de `08-01-SUMMARY.md` / `08-02-SUMMARY.md` — mismo problema
- Milestone ya había sido parcialmente archivado (`34d5f68`) antes de correr `/gsd:complete-milestone` formalmente

### Patterns Established

- Usar `prisma db push` para schema changes cuando hay drift de migraciones (documentado como deuda)
- Empleados no se eliminan — solo se desactivan (`status: inactivo`)
- `z.coerce.number()` es el API correcto en Zod 4 (no `z.number({ coerce: true })`)
- Timestamps UTC para clock logs: `localHour - 6` para offset CR

### Key Lessons

- Nombrar SUMMARYs con número de plan (`08-01-SUMMARY.md`) para que gsd-tools los detecte correctamente
- No mezclar archivados manuales con `/gsd:complete-milestone` — hacer uno o el otro
- El audit gap de `prisma db push` vs `migrate dev` es real — priorizar en v1.1

### Cost Observations

- Model mix: executor=sonnet, planner=opus, mapper=haiku
- 8 fases completadas en 3 días con trabajo conjunto Claude + OpenCode
- Mapper agents (haiku) muy eficientes para exploración de codebase en paralelo

---

## Cross-Milestone Trends

| Metric | v1.0 |
|--------|------|
| Phases | 8 |
| Plans | 22 |
| Tests | 45 |
| Duration | 3 días |
| Failures at close | 0 |

---

*Last updated: 2026-03-31 after v1.0 milestone*
