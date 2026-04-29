# Guía de Planilla — Cómo Calcula el Sistema su Salario

Esta guía explica en términos simples cómo el sistema calcula el salario de cada empleado,
qué puede configurar el encargado de planilla, y cuáles son las implicaciones legales
de cada decisión.

Dirigida a: administradores, jefes de recursos humanos y encargados de planilla.
No se requiere conocimiento técnico.

---

## ¿Cómo funciona el cálculo de planilla?

Cada quincena, el sistema revisa los marcajes del reloj de cada empleado y construye
el salario en partes. Piense en ello como armar una factura: hay líneas de cobro
distintas que al final se suman para dar el total que el empleado recibe.

El salario bruto se compone de estas partes:

```
Salario Bruto = Horas Ordinarias
              + Horas Extra
              + Descanso Semanal
              + Bonificaciones
              + Feriados Obligatorios No Trabajados  (si está activado)
```

Luego se restan las deducciones de la CCSS y el empleado recibe el **salario neto**.

---

## Parte 1 — Horas Ordinarias

Son las primeras 8 horas de cada día trabajado. Se pagan a la tarifa normal del empleado.

**Ejemplo:**
Un empleado con tarifa de ₡3,000 por hora trabaja 8 horas un lunes ordinario:
```
8 horas × ₡3,000 = ₡24,000 ese día
```

---

## Parte 2 — Horas Extra

Son las horas que el empleado trabaja por encima de las 8 horas diarias.
El Código de Trabajo obliga a pagarlas con un recargo del 50% sobre la tarifa normal.

**Ejemplo:**
El mismo empleado trabaja 10 horas un día:
- Las primeras 8 horas → pago normal: 8 × ₡3,000 = ₡24,000
- Las 2 horas de más → pago con recargo: 2 × ₡3,000 × 1.5 = ₡9,000
- Total del día: ₡33,000

---

## Parte 3 — Descanso Semanal Remunerado

El Código de Trabajo de Costa Rica establece que todo empleado tiene derecho a un día
de descanso por cada seis días laborados, y ese descanso debe ser remunerado.

El sistema calcula este componente de forma proporcional según las horas trabajadas
en la quincena, usando la fórmula estándar para actividades comerciales:

```
Horas de descanso = (Horas ordinarias trabajadas × 8 ÷ 104) × 2
Pago de descanso  = Horas de descanso × tarifa por hora
```

El número 104 representa la quincena completa de trabajo (13 días × 8 horas).
Si el empleado trabajó menos horas, recibe proporcionalmente menos descanso.

**Ejemplo:**
Empleado que trabajó 96 horas ordinarias en la quincena:
```
Horas de descanso = (96 × 8 ÷ 104) × 2 = 14.77 horas
Pago              = 14.77 × ₡3,000      = ₡44,307
```

**Importante:** Las horas de días feriados trabajados no entran en esta base de cálculo
porque ya tienen su propio tratamiento especial (ver sección de feriados).

---

## Parte 4 — Feriados de Pago Obligatorio

La ley costarricense define una lista de feriados de pago obligatorio (como el 1° de enero,
11 de abril, 1° de mayo, etc.). El sistema maneja dos situaciones distintas:

### Si el empleado NO trabajó el feriado

El empleado de todas formas tiene derecho a cobrar ese día como si lo hubiera trabajado,
a su tarifa normal. Esto es el estándar legal.

```
Pago = 8 horas × tarifa normal
```

Este comportamiento se puede desactivar en la configuración de la empresa (ver sección de
configuraciones), pero desactivarlo implica un riesgo legal que el empleador debe asumir.

### Si el empleado SÍ trabajó el feriado

La ley obliga a pagar el doble por las horas ordinarias trabajadas ese día:

```
Horas ordinarias (hasta 8h): tarifa × 2.0
```

Además, si el empleado hizo horas extra ese día (más de 8 horas), esas horas extra
se pagan a triple tarifa, porque se combina el recargo de feriado (×2) con el recargo
de sobretiempo (×1.5):

```
Horas extra en feriado: tarifa × 2.0 × 1.5 = tarifa × 3.0
```

