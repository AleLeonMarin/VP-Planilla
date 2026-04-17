export interface Employee {
  id: number;
  name: string;
  last_name: string;
  middle_name: string;
  national_id: string;
  social_code: string;
  email: string;
  phone?: string | null;
  position_id: number;
  hire_date: Date;
  exit_date?: Date;
  fired: boolean;
  status: string; // e.g., 'active', 'inactive'
  gender?: string | null;
  required_hours_biweekly?: number; // Horas requeridas por quincena
  version: number;
}