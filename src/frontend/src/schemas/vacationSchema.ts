import { z } from 'zod';

export const VacationSchema = z.object({
  employee_id: z.number({ error: 'Empleado es requerido' }).min(1, 'El campo empleado es requerido'),
  start_date: z.string().min(1, 'Fecha inicio es requerida'),
  end_date: z.string().min(1, 'Fecha fin es requerida'),
  days: z.number().min(1, 'Días debe ser al menos 1'),
  paid: z.boolean().optional(),
  status: z.string().optional(),
});

export type VacationForm = z.infer<typeof VacationSchema>;
