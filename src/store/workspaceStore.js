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

export const useWorkspaces = create((set, get) => ({
  // --- STATE ---
  workspaces: [],
  selectedWorkspace: null,
  formData: null,
  screenMode: "view",
  isLoading: false,

  // --- UI ---
  openWorkspaceNewModal: () =>
    set({ screenMode: WORKSPACE_NEW, formData: { ...DEFAULT_WORKSPACE_FORM } }),
  openWorkspaceEditModal: (workspace) =>
    set({ screenMode: WORKSPACE_EDIT, formData: { ...workspace } }),
  openWorkspaceDeleteModal: (workspace) =>
    set({ screenMode: WORKSPACE_DELETE, formData: { ...workspace } }),

  // --- ACTIONS ---
  setSelectedWorkspace: (workspace) => set({ selectedWorkspace: workspace }),

  // READ (ALL)
  fetchWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const response = await workspacesClient.getWorkspaces();
      set({ workspaces: response });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách workspaces:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  // READ (SINGLE): Lấy chi tiết theo ID
  fetchWorkspaceById: async (id) => {
    set({ isLoading: true });
    try {
      const response = await workspacesClient.getWorkspace(id);
      set({ selectedWorkspace: response });
    } catch (error) {
      console.error(`Lỗi khi lấy thông tin workspace [ID: ${id}]:`, error);
    } finally {
      set({ isLoading: false });
    }
  },

  // CREATE
  createWorkspace: async (payload) => {
    set({ isLoading: true });
    try {
      const response = await workspacesClient.createWorkspace(payload);
      const newWorkspace = response || payload;

      set((state) => ({
        workspaces: [...state.workspaces, newWorkspace],
        selectedWorkspace: response,
        screenMode: "view",
      }));
    } catch (error) {
      console.error("Lỗi khi tạo workspace:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // UPDATE: Cập nhật và mapping bằng ID
  updateWorkspace: async (payload) => {
    // Đảm bảo payload gửi lên có chứa id
    if (!payload.id) {
      console.error("Cập nhật thất bại: Payload thiếu trường 'id'");
      return;
    }

    set({ isLoading: true });
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
      }));
    } catch (error) {
      console.error(`Lỗi khi cập nhật workspace [ID: ${payload.id}]:`, error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // DELETE: Xóa và mapping bằng ID
  deleteWorkspace: async (id) => {
    set({ isLoading: true });
    try {
      await workspacesClient.deleteWorkspace(id);

      set((state) => ({
        workspaces: state.workspaces.filter((ws) => ws.id !== id),
        selectedWorkspace:
          state.selectedWorkspace?.id === id ? null : state.selectedWorkspace,
        screenMode: "view",
      }));
    } catch (error) {
      console.error(`Lỗi khi xóa workspace [ID: ${id}]:`, error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
