/**
 * Domain model for an employee document reference.
 * Mirrors the real shape of the `vpg_employee_documents` table (no `version` column exists in DB).
 * Note: in the current scope (no binary upload), `file_path` is used as the document name.
 */
export interface EmployeeDocument {
  id: number;
  employee_id: number;
  file_path: string;
  document_type: string;
  uploaded_at: Date;
}

/** Payload for creating an employee document reference. */
export interface CreateEmployeeDocumentInput {
  file_path: string;
  document_type: string;
}
