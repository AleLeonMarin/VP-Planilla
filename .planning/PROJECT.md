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

## Current Milestone: v1.1 Calidad, UI Moderna y Cobertura de Tests

**Goal:** Elevar la calidad del sistema en tres frentes: cobertura de tests ~60%, rediseño visual dark mode moderno consistente en todo el frontend, y validación de la integración frontend-backend.

**Target features:**
- Tests unitarios ~60% de cobertura (módulo empleados + otros módulos críticos)
- Design system dark mode: sidebar, cards, tipografía y colores cohesivos en TODOS los módulos
- Modales de confirmación/advertencia en flujos críticos
- Corrección de bugs visuales, inconsistencias y flujo UX mejorado
- Validación completa de conexión frontend-backend (contratos de API)

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
## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-31 — v1.1 milestone started*
