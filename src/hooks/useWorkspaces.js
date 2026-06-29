import { useEffect } from 'react';
import { useWorkspaceStore } from '../stores/workspaceStore';

export function useWorkspaces() {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const loading = useWorkspaceStore((s) => s.loading);
  const error = useWorkspaceStore((s) => s.error);

  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace);
  const deleteWorkspace = useWorkspaceStore((s) => s.deleteWorkspace);
  const clearError = useWorkspaceStore((s) => s.clearError);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  return {
    // data
    workspaces,
    loading,
    error,
    isEmpty: !loading && workspaces.length === 0,

    // actions
    refetchWorkspaces: fetchWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    clearError,
  };
}
