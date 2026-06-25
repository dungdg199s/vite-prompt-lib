import { create } from "zustand";
import { workspacesClient } from "../lib/workspaces-client";

export const DEFAULT_WORKSPACE_FORM = {
  name: "",
  description: "",
  shareMode: "private",
  shareWith: "",
};

export const WORKSPACE_NEW = "WORKSPACE_NEW";
export const WORKSPACE_EDIT = "WORKSPACE_EDIT";
export const WORKSPACE_DELETE = "WORKSPACE_DELETE";

export const useWorkspaces = create((set) => ({
  // --- STATE ---
  workspaces: [],
  selectedWorkspace: null,
  formData: null,
  screenMode: "view",
  isLoading: false,
  error: null,

  // --- UI ---
  openWorkspaceNewModal: () =>
    set({ screenMode: WORKSPACE_NEW, formData: { ...DEFAULT_WORKSPACE_FORM } }),
  openWorkspaceEditModal: (workspace) =>
    set({ screenMode: WORKSPACE_EDIT, formData: { ...workspace } }),
  openWorkspaceDeleteModal: (workspace) =>
    set({ screenMode: WORKSPACE_DELETE, formData: { ...workspace } }),
  closeModal: () => set({ screenMode: "view", formData: null }),

  // --- ACTIONS ---
  setSelectedWorkspace: (workspace) => set({ selectedWorkspace: workspace }),

  // READ (ALL)
  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await workspacesClient.getWorkspaces();
      set({ workspaces: response || [] });
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      set({ error: error?.message || "Failed to load workspaces" });
    } finally {
      set({ isLoading: false });
    }
  },

  // Backward compatibility alias
  loadWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await workspacesClient.getWorkspaces();
      set({ workspaces: response || [] });
    } catch (error) {
      console.error("Error loading workspaces:", error);
      set({ error: error?.message || "Failed to load workspaces" });
    } finally {
      set({ isLoading: false });
    }
  },

  // READ (SINGLE)
  fetchWorkspaceById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await workspacesClient.getWorkspace(id);
      set({ selectedWorkspace: response });
    } catch (error) {
      console.error(`Error fetching workspace [ID: ${id}]:`, error);
      set({ error: error?.message || "Failed to load workspace" });
    } finally {
      set({ isLoading: false });
    }
  },

  // CREATE
  createWorkspace: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await workspacesClient.createWorkspace(payload);
      const newWorkspace = response || payload;

      set((state) => ({
        workspaces: [...state.workspaces, newWorkspace],
        selectedWorkspace: response,
        screenMode: "view",
        formData: null,
      }));
    } catch (error) {
      console.error("Error creating workspace:", error);
      set({ error: error?.message || "Failed to create workspace" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // UPDATE
  updateWorkspace: async (payload) => {
    if (!payload.id) {
      console.error("Update failed: Payload missing 'id' field");
      set({ error: "Workspace ID is required for update" });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await workspacesClient.updateWorkspace(payload);
      const updatedWorkspace = response || payload;

      set((state) => ({
        workspaces: state.workspaces.map((ws) =>
          ws.id === updatedWorkspace.id ? updatedWorkspace : ws,
        ),
        selectedWorkspace:
          state.selectedWorkspace?.id === updatedWorkspace.id
            ? updatedWorkspace
            : state.selectedWorkspace,
        screenMode: "view",
        formData: null,
      }));
    } catch (error) {
      console.error(`Error updating workspace [ID: ${payload.id}]:`, error);
      set({ error: error?.message || "Failed to update workspace" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // DELETE
  deleteWorkspace: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await workspacesClient.deleteWorkspace(id);

      set((state) => ({
        workspaces: state.workspaces.filter((ws) => ws.id !== id),
        selectedWorkspace:
          state.selectedWorkspace?.id === id ? null : state.selectedWorkspace,
        screenMode: "view",
        formData: null,
      }));
    } catch (error) {
      console.error(`Error deleting workspace [ID: ${id}]:`, error);
      set({ error: error?.message || "Failed to delete workspace" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // REFRESH
  refreshWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const list = await workspacesClient.getWorkspaces();
      set({ workspaces: list || [] });
    } catch (error) {
      console.error("Error refreshing workspaces:", error);
      set({ error: error?.message || "Failed to refresh workspaces" });
    } finally {
      set({ isLoading: false });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
