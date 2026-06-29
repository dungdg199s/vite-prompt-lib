import { useEffect, useRef } from 'react';
import { useWorkspacesStore } from '../store/workspacesStore';

export function useWorkspace(workspaceId) {
  const fetchWorkspaceById = useWorkspacesStore((s) => s.fetchWorkspaceById);
  const record = useWorkspacesStore((s) => s.recordState[workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    if (!record) {
      fetchWorkspaceById(workspaceId);
    }
  }, [workspaceId, record, fetchWorkspaceById]);

  return {
    workspaceId,
    workspace: record?.data || null,
    isLoading: record?.isLoading || false,
    error: record?.error || null,
    fetchWorkspaceById: () => fetchWorkspaceById(workspaceId),
  };
}

export function useWorkspaces(options = {}) {
  const autoFetchTriggeredRef = useRef(false);

  const { autoFetch = true } = options;

  const workspaces = useWorkspacesStore((s) => s.workspaces);
  const isLoading = useWorkspacesStore((s) => s.isLoading);
  const error = useWorkspacesStore((s) => s.error);

  const fetchWorkspaces = useWorkspacesStore((s) => s.fetchWorkspaces);
  const createWorkspace = useWorkspacesStore((s) => s.createWorkspace);
  const updateWorkspace = useWorkspacesStore((s) => s.updateWorkspace);
  const deleteWorkspace = useWorkspacesStore((s) => s.deleteWorkspace);

  useEffect(() => {
    if (!autoFetch) return;
    if (autoFetchTriggeredRef.current) return;
    if (!workspaces?.length && !isLoading) {
      autoFetchTriggeredRef.current = true;
      fetchWorkspaces();
    }
  }, [autoFetch, workspaces?.length, isLoading, fetchWorkspaces]);

  return {
    workspaces,
    isLoading,
    error,
    fetchWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
  };
}
