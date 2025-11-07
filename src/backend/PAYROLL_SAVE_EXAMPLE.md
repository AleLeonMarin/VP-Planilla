# Ejemplo de Cálculo y Guardado de Nómina

## 1. Calcular sin guardar (vista previa)

Solo calcular la nómina para ver los resultados sin persistir en la BD:

```bash
curl -X POST http://localhost:3000/api/nominee/calculate-payroll \
  -H 'Content-Type: application/json' \
  -d '{
    "startDate": "2025-10-01",
    "endDate": "2025-10-31"
  }'
```

## 2. Calcular y guardar en la base de datos

Primero necesitas crear un registro de payroll:

```bash
# Crear un payroll
curl -X POST http://localhost:3000/api/payroll/create \
  -H 'Content-Type: application/json' \
  -d '{
    "payroll_type": 1,
    "period_start": "2025-10-01",
    "period_end": "2025-10-31",
    "payment_date": "2025-11-05",
    "status": "CALCULADO"
  }'
```

Respuesta ejemplo:
```json
{
  "id": 5,
  "payroll_type": 1,
  "period_start": "2025-10-01T00:00:00.000Z",
  "period_end": "2025-10-31T00:00:00.000Z",
  "payment_date": "2025-11-05T00:00:00.000Z",
  "status": "CALCULADO",
  "version": 1
}
```

Ahora calcular y guardar usando el `id` del payroll creado:

```bash
# Calcular y guardar (usar el id del payroll creado)
curl -X POST http://localhost:3000/api/nominee/calculate-payroll \
  -H 'Content-Type: application/json' \
  -d '{
    "startDate": "2025-10-01",
    "endDate": "2025-10-31",
    "payrollId": 5
  }'
```

## 3. Verificar los registros guardados

Consultar los empleados de un payroll específico:

```bash
curl http://localhost:3000/api/payroll/5/employees
```

## Respuesta esperada

Cuando incluyes `payrollId`, la respuesta incluirá un mensaje confirmando el guardado:

```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2025-10-01",
      "endDate": "2025-10-31"
    },
    "employees": [
      {
        "employeeId": "123",
        "employeeName": "Juan Pérez García",
        "positionId": "5",
        "baseHourlySalary": 5000,
        "grossSalary": 950000,
        "totalDeductions": 95000,
        "netSalary": 855000,
        "bonuses": 0,
        "days": [...],
        "deductionsBreakdown": [...],
        "inconsistencies": [],
        "generalMessages": []
      }
    ],
    "summary": {
      "employeesProcessed": 1,
      "employeesWithInconsistencies": 0,
      "messages": [
        "Procesamiento completado: 1 empleados procesados, 0 con inconsistencias",
        "Registros guardados en base de datos: 1 de 1"
      ]
    }
  },
  "message": "Cálculo de nómina del periodo completado y guardado exitosamente"
}
```

## Notas importantes

1. **Sin payrollId**: Solo calcula y devuelve los resultados (útil para vista previa)
2. **Con payrollId**: Calcula y guarda automáticamente en `vpg_payroll_employee`
3. Si ya existen registros para ese payroll/empleado, se actualizan (no se duplican)
4. El campo `version` se incrementa automáticamente en cada actualización
5. Los campos guardados son:
   - `payroll_employee_gross_salary`: Salario bruto
   - `payroll_employee_total_deductions`: Total de deducciones
   - `payroll_employee_net_salary`: Salario neto

## Flujo recomendado

1. **Vista previa**: Calcular sin `payrollId` para revisar
2. **Crear payroll**: Si los cálculos son correctos
3. **Guardar**: Calcular con `payrollId` para persistir
4. **Consultar**: Verificar con `/payroll/{id}/employees`
