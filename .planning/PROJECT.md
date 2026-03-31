# VP-Planilla

## What This Is

Sistema de planilla (nómina) para Costa Rica. Maneja el ciclo completo: empleados, períodos de planilla, cálculo de horas y horas extra según ley laboral costarricense, deducciones CCSS, generación de reportes oficiales y envío por email.

## Core Value

Calcular y generar planillas correctas conforme a la ley laboral costarricense, con datos seguros y auditables.

## Current State (v1.0 — 2026-03-27)

**v1.0 SHIPPED** — Sistema estabilizado:
- ✅ Singleton Prisma en todos los servicios
- ✅ Todas las rutas protegidas con AuthMiddleware
- ✅ Validación Zod en endpoints críticos
- ✅ Performance: O(6) queries para cualquier número de empleados
- ✅ Feriados nacionales CR en cálculo de planilla
- ✅ Rate limiting, Helmet, token revocation
- ✅ 45 tests (42 unit + 3 integration), 0 failures

## Context

- **Stack:** Express 5 + TypeScript 5.8 (backend) · Next.js 15 + React 19 (frontend) · Prisma 6 + PostgreSQL · Tailwind 4
- **Arquitectura:** Route → Controller → Service → Prisma (backend) / Page → Hook → Service → http.ts (frontend)
- **Dominio:** Semana laboral lunes–sábado · 8h regulares/día · 1.5× hasta 10h · 2× sobre 10h · descanso semanal 0.5×
- **Repositorio:** brownfield — código existente mejorado en v1.0

## Next Milestone Goals (v1.1)

- Corregir 27 errores TypeScript pre-existentes
- Fix logout frontend (no limpia localStorage)
- Tests E2E con Playwright
- Tests de frontend (Vitest)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Singleton Prisma via lib/prisma.ts | Ya existía, solo faltaba usarlo | ✅ v1.0 |
| AuthMiddleware por ruta (router.use) | Más control sin allowlist complicada | ✅ v1.0 |
| Zod validation en backend | Frontend ya usa Zod | ✅ v1.0 |
| Feriados CR como lista estática | No hay API pública confiable | ✅ v1.0 |
| Token revocation con DB blocklist | Redis no está en el stack | ✅ v1.0 |
| No eliminar empleados — solo desactivar | Eliminar rompería historial de planillas | ✅ Regla de negocio |

## Out of Scope

- Multitenancy / múltiples empresas — requiere rediseño del schema
- App móvil — fuera del alcance actual
- Integración directa con CCSS API — no hay API pública disponible
- Migración a microservicios — monolito es correcto para el tamaño actual
- Eliminar empleados permanentemente — solo desactivar (status: inactivo)

---
*Last updated: 2026-03-31 — v1.0 milestone archived, ready for v1.1*
