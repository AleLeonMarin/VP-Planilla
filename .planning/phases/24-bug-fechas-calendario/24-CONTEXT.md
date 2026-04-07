---
phase: 24
slug: bug-fechas-calendario
milestone: v1.3
status: pending
created: 2026-04-06
---

# Phase 24 — Bug de Fechas en Componentes de Calendario

## Síntoma

Al seleccionar una fecha en cualquier componente de calendario del sistema, la fecha que se guarda/envía es **un día anterior** al seleccionado.

**Ejemplo reportado:**
- Usuario selecciona: **1 de abril**
- Sistema guarda/muestra: **30 de marzo**

## Causa Raíz Probable

Bug de UTC offset (timezone). Patrón típico:

1. El componente de calendario devuelve un objeto `Date` de JavaScript representando la fecha seleccionada en **hora local** (ej. `2026-04-01T00:00:00.000 UTC-06:00` para Costa Rica)
2. Al hacer `.toISOString()` o serializar para enviar al backend, se convierte a UTC: `2026-03-31T06:00:00.000Z`
3. El backend parsea la parte de fecha: **31 de marzo** ❌

Costa Rica está en **UTC-6**, por lo que medianoche local = `06:00 UTC` del mismo día, pero si se toma solo la fecha UTC resulta el día anterior.

## Componentes a Revisar

- `src/frontend/src/components/DatePicker.tsx` (o similar) — cualquier componente que wrappee FullCalendar, react-datepicker u otro
- Todos los lugares donde se construye un string de fecha para enviar al backend desde un Date object del calendario
- Hooks y servicios que transforman fechas antes de pasarlas a la API

## Goal de la Fase

1. Identificar todos los componentes de calendario y los puntos donde se serializa la fecha
2. Corregir la serialización para usar fecha local (no UTC) — patrón: `YYYY-MM-DD` extraído de `.getFullYear()/.getMonth()/.getDate()` o `format(date, 'yyyy-MM-dd')` de `date-fns`
3. Verificar que seleccionar el 1 de abril → guarda/envía `2026-04-01` sin conversión UTC

## Fix Esperado

```ts
// MAL — convierte a UTC antes de serializar
const dateStr = date.toISOString().split('T')[0]; // → día anterior en UTC-6

// BIEN — usa componentes locales
const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
// o con date-fns:
import { format } from 'date-fns';
const dateStr = format(date, 'yyyy-MM-dd');
```

## Scope

- Frontend únicamente (la causa está en la serialización de fechas en el cliente)
- Todos los componentes de calendario / date picker del sistema
- Todos los formularios que usen estos componentes para seleccionar fechas de inicio/fin de períodos, vacaciones, marcas, etc.
