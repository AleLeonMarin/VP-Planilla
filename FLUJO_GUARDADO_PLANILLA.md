# Flujo de Guardado de Planilla - Frontend

## Cambios Implementados

### 1. **NomineeService.ts**
- ✅ Método `calculatePayrollForPeriod` ahora acepta `payrollId` opcional
- Cuando se proporciona `payrollId`, el backend guarda automáticamente en `vpg_payroll_employee`

### 2. **useNominee.ts (Hook)**
- ✅ Hook actualizado para pasar `payrollId` opcional al servicio
- Mantiene compatibilidad con llamadas sin `payrollId` (solo calcular)

### 3. **PayrollCreateModal.tsx**
- ✅ Ahora importa y usa `useNominee` además de `usePayroll`
- ✅ Flujo mejorado:
  1. Crea el registro de planilla en `vpg_payrolls`
  2. **Recalcula automáticamente** con el `payrollId` para guardar en `vpg_payroll_employee`
  3. Guarda ID en historial local
  4. Notifica al componente padre
- ✅ Campos del formulario mejorados:
  - Tipo de planilla
  - **Fecha de pago** (nuevo)
  - Estado (valor por defecto: "CALCULADO")
  - Muestra periodo de forma clara
  - Nota informativa sobre el guardado automático

### 4. **payrollService.ts**
- ✅ Interfaces actualizadas para incluir `payment_date`

## Flujo Completo de Usuario

### Paso 1: Calcular Planilla (Vista Previa)
```
Usuario -> Selecciona fechas -> Click "Calcular"
         -> Se muestra tabla con resultados
         -> NO se guarda en BD (solo preview)
```

### Paso 2: Guardar Planilla
```
Usuario -> Click "Guardar planilla" (botón verde)
         -> Se abre modal con formulario
         -> Usuario completa:
            - Tipo de planilla (default: 1)
            - Fecha de pago (default: hoy)
            - Estado (default: CALCULADO)
         -> Click "Guardar"
         
Backend:
  1. Crea registro en vpg_payrolls
  2. Devuelve el ID (ej: 5)
  3. Frontend recalcula con payrollId=5
  4. Backend guarda cada empleado en vpg_payroll_employee
  5. Devuelve confirmación
  
Frontend:
  -> Muestra mensaje de éxito
  -> Cierra modal
```

### Paso 3: Verificar Datos Guardados
```
Usuario -> Navega a /payroll/{id}/employees
         -> Ve lista de empleados con salarios calculados
```

## Endpoints Utilizados

### POST /api/payroll/create
Crea el registro principal de planilla.

**Request:**
```json
{
  "payroll_type_id": 1,
  "period_start": "2025-10-01",
  "period_end": "2025-10-31",
  "payment_date": "2025-11-05",
  "status": "CALCULADO"
}
```

**Response:**
```json
{
  "id": 5,
  "payroll_type_id": 1,
  "period_start": "2025-10-01T00:00:00.000Z",
  "period_end": "2025-10-31T00:00:00.000Z",
  "payment_date": "2025-11-05T00:00:00.000Z",
  "status": "CALCULADO",
  "version": 1
}
```

### POST /api/nominee/calculate-payroll
Calcula y opcionalmente guarda la planilla.

**Request (con guardado):**
```json
{
  "startDate": "2025-10-01",
  "endDate": "2025-10-31",
  "payrollId": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": { "startDate": "2025-10-01", "endDate": "2025-10-31" },
    "employees": [...],
    "summary": {
      "employeesProcessed": 10,
      "employeesWithInconsistencies": 0,
      "messages": [
        "Procesamiento completado: 10 empleados procesados, 0 con inconsistencias",
        "Registros guardados en base de datos: 10 de 10"
      ]
    }
  },
  "message": "Cálculo de nómina del periodo completado y guardado exitosamente"
}
```

### GET /api/payroll/{id}/employees
Consulta empleados guardados de una planilla específica.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "payroll_id": 5,
      "employee_id": 123,
      "employee_name": "Juan Pérez García",
      "employee_identification": "123456789",
      "position_name": "Desarrollador",
      "gross_salary": 950000,
      "total_deductions": 95000,
      "net_salary": 855000,
      "version": 1
    }
  ]
}
```

## Datos Guardados en vpg_payroll_employee

Para cada empleado se guarda:
- `payroll_employee_payroll_id`: ID de la planilla
- `payroll_employee_employee_id`: ID del empleado
- `payroll_employee_gross_salary`: Salario bruto (horas × tarifa + bonos)
- `payroll_employee_total_deductions`: Total de deducciones
- `payroll_employee_net_salary`: Salario neto (nunca negativo)
- `payroll_employee_version`: Control de versión

## Validaciones

✅ Fechas requeridas antes de calcular
✅ Periodo válido (inicio < fin)
✅ No duplica registros (actualiza si existe)
✅ Incrementa versión en actualizaciones
✅ Manejo de errores en cada paso
✅ Notificaciones al usuario

## Pruebas Recomendadas

1. **Calcular sin guardar**
   - Seleccionar fechas
   - Click "Calcular"
   - Verificar que muestra resultados
   - NO debería guardar en BD

2. **Guardar planilla nueva**
   - Después de calcular
   - Click "Guardar planilla"
   - Completar formulario
   - Verificar mensaje de éxito
   - Consultar en `/payroll/{id}/employees`

3. **Re-calcular planilla existente**
   - Usar mismo periodo
   - Guardar con mismo payrollId
   - Verificar que actualiza (no duplica)
   - Verificar version incrementada

4. **Manejo de errores**
   - Intentar guardar sin fechas
   - Intentar con tipo de planilla inválido
   - Verificar mensajes de error claros

## Notas Técnicas

- El cálculo siempre devuelve resultados, guardar es opcional
- Si ya existe registro para empleado+planilla, se actualiza
- La versión se incrementa automáticamente en updates
- LocalStorage guarda historial de últimos 50 IDs de planilla
- El frontend usa aliases de campos para compatibilidad (id, employee_id, name, employee_name)
