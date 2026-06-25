import { create } from "zustand";
import { workspacesClient } from "../lib/workspaces-client";

export const useWorkspaces = create((set) => ({
  isLoading: false,
  workspaces: [],
  selectedWorkspace: null,

  setWorkspaces: (workspaces) => set({ workspaces }),

  setSelectedWorkspace: (workspace) => {
    set({
      selectedWorkspace: workspace,
      prompts: workspace?.prompts || [],
      documents: workspace?.documents || [],
    });
  },

  loadWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const data = await workspacesClient.getWorkspaces();
      set({ workspaces: data });
    } catch (error) {
      console.error("Failed to load workspaces:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadWorkspace: async (name) => {
    set({ isLoading: true });
    try {
      const data = await workspacesClient.getWorkspace(name);
      set({
        selectedWorkspace: data,
        prompts: data?.prompts || [],
        documents: data?.documents || [],
      });
    } catch (error) {
      console.error(`Failed to load workspace ${name}:`, error);
    } finally {
      set({ isLoading: false });
    }
  },

  createWorkspace: async (workspaceData) => {
    set({ isLoading: true });
    try {
      await workspacesClient.createWorkspace(workspaceData);
      await useWorkspaces.getState().loadWorkspaces();
      
    } catch (error) {
      console.error("Failed to create workspace:", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