**Ejemplo concreto** (tarifa ₡3,000/hora, empleado trabajó 10h en feriado obligatorio):

| Concepto | Cálculo | Monto |
|---|---|---|
| 8h ordinarias en feriado | 8 × ₡3,000 × 2.0 | ₡48,000 |
| 2h extra en feriado | 2 × ₡3,000 × 3.0 | ₡18,000 |
| **Total del día** | | **₡66,000** |

Compare con un día ordinario con las mismas horas:
| Concepto | Cálculo | Monto |
|---|---|---|
| 8h ordinarias | 8 × ₡3,000 × 1.0 | ₡24,000 |
| 2h extra | 2 × ₡3,000 × 1.5 | ₡9,000 |
| **Total del día** | | **₡33,000** |

El feriado obligatorio trabajado cuesta exactamente el doble que un día ordinario normal.

---

## Parte 5 — Deducciones CCSS

Sobre el salario bruto calculado, el sistema aplica automáticamente las deducciones
de la Caja Costarricense de Seguro Social que corresponden al trabajador:

| Concepto | Porcentaje |
|---|---|
| Seguro de Salud (obrero) | 5.50% |
| Pensión IVM (obrero) | 4.33% |
| Banco Popular (obrero) | 1.00% |
| **Total deducciones obrero** | **10.83%** |

Estas tasas las define la CCSS y pueden cambiar por decreto. Cuando cambian,
el encargado de planilla debe actualizarlas en el sistema para que los períodos
futuros calculen con los valores correctos. Los períodos anteriores conservan
los valores históricos que correspondían en ese momento.

**Ejemplo:**
```
Salario bruto:      ₡416,307
Deducción CCSS:     ₡416,307 × 10.83% = ₡45,085
Salario neto:       ₡416,307 - ₡45,085 = ₡371,222
```

El salario neto nunca puede ser negativo. Si las deducciones superaran el bruto
(situación muy inusual), el sistema lo limita a ₡0.

---

## Configuraciones que puede modificar el encargado

En la pantalla **Configuración → Empresa** hay cinco opciones que afectan cómo
se calcula la planilla. A continuación se explica cada una, qué cambia, y cuándo
conviene activarla o desactivarla.

---

### Configuración 1 — Política de Redondeo de Minutos

**¿Qué hace?**
Define qué pasa cuando un empleado marca, por ejemplo, 8 horas y 7 minutos.
¿Se le pagan exactamente esos 7 minutos? ¿Se redondea hacia arriba? ¿O depende
de si pasó o no la mitad del cuarto de hora?

**Las tres opciones:**

**Modalidad A — Proporcional Exacto (opción por defecto)**
Se pagan los minutos exactamente como se trabajaron. Si marcó 8h 7min,
se le pagan 8.117 horas. Es la opción más precisa y sin complicaciones legales.

**Modalidad B — Cuarto de hora superior siempre**
Cualquier fracción de minuto sube al siguiente cuarto de hora.
Si marcó 8h 1min, se le pagan 8h 15min (8.25 horas).
Favorece al empleado. No requiere descargo legal.

**Modalidad C — Cuarto de hora más cercano**
Si la fracción está en la primera mitad del cuarto, baja. Si está en la segunda mitad, sube.
La regla práctica: si el empleado marcó menos de 8 minutos extra, esos minutos se descartan.
Si marcó 8 minutos o más, se redondea al cuarto siguiente.

> **Atención:** La Modalidad C puede resultar en que algunos minutos trabajados
> no se paguen. Por eso el sistema exige que el encargado acepte un **descargo
> legal explícito** antes de activarla. Si selecciona esta modalidad y no acepta
> el descargo, el cambio no se guarda.

**¿Cuál elegir?**
Para la mayoría de empresas, la Modalidad A es suficiente y evita cualquier riesgo.
La Modalidad B es la más generosa con el empleado. La Modalidad C solo debe usarse
si la empresa tiene una política interna documentada y asesoría legal.

---

### Configuración 2 — Pago de Feriados Obligatorios No Trabajados

