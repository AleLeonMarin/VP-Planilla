# VP-Planilla

Sistema de planilla (nómina) para Costa Rica. Maneja empleados, períodos de planilla, cálculo de horas y horas extra según ley laboral costarricense, deducciones CCSS, y generación de reportes oficiales.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Express 5 + TypeScript + Prisma + PostgreSQL |
| Frontend | Next.js 15 + React 19 + Tailwind 4 |
| Testing | Jest 29 + ts-jest |
| Validación | Zod |

---

## Levantar el proyecto

```bash
# Backend (puerto 3001)
cd src/backend
npm install
npm run dev

# Frontend (puerto 3000)
cd src/frontend
npm install
npm run dev
```

Variables de entorno requeridas en `src/backend/.env`:
```
DATABASE_URL=...
JWT_SECRET=...
ALLOWED_ORIGINS=http://localhost:3000
```

> El servidor NO arranca si falta JWT_SECRET. Esto es intencional.

---

## Comandos útiles

```bash
# Verificar TypeScript sin compilar
cd src/backend && npx tsc --noEmit
cd src/frontend && npx tsc --noEmit

# Correr tests
cd src/backend && npm test

# Tests con reporte de cobertura
cd src/backend && npm test -- --coverage

# Lint frontend
cd src/frontend && npx next lint
```

---

## Cómo trabajar con IA en este proyecto

Este proyecto usa **GSD (Get Shit Done)** — una metodología para trabajar con agentes IA de forma organizada. Todo el estado del proyecto vive en `.planning/`.

### Los agentes disponibles

| Agente | Para qué |
|--------|---------|
| **Claude (este)** | Planear, depurar, ejecutar fases |
| **OpenCode** | Ejecutar fases largas cuando Claude tiene contexto alto |

---

## Flujo de trabajo normal

```
/gsd:plan-phase N     →  planea la fase N (investiga + crea PLAN.md)
/gsd:execute-phase N  →  ejecuta los cambios de la fase N
/gsd:validate-phase N →  verifica que la fase quedó bien
```

Después de cada fase ejecutada, continuar con la siguiente:
```
/gsd:plan-phase 5
/gsd:execute-phase 5
/gsd:validate-phase 5
...
```

---

## Flujo Claude ↔ OpenCode (cuando el contexto está alto)

Cuando Claude empieza a consumir demasiado contexto, se hace handoff a OpenCode y viceversa.

```
┌─────────────────────────────────────────────────────┐
│                    CLAUDE                           │
│  Trabajas normalmente hasta que el contexto sube   │
│                        ↓                           │
│            /gsd:pause-work                         │
│         (genera .planning/HANDOFF.md)              │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                   OPENCODE                          │
│  Abres OpenCode, le das el HANDOFF.md              │
│  "Lee este archivo y continúa desde ahí"           │
│  OpenCode trabaja, hace commits                    │
│                        ↓                           │
│            /gsd:pause-work                         │
│         (OpenCode empaqueta su estado)             │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                    CLAUDE                           │
│            /gsd:resume-work                        │
│     (Claude lee el estado y continúa)              │
└─────────────────────────────────────────────────────┘
```

### Regla simple

- **`/gsd:pause-work`** = "empaqueto mi estado para que otro lo retome"
- **`/gsd:resume-work`** = "leo lo que el anterior dejó y continúo"
- **Siempre hacer `pause-work` al terminar, `resume-work` al empezar**

### Señales de que debes hacer handoff

- Claude empieza a olvidar cosas de mensajes anteriores
- Las respuestas se vuelven menos precisas
- Ves aviso de contexto alto en la UI de Claude

---

## Estado actual del proyecto

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1 | Singleton Prisma | ✅ Completa |
| 2 | Seguridad de Autenticación | ✅ Completa |
| 3 | Validación de Inputs y CORS | ✅ Completa |
| 4 | Performance del Cálculo de Planilla | ✅ Completa |
| 5 | Funcionalidad de Negocio Faltante | ⬜ Pendiente |
| 6 | Feriados Nacionales Costa Rica | ⬜ Pendiente |
| 7 | Rate Limiting, Helmet y Token Revocation | ⬜ Pendiente |
| 8 | Tests Unitarios NomineeService | ⬜ Pendiente |

Ver `.planning/ROADMAP.md` para el detalle completo.

---

## Estructura del proyecto

```
VP-Planilla/
├── src/
│   ├── backend/          # Express API (puerto 3001)
│   │   ├── src/
│   │   │   ├── controller/   # Parsea req/res, llama al service
│   │   │   ├── service/      # Toda la lógica de negocio
│   │   │   ├── routes/       # Express Router + middleware
│   │   │   ├── middleware/   # AuthMiddleware, validateBody
│   │   │   ├── schemas/      # Validación Zod
│   │   │   ├── model/        # Interfaces TypeScript
│   │   │   ├── lib/          # Singleton Prisma
│   │   │   └── utils/        # payrollUtils, asyncHandler
│   │   └── prisma/           # Schema + migraciones DB
│   ├── frontend/         # Next.js (puerto 3000)
│   │   └── src/
│   │       ├── app/          # Páginas
│   │       ├── components/   # Componentes reutilizables
│   │       ├── hooks/        # useEmployee, usePayroll, etc.
│   │       ├── services/     # Llamadas al API via http.ts
│   │       └── schemas/      # Validación Zod frontend
│   └── Java/             # Parser de reloj de asistencia (standalone)
├── .planning/            # Estado del proyecto GSD
│   ├── PROJECT.md        # Qué es este proyecto
│   ├── ROADMAP.md        # Las 8 fases
│   ├── REQUIREMENTS.md   # Requisitos detallados por fase
│   ├── STATE.md          # Dónde estamos ahora
│   └── phases/           # Plans, research y summaries por fase
└── CLAUDE.md             # Instrucciones para el agente IA
```

---

## Ley laboral costarricense (dominio)

Las reglas de negocio implementadas en `payrollUtils.ts`:

| Regla | Valor |
|-------|-------|
| Semana laboral | Lunes a Sábado |
| Horas regulares | 8h/día |
| Horas extra | 1.5× hasta 10h totales, 2× sobre 10h |
| Descanso semanal trabajado | 0.5× salario diario |
| Deducciones CCSS | Obligatorias |

---

## Responsables

- Alejandro León Marín
- Kendall Fonseca Hidalgo

*Ingeniería en Sistemas — 2026*
