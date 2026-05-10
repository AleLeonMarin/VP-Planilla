import { http } from './http';
import { EmployeeDocument, CreateEmployeeDocumentInput } from '@/types/employeeDocument';

export const employeeDocumentService = {
  getAll: (employeeId: number): Promise<EmployeeDocument[]> =>
    http.get(`/employees/${employeeId}/documents`),

  create: (employeeId: number, data: CreateEmployeeDocumentInput): Promise<EmployeeDocument> =>
    http.post(`/employees/${employeeId}/documents`, data),

  delete: (employeeId: number, docId: number): Promise<void> =>
    http.delete(`/employees/${employeeId}/documents/${docId}`),
};
