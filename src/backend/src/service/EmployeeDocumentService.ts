import { prisma } from '../lib/prisma';
import { EmployeeDocument, CreateEmployeeDocumentInput } from '../model/employeeDocuments';

/** Map a Prisma vpg_employee_documents row to the EmployeeDocument domain model. */
function mapDoc(row: {
  employee_documents_id: number;
  employee_documents_employee_id: number;
  employee_documents_file_path: string;
  employee_documents_document_type: string;
  employee_documents_uploaded_at: Date;
}): EmployeeDocument {
  return {
    id: row.employee_documents_id,
    employee_id: row.employee_documents_employee_id,
    file_path: row.employee_documents_file_path,
    document_type: row.employee_documents_document_type,
    uploaded_at: row.employee_documents_uploaded_at,
  };
}

export class EmployeeDocumentService {
  /**
   * Create a new document reference for an employee.
   * @param employeeId - Owner employee id (FK to vpg_employees.employee_id)
   * @param data - Document name (file_path) and type
   * @returns The created EmployeeDocument
   * @throws Error if Prisma create fails (e.g. FK violation)
   */
  static async create(
    employeeId: number,
    data: CreateEmployeeDocumentInput
  ): Promise<EmployeeDocument> {
    const created = await prisma.vpg_employee_documents.create({
      data: {
        employee_documents_employee_id: employeeId,
        employee_documents_file_path: data.file_path,
        employee_documents_document_type: data.document_type,
        employee_documents_uploaded_at: new Date(),
      },
    });
    return mapDoc(created);
  }

  /**
   * Get all documents for a given employee.
   * @param employeeId - Filter by employee
   * @returns Array of EmployeeDocument ordered by uploaded_at desc (newest first)
   * @throws Error if the query fails
   */
  static async getAll(employeeId: number): Promise<EmployeeDocument[]> {
    const rows = await prisma.vpg_employee_documents.findMany({
      where: { employee_documents_employee_id: employeeId },
      orderBy: { employee_documents_uploaded_at: 'desc' },
    });
    return rows.map(mapDoc);
  }

  /**
   * Delete a document by its primary id.
   * @param docId - employee_documents_id
   * @returns The deleted EmployeeDocument, or null if not found (Prisma P2025)
   */
  static async delete(docId: number): Promise<EmployeeDocument | null> {
    try {
      const deleted = await prisma.vpg_employee_documents.delete({
        where: { employee_documents_id: docId },
      });
      return mapDoc(deleted);
    } catch {
      return null;
    }
  }
}
