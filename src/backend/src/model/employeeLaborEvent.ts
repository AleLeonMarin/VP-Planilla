export interface EmployeeLaborEvent {
  id: number;
  employee_id: number;
  labor_event_id: number;
  star_date: Date;
  end_date: Date;
  status: string;
  version: number;
}