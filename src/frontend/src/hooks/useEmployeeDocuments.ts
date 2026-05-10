import { useState, useEffect, useCallback } from 'react';
import { employeeDocumentService } from '@/services/employeeDocumentService';
import { EmployeeDocument, CreateEmployeeDocumentInput } from '@/types/employeeDocument';

/**
 * Hook to fetch documents for a single employee and expose
 * create/delete mutations. Mutations re-throw errors so callers can
 * show toast.error.
 */
export function useEmployeeDocuments(employeeId: number | string | undefined) {
  const [data, setData] = useState<EmployeeDocument[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    if (!employeeId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await employeeDocumentService.getAll(Number(employeeId));
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los documentos');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const createDocument = useCallback(
    async (input: CreateEmployeeDocumentInput) => {
      if (!employeeId) throw new Error('Empleado no especificado');
      await employeeDocumentService.create(Number(employeeId), input);
      await fetchDocs();
    },
    [employeeId, fetchDocs]
  );

  const deleteDocument = useCallback(
    async (docId: number) => {
      if (!employeeId) throw new Error('Empleado no especificado');
      await employeeDocumentService.delete(Number(employeeId), docId);
      await fetchDocs();
    },
    [employeeId, fetchDocs]
  );

  return {
    data,
    isLoading,
    error,
    refresh: fetchDocs,
    createDocument,
    deleteDocument,
  };
}
