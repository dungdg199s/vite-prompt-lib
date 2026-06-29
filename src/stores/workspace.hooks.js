import { useMemo } from 'react';
import { useWorkspaceStore } from './workspaceStore';

export const useWorkspaces = () =>
  useWorkspaceStore((s) => ({
    workspaces: s.workspaces,
    isLoading: s.listLoading.workspaces,
    fetchWorkspaces: s.fetchWorkspaces,
    createWorkspace: s.createWorkspace,
  }));

export const useWorkspaceDetail = (id) =>
  useWorkspaceStore((s) => ({
    workspace: s.workspaceById[id],
    isLoading: !!s.recordLoading.workspace[id],
    fetch: () => s.fetchWorkspace(id),
    update: (payload) => s.updateWorkspace(id, payload),
    remove: () => s.deleteWorkspace(id),
  }));

export const useWorkspacePrompts = (workspaceId) =>
  useWorkspaceStore((s) => ({
    prompts: s.promptsByWorkspace[workspaceId] ?? [],
    isLoading: !!s.listLoading.promptsByWorkspace[workspaceId],
    fetch: () => s.fetchPrompts(workspaceId),
    create: (payload) => s.createPrompt({ ...payload, workspaceId, workspace: payload.workspace ?? workspaceId }),
  }));

export const useWorkspaceDocuments = (workspaceId) =>
  useWorkspaceStore((s) => ({
    documents: s.documentsByWorkspace[workspaceId] ?? [],
    isLoading: !!s.listLoading.documentsByWorkspace[workspaceId],
    fetch: () => s.fetchDocuments(workspaceId),
    create: (payload) => s.createDocument({ ...payload, workspaceId, workspace: payload.workspace ?? workspaceId }),
  }));

export const useTabs = () =>
  useWorkspaceStore((s) => ({
    tabs: s.tabs,
    openTab: s.openTab,
    closeTab: s.closeTab,
    renameTab: s.renameTab,
    clearTabs: s.clearTabs,
  }));

export const useIsCreating = () =>
  useWorkspaceStore((s) => ({
    workspace: s.recordLoading.creatingWorkspace,
    prompt: s.recordLoading.creatingPrompt,
    document: s.recordLoading.creatingDocument,
  }));

export const useWorkspaceActions = () =>
  useWorkspaceStore((s) => ({
    updateWorkspace: s.updateWorkspace,
    deleteWorkspace: s.deleteWorkspace,
    updatePrompt: s.updatePrompt,
    deletePrompt: s.deletePrompt,
    updateDocument: s.updateDocument,
    deleteDocument: s.deleteDocument,
  }));

export const useRecordLoading = (type, id) => useWorkspaceStore((s) => !!s.recordLoading[type]?.[id]);

export const useWorkspaceComputed = (workspaceId) => {
  const prompts = useWorkspaceStore((s) => s.promptsByWorkspace[workspaceId] ?? []);
  const docs = useWorkspaceStore((s) => s.documentsByWorkspace[workspaceId] ?? []);

  return useMemo(
    () => ({
      totalPrompts: prompts.length,
      totalDocuments: docs.length,
    }),
    [prompts.length, docs.length]
  );
};
