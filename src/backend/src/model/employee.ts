export interface Employee {
  id: number;
  first_name: string;
  name?: string;
  last_name: string;
  middle_name: string;
  national_id: string;
  social_code: string;
  email: string;
  phone?: string | null;
  position_id: number;
  hire_date: Date;
  exit_date?: Date | null;
  fired: boolean;
  status: string; // e.g., 'active', 'inactive'
  gender?: string | null;
  shift_type?: string;  // EmployeeShiftType: USE_ENTERPRISE_DEFAULT | DIURNA | MIXTA | NOCTURNA
  required_hours_biweekly?: number; // Horas requeridas por quincena
  version: number;
  salary?: number;
  // Campos enriquecidos (solo en getEmployeeById)
  position_name?: string | null;
  position_base_salary?: number | null;
}