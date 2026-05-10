# Documentación del Motor de Cálculo de Planilla

Sistema de planilla para Costa Rica — VP-Planilla v1.7
Referencia técnica para el módulo de cálculo de salarios quincenales.

---

## Índice

1. [Flujo general del cálculo](#1-flujo-general-del-cálculo)
2. [Componentes del salario bruto](#2-componentes-del-salario-bruto)
3. [Feriados — configuración e impacto](#3-feriados--configuración-e-impacto)
4. [Parámetros legales — qué es modificable](#4-parámetros-legales--qué-es-modificable)
5. [Configuración de la empresa — checks globales](#5-configuración-de-la-empresa--checks-globales)
6. [Checks configurables desde la UI](#6-checks-configurables-desde-la-ui)
7. [Política de redondeo de minutos](#7-política-de-redondeo-de-minutos)
8. [Deducciones CCSS](#8-deducciones-ccss)
9. [Ejemplo completo paso a paso](#9-ejemplo-completo-paso-a-paso)
10. [Referencia de funciones](#10-referencia-de-funciones)

---

## 1. Flujo general del cálculo

El cálculo de planilla se inicia desde `NomineeService.calculatePayrollForPeriod()`.
El flujo tiene dos fases: **precarga de datos** (una sola query por tipo) y **cálculo por empleado**.

```
NomineeService.calculatePayrollForPeriod(startDate, endDate, payrollId?)
│
├── PRECARGA (una sola vez para todos los empleados)
│   ├── clockLogsMap      — marcajes de reloj del período
│   ├── vacationsMap      — vacaciones aprobadas
│   ├── laborEventsMap    — eventos laborales (permisos, suspensiones)
│   ├── bonusesMap        — bonificaciones activas del período
│   ├── deductionsMap     — deducciones configuradas
│   ├── positionsMap      — puestos y salarios base
│   ├── holidays[]        — feriados activos del período (vpg_company_holidays)
│   ├── legalParams       — parámetros legales vigentes a startDate (vpg_legal_params)
│   └── enterpriseConfig  — configuración global de la empresa (vpg_enterprise)
│
└── POR CADA EMPLEADO → calculateEmployeePayroll()
    │
    ├── 1. Obtener salario base (desde positionsMap)
    ├── 2. processDailyWork() — construir DayWork[] con horas por día
    ├── 3. Calcular horas programadas (scheduledHours)
    ├── 4. Calcular horas regulares y horas extra
    ├── 5. Calcular pago de descanso semanal
    ├── 6. Calcular pago de horas extra
    ├── 7. Sumar bonificaciones
    ├── 8. calculateGrossSalary() → salario bruto
    ├── 9. getMandatoryHolidayBreakdown() → feriados obligatorios no trabajados
    ├── 10. Calcular deducciones (CCSS + deducciones individuales)
    └── 11. calculateNetSalary() → salario neto
```

### Estructura de un DayWork

Cada día del período se representa como:

```typescript
interface DayWork {
  date: string;        // "YYYY-MM-DD"
  hoursWorked: number; // horas totales del día (incluye sobretiempo)
  isVacation: boolean;
  messages: string[];  // advertencias o inconsistencias del día
}
```

---

## 2. Componentes del salario bruto

El salario bruto se calcula en `calculateGrossSalary()` como la suma de cuatro componentes:

```
Salario Bruto = Pago Regular + Pago Extra + Descanso Semanal + Bonificaciones
```

### 2.1 Pago Regular

Suma de `min(horasDelDía, 8)` por cada día trabajado, con el multiplicador correspondiente:

| Tipo de día | Multiplicador | Base legal |
|---|---|---|
| Día ordinario | 1.0× | CT Art. 136 |
| Feriado obligatorio trabajado | 2.0× (`holidayMandatoryFactor`) | CT Art. 148 |

**Fórmula por día:**
```
pagoRegularDia = min(horasWorked, 8) × tarifaHora × multiplicador
```

**Ejemplo** (tarifa = ₡3,000/hora):
```
Lunes ordinario 8h:   8 × ₡3,000 × 1.0 = ₡24,000
Feriado trabajado 8h: 8 × ₡3,000 × 2.0 = ₡48,000
```

### 2.2 Pago de Horas Extra

Se calcula en `calculateOvertimePay()`.
Las horas extra son las horas por encima de 8h en el mismo día.

El multiplicador **compone** el factor de feriado con el factor de sobretiempo:

```
multiplier = holidayFactor × otFactor
```

| Tipo de día | holidayFactor | otFactor | Multiplicador final |
|---|---|---|---|
| Día ordinario | 1.0 | 1.5 | **1.5×** |
| Feriado obligatorio | 2.0 | 1.5 | **3.0×** |

**Fórmula:**
```
pagoExtra = horasExtra × tarifaHora × multiplier
```

**Ejemplo** (tarifa = ₡3,000/hora):
```
2h extra en día ordinario: 2 × ₡3,000 × 1.5 = ₡9,000
2h extra en feriado:        2 × ₡3,000 × 3.0 = ₡18,000
```

> **Nota:** `holidayTripleFactor` (3.0) existe en la BD como parámetro configurable
> pero actualmente NO se usa en overtime — el 3.0 resulta naturalmente de 2.0 × 1.5.

### 2.3 Descanso Semanal Remunerado

Se calcula en `calculateWeeklyRestPay()` usando la fórmula estándar de la empresa:

```
horasDescanso = (horasRegulares × 8 / 104) × 2
pagoDescanso  = horasDescanso × tarifaHora
```

**Puntos clave:**
- La base `horasRegulares` excluye los días de feriado obligatorio trabajado (ya tienen tratamiento salarial propio en el pago regular).
- El denominador 104 representa el máximo de horas regulares en una quincena estándar (13 días × 8h).
- El resultado es proporcional: si se trabajó menos de 104h, el descanso es menor.

**Ejemplo** (tarifa = ₡3,000/hora, 96h regulares sin feriados):
```
horasDescanso = (96 × 8 / 104) × 2 = 14.77h
pagoDescanso  = 14.77 × ₡3,000     = ₡44,307
```

**Ejemplo** (104h regulares — quincena completa):
```
horasDescanso = (104 × 8 / 104) × 2 = 16h
pagoDescanso  = 16 × ₡3,000          = ₡48,000
```

### 2.4 Bonificaciones

Se suman directamente al bruto. Las bonificaciones son configuradas por empleado en `vpg_employee_bonuses` y pueden ser de monto fijo o porcentual sobre el salario base.

---

## 3. Feriados — configuración e impacto

Los feriados se almacenan en la tabla `vpg_company_holidays`. Cada feriado tiene tres flags que determinan su comportamiento en el cálculo.

### 3.1 Campos del feriado

| Campo | Tipo | Efecto en el cálculo |
|---|---|---|
| `company_holidays_date` | Date | Fecha exacta del feriado |
| `company_holidays_is_mandatory` | Boolean | Activa el régimen de pago obligatorio (Art. 148) |
| `company_holidays_is_triple` | Boolean | Reservado — actualmente no afecta el cálculo (ver nota) |
| `company_holidays_status` | String | Solo feriados `'active'` se consideran |

### 3.2 Comportamiento según is_mandatory

**Feriado NO obligatorio** (`is_mandatory = false`):
- Si no se trabaja: no genera ningún pago adicional.
- Si se trabaja: las horas se pagan a 1.0× (igual que día normal).
- Las horas extra se pagan a 1.5×.

**Feriado obligatorio** (`is_mandatory = true`):

| Escenario | Cálculo | Base legal |
|---|---|---|
| No trabajado | 8h × tarifa × 1.0 (pago base por el día) | CT Art. 148 |
| Trabajado — horas regulares | h × tarifa × 2.0 | CT Art. 148 |
| Trabajado — horas extra | h × tarifa × 3.0 (= 2.0 × 1.5) | CT Art. 139 + 148 |

> El pago de feriado no trabajado depende también del check global
> `enterprise_pay_unworked_holidays` (ver sección 5).

### 3.3 Feriados obligatorios de Costa Rica (estándar)

Los siguientes feriados deben registrarse como `is_mandatory = true`:

| Fecha | Nombre |
|---|---|
| 1° enero | Año Nuevo |
| 11 abril | Juan Santamaría |
| Jueves Santo | Semana Santa |
| Viernes Santo | Semana Santa |
| 1° mayo | Día del Trabajo |
| 25 julio | Guanacaste |
| 2 agosto | Virgen de los Ángeles |
| 15 agosto | Día de la Madre |
| 15 setiembre | Independencia |
| 25 diciembre | Navidad |

### 3.4 Ejemplo: quincena con feriado no trabajado

Período 1–15 abril. El 11 de abril (Juan Santamaría) cae en lunes — empleado no laboró.

Con `payUnworkedHolidays = true`:
```
Pago feriado no trabajado = 8h × ₡3,000 × 1.0 = ₡24,000
(se suma al regularPay en calculateGrossSalary)
```

Con `payUnworkedHolidays = false`:
```
Pago feriado no trabajado = ₡0
(getMandatoryHolidayBreakdown retorna { hours: 0, pay: 0 })
```

---

## 4. Parámetros legales — qué es modificable

Los parámetros legales se almacenan en `vpg_legal_params` con soporte de fechas de vigencia.
El sistema carga el valor vigente a la **fecha de inicio del período** usando:

```
validFrom <= startDate AND isActive = true  →  registro más reciente
```

Esto permite actualizar tasas (ej. cambio de CCSS) y que los períodos históricos calculen con los valores correctos.

### 4.1 Parámetros disponibles

| Clave en BD | Descripción | Valor default | Categoría |
|---|---|---|---|
| `OT_FACTOR` | Multiplicador de horas extra | 1.5 | OVERTIME |
| `HOLIDAY_MANDATORY_FACTOR` | Multiplicador de feriado obligatorio | 2.0 | OVERTIME |
| `HOLIDAY_TRIPLE_FACTOR` | Factor triple (reservado) | 3.0 | OVERTIME |
| `CCSS_OBRERO_SALUD` | Deducción CCSS salud obrero (%) | 5.5 | CCSS |
| `CCSS_OBRERO_PENSION` | Deducción CCSS pensión obrero (%) | 4.33 | CCSS |
| `CCSS_OBRERO_BP` | Deducción Banco Popular obrero (%) | 1.0 | CCSS |
| `GLOBAL_MIN_WAGE_RATE` | Tarifa de referencia salario mínimo | 1529.62 | MIN_WAGE |

### 4.2 Cómo modificar un parámetro

Los parámetros son **insert-only** — nunca se edita un registro existente. Al crear uno nuevo:
1. El registro anterior se cierra automáticamente (`validUntil = newValidFrom - 1 día`).
2. El nuevo registro queda abierto (`validUntil = null`).
3. Períodos anteriores siguen calculando con el valor histórico correcto.

**Ejemplo — actualización de CCSS:**
```
Registro actual:  CCSS_OBRERO_SALUD = 5.5%,  validFrom = 2024-01-01
Nuevo decreto:    CCSS_OBRERO_SALUD = 5.75%, validFrom = 2026-07-01

Resultado en BD:
  id=1: value=5.5,  validFrom=2024-01-01, validUntil=2026-06-30  (cerrado automáticamente)
  id=2: value=5.75, validFrom=2026-07-01, validUntil=null         (vigente)
```

### 4.3 Parámetros hardcodeados (NO en BD)

| Parámetro | Valor | Motivo |
|---|---|---|
| `regularHoursPerDay` | 8h | Pendiente Phase 66 (Jornadas) |
| `regularHoursPerWeek` | 48h | Pendiente Phase 66 |

---

## 5. Configuración de la empresa — checks globales

La tabla `vpg_enterprise` contiene configuraciones que afectan el comportamiento global del cálculo.

### 5.1 enterprise_pay_unworked_holidays

**Tipo:** Boolean | **Default:** `true`

Controla si los feriados de pago obligatorio **no trabajados** generan pago.

| Valor | Comportamiento |
|---|---|
| `true` (default) | Feriados obligatorios no trabajados → 8h × tarifa por cada feriado. Cumple estándar CT Art. 148. |
| `false` | Feriados no trabajados → ₡0. El empleador acepta el riesgo legal. |

**Alcance:** Solo afecta a `getMandatoryHolidayBreakdown()`.
**No afecta:** Los días de feriado que SÍ se trabajaron siempre se pagan con el multiplicador correspondiente (2.0× o 3.0× en extra), independientemente de este check.

**Ejemplo con tarifa ₡3,000/hora y 2 feriados obligatorios no trabajados:**
```
payUnworkedHolidays = true:
  pago = 2 × 8h × ₡3,000 = ₡48,000

payUnworkedHolidays = false:
  pago = ₡0
```

### 5.2 enterprise_minute_rounding_policy

**Tipo:** Enum | **Default:** `EXACT`

Define cómo se redondean los minutos al convertir marcajes a horas.

| Valor | Comportamiento |
|---|---|
| `EXACT` | Sin redondeo — minutos proporcionales exactos (ej. 7:45h = 7.75h) |
| `ALWAYS_UP` | Redondea al cuarto de hora superior (ej. 7:46h → 8.0h) |
| `NEAREST_QUARTER` | Redondea al cuarto de hora más cercano (ej. 7:46h → 7.75h, 7:52h → 8.0h) |

**Cómo afecta el cálculo:** Se aplica en `applyMinuteRounding()` al procesar cada par de marcajes IN/OUT. Un redondeo más generoso incrementa las horas declaradas y por ende el salario.

**Ejemplo:**
```
Empleado marcó: 08:00 IN — 17:07 OUT  →  547 minutos trabajados

EXACT:            547 / 60 = 9.117h
ALWAYS_UP:        ceil(547/15) × 15 / 60 = 9.25h
NEAREST_QUARTER:  round(547/15) × 15 / 60 = 9.25h
```

### 5.3 enterprise_is_commercial_activity

**Tipo:** Boolean | **Default:** `true`

Indica si la empresa es una actividad comercial. Actualmente es un campo de datos; la lógica de jornadas diferenciadas (Art. 136 CT) quedará implementada en Phase 66.

### 5.4 enterprise_ordinary_shift_type

**Tipo:** Enum (`DIURNA` | `NOCTURNA` | `MIXTA`) | **Default:** `DIURNA`

Tipo de jornada ordinaria de la empresa. Se usará en Phase 66 para calcular las horas ordinarias máximas según jornada (diurna: 8h, nocturna: 6h, mixta: 7h).

---

## 6. Checks configurables desde la UI

Ruta en el sistema: **Configuración → Empresa** (`/pages/configuracion/empresa`)

Esta pantalla expone exactamente 5 controles que el administrador puede modificar sin tocar la base de datos directamente. Se dividen en dos grupos según cómo se guardan.

---

### Grupo A — Se guardan con el botón "Guardar Cambios"

Estos cuatro controles se envían juntos a `PATCH /enterprise/config` al presionar el botón.
El botón está deshabilitado si no hay cambios pendientes (`isDirty = false`).

---

#### Check 1 — Política de Redondeo de Minutos

**Tipo:** Select (3 opciones)
**Campo:** `enterprise_minute_rounding_policy`
**Tabla:** `vpg_enterprise`

| Opción visible | Valor interno | Comportamiento |
|---|---|---|
| Modalidad A: Proporcional Exacto | `EXACT` | Minutos se pagan exactamente como se trabajan |
| Modalidad B: Cuarto de hora superior siempre | `ALWAYS_UP` | Cualquier fracción sube al cuarto siguiente |
| Modalidad C: Cuarto más cercano (Bi-direccional) | `NEAREST_QUARTER` | Regla de los 8 minutos — puede descartar minutos |

**Comportamiento especial al seleccionar Modalidad C:**
- Aparece una advertencia amarilla en pantalla.
- Al intentar guardar, se bloquea el guardado y se abre el modal `LegalRoundingModal`.
- El usuario debe confirmar el descargo legal explícitamente.
- Al confirmar, se activa `enterprise_rounding_policy_acknowledged = true` y se guarda.
- Si el usuario cancela, el select vuelve a la política anterior sin guardar nada.
- Si en el futuro se cambia a otra modalidad, `acknowledged` se resetea a `false` automáticamente.

**Impacto en el cálculo:** Afecta `applyMinuteRounding()`. Un empleado que marcó 8h 1min:
```
EXACT:   8.017h  → sin horas extra
ALWAYS_UP: 8.25h → 0.25h extra × tarifa × 1.5
NEAREST_QUARTER: 8.0h → sin horas extra (1 min no llega al cuarto)
```

---

#### Check 2 — Jornada Ordinaria

**Tipo:** Select (3 opciones)
**Campo:** `enterprise_ordinary_shift_type`
**Tabla:** `vpg_enterprise`

| Opción | Valor | Horas ordinarias diarias |
|---|---|---|
| DIURNA | `DIURNA` | 8h |
| MIXTA | `MIXTA` | 7h |
| NOCTURNA | `NOCTURNA` | 6h |

**Estado actual:** Este campo se guarda pero aún no afecta el cálculo de horas.
La lógica de jornadas diferenciadas se implementará en Phase 66 (Jornadas).
El sistema actualmente usa 8h/día de forma fija.

---

#### Check 3 — Actividad Comercial

**Tipo:** Checkbox (toggle)
**Campo:** `enterprise_is_commercial_activity`
**Tabla:** `vpg_enterprise`

| Estado | Significado |
|---|---|
| Activado (default) | Empresa de actividad comercial → descanso semanal remunerado obligatorio |
| Desactivado | Empresa no comercial |

**Estado actual:** El campo se guarda. La lógica que diferencia el cálculo del descanso semanal según tipo de actividad se activará en Phase 66.

---

#### Check 4 — Pago de Feriados No Trabajados

**Tipo:** Checkbox (toggle)
**Campo:** `enterprise_pay_unworked_holidays`
**Tabla:** `vpg_enterprise`

| Estado | Efecto en el cálculo | Riesgo |
|---|---|---|
| Activado (default, recomendado) | Feriados obligatorios no trabajados → 8h × tarifa por cada feriado | Ninguno — cumple CT Art. 148 |
| Desactivado | Feriados no trabajados → ₡0 | Riesgo legal — el empleador asume responsabilidad |

**Comportamiento especial al desactivar:**
- Al quitar el check, el valor se cambia inmediatamente a `false` en el formulario.
- Se abre el modal `LegalArt148Modal` con el texto del descargo de responsabilidades.
- Si el usuario confirma: el check queda en `false`, listo para guardar con "Guardar Cambios".
- Si el usuario cancela: el check vuelve a `true` automáticamente.

**Impacto en el cálculo:** Controla `params.payUnworkedHolidays` en `getMandatoryHolidayBreakdown()`.
Los feriados que SÍ se trabajaron siempre se pagan con el multiplicador correspondiente — este check NO los afecta.

---

### Grupo B — Se guardan automáticamente al cambiar

Este control tiene su propio mecanismo de guardado independiente del botón principal.

---

#### Check 5 — Validación de Salario Mínimo

**Tipo:** Checkbox (toggle)
**Campo:** `MIN_WAGE_CHECK_ENABLED` en `vpg_legal_params`
**Tabla:** `vpg_legal_params` (no en `vpg_enterprise`)

| Estado | Efecto |
|---|---|
| Activado | En el wizard de planilla, los empleados con tarifa por hora < `GLOBAL_MIN_WAGE_RATE` muestran una advertencia visual. El cálculo NO se bloquea — solo es informativo. |
| Desactivado (default) | No se muestran advertencias de salario mínimo. |

**Comportamiento especial:**
- Se guarda **inmediatamente** al hacer toggle, sin necesidad de presionar "Guardar Cambios".
- No tiene modal de confirmación.
- Usa `LegalParamService.updateParam('MIN_WAGE_CHECK_ENABLED', 1 | 0)` directamente.
- El valor de referencia (`GLOBAL_MIN_WAGE_RATE`) es un parámetro legal separado configurable en `vpg_legal_params`.

**Dónde se evalúa:** En el wizard de planilla (`/pages/payroll/wizard`), al renderizar la lista de empleados:
```typescript
const isLowWage = minWageCheckEnabled === 1 &&
  Math.round(hourlySalary * 100) / 100 < Math.round(threshold * 100) / 100;
```
Si `isLowWage = true`, el empleado aparece marcado visualmente pero se incluye normalmente en el cálculo.

---

### Resumen de checks y su alcance

| # | Control | Dónde se guarda | Modal de descargo | Impacto en cálculo | Estado |
|---|---|---|---|---|---|
| 1 | Redondeo de minutos | `vpg_enterprise` | Sí (Modalidad C) | Sí — `applyMinuteRounding()` | Activo |
| 2 | Jornada Ordinaria | `vpg_enterprise` | No | No (Phase 66) | Parcial |
| 3 | Actividad Comercial | `vpg_enterprise` | No | No (Phase 66) | Parcial |
| 4 | Feriados no trabajados | `vpg_enterprise` | Sí (Art. 148) | Sí — `getMandatoryHolidayBreakdown()` | Activo |
| 5 | Validación salario mínimo | `vpg_legal_params` | No | No (solo visual) | Activo |

---

## 7. Política de redondeo de minutos — detalle técnico

La política se aplica en `applyMinuteRounding(totalMinutes, policy)`.

### Casos borde importantes

| Minutos | EXACT | ALWAYS_UP | NEAREST_QUARTER |
|---|---|---|---|
| 480 (8:00h exactas) | 8.0h | 8.0h | 8.0h |
| 481 (8h 1min) | 8.017h | 8.25h | 8.0h |
| 488 (8h 8min) | 8.133h | 8.25h | 8.25h |
| 495 (8h 15min) | 8.25h | 8.25h | 8.25h |
| 497 (8h 17min) | 8.283h | 8.5h | 8.25h |
| 510 (8h 30min) | 8.5h | 8.5h | 8.5h |

### Impacto en overtime

Con `ALWAYS_UP`, un empleado que marcó 8h 1min será registrado con 8.25h → genera 0.25h de overtime (₡0.25 × tarifa × 1.5). Con `EXACT`, solo se paga el minuto proporcional.

---

## 8. Deducciones CCSS

Las deducciones CCSS del obrero se calculan sobre el **salario bruto**:

| Deducción | Clave | Porcentaje default |
|---|---|---|
| Seguro de Salud | `CCSS_OBRERO_SALUD` | 5.50% |
| Pensión (IVM) | `CCSS_OBRERO_PENSION` | 4.33% |
| Banco Popular | `CCSS_OBRERO_BP` | 1.00% |
| **Total obrero** | | **10.83%** |

**Fórmula:**
```
deduccionCCSS = salárioBruto × (5.5 + 4.33 + 1.0) / 100
             = salárioBruto × 0.1083
```

Adicionalmente, cada empleado puede tener deducciones individuales configuradas en `vpg_employee_deductions` (monto fijo o porcentual).

**Salario neto:**
```
salarioNeto = max(0, salárioBruto - totalDeducciones)
```

El salario neto nunca puede ser negativo.

---

## 9. Ejemplo completo paso a paso

**Escenario:** Período quincenal del 1 al 15 de mayo 2026.
El 1° de mayo es feriado de pago obligatorio (Día del Trabajo).
Tarifa base: ₡3,000/hora.

**Días trabajados:**
- 10 días ordinarios × 8h cada uno
- 2 días con sobretiempo × 10h cada uno (8h + 2h extra)
- 1 de mayo (feriado obligatorio) trabajado × 10h (8h ordinarias + 2h extra)

---

### Paso 1 — Pago regular días ordinarios

```
10 días × 8h × ₡3,000 × 1.0 = ₡240,000
```

### Paso 2 — Pago regular de los días con sobretiempo (primeras 8h)

```
2 días × 8h × ₡3,000 × 1.0 = ₡48,000
```

### Paso 3 — Pago regular del feriado trabajado (primeras 8h)

```
1 feriado × 8h × ₡3,000 × 2.0 = ₡48,000
```

### Paso 4 — Horas extra días ordinarios

```
2 días × 2h × ₡3,000 × (1.0 × 1.5) = ₡18,000
```

### Paso 5 — Horas extra del feriado

```
2h × ₡3,000 × (2.0 × 1.5) = 2h × ₡3,000 × 3.0 = ₡18,000
```

### Paso 6 — Descanso semanal remunerado

Base de horas regulares (excluye el feriado):
```
10 días × 8h + 2 días × 8h = 96h
```

```
horasDescanso = (96 × 8 / 104) × 2 = 14.77h
pagoDescanso  = 14.77h × ₡3,000    = ₡44,307
```

### Paso 7 — Feriados obligatorios no trabajados

El 1° de mayo fue trabajado → no genera pago adicional por "no trabajado".
Si hubiera otro feriado obligatorio no trabajado en el período:
```
pagoFeriado = 8h × ₡3,000 × 1.0 = ₡24,000  (si payUnworkedHolidays = true)
pagoFeriado = ₡0                               (si payUnworkedHolidays = false)
```

### Resumen del salario bruto

| Componente | Monto |
|---|---|
| Ordinarias (10 días) | ₡240,000 |
| Ordinarias (días con OT) | ₡48,000 |
| Ordinarias feriado (×2.0) | ₡48,000 |
| Extra días ordinarios (×1.5) | ₡18,000 |
| Extra feriado (×3.0) | ₡18,000 |
| Descanso semanal | ₡44,307 |
| **Salario Bruto** | **₡416,307** |

### Paso 8 — Deducciones CCSS

```
CCSS Salud:   ₡416,307 × 5.50%  = ₡22,897
CCSS Pensión: ₡416,307 × 4.33%  = ₡18,026
Banco Popular: ₡416,307 × 1.00% = ₡4,163
Total CCSS:                        ₡45,086
```

### Paso 9 — Salario neto

```
Salario Neto = ₡416,307 - ₡45,086 = ₡371,221
```

---

## 10. Referencia de funciones

Todas las funciones de cálculo son puras y residen en `src/backend/src/utils/payrollUtils.ts`.

| Función | Descripción | Inputs clave |
|---|---|---|
| `calculateRegularHours(days, params)` | Suma `min(h, 8)` por día (todos los días, incluye feriados). Usado para display. | `DayWork[]` |
| `calculateOvertimeHours(days, params)` | Suma `max(0, h - 8)` por día. | `DayWork[]` |
| `calculateOvertimeHoursBiweekly(worked, required)` | OT quincenal: `max(0, worked - required)`. | números |
| `calculateWeeklyRestHours(regularHours, start, end)` | `(h × 8 / 104) × 2`. | horas base (sin feriados) |
| `calculateWeeklyRestPay(days, rate, start, end, params)` | Pago de descanso semanal. | `DayWork[]` sin feriados |
| `calculateOvertimePay(days, rate, holidays, params)` | Pago OT con factor de feriado compuesto. | `DayWork[]`, `PayrollHoliday[]` |
| `getMandatoryHolidayBreakdown(days, rate, start, end, holidays, params)` | Horas/pago de feriados obligatorios no trabajados. Respeta `payUnworkedHolidays`. | `DayWork[]`, `PayrollHoliday[]` |
| `calculateGrossSalary(days, rate, bonuses, start, end, holidays, params)` | Salario bruto completo. Filtra feriados de la base de descanso. | Todo |
| `calculateNetSalary(gross, deductions)` | `max(0, gross - deductions)` | números |
| `applyMinuteRounding(minutes, policy)` | Convierte minutos a horas según política. | minutos, `MinuteRoundingPolicy` |
| `roundToMoney(amount)` | Redondea a 2 decimales. | número |

### Jerarquía de configuración

```
vpg_legal_params (BD, con vigencia por fecha)
  └── OT_FACTOR, HOLIDAY_MANDATORY_FACTOR, CCSS_*, GLOBAL_MIN_WAGE_RATE
      └── Cargados por LegalParamService.getParamSetAtDate(startDate)

vpg_enterprise (BD, global)
  ├── enterprise_pay_unworked_holidays  → legalParams.payUnworkedHolidays
  └── enterprise_minute_rounding_policy → legalParams.minuteRoundingPolicy

vpg_company_holidays (BD, por feriado)
  ├── is_mandatory → activa multiplicador 2.0 y pago de no-trabajados
  └── is_triple    → reservado

DEFAULT_LEGAL_PARAMS (hardcoded en payrollUtils.ts)
  └── Fallback si no se llama LegalParamService (solo en tests unitarios)
```

---

*Generado: 2026-04-28 — VP-Planilla v1.7*
*Archivo fuente principal: `src/backend/src/utils/payrollUtils.ts`*
*Orquestador: `src/backend/src/service/NomineeService.ts`*