**¿Qué hace?**
Controla si los feriados de pago obligatorio que el empleado NO trabajó se incluyen
automáticamente en la planilla.

**Activado (recomendado y opción por defecto)**
El sistema agrega automáticamente el pago de cada feriado obligatorio no laborado,
a la tarifa normal del empleado (8 horas × tarifa). Esto cumple el Artículo 148
del Código de Trabajo de Costa Rica.

**Desactivado**
Los feriados no trabajados no generan pago. Solo se pagan los feriados que el
empleado efectivamente trabajó (y esos se pagan al doble, como siempre).

> **Advertencia legal:** Desactivar esta opción puede exponer a la empresa a
> reclamos laborales y sanciones del Ministerio de Trabajo. El sistema muestra
> un aviso legal antes de permitir este cambio y requiere que el encargado lo
> acepte explícitamente. Se recomienda contar con asesoría laboral antes de
> desactivar esta opción.

**¿Cuándo podría desactivarse?**
Únicamente en casos donde un acuerdo colectivo, convenio o resolución específica
lo permita. Consulte con su asesor laboral antes de hacer este cambio.

---

### Configuración 3 — Validación de Salario Mínimo

**¿Qué hace?**
Activa una advertencia visual en la pantalla de planilla cuando algún empleado
tiene una tarifa por hora inferior al salario mínimo de referencia configurado
en el sistema.

**Importante:** Esta validación es solo informativa. No bloquea el cálculo ni
impide generar la planilla. Simplemente muestra una marca de alerta para que
el encargado tome nota.

**Activado**
Si la tarifa del empleado está por debajo del mínimo de referencia, aparece
una señal de advertencia junto a su nombre en la pantalla de revisión.

**Desactivado (opción por defecto)**
No se muestran advertencias. El sistema calcula normalmente sin verificar
el mínimo.

**¿Cuándo activarlo?**
Cuando la empresa quiere tener un control adicional para asegurarse de que
ningún empleado esté registrado por debajo del salario mínimo legal.
Este es un buen complemento para empresas con muchos puestos o altas rotaciones.

> Esta configuración se guarda de forma inmediata al hacer el cambio,
> sin necesidad de presionar "Guardar Cambios".

---

### Configuración 4 — Jornada Ordinaria

**¿Qué hace?**
Indica si la empresa trabaja bajo jornada diurna (8 horas diarias), mixta
(7 horas) o nocturna (6 horas).

| Jornada | Horas diarias ordinarias |
|---|---|
| Diurna (opción por defecto) | 8 horas |
| Mixta | 7 horas |
| Nocturna | 6 horas |

> **Nota:** Esta configuración está disponible para registrar el tipo de jornada
> de la empresa, pero el cálculo automático de horas extra según el tipo de
> jornada se habilitará en una próxima versión del sistema. Actualmente el
> sistema usa 8 horas como límite diario para todos.

---

### Configuración 5 — Actividad Comercial

**¿Qué hace?**
Indica si la empresa es una actividad comercial. Las empresas comerciales tienen
obligaciones específicas en cuanto al pago del descanso semanal.

> **Nota:** Al igual que la jornada ordinaria, esta opción está disponible para
> registro pero su efecto diferenciado en el cálculo se habilitará en una
> próxima versión.

---

## Los feriados — cómo se registran en el sistema

Los feriados se administran en la sección de configuración del sistema.
Cada feriado tiene dos opciones que determinan cómo afecta la planilla:

### ¿Es feriado de pago obligatorio?

Si está marcado como **obligatorio**, el sistema aplica todas las reglas
del Artículo 148 del Código de Trabajo:
- Si no se trabajó → se paga igual (8h × tarifa normal)
- Si se trabajó → se paga al doble (horas regulares × 2)
- Si hubo horas extra ese día → se pagan al triple (× 3.0)

Si **no** está marcado como obligatorio:
- Si no se trabajó → no genera pago adicional
- Si se trabajó → se paga igual que un día normal

### Feriados obligatorios en Costa Rica

Según el Código de Trabajo, los siguientes días son feriados de pago obligatorio
y deben estar registrados como tal en el sistema:

