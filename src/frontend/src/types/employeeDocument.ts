/**
 * Frontend representation of a vpg_employee_documents row.
 * In the current scope (no binary upload), `file_path` is used as the
 * document name. Dates arrive as ISO strings over JSON.
 */
export interface EmployeeDocument {
  id: number;
  employee_id: number;
  file_path: string;
  document_type: string;
  uploaded_at: string;
}

/** Payload accepted by employeeDocumentService.create */
export interface CreateEmployeeDocumentInput {
  file_path: string;
  document_type: string;
}
