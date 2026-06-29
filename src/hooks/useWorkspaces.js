import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../stores/workspaceStore';

export function useWorkspaces() {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const isLoading = useWorkspaceStore((s) => s.listLoading.workspaces);
  const errorByKey = useWorkspaceStore((s) => s.errorByKey);

  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace);
  const deleteWorkspace = useWorkspaceStore((s) => s.deleteWorkspace);
  const clearError = useWorkspaceStore((s) => s.clearError);

  useEffect(() => {
    if (!workspaces.length && !isLoading) {
      fetchWorkspaces();
    }
  }, [fetchWorkspaces, isLoading, workspaces.length]);

  const error = errorByKey.createWorkspace ?? errorByKey.fetchWorkspaces;

  return {
    workspaces,
    isLoading,
    error,
    isEmpty: !isLoading && workspaces.length === 0,
    fetchWorkspaces,
    refetchWorkspaces: fetchWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    clearError,
  };
}

export function useWorkspace(explicitWorkspaceId) {
  const params = useParams();
  const workspaceId = explicitWorkspaceId ?? params.workspaceId;

  const workspace = useWorkspaceStore((s) => (workspaceId ? s.workspaceById[workspaceId] : undefined));
  const promptItems = useWorkspaceStore((s) => (workspaceId ? s.promptsByWorkspace[workspaceId] : undefined));
  const documentItems = useWorkspaceStore((s) => (workspaceId ? s.documentsByWorkspace[workspaceId] : undefined));
  const tabs = useWorkspaceStore((s) => s.tabs);
  const errorByKey = useWorkspaceStore((s) => s.errorByKey);
  const isLoadingWorkspace = useWorkspaceStore((s) => (workspaceId ? !!s.recordLoading.workspace[workspaceId] : false));
  const isLoadingPrompts = useWorkspaceStore((s) =>
    workspaceId ? !!s.listLoading.promptsByWorkspace[workspaceId] : false
  );
  const isLoadingDocuments = useWorkspaceStore((s) =>
    workspaceId ? !!s.listLoading.documentsByWorkspace[workspaceId] : false
  );

  const fetchWorkspace = useWorkspaceStore((s) => s.fetchWorkspace);
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
  const openTab = useWorkspaceStore((s) => s.openTab);
  const closeTab = useWorkspaceStore((s) => s.closeTab);

  useEffect(() => {
    if (!workspaceId) {
      return;
    }

    if (!workspace) {
      fetchWorkspace(workspaceId);
      return;
    }

    if (promptItems === undefined && !Array.isArray(workspace.prompts)) {
      fetchPrompts(workspaceId);
    }

    if (documentItems === undefined && !Array.isArray(workspace.documents)) {
      fetchDocuments(workspaceId);
    }
  }, [documentItems, fetchDocuments, fetchPrompts, fetchWorkspace, promptItems, workspace, workspaceId]);

  const composedWorkspace = useMemo(() => {
    if (!workspace) {
      return undefined;
    }

    const prompts = promptItems ?? workspace.prompts ?? [];
    const documents = documentItems ?? workspace.documents ?? [];

    return {
      ...workspace,
      prompts,
      documents,
    };
  }, [documentItems, promptItems, workspace]);

  const prompts = composedWorkspace?.prompts ?? [];
  const documents = composedWorkspace?.documents ?? [];

  const error = workspaceId
    ? errorByKey[`updateWorkspace:${workspaceId}`] ??
      errorByKey[`deleteWorkspace:${workspaceId}`] ??
      errorByKey[`fetchWorkspace:${workspaceId}`] ??
      errorByKey[`fetchPrompts:${workspaceId}`] ??
      errorByKey[`fetchDocuments:${workspaceId}`]
    : undefined;

  const isLoading = isLoadingWorkspace || isLoadingPrompts || isLoadingDocuments;

  const addTab = (workspaceOrTab, maybeTab) => {
    const nextTab = maybeTab ?? workspaceOrTab;
    if (!nextTab) {
      return;
    }

    openTab({
      ...nextTab,
      name: nextTab.name ?? nextTab.label ?? nextTab.id,
    });
  };

  const removeTab = (workspaceOrTab, maybeTab) => {
    closeTab(maybeTab ?? workspaceOrTab);
  };

  return {
    workspaceId,
    workspace: composedWorkspace,
    prompts,
    documents,
    tabs,
    isLoading,
    error,
    fetchWorkspace,
    refetchWorkspace: () => workspaceId && fetchWorkspace(workspaceId),
    updateWorkspace: (idOrPayload, maybePayload) => {
      const id = maybePayload ? idOrPayload : workspaceId;
      const payload = maybePayload ?? idOrPayload;
      return id ? updateWorkspace(id, payload) : undefined;
    },
    deleteWorkspace: (id = workspaceId) => (id ? deleteWorkspace(id) : undefined),
    refetchPrompts: () => workspaceId && fetchPrompts(workspaceId),
    createPrompt: (payload) =>
      workspaceId
        ? createPrompt({
            ...payload,
            workspaceId,
            workspace: payload.workspace ?? workspaceId,
          })
        : undefined,
    updatePrompt,
    deletePrompt: (id, targetWorkspaceId = workspaceId) =>
      id ? deletePrompt(id, targetWorkspaceId) : undefined,
    refetchDocuments: () => workspaceId && fetchDocuments(workspaceId),
    createDocument: (payload) =>
      workspaceId
        ? createDocument({
            ...payload,
            workspaceId,
            workspace: payload.workspace ?? workspaceId,
          })
        : undefined,
    updateDocument,
    deleteDocument: (id, targetWorkspaceId = workspaceId) =>
      id ? deleteDocument(id, targetWorkspaceId) : undefined,
    addTab,
    openTab: addTab,
    closeTab: removeTab,
    removeTab,
  };
}