| Fecha | Feriado |
|---|---|
| 1° de enero | Año Nuevo |
| 11 de abril | Batalla de Rivas (Juan Santamaría) |
| Jueves Santo | Variable según año |
| Viernes Santo | Variable según año |
| 1° de mayo | Día del Trabajo |
| 25 de julio | Anexión de Guanacaste |
| 2 de agosto | Virgen de los Ángeles |
| 15 de agosto | Día de la Madre |
| 15 de setiembre | Independencia |
| 25 de diciembre | Navidad |

Los feriados de fecha variable (Semana Santa) deben actualizarse manualmente
en el sistema cada año.

---

## Ejemplo completo de una quincena

**Período:** 1 al 15 de mayo 2026
El 1° de mayo es feriado obligatorio (Día del Trabajo) y el empleado SÍ trabajó.
Tarifa del empleado: ₡3,000 por hora.

| Días trabajados | Detalle |
|---|---|
| 10 días normales | 8 horas cada uno |
| 2 días con sobretiempo | 10 horas cada uno (8h + 2h extra) |
| 1° de mayo (feriado) | 10 horas (8h ordinarias + 2h extra) |

**Cálculo del salario bruto:**

| Concepto | Detalle | Monto |
|---|---|---|
| Horas ordinarias, días normales | 10 días × 8h × ₡3,000 | ₡240,000 |
| Horas ordinarias, días con sobretiempo | 2 días × 8h × ₡3,000 | ₡48,000 |
| Horas ordinarias del feriado (doble) | 8h × ₡3,000 × 2.0 | ₡48,000 |
| Horas extra, días normales | 2 días × 2h × ₡3,000 × 1.5 | ₡18,000 |
| Horas extra del feriado (triple) | 2h × ₡3,000 × 3.0 | ₡18,000 |
| Descanso semanal proporcional | 96h base × fórmula | ₡44,307 |
| **Salario bruto** | | **₡416,307** |

**Cálculo de deducciones:**

| Concepto | Porcentaje | Monto |
|---|---|---|
| CCSS Salud | 5.50% | ₡22,897 |
| CCSS Pensión | 4.33% | ₡18,026 |
| Banco Popular | 1.00% | ₡4,163 |
| **Total deducciones** | **10.83%** | **₡45,086** |

**Salario neto a pagar: ₡371,221**

---

## Preguntas frecuentes

**¿Qué pasa si el empleado no marcó la entrada o la salida un día?**
El sistema detecta el marcaje incompleto y lo reporta como una inconsistencia.
Ese día aparece en el resumen del empleado con una advertencia. El encargado
debe revisar y corregir o justificar manualmente.

**¿Puede el sistema calcular planilla mensual en vez de quincenal?**
Sí. El período de planilla es configurable al iniciar el proceso. Se puede elegir
quincenal, mensual o un rango libre de fechas.

**¿Qué son las bonificaciones y cómo se registran?**
Las bonificaciones son montos adicionales al salario base (por ejemplo, bono de
productividad, bono de transporte, etc.). Se configuran por empleado en el módulo
de empleados y se suman automáticamente al salario bruto en cada período activo.

**¿Si cambio la tasa de CCSS, afecta los períodos pasados ya calculados?**
No. El sistema guarda un historial de tasas con fechas de vigencia. Los períodos
históricos conservan las tasas que correspondían en ese momento. El cambio solo
aplica a períodos futuros desde la fecha de vigencia del nuevo valor.

**¿El sistema garantiza el cumplimiento legal automáticamente?**
El sistema aplica las reglas del Código de Trabajo de Costa Rica tal como están
programadas. Sin embargo, la responsabilidad de verificar el cumplimiento legal
siempre recae en el empleador. Se recomienda revisar la planilla generada antes
de procesarla y consultar a un asesor laboral ante dudas específicas.

---

*VP-Planilla v1.7 — Guía para usuarios no técnicos*
*Para dudas sobre el sistema, contacte al administrador técnico.*
*Para dudas legales, consulte a su asesor laboral.*
