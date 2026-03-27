# Cómo trabajar con IA en este proyecto

## Herramientas

| Herramienta | Para qué |
|---|---|
| **Claude Code** | Planear, investigar, ejecutar fases, depurar |
| **OpenCode** | Continuar trabajo cuando Claude tiene contexto alto |

---

## Flujo normal de trabajo

```
/gsd:plan-phase N     → Investiga y crea el plan
/gsd:execute-phase N  → Ejecuta el plan
/gsd:validate-phase N → Verifica que todo quedó bien
/gsd:plan-phase N+1   → Siguiente fase
```

---

## Cuando el contexto de Claude está alto → pasar a OpenCode

```
Claude (contexto alto)
    ↓
/gsd:pause-work           → genera .continue-here.md con todo el estado
    ↓
OpenCode lee .continue-here.md → trabaja → hace commits
    ↓
OpenCode termina → /gsd:pause-work (desde OpenCode)
    ↓
Abres Claude → /gsd:resume-work
    ↓
Claude continúa desde donde OpenCode paró
```

**Regla:**
- `pause-work` = empaquetar mi estado para que otro lo retome
- `resume-work` = leer lo que el anterior dejó y continuar
- `.continue-here.md` = el puente entre los dos agentes

---

## Estado actual del proyecto

Ver `.planning/STATE.md` — siempre tiene la posición exacta y el siguiente comando.

---

## Fases del Milestone 1

| # | Fase | Estado |
|---|------|--------|
| 1 | Singleton Prisma | ✅ Completa |
| 2 | Seguridad de Autenticación | ✅ Completa |
| 3 | Validación de Inputs y CORS | ✅ Completa |
| 4 | Performance del Cálculo de Planilla | ✅ Completa |
| 5 | Funcionalidad de Negocio Faltante | 📋 Planificada |
| 6 | Feriados Nacionales Costa Rica | ⬜ Pendiente |
| 7 | Rate Limiting, Helmet y Token Revocation | ⬜ Pendiente |
| 8 | Tests Unitarios NomineeService | ⬜ Pendiente |

---

## Comandos útiles

```bash
# Ver estado y siguiente paso
/gsd:progress

# Ver todas las fases y planes
/gsd:stats

# Si algo se rompe
/gsd:debug <descripción del error>

# Si OpenCode hizo trabajo y quieres retomar
/gsd:resume-work
```

---

## Estructura del proyecto

```
src/backend/    → API Express + TypeScript + Prisma
src/frontend/   → Next.js + React + Tailwind
src/Java/       → Parser de reloj marcador (standalone)
.planning/      → Planes, fases, estado del proyecto
CLAUDE.md       → Reglas que la IA DEBE seguir siempre
```
