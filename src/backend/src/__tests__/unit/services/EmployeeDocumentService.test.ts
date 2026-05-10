import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { EmployeeDocumentService } from '../../../service/EmployeeDocumentService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

const mockRow = {
  employee_documents_id: 11,
  employee_documents_employee_id: 7,
  employee_documents_file_path: 'contrato-2026.pdf',
  employee_documents_document_type: 'CONTRATO',
  employee_documents_uploaded_at: new Date('2026-05-09T10:00:00Z'),
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.vpg_employee_documents.create.mockResolvedValue(mockRow);
  prisma.vpg_employee_documents.findMany.mockResolvedValue([mockRow]);
  prisma.vpg_employee_documents.delete.mockResolvedValue(mockRow);
});

describe('EmployeeDocumentService', () => {
  describe('create', () => {
    it('persists with real DB columns and maps the result to domain shape', async () => {
      const result = await EmployeeDocumentService.create(7, {
        file_path: 'contrato-2026.pdf',
        document_type: 'CONTRATO',
      });

      expect(prisma.vpg_employee_documents.create).toHaveBeenCalledTimes(1);
      const call = prisma.vpg_employee_documents.create.mock.calls[0][0];
      expect(call.data.employee_documents_employee_id).toBe(7);
      expect(call.data.employee_documents_file_path).toBe('contrato-2026.pdf');
      expect(call.data.employee_documents_document_type).toBe('CONTRATO');
      expect(call.data.employee_documents_uploaded_at).toBeInstanceOf(Date);

      expect(result).toEqual({
        id: 11,
        employee_id: 7,
        file_path: 'contrato-2026.pdf',
        document_type: 'CONTRATO',
        uploaded_at: mockRow.employee_documents_uploaded_at,
      });
    });

    it('propagates DB errors', async () => {
      prisma.vpg_employee_documents.create.mockRejectedValue(new Error('FK violation'));
      await expect(
        EmployeeDocumentService.create(7, { file_path: 'a', document_type: 'b' })
      ).rejects.toThrow('FK violation');
    });
  });

  describe('getAll', () => {
    it('filters by employee_id and orders by uploaded_at desc', async () => {
      const rows = await EmployeeDocumentService.getAll(7);

      expect(prisma.vpg_employee_documents.findMany).toHaveBeenCalledWith({
        where: { employee_documents_employee_id: 7 },
        orderBy: { employee_documents_uploaded_at: 'desc' },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe(11);
      expect(rows[0].employee_id).toBe(7);
      expect(rows[0].file_path).toBe('contrato-2026.pdf');
    });

    it('returns empty array when there are no documents', async () => {
      prisma.vpg_employee_documents.findMany.mockResolvedValue([]);
      const rows = await EmployeeDocumentService.getAll(99);
      expect(rows).toEqual([]);
    });
  });

  describe('delete', () => {
    it('deletes by employee_documents_id and returns the mapped row', async () => {
      const result = await EmployeeDocumentService.delete(11);
      expect(prisma.vpg_employee_documents.delete).toHaveBeenCalledWith({
        where: { employee_documents_id: 11 },
      });
      expect(result).toEqual({
        id: 11,
        employee_id: 7,
        file_path: 'contrato-2026.pdf',
        document_type: 'CONTRATO',
        uploaded_at: mockRow.employee_documents_uploaded_at,
      });
    });

    it('returns null when the row does not exist (Prisma P2025)', async () => {
      prisma.vpg_employee_documents.delete.mockRejectedValue(
        Object.assign(new Error('Record to delete does not exist.'), { code: 'P2025' })
      );
      const result = await EmployeeDocumentService.delete(404);
      expect(result).toBeNull();
    });
  });
});
