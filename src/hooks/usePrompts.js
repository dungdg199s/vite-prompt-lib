import { useMemo } from "react";
import { useWorkspace } from "./useWorkspaces";

export function usePrompts(workspaceId) {
  const workspaceState = useWorkspace(workspaceId);

  return useMemo(
    () => ({
      workspaceId: workspaceState.workspaceId,
      workspace: workspaceState.workspace,
      prompts: workspaceState.prompts,
      documents: workspaceState.documents,
      isLoading: workspaceState.isLoading,
      error: workspaceState.error,
      refetchWorkspace: workspaceState.refetchWorkspace,
      refetchPrompts: workspaceState.refetchPrompts,
      createPrompt: workspaceState.createPrompt,
      updatePrompt: workspaceState.updatePrompt,
      deletePrompt: workspaceState.deletePrompt,
      refetchDocuments: workspaceState.refetchDocuments,
      createDocument: workspaceState.createDocument,
      updateDocument: workspaceState.updateDocument,
      deleteDocument: workspaceState.deleteDocument,
      addTab: workspaceState.addTab,
      removeTab: workspaceState.removeTab,
      tabs: workspaceState.tabs,
    }),
    [workspaceState]
  );
}

export { useWorkspace } from "./useWorkspaces";
