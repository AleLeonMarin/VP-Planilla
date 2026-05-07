# VP-Planilla — Descripción Completa del Sistema

Sistema de gestión de planilla para Costa Rica, con cumplimiento del Código de Trabajo y regulaciones de CCSS y Ministerio de Hacienda.

---

## Índice

1. [Arquitectura General](#1-arquitectura-general)
2. [Autenticación y Usuarios](#2-autenticación-y-usuarios)
3. [Configuración de la Empresa](#3-configuración-de-la-empresa)
4. [Catálogos Base](#4-catálogos-base)
5. [Gestión de Empleados](#5-gestión-de-empleados)
6. [Marcas de Reloj (Clock Logs)](#6-marcas-de-reloj-clock-logs)
7. [Ajustes de Marcas](#7-ajustes-de-marcas)
8. [Vacaciones](#8-vacaciones)
9. [Eventos Laborales](#9-eventos-laborales)
10. [Deducciones](#10-deducciones)
11. [Bonos](#11-bonos)
12. [Planilla — Ciclo de Vida Completo](#12-planilla--ciclo-de-vida-completo)
13. [Cálculo de Planilla — Motor Central](#13-cálculo-de-planilla--motor-central)
14. [Ajuste Manual de Planilla](#14-ajuste-manual-de-planilla)
15. [Aguinaldo](#15-aguinaldo)
16. [Comprobantes de Pago](#16-comprobantes-de-pago)
17. [Reportes](#17-reportes)
18. [Bitácora de Auditoría](#18-bitácora-de-auditoría)
19. [Notificaciones](#19-notificaciones)
20. [Parámetros Legales](#20-parámetros-legales)
21. [Feriados de la Empresa](#21-feriados-de-la-empresa)
22. [Ventanas de Tiempo y Confirmaciones](#22-ventanas-de-tiempo-y-confirmaciones)
23. [Flujo End-to-End de un Período de Planilla](#23-flujo-end-to-end-de-un-período-de-planilla)

---

## 1. Arquitectura General

```
Backend  (Express 5 + TypeScript + Prisma + PostgreSQL)  — puerto 3001
Frontend (Next.js 15 + React 19 + Tailwind 4)           — puerto 3000
```

**Capas estrictas:**

```
Backend:   Route → Controller → Service → Prisma (PostgreSQL)
Frontend:  Page → Hook → Service → http.ts → Backend API
```

Todas las tablas llevan el prefijo `vpg_`. Todos los endpoints requieren JWT salvo los de autenticación.

---

## 2. Autenticación y Usuarios

### Autenticación

- Login con `username` + `password` (bcrypt).
- Emite **access token** (JWT de corta duración) y **refresh token** (larga duración).
- Los tokens se guardan en `localStorage` bajo las claves `vp_access_token` / `vp_refresh_token`.
- `http.ts` renueva el access token automáticamente cuando expira (intercept 401).
- Logout invalida el token insertándolo en `vpg_token_blocklist`.
- **Cambio de contraseña:** el usuario recibe un código de 6 dígitos por email; válido 15 minutos, un solo uso (tabla `vpg_password_change_request`).

### Roles del Sistema

| Rol | Label | Capacidades |
|---|---|---|
| `admin` | Administrador | Acceso total, usuarios, catálogos, planillas, reportes |
| `supervisor` | Supervisor | Vacaciones, deducciones, bonos, reportes, auditoría básica |
| `analyst` | Analista de Nómina | Procesar períodos, cargar marcas, generar reportes CCSS/Hacienda |
| `viewer` | Consulta | Solo lectura de módulos operativos |

Los permisos son descriptivos (mostrados en UI); la lógica de acceso real se basa en el rol asignado al usuario. Un `admin` puede cambiar el rol de cualquier usuario y la acción queda en auditoría.

---

## 3. Configuración de la Empresa

Tabla `vpg_enterprise`. Una sola fila con los parámetros globales que afectan el cálculo de planilla:

| Campo | Descripción | Impacto |
|---|---|---|
| `enterprise_minute_rounding_policy` | `EXACT`, `ALWAYS_UP`, `NEAREST_QUARTER` | Redondeo de minutos en horas trabajadas |
| `enterprise_ordinary_shift_type` | `DIURNA`, `MIXTA`, `NOCTURNA` | Jornada por defecto de todos los empleados |
| `enterprise_is_commercial_activity` | booleano | Clasificación de actividad comercial |
| `enterprise_pay_unworked_holidays` | booleano | Si se pagan feriados no laborados |
| `enterprise_aguinaldo_period_start_month/day` | int | Inicio del período fiscal para aguinaldo |
| `enterprise_aguinaldo_payment_deadline_day` | int | Día límite de pago de aguinaldo |
| `enterprise_rounding_policy_acknowledged` | booleano | Confirma que el usuario leyó el aviso de redondeo |

---

## 4. Catálogos Base

### Posiciones (`vpg_positions`)

Cada posición tiene:
- `position_name` — nombre del puesto.
- `position_description` — descripción.
- `position_base_salary` — **salario base por hora** (Decimal 10,2). Este es el valor que el motor de planilla usa para todos los cálculos de pago del empleado asignado a esa posición.

Los empleados se asignan a una sola posición. Si el salario de la posición cambia, afecta el cálculo de la siguiente planilla.

### Sucursales (`vpg_branches`)

- `branch_name`, `branch_location`.
- Ligadas a la empresa via `vpg_enterprise_branch` (relación N:N).
- Ligadas a empleados via `vpg_branch_employee`.

### Tipos de Planilla (`vpg_payroll_types`)

Catálogo de tipos de períodos de pago: Quincenal, Mensual, Rango Libre, etc. Cada planilla referencia un tipo.

---

## 5. Gestión de Empleados

Tabla `vpg_employees`. Un empleado tiene:

| Campo | Descripción |
|---|---|
| `employee_first/middle/last_name` | Nombre completo |
| `employee_national_id` | Cédula de identidad |
| `employee_social_code` | Código de seguridad social (CCSS) |
| `employee_email` / `employee_phone` | Contacto |
| `employee_position_id` | Posición asignada (salario base) |
| `employee_hire_date` | Fecha de contratación |
| `employee_exit_date` | Fecha de salida (null si activo) |
| `employee_fired` | Bandera de despido |
| `employee_status` | `A`=activo, `V`=vacación, `I`=asistencia incompleta, `M`=incapacidad/maternidad |
| `employee_shift_type` | `USE_ENTERPRISE_DEFAULT`, `DIURNA`, `MIXTA`, `NOCTURNA` |
| `employee_required_hours_biweekly` | Horas requeridas por quincena (override del default) |
| `employee_gender` | Género |

### Creación de un Empleado

1. Ir a **Empleados → Lista → Crear**.
2. Ingresar nombre, cédula, código CCSS, email, posición, fecha de contratación, tipo de jornada.
3. El sistema asigna `status = 'A'` por defecto.

### Edición

- Se puede modificar posición, datos de contacto, jornada, horas requeridas quincenales.
- El campo `employee_version` incrementa en cada actualización (optimistic locking).

### Desvinculación

- Se registra `employee_exit_date` y se activa `employee_fired = true`.
- El empleado deja de incluirse en planillas futuras (filtrado por `getActiveEmployeesForPeriod`).

### Alias de Reloj (`vpg_clock_aliases`)

Los empleados pueden tener **múltiples alias** que representan cómo aparecen sus nombres en el reloj de marcaje físico. Esto permite que el importador Java/Excel encuentre al empleado aunque el reloj use un nombre diferente al del sistema.

---

## 6. Marcas de Reloj (Clock Logs)

Tabla `vpg_clock_logs`. Cada registro es una marca individual de entrada o salida.

### Campos Clave

| Campo | Valores posibles | Descripción |
|---|---|---|
| `clock_logs_log_type` | `IN` / `OUT` | Tipo de marca |
| `clock_logs_status` | `pending`, `valid`, `anomaly`, `corrected`, `orphan` | Estado de la marca |
| `clock_logs_source` | `java_import`, `excel_import`, `manual`, `device` | Origen |
| `clock_logs_import_session_id` | int? | Sesión de importación que la originó |

### Fuentes de Importación

#### A. Importación desde Java Parser

El sistema tiene un parser Java (`src/Java/`) que lee archivos de log del reloj físico. El resultado se importa al backend que:
1. Crea una **sesión de importación** (`vpg_clock_import_sessions`) con estado `pending`.
2. Inserta las marcas con `status = 'pending'`.
3. Ejecuta el **análisis post-importación** (ver abajo).
4. Cierra la sesión con estadísticas (total, creadas, omitidas, anomalías).

El campo `clock_logs_import_session_id` vincula cada marca a su sesión de origen para trazabilidad.

#### B. Importación desde Excel

Mismo flujo que Java, con fuente `excel_import`. El usuario sube un archivo Excel con columnas de empleado, timestamp y tipo de marca.

#### C. Marca Manual

Un administrador o analista puede agregar una marca manual directamente desde la UI (módulo Clock Logs). Requiere:
- Empleado
- Timestamp exacto
- Tipo (`IN`/`OUT`)
- Justificación (texto)

La marca manual se crea con `status = 'valid'` y genera un registro de auditoría automáticamente.

### Análisis Post-Importación (`ClockLogAnalysisService`)

Luego de cada importación, el sistema corre cuatro detectores **en memoria** (sin N+1 queries) sobre las marcas `pending` de la sesión:

| Detector | Qué detecta | Resultado |
|---|---|---|
| **Orphan** | Marca IN sin OUT correspondiente en 24h, o OUT sin IN previo en 24h | `status = 'orphan'` |
| **Double Entry** | Dos IN consecutivos del mismo empleado sin OUT entre ellos | `status = 'anomaly'` |
| **Double Exit** | Dos OUT consecutivos del mismo empleado sin IN entre ellos | `status = 'anomaly'` |
| **Long Session** | Par IN→OUT con duración mayor a 16 horas | `status = 'anomaly'` |

El orden de precedencia es: Orphan → Double Entry → Double Exit → Long Session. Las marcas que superan todos los filtros quedan en `status = 'valid'`.

### Panel de Sesiones de Importación

Desde la UI se puede ver el historial de sesiones con:
- Fecha de inicio/fin.
- Fuente (java/excel).
- Contadores: total, creadas, omitidas, anomalías.
- Estado de la sesión.

### Resolución de Huérfanas

Para una marca con `status = 'orphan'`:
- **Asignar complemento:** se crea una marca manual del tipo opuesto (IN↔OUT) con timestamp y justificación. Ambas quedan en `valid`.
- **Descartar:** la marca se marca como `corrected` con la justificación en remarks.

---

## 7. Ajustes de Marcas

Tabla `vpg_clock_log_adjustments`. El sistema de ajustes es **no destructivo**: nunca borra ni modifica las marcas originales. En cambio, crea registros de ajuste que el sistema aplica al calcular las marcas efectivas.

### Tipos de Ajuste

| Tipo | Descripción |
|---|---|
| `ADD` | Agregar una marca nueva que no existe en el sistema |
| `EDIT` | Cambiar el timestamp de una marca existente |
| `VOID` | Anular una marca existente (dejarla sin efecto) |

### Validaciones

- La **justificación** debe tener al menos 10 caracteres.
- El sistema verifica el **bloqueo de planilla**: si el timestamp afectado cae dentro de una planilla con estado `PAGADA`, el ajuste es rechazado.
- Cada ajuste registra quién lo creó (`adjustment_created_by`) y cuándo.

### Marcas Efectivas (`ClockLogEffectiveService`)

Al calcular la planilla, el motor NO usa las marcas crudas. Usa las **marcas efectivas**, que son:
- Todas las marcas `valid` del período.
- Con los ajustes `ACTIVE` aplicados: EDITs cambian el timestamp, VOIDs excluyen la marca, ADDs agregan marks nuevas.

Esto garantiza que cualquier corrección hecha después de una importación se refleja en el próximo cálculo de planilla sin alterar el historial.

---

## 8. Vacaciones

Tabla `vpg_vacations`. Registra períodos de vacaciones por empleado.

| Campo | Descripción |
|---|---|
| `vacations_start_date` / `vacations_end_date` | Rango del período |
| `vacations_total_days` | Calculado automáticamente por PostgreSQL: `(end - start) + 1` |
| `vacations_paid` | Si las vacaciones son pagas (default: true) |
| `vacations_status` | `Aprobado`, `Pendiente`, etc. |

### Impacto en Planilla

Durante el cálculo de planilla, por cada día del período se verifica si cae en una vacación **paga**. Si es así:
- `isVacation = true`
- `hoursWorked = regularHoursPerDay` (según jornada del empleado)
- No se procesan marcas de reloj para ese día.
- Si hubiera marcas ese día de todas formas, se genera un mensaje de advertencia y se prioriza la vacación.

---

## 9. Eventos Laborales

Tabla `vpg_employee_labor_event` + catálogo `vpg_labor_events`.

Los eventos laborales cubren ausencias justificadas distintas a vacaciones: incapacidades, suspensiones, licencias de maternidad, etc.

Cada evento tiene:
- Referencia al catálogo (`vpg_labor_events`: nombre + descripción).
- `employee_labor_event_start_date` y `employee_labor_event_end_date` (puede ser abierto).
- `employee_labor_event_status` — activo, cerrado, etc.

### Impacto en Planilla

Si un día del período está cubierto por un evento laboral activo:
- `hoursWorked = 0` (no se espera marcaje).
- Se genera un mensaje descriptivo con el nombre del evento.
- No se procesa ninguna marca de reloj para ese día.

---

## 10. Deducciones

El sistema maneja deducciones en dos niveles:

### A. Catálogo Global (`vpg_deductions`)

Define los tipos de deducción disponibles:
- `deductions_name` — nombre (ej: "CCSS Obrero Salud").
- `deductions_description` — descripción.
- `deductions_percentage` — porcentaje del salario bruto (ej: 5.5 para CCSS).
- `deductions_fixed_amount` — monto fijo en colones.

Una deducción puede ser **porcentual** O de **monto fijo**, no ambas.

### B. Deducciones por Empleado (`vpg_deductions_per_employee`)

Asigna deducciones del catálogo a empleados específicos. Esta es la tabla que el motor de planilla consulta para saber qué deducciones aplicar a cada empleado.

**Flujo para asignar una deducción:**
1. Ir a **Deducciones por Empleado**.
2. Seleccionar empleado y deducción del catálogo.
3. Guardar la asignación.

Desde ese momento, en cada planilla que incluya al empleado, esa deducción se aplicará automáticamente.

### C. Historial de Deducciones (`vpg_employee_deductions`)

Almacena el monto real deducido por empleado por cada planilla procesada. Clave compuesta: `(employee_id, deduction_id, payroll_id)`.

Permite auditar exactamente cuánto se dedujo a quién en cada período, incluyendo año y mes.

---

## 11. Bonos

Tabla `vpg_bonuses`. Los bonos son montos adicionales al salario, ligados a un empleado y una planilla específica.

| Campo | Descripción |
|---|---|
| `bonuses_employee_id` | Empleado beneficiado |
| `bonuses_payroll_id` | Planilla a la que pertenece |
| `bonuses_year` / `bonuses_month` | Período del bono |
| `bonuses_description` | Descripción del bono (ej: "Bono de desempeño Q1") |
| `bonuses_amount` | Monto en colones |
| `bonuses_granted_at` | Fecha de otorgamiento |

Los bonos se suman al salario bruto durante el cálculo de planilla. El motor los preloea por rango de fechas (`bonuses_granted_at` dentro del período).

---

## 12. Planilla — Ciclo de Vida Completo

### Estados de una Planilla

```
BORRADOR  →  APROBADA  →  PAGADA
              ↓
          (puede reabrirse a BORRADOR con razón documentada)
```

| Estado | Descripción |
|---|---|
| `BORRADOR` | Editable, puede recalcularse |
| `APROBADA` | Bloqueada para edición de marcas en ese período; aprobada por usuario con registro de fecha |
| `PAGADA` | Completamente bloqueada; las marcas del período ya no pueden ajustarse |

### Creación de una Planilla

1. Ir a **Planilla → Crear**.
2. Seleccionar **tipo de planilla** (quincenal, mensual, etc.).
3. Definir **fecha inicio**, **fecha fin** y **fecha de pago**.
4. La planilla se crea en estado `BORRADOR`.

La planilla puede configurarse con un **tipo de período**: `quincenal`, `mensual` o `rango_libre`.

### Reapertura

Si una planilla `APROBADA` necesita correcciones:
- Se registra `payrolls_reopened_at` y `payrolls_reopen_reason`.
- Vuelve a `BORRADOR`.
- El campo de ajuste manual de empleados se preserva.

### Snapshot de Parámetros Legales (`vpgPayrollParamSnapshot`)

Al aprobar una planilla, el sistema guarda un **snapshot** de los parámetros legales vigentes en ese momento (tasas CCSS, factores de horas extra, etc.). Esto garantiza reproducibilidad histórica: siempre se sabe con qué parámetros se calculó cada planilla.

### Historial de Recálculos (`vpg_payroll_recalculations`)

Cada vez que se recalcula una planilla ya guardada, se almacena un registro con:
- Razón del recálculo.
- Timestamp.
- Usuario que lo ejecutó.
- Snapshot JSON de los datos anteriores.

---

## 13. Cálculo de Planilla — Motor Central

El motor vive en `NomineeService.calculatePayrollForPeriod()`. Se puede invocar para:
- **Todos los empleados activos** del período.
- **Empleados seleccionados** (subset por IDs).

### Paso 1 — Precarga de Datos (N+1 Prevention)

El motor carga **una vez** todos los datos necesarios antes del loop de empleados:

```
clockLogsMap    → marcas efectivas por empleado (con ajustes aplicados)
vacationsMap    → vacaciones pagas
laborEventsMap  → eventos laborales activos en el período
bonusesMap      → bonos otorgados en el período
deductionsMap   → deducciones asignadas por empleado (con definición completa)
positionsMap    → posiciones y sus salarios base
holidays        → feriados activos en el período
legalParamMap   → parámetros legales para DIURNA, MIXTA y NOCTURNA
enterpriseConfig → configuración de jornada y pago de feriados
```

### Paso 2 — Por Cada Empleado

Para cada empleado se resuelve:

1. **Jornada efectiva:** si el empleado tiene `USE_ENTERPRISE_DEFAULT`, se usa la jornada de la empresa; de lo contrario, la individual.

2. **Parámetros legales:** se selecciona el set de parámetros correspondiente a la jornada efectiva (`DIURNA`/`MIXTA`/`NOCTURNA`).

3. **Salario base por hora:** tomado de la posición del empleado.

4. **Proceso diario:** por cada día del período se evalúa (en orden de prioridad):
   - ¿Es día de vacación paga? → `hoursWorked = regularHoursPerDay`, sin marcas.
   - ¿Hay evento laboral activo? → `hoursWorked = 0`, sin marcas.
   - ¿Hay marcas de reloj? → se calculan las horas por pares IN→OUT.
   - Sin marcas: `hoursWorked = 0` (fin de semana, día libre, ausencia).

5. **Redondeo de minutos:** según la política configurada en la empresa (`EXACT`, `ALWAYS_UP`, `NEAREST_QUARTER`).

### Paso 3 — Cálculo de Horas

```
totalHoursWorked = suma de hoursWorked de todos los días

Si el empleado tiene required_hours_biweekly configurado:
  regularHours = min(totalHoursWorked, required_hours_biweekly)
  overtimeHours = calculateOvertimeHoursBiweekly(total, biweeklyReq)

Si no tiene biweekly configurado (fallback):
  regularHours = calculateRegularHours(days, params)  ← hasta params.regularHoursPerDay/día
  overtimeHours = calculateOvertimeHours(days, params) ← lo que supere el límite diario

weeklyRestHours = regularHours / WORKING_DAYS_PER_WEEK / 2
                  (descanso semanal = 0.5 día por semana de trabajo efectivo)
```

### Paso 4 — Cálculo de Pagos (Ley Laboral CR)

| Componente | Fórmula |
|---|---|
| Horas extra | 1.5× para horas sobre el límite diario hasta 10h; 2× por encima de 10h |
| Descanso semanal | 0.5× tarifa diaria por cada semana con trabajo efectivo |
| Feriados obligatorios | 2× tarifa por hora trabajada en feriado mandatorio; pago base si no se trabajó (si `pay_unworked_holidays = true`) |
| Feriados triples | 3× tarifa (días específicos configurados en catálogo) |
| Bonos | Se suman como monto fijo al bruto |
| Salario bruto | `regularPay + overtimePay + weeklyRestPay + holidayPay + bonuses` |

### Paso 5 — Deducciones

Por cada deducción asignada al empleado:
- Si es **porcentual**: `amount = grossSalary × (percentage / 100)`
- Si es de **monto fijo**: `amount = fixed_amount`

`totalDeductions = suma de todos los amounts`

### Paso 6 — Salario Neto

```
netSalary = max(0, grossSalary - totalDeductions)
```

(Nunca negativo — si lo fuera, se fija en 0 con mensaje de advertencia.)

### Inconsistencias

El motor genera **inconsistencias** cuando detecta marcas huérfanas o anomalías que no pudieron resolverse. Estas quedan visibles en la planilla para revisión manual.

### Guardar en Base de Datos

Si se provee un `payrollId`, los resultados se guardan/actualizan en `vpg_payroll_employee`. Si el registro ya existe y fue **ajustado manualmente**, el motor lo **omite** (respeta los valores del supervisor).

---

## 14. Ajuste Manual de Planilla

Un supervisor puede ajustar manualmente los valores calculados de un empleado dentro de una planilla en estado `BORRADOR`:

| Campo overridable | Descripción |
|---|---|
| `payroll_employee_hours_override` | Horas regulares ajustadas |
| `payroll_employee_overtime_override` | Horas extra ajustadas |
| `payroll_employee_weekly_rest_override` | Horas de descanso semanal ajustadas |
| `payroll_employee_deductions_override` | Deducciones ajustadas |
| `payroll_employee_is_manually_adjusted` | Flag que marca el registro como ajustado |

Una vez activado el flag, los recálculos automáticos **no sobreescriben** este empleado. Esto permite que RRHH corrija casos excepcionales sin perder el ajuste al recalcular el resto.

---

## 15. Aguinaldo

Cálculo del decimotercer mes según el Código de Trabajo de Costa Rica.

### Período Fiscal

Configurable en `vpg_enterprise`:
- `enterprise_aguinaldo_period_start_month` / `enterprise_aguinaldo_period_start_day` — inicio del período (default: 1 de diciembre).
- `enterprise_aguinaldo_payment_deadline_day` — día límite de pago.

### Cálculo

```
aguinaldo = promedio de salarios netos en el período fiscal
```

El sistema busca todas las planillas cuyo `period_end` caiga dentro del período fiscal de aguinaldo y promedia los salarios netos del empleado en esas planillas.

Si el empleado fue contratado dentro del período (menos de 1 año), el monto es proporcional.

Si el empleado no tiene fecha de contratación, o no tiene planillas en el período, el resultado es `null` con mensaje descriptivo.

El módulo de aguinaldo puede calcularse para **todos los empleados activos** o para un subconjunto, desde la pantalla de reportes de planilla.

---

## 16. Comprobantes de Pago

El sistema genera comprobantes de pago individuales por empleado (PDF) usando **Puppeteer + Handlebars + pdf-lib**.

El comprobante incluye:
- Datos del empleado y la empresa.
- Período de pago.
- Desglose de horas (regulares, extra, descanso semanal).
- Bonos.
- Desglose de deducciones.
- Salario bruto y neto.

Los comprobantes se pueden enviar por **email** al empleado directamente desde la UI (módulo de Email con configuración SMTP en `vpg_mail_server_settings`).

---

## 17. Reportes

El sistema genera reportes formales para organismos externos:

| Tipo | Descripción |
|---|---|
| **CCSS** | Reporte de planilla para la Caja Costarricense de Seguro Social |
| **Hacienda** | Reporte para el Ministerio de Hacienda |

Los reportes se registran en `vpg_report_logs` con:
- Tipo de reporte.
- Usuario que lo generó.
- Período cubierto.
- Ruta del archivo generado.
- Estado (`generated`, etc.).

Cada reporte puede tener múltiples versiones (`vpg_report_versions`) si se regenera.

Los **destinos de reporte** (`vpg_report_targets`) permiten configurar endpoints externos (URL + token de autenticación) para envío automático a instituciones.

---

## 18. Bitácora de Auditoría

Tabla `vpg_audit_logs`. Registra automáticamente todas las acciones críticas del sistema.

| Campo | Descripción |
|---|---|
| `audit_logs_user_id` | Usuario que ejecutó la acción |
| `audit_logs_action` | Acción realizada (ej: `UPDATE_PERMISSIONS`, `manual_correction`) |
| `audit_logs_entity` | Entidad afectada (ej: `vpg_users`, `clock_log`) |
| `audit_logs_entity_id` | ID del registro afectado |
| `audit_logs_timestamp` | Cuándo ocurrió |
| `audit_logs_details` | JSON con detalles adicionales (valores antes/después) |

Acciones auditadas automáticamente:
- Cambios de rol de usuario.
- Creación/edición de marcas manuales.
- Cambios de estado de marcas.
- Ajustes de marcas (ADD/EDIT/VOID).
- Aprobación de planillas.

Desde la UI, el módulo **Auditoría** permite filtrar por usuario, acción, entidad y fecha, con visualización tipo timeline.

---

## 19. Notificaciones

Tabla `vpg_notifications`. Sistema de notificaciones in-app por usuario.

| Campo | Descripción |
|---|---|
| `notifications_title` | Título corto |
| `notifications_message` | Mensaje (hasta 500 chars) |
| `notifications_type` | Tipo visual (info, warning, error, etc.) |
| `notifications_is_read` | Si el usuario ya la leyó |
| `notifications_requires_acknowledgment` | Si requiere confirmación explícita |
| `notifications_acknowledged_by/at` | Quién y cuándo la confirmó |
| `notifications_metadata` | JSON con datos adicionales del contexto |

Las notificaciones críticas (`requires_acknowledgment = true`) no desaparecen hasta que un usuario con permisos las confirme explícitamente.

---

## 20. Parámetros Legales

Tabla `vpg_legal_params`. Almacena los parámetros del Código de Trabajo y CCSS con soporte de **vigencia temporal** (válidos desde/hasta).

| Parámetro | Descripción |
|---|---|
| `ccss_obrero_salud` | Deducción CCSS obrero salud (default 5.5%) |
| `ccss_obreros_pension` | Deducción pensión obrero (default 4.33%) |
| `ccss_obrero_bp` | Deducción Banco Popular (default 1.0%) |
| `regular_hours_per_day` | Horas regulares por día (8h diurna, 7h nocturna, 7.5h mixta) |
| `regular_hours_per_week` | Horas regulares por semana (48h diurna, 36h nocturna, 42h mixta) |
| `ot_factor` | Factor horas extra (default 1.5×) |
| `holiday_mandatory_factor` | Factor feriado obligatorio (default 2.0×) |
| `holiday_triple_factor` | Factor feriado triple (default 3.0×) |

Los parámetros son **por tipo de jornada** (`DIURNA`/`MIXTA`/`NOCTURNA`) y tienen `validFrom` / `validUntil`, lo que permite actualizar tasas sin perder el historial.

El motor busca el set vigente a la fecha de inicio del período (`getParamSetAtDate`). Si no hay parámetros configurados en BD, usa los defaults hardcodeados (valores actuales del Código de Trabajo).

Al aprobar una planilla, se guarda un **snapshot** del set usado en `vpg_payroll_param_snapshots` para reproducibilidad histórica.

---

## 21. Feriados de la Empresa

Tabla `vpg_company_holidays`. Lista dinámica de feriados gestionada desde la UI.

| Campo | Descripción |
|---|---|
| `company_holidays_name` | Nombre del feriado |
| `company_holidays_date` | Fecha exacta |
| `company_holidays_is_mandatory` | Si es feriado de pago obligatorio (Art. 148) |
| `company_holidays_is_triple` | Si aplica pago triple |
| `company_holidays_status` | `active` / `inactive` |

El motor filtra solo los feriados `active` dentro del período al calcular. Esto permite desactivar feriados históricos sin borrarlos.

---

## 22. Ventanas de Tiempo y Confirmaciones

### Ventanas de Tiempo (`vpg_time_windows`)

Definen rangos horarios esperados para las marcas (ej: entrada mañana 07:00–08:30, salida almuerzo 12:00–13:00). Se usan en el sistema de **sugerencias de marcas** para asistir en la resolución de inconsistencias.

### Sugerencias de Marcas (`MarkSuggestionService`)

Cuando una marca tiene estado `orphan` o `anomaly`, el sistema puede sugerir automáticamente marcas complementarias basadas en las ventanas de tiempo configuradas y el patrón histórico del empleado.

### Confirmaciones de Día (`vpg_day_confirmations`)

Permite que un supervisor confirme manualmente la asistencia de un empleado para un día específico, incluso si no hay marcas de reloj. Registro de quién confirmó y notas opcionales.

---

## 23. Flujo End-to-End de un Período de Planilla

```
1. PREPARACIÓN
   ├── Configurar feriados del período en "Feriados"
   ├── Verificar que los empleados activos tienen posición y jornada correctas
   ├── Asignar deducciones a empleados si hay nuevas (Deducciones por Empleado)
   └── Registrar bonos del período si aplica (Bonos)

2. IMPORTACIÓN DE MARCAS
   ├── Subir archivo del reloj (Java parser o Excel)
   ├── El sistema crea sesión de importación + marcas en 'pending'
   ├── Análisis automático: orphan, double entry, double exit, long session
   └── Ver panel de sesiones para revisar estadísticas

3. LIMPIEZA DE MARCAS
   ├── Revisar marcas 'orphan' → resolver (asignar complemento o descartar)
   ├── Revisar marcas 'anomaly' → ajustar con ADD/EDIT/VOID + justificación
   └── Agregar marcas manuales si hay empleados sin marcaje justificado

4. REGISTRO DE NOVEDADES
   ├── Registrar vacaciones del período (si no estaban ya)
   ├── Registrar eventos laborales (incapacidades, suspensiones)
   └── Verificar labor events abiertos de períodos anteriores

5. CÁLCULO DE PLANILLA
   ├── Ir a Planilla → seleccionar la planilla en BORRADOR
   ├── Ejecutar "Calcular" → el motor procesa todos los empleados
   ├── Revisar inconsistencias reportadas
   ├── Si hay empleados con horas incorrectas → ajustar marcas y recalcular
   └── Opcionalmente hacer ajuste manual por empleado (override de horas/deducciones)

6. REVISIÓN Y APROBACIÓN
   ├── Revisar resumen: total empleados, bruto, deducciones, neto
   ├── Revisar desglose por empleado
   ├── Aprobar → estado cambia a APROBADA, queda registrado quién aprobó y cuándo
   └── Snapshot de parámetros legales guardado automáticamente

7. PAGO Y CIERRE
   ├── Generar comprobantes de pago individuales (PDF)
   ├── Enviar comprobantes por email a empleados
   ├── Generar reporte CCSS y/o Hacienda
   └── Marcar planilla como PAGADA → bloqueo total de marcas del período

8. VERIFICACIÓN POSTERIOR
   ├── Consultar bitácora de auditoría para verificar cambios
   └── Calcular aguinaldo al final del período fiscal si corresponde
```

---

## Resumen de Tablas de Base de Datos

| Tabla | Propósito |
|---|---|
| `vpg_users` | Usuarios del sistema con roles |
| `vpg_audit_logs` | Bitácora de acciones críticas |
| `vpg_token_blocklist` | Tokens JWT invalidados (logout) |
| `vpg_password_change_request` | Códigos de cambio de contraseña |
| `vpg_enterprise` | Configuración única de la empresa |
| `vpg_branches` | Sucursales |
| `vpg_enterprise_branch` | Relación empresa ↔ sucursal |
| `vpg_positions` | Puestos con salario base |
| `vpg_employees` | Empleados |
| `vpg_branch_employee` | Empleado ↔ sucursal |
| `vpg_employee_documents` | Documentos adjuntos por empleado |
| `vpg_clock_logs` | Marcas de reloj (crudas) |
| `vpg_clock_log_adjustments` | Ajustes no destructivos de marcas |
| `vpg_clock_aliases` | Alias de nombre en reloj por empleado |
| `vpg_clock_import_sessions` | Sesiones de importación de marcas |
| `vpg_payroll_types` | Catálogo de tipos de planilla |
| `vpg_payrolls` | Planillas (cabecera) |
| `vpg_payroll_employee` | Resultado de planilla por empleado |
| `vpg_payroll_recalculations` | Historial de recálculos |
| `vpg_payroll_param_snapshots` | Snapshot de parámetros al aprobar |
| `vpg_deductions` | Catálogo de deducciones |
| `vpg_deductions_per_employee` | Deducciones asignadas a empleados |
| `vpg_employee_deductions` | Montos reales deducidos por planilla |
| `vpg_bonuses` | Bonos por empleado/planilla |
| `vpg_vacations` | Períodos de vacaciones |
| `vpg_labor_events` | Catálogo de eventos laborales |
| `vpg_employee_labor_event` | Eventos aplicados a empleados |
| `vpg_notifications` | Notificaciones in-app |
| `vpg_report_logs` | Historial de reportes generados |
| `vpg_report_versions` | Versiones de reportes |
| `vpg_report_targets` | Endpoints externos para reportes |
| `vpg_mail_server_settings` | Configuración SMTP |
| `vpg_company_holidays` | Feriados de la empresa |
| `vpg_time_windows` | Ventanas horarias de marcaje |
| `vpg_day_confirmations` | Confirmaciones manuales de asistencia |
| `vpg_legal_params` | Parámetros legales con vigencia |

---

*Generado: 2026-05-07 — Basado en el código fuente de la rama `veriso1.7/payroll`*
