import { useEffect, useRef } from 'react';
import { useDocumentsStore } from '../store/documentsStore';

export function useDocument(workspaceId) {
  const fetchDocumentById = useDocumentsStore((s) => s.fetchDocumentById);
  const record = useDocumentsStore((s) => s.recordState[workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    if (!record) {
      fetchDocumentById(workspaceId);
    }
  }, [workspaceId, record, fetchDocumentById]);

  return {
    workspace: record?.data || null,
    isLoading: record?.isLoading || false,
    error: record?.error || null,
    fetchDocumentById: () => fetchDocumentById(workspaceId),
  };
}

export function useDocuments(options = {}) {
  const autoFetchTriggeredRef = useRef(false);

  const { autoFetch = true } = options;

  const documments = useDocumentsStore((s) => s.documments);
  const isLoading = useDocumentsStore((s) => s.isLoading);
  const error = useDocumentsStore((s) => s.error);

  const fetchDocuments = useDocumentsStore((s) => s.fetchDocuments);
  const createDocument = useDocumentsStore((s) => s.createDocument);
  const updateDocument = useDocumentsStore((s) => s.updateDocument);
  const deleteDocument = useDocumentsStore((s) => s.deleteDocument);

  useEffect(() => {
    if (!autoFetch) return;
    if (autoFetchTriggeredRef.current) return;
    if (!documments?.length && !isLoading) {
      autoFetchTriggeredRef.current = true;
      fetchDocuments();
    }
  }, [autoFetch, documments?.length, isLoading, fetchDocuments]);

  return {
    documments,
    isLoading,
    error,
    fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
  };
}
