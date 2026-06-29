import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../stores/workspaceStore';

export function useWorkspace() {
  const { workspaceId } = useParams();
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const loading = useWorkspaceStore((s) => s.loading);
  const error = useWorkspaceStore((s) => s.error);

  const fetchWorkspaceDetail = useWorkspaceStore((s) => s.fetchWorkspaceDetail);
  const fetchPrompts = useWorkspaceStore((s) => s.fetchPrompts);
  const fetchDocuments = useWorkspaceStore((s) => s.fetchDocuments);

  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace);
  const deleteWorkspace = useWorkspaceStore((s) => s.deleteWorkspace);

  const createPrompt = useWorkspaceStore((s) => s.createPrompt);
  const updatePrompt = useWorkspaceStore((s) => s.updatePrompt);
  const deletePrompt = useWorkspaceStore((s) => s.deletePrompt);

  const createDocument = useWorkspaceStore((s) => s.createDocument);
  const updateDocument = useWorkspaceStore((s) => s.updateDocument);
  const deleteDocument = useWorkspaceStore((s) => s.deleteDocument);

  const addTab = useWorkspaceStore((s) => s.addTab);
  const removeTab = useWorkspaceStore((s) => s.removeTab);

  const currentWorkspace = useMemo(() => workspaces.find((w) => w.id === workspaceId), [workspaces, workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;

    if (!currentWorkspace) {
      fetchWorkspaceDetail(workspaceId);
      return;
    }

    if (!Array.isArray(currentWorkspace.prompts)) {
      fetchPrompts(workspaceId);
    }
    if (!Array.isArray(currentWorkspace.documents)) {
      fetchDocuments(workspaceId);
    }
  }, [workspaceId, currentWorkspace, fetchWorkspaceDetail, fetchPrompts, fetchDocuments]);

  return {
    workspaceId,
    workspace: currentWorkspace,
    prompts: currentWorkspace?.prompts ?? [],
    documents: currentWorkspace?.documents ?? [],
    tabs: currentWorkspace?.tabs ?? [],

    loading,
    error,

    // workspace actions
    refetchWorkspace: () => workspaceId && fetchWorkspaceDetail(workspaceId),
    updateWorkspace: (payload) => workspaceId && updateWorkspace(workspaceId, payload),
    deleteWorkspace: () => workspaceId && deleteWorkspace(workspaceId),

    // prompt actions
    refetchPrompts: () => workspaceId && fetchPrompts(workspaceId),
    createPrompt: (payload) => workspaceId && createPrompt({ ...payload, workspaceId }),
    updatePrompt,
    deletePrompt: (promptId) => workspaceId && deletePrompt(workspaceId, promptId),

    // document actions
    refetchDocuments: () => workspaceId && fetchDocuments(workspaceId),
    createDocument: (payload) => workspaceId && createDocument({ ...payload, workspaceId }),
    updateDocument,
    deleteDocument: (documentId) => workspaceId && deleteDocument(workspaceId, documentId),

    // tab actions
    addTab: (tab) => workspaceId && addTab(workspaceId, tab),
    removeTab: (tabId) => workspaceId && removeTab(workspaceId, tabId),
  };
}
