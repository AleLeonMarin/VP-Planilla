import { z } from 'zod';
import { PayrollStatus } from '@prisma/client';

export const createPayrollSchema = z.object({
  payroll_type_id: z.coerce.number().int().positive('Tipo de planilla requerido'),
  period_start: z.string().min(1, 'Fecha inicio requerida'),
  period_end: z.string().min(1, 'Fecha fin requerida'),
  payment_date: z.string().optional(),
  status: z.nativeEnum(PayrollStatus).optional().default(PayrollStatus.BORRADOR),
});

export const updatePayrollSchema = createPayrollSchema.partial();

export type CreatePayrollInput = z.infer<typeof createPayrollSchema>;
export type UpdatePayrollInput = z.infer<typeof updatePayrollSchema>;

// Schema para POST /nominee/calculate-payroll
export const calculatePayrollSchema = z.object({
  startDate: z.string().min(1, 'Fecha inicio requerida'),
  endDate: z.string().min(1, 'Fecha fin requerida'),
  payrollId: z.coerce.number().int().positive().optional(),
  selectedEmployeeIds: z.array(z.coerce.number().int().positive()).optional(),
});

export type CalculatePayrollInput = z.infer<typeof calculatePayrollSchema>;

// Schema para PATCH /payroll/:id/employee/:empId/override
export const employeeOverrideSchema = z.object({
  regularHours: z.coerce.number().gte(0).optional(),
  overtimeHours: z.coerce.number().gte(0).optional(),
  weeklyRestHours: z.coerce.number().gte(0).optional(),
  totalDeductions: z.coerce.number().gte(0).optional(),
}).refine(
  (data) => {
    const regular = data.regularHours ?? 0;
    const overtime = data.overtimeHours ?? 0;
    return regular + overtime <= 24;
  },
  { message: 'La suma de horas regulares y horas extra no puede exceder 24 horas' }
);

export type EmployeeOverrideInput = z.infer<typeof employeeOverrideSchema>;

