# Phase 11 Plan: Design System Dark Mode

## Metadata

- **Phase**: 11
- **Requirements**: UI-01, UI-02
- **Status**: Pending execution
- **Depends on**: Phase 8 (v1.0)
- **Style**: Dark mode SaaS moderno (Linear/Vercel style)

---

## Research Findings

### Current State

**CSS Variables (globals.css, 135 líneas):**
- `:root` define variables light mode
- Colores: beige/verde (#4A5D3A primary, #FBF8F0 page bg)
- No existe `.dark` variant todavía
- Tailwind con `@custom-variant dark (&:where(.dark, .dark *))`

**Components principales:**
- `components/ui/` — Sidebar, Table, StatsCards, Modal, FormModal, Header, ConfirmDialog, EmployeeTabs
- `components/` — EmployeeTable, PayrollResults, PayrollCalendar, AddEmployeeModal, EditEmployeeModal, etc.
- ~42 componentes total

**Sidebar (Sidebar.tsx, 102 líneas):**
- Menú con items y subItems
- Usa iconos PNG (no SVG)
- No tiene estado "active" implementado visualmente
- No colapsa en mobile

### Problemas identificados

1. **No hay dark mode** — Solo `:root` existe, no hay `.dark` variant
2. **Sidebar sin estado activo** — No marca visualmente la ruta actual
3. **Sidebar no colapsa** — No hay soporte mobile
4. **Inconsistencia de colores** — Algunos componentes pueden tener hardcoded colors

---

## Scope

### UI-01: Design Tokens CSS Globales

1. **Crear variables dark mode en globals.css**
   - Definir `.dark` variant con colores dark (no invertirlos de light)
   - Paleta dark: bg #09090B, surface #18181B, border #27272A, text #FAFAFA
   - Toggle para alternar entre light/dark

2. **Centralizar tokens** — Todas las variables en `:root` y `.dark`

3. **Verificar componentes** — Buscar hardcoded colors y reemplazar con variables CSS

### UI-02: Sidebar Moderno

1. **Estado activo** — Marcar visualmente el item de navegación actual
2. **Colapso mobile** — Botón hamburger, sidebar colapsable
3. **Estilo dark consistente** — Usar tokens CSS (no hardcoded)

---

## Éxito Criteria

| # | Criterio | Target |
|---|-----------|--------|
| 1 | Variables dark mode definidas | `.dark` variant en globals.css |
| 2 | Toggle light/dark funciona | Botón en Header o Settings |
| 3 | Sidebar muestra estado activo | Item actual marcado visualmente |
| 4 | Sidebar colapsa en mobile | Responsive behavior |
| 5 | Consistencia visual | No hardcoded colors en componentes |
| 6 | `npx next lint` pasa | Sin errores nuevos |
| 7 | `npx tsc --noEmit` pasa | Sin errores nuevos |

---

## Plan de ejecución

### Paso 1: Diseñar sistema de tokens dark mode
- Definir paleta dark (Zinc-950 base, no puramente blanco/negro)
- Mapear a variables CSS
- Agregar `.dark` variant al globals.css

### Paso 2: Agregar toggle dark/light
- Crear hook o context para theme
- Persistir preferencia en localStorage
- Agregar botón de toggle en Header

### Paso 3: Actualizar Sidebar
- Agregar estado activo con color de acento
- Implementar colapso con botón hamburger
- Usar tokens CSS en vez de colores hardcoded

### Paso 4: Verificar consistencia
- Buscar y reemplazar hardcoded colors
- Auditar componentes principales
- Verificar que no hay "islas" de estilo diferente

---

## Archivos a modificar

| Archivo | Cambios |
|---------|---------|
| `src/frontend/src/styles/globals.css` | Agregar `.dark` variant, nuevos tokens |
| `src/frontend/src/components/ui/Header.tsx` | Agregar toggle theme |
| `src/frontend/src/components/ui/Sidebar.tsx` | Estado activo, colapso mobile |
| `src/frontend/src/components/SidebarItem.tsx` | Estilos activos |
| `src/frontend/src/hooks/useTheme.ts` | NUEVO — theme state + localStorage |

## Archivos a crear

| Archivo | Descripción |
|---------|-------------|
| `src/frontend/src/hooks/useTheme.ts` | Hook para gestionar tema |

---

## UI Reference: Linear/Vercel Dark Style

```
Background:   #09090B (zinc-950)
Surface:      #18181B (zinc-900)
Border:       #27272A (zinc-800)
Text:         #FAFAFA (zinc-50)
Text muted:   #71717A (zinc-500)
Primary:      #22C55E (green-500) o #3B82F6 (blue-500)
```

**Key principles:**
- No usar blanco puro (#FFFFFF) — usar zinc-50 (#FAFAFA)
- Superficies con depth: bg general → cards más claras → modals más claras
- Bordes sutiles para separar secciones
- Accent color para acciones y estado activo

---

## Estimación

- **Complejidad**: Media — requiere cambios CSS + React state
- **Riesgo**: Bajo — cambios incrementales, fácil revertir
- **Tiempo estimado**: 1-2 sesiones

---

*Planned: 2026-03-31*
