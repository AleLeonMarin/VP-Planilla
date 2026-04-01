# Phase 12 Plan: Tablas, Formularios y Modales (Dark Mode Completo)

## Metadata

- **Phase**: 12
- **Requirements**: UI-03, UI-04, UI-05
- **Status**: Pending execution
- **Depends on**: Phase 11
- **Scope**: TODOS los componentes y páginas del frontend (Phase 11 solo tocó globals.css, Header, Sidebar, useTheme)

---

## Research Findings

### Scope Real de Phase 12

Phase 11 tocó SOLO:
- ✅ `styles/globals.css` — CSS tokens dark
- ✅ `components/ui/Header.tsx` — theme toggle
- ✅ `components/ui/Sidebar.tsx` — active state + mobile collapse
- ✅ `hooks/useTheme.tsx` — theme context

**TODO el resto del frontend es responsabilidad de Phase 12:**
- 46 archivos con colores hardcoded
- ~146 instancias de colores sin variante dark:
- 24 componentes
- ~21 páginas page.tsx

### Color System Actual → Dark Mapping

| Color actual | Usado en | Reemplazar con |
|--------------|----------|---------------|
| `bg-[#FBF8F0]`, `bg-white` | Fondos principales | `dark:bg-zinc-900` (#09090B) |
| `bg-[#FCF1D5]`, `bg-[#F0E6D2]` | Sidebar, headers | `dark:bg-zinc-800` (#18181B) |
| `bg-[#E7DCC1]` | Main backgrounds | `dark:bg-zinc-950` (#09090B) |
| `bg-[#4A5D3A]`, `bg-[#6F7153]` | Botones primarios | `dark:bg-green-600` (#16A34A) |
| `text-[#4A5D3A]`, `text-[#6F7153]` | Textos primarios | `dark:text-zinc-100` (#F4F4F5) |
| `text-[#5D614A]` | Textos secundarios | `dark:text-zinc-400` (#A1A1AA) |
| `text-[#D9C38B]` | Textos accent | `dark:text-zinc-500` (#71717A) |
| `border-[#E0D6B7]`, `border-[#F0EDE5]` | Bordes | `dark:border-zinc-700` (#3F3F46) |
| `border-[#D4C89A]` | Bordes oscuros | `dark:border-zinc-600` (#52525B) |

---

## Scope Completo de Archivos

### Componentes UI Base (7 archivos)

| Archivo | Prioridad | Cambios principales |
|---------|-----------|-------------------|
| `ui/Modal.tsx` | 🔴 Alta | Background dark, bordes dark, overlay dark |
| `ui/Table.tsx` | 🔴 Alta | Hover rows dark, headers dark, empty state dark |
| `ui/FormModal.tsx` | 🔴 Alta | Inputs dark, validación error/éxito |
| `ui/ConfirmDialog.tsx` | 🟡 Media | Verificar dark completo |
| `ui/StatsCards.tsx` | 🟡 Media | Cards dark, iconos dark |
| `ui/EmployeeTabs.tsx` | 🟡 Media | Tabs dark, borders dark |
| `ui/Header.tsx` | ✅ Ya OK | — |

### Componentes de Empleados (12 archivos)

| Archivo | Prioridad | Cambios principales |
|---------|-----------|-------------------|
| `AddEmployeeModal.tsx` | 🔴 Alta | Form completo dark |
| `EditEmployeeModal.tsx` | 🔴 Alta | Form completo dark |
| `DismissEmployeeModal.tsx` | 🔴 Alta | Form + confirmación dark |
| `EmployeeTable.tsx` | 🔴 Alta | Tabla dark, badges dark |
| `EmployeeProfileModal.tsx` | 🔴 Alta | Perfil dark |
| `EmployeeProfileCard.tsx` | 🟡 Media | Card dark |
| `EmployeeIncidenceCard.tsx` | 🟡 Media | Card dark |
| `EmployeeAttendanceTable.tsx` | 🟡 Media | Tabla dark |
| `SidebarItem.tsx` | ✅ Ya OK | — |
| `DatePicker.tsx` | 🟡 Media | Calendar dark |
| `PositionsModal.tsx` | 🟡 Media | Modal dark |
| `LaborEventModal.tsx` | 🟡 Media | Modal dark |
| `LaborEventsCalendar.tsx` | 🟡 Media | Calendar dark |

### Componentes de Planilla (4 archivos)

| Archivo | Prioridad | Cambios principales |
|---------|-----------|-------------------|
| `PayrollResults.tsx` | 🔴 Alta | 817 líneas — tabla dark, resultados dark |
| `PayrollCreateModal.tsx` | 🔴 Alta | Form completo dark |
| `PayrollCalendar.tsx` | 🟡 Media | Calendar dark |
| `PayrollTypeService.ts` (no es UI) | — | — |

### Dashboard y Utilidades (3 archivos)

| Archivo | Prioridad | Cambios principales |
|---------|-----------|-------------------|
| `DashboardStats.tsx` | 🟡 Media | Stats cards dark |
| `QuickActions.tsx` | 🟡 Media | Botones dark |
| `RecentEmployees.tsx` | 🟡 Media | Lista dark |

### Páginas (audit + fixes críticos, ~21 archivos)

| Archivo | Prioridad | Cambios principales |
|---------|-----------|-------------------|
| `pages/main/page.tsx` | 🔴 Alta | Dashboard principal dark |
| `pages/employee/list/page.tsx` | 🔴 Alta | Lista empleados dark |
| `pages/payroll/list/page.tsx` | 🔴 Alta | Lista planillas dark |
| `pages/payroll/[id]/page.tsx` | 🔴 Alta | Detalle planilla dark |
| `pages/payroll/[id]/employees/page.tsx` | 🔴 Alta | Empleados planilla dark |
| `pages/deductions/list/page.tsx` | 🟡 Media | Lista deducciones dark |
| `pages/clocklogs/list/page.tsx` | 🟡 Media | Lista clock logs dark |
| `pages/reports/page.tsx` | 🟡 Media | Reportes dark |
| `pages/users/page.tsx` | 🟡 Media | Users dark |
| `pages/auth/*.tsx` | 🟡 Media | Login dark |
| `pages/vacations/*.tsx` | 🟡 Media | Vacaciones dark |
| `pages/branches/*.tsx` | 🟡 Media | Sucursales dark |
| `pages/attendance/page.tsx` | 🟡 Media | Asistencia dark |
| `pages/configuracion/page.tsx` | 🟡 Media | Configuración dark |
| `pages/payroll-types/*.tsx` | 🟡 Media | Tipos planilla dark |
| `pages/employee-deductions/*.tsx` | 🟡 Media | Deducciones por empleado dark |
| `pages/main/PayrollStatsCards.tsx` | 🟡 Media | Stats dark |
| `pages/main/StatsCards.tsx` | 🟡 Media | Stats dark |

### Archivos ya en buen estado (NO modificar)

- ✅ `layouts/main.tsx` — mobile collapse OK
- ✅ `components/ui/Sidebar.tsx` — dark OK
- ✅ `components/ui/Header.tsx` — dark OK
- ✅ `hooks/useTheme.tsx` — OK
- ✅ `styles/globals.css` — tokens OK

---

## Criterios de Éxito

| # | Criterio | Target |
|---|-----------|--------|
| 1 | Todos los componentes UI base tienen dark mode | Modal, Table, FormModal, ConfirmDialog, StatsCards |
| 2 | Todos los componentes de empleados tienen dark mode | 12+ componentes |
| 3 | Páginas principales tienen dark mode | pages/main, pages/employee/list, pages/payroll/* |
| 4 | UI-04: Validación de formularios tiene feedback visual | Borde rojo/verde + mensaje |
| 5 | UI-05: Logout tiene confirmación | ConfirmDialog antes de cerrar |
| 6 | No hay "islas" de luz en dark mode | 0 colores hardcoded sin dark variant |
| 7 | `npx next lint` pasa | Sin errores nuevos |
| 8 | `npx tsc --noEmit` pasa | Sin errores nuevos |

---

## Plan de Ejecución

### Fase 1: UI Base Components (Sesión 1)

1. **Modal.tsx** — Background, overlay, header, footer dark
2. **Table.tsx** — Headers, rows, hover, empty state, pagination dark
3. **FormModal.tsx** — Inputs dark + validación visual (UI-04)
4. **ConfirmDialog.tsx** — Verificar dark completo
5. **StatsCards.tsx** — Cards dark
6. **EmployeeTabs.tsx** — Tabs dark

### Fase 2: Employee Components (Sesión 1-2)

1. **AddEmployeeModal.tsx** — Form completo dark
2. **EditEmployeeModal.tsx** — Form completo dark
3. **DismissEmployeeModal.tsx** — Form + confirmación dark
4. **EmployeeTable.tsx** — Tabla, badges, pagination dark
5. **EmployeeProfileModal.tsx** — Perfil dark
6. **EmployeeProfileCard.tsx** — Card dark
7. **EmployeeIncidenceCard.tsx** — Card dark
8. **EmployeeAttendanceTable.tsx** — Tabla dark

### Fase 3: Payroll + Dashboard Components (Sesión 2)

1. **PayrollResults.tsx** — 817 líneas — tabla, cards, resultados dark
2. **PayrollCreateModal.tsx** — Form completo dark
3. **PayrollCalendar.tsx** — Calendar dark
4. **DashboardStats.tsx** — Stats dark
5. **QuickActions.tsx** — Botones dark
6. **RecentEmployees.tsx** — Lista dark

### Fase 4: Páginas (Sesión 2-3)

1. **pages/main/page.tsx** — Dashboard principal
2. **pages/employee/list/page.tsx** — Lista empleados
3. **pages/payroll/list/page.tsx** — Lista planillas
4. **pages/payroll/[id]/*.tsx** — Detalles planilla
5. **pages/deductions/list/page.tsx** — Deducciones
6. **pages/clocklogs/list/page.tsx** — Clock logs
7. **pages/reports/page.tsx** — Reportes
8. **pages/users/page.tsx** — Usuarios
9. Resto de páginas (audit + fixes)

### Fase 5: UI-05 Confirmación Logout (Sesión 1)

1. **Sidebar.tsx** — Agregar ConfirmDialog en logout
2. Mensaje: "¿Estás seguro de que deseas cerrar sesión?"
3. Usar ConfirmDialog existente

### Fase 6: Verificación Final (Sesión 3)

1. Ejecutar `npx next lint`
2. Ejecutar `npx tsc --noEmit`
3. Audit visual en todas las páginas
4. Verificar no hay "islas" de luz

---

## Estrategia de Reemplazo de Colores

### Patrones comunes a reemplazar

```typescript
// Fondos
bg-[#FBF8F0]  → dark:bg-zinc-900
bg-[#FCF1D5]   → dark:bg-zinc-800
bg-[#F0E6D2]   → dark:bg-zinc-800
bg-[#E7DCC1]   → dark:bg-zinc-950
bg-[#E0D6B7]   → dark:bg-zinc-800

// Textos
text-[#4A5D3A] → dark:text-zinc-100
text-[#6F7153] → dark:text-zinc-300
text-[#5D614A] → dark:text-zinc-400
text-[#D9C38B] → dark:text-zinc-500

// Bordes
border-[#E0D6B7] → dark:border-zinc-700
border-[#F0EDE5] → dark:border-zinc-700
border-[#D4C89A] → dark:border-zinc-600

// Botones primarios
bg-[#4A5D3A]  → dark:bg-green-600
hover:bg-[#2A3A1A] → dark:hover:bg-green-700
```

### Validación Visual (UI-04)

```tsx
// Input normal
<input className="border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800" />

// Input con error
<input className="border-red-500 dark:border-red-400" />
<span className="text-red-500 dark:text-red-400">Mensaje de error</span>

// Input con éxito
<input className="border-green-500 dark:border-green-400" />
```

---

## Estimación Realista

| Fase | Archivos | Sesiones | Complejidad |
|------|----------|----------|------------|
| 1. UI Base | 6 | 1 | Media |
| 2. Employees | 8 | 1-2 | Media |
| 3. Payroll | 6 | 1 | Media |
| 4. Páginas | ~21 | 1-2 | Baja-Media |
| 5. Logout confirm | 1 | 0.25 | Baja |
| 6. Verificación | — | 0.25 | Baja |

**Total estimado: 3-4 sesiones**

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Inconsistencia entre componentes | Alta | Usar componentes base (Modal, Table) como reference |
| Páginas con estilos inline | Media | Mover a clases o agregar dark: inline |
| Formularios con validation hooks | Media | Mantener lógica, solo cambiar estilos |
| Retrocompatibilidad light mode | Baja | Los cambios son additive (dark:), no removed |

---

## Checklist de Verificación

- [ ] Modal.tsx — overlay, header, body, footer todos dark
- [ ] Table.tsx — headers, rows, hover, empty state
- [ ] FormModal.tsx — inputs, labels, buttons
- [ ] ConfirmDialog.tsx — título, mensaje, botones
- [ ] AddEmployeeModal.tsx — todos los campos
- [ ] EditEmployeeModal.tsx — todos los campos
- [ ] DismissEmployeeModal.tsx — form + confirmación
- [ ] EmployeeTable.tsx — tabla + paginación
- [ ] PayrollResults.tsx — tabla + cards + resultados
- [ ] pages/main/page.tsx — dashboard completo
- [ ] Logout confirmation funciona
- [ ] 0 ESLint errors
- [ ] 0 TypeScript errors

---

*Planned: 2026-03-31*
*Rewritten with full codebase audit*
