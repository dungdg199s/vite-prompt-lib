import { create } from "zustand";
import { workspacesClient } from "../lib/workspacesClient";

const EMPTY_WORKSPACES = [];

export const useWorkspacesStore = create((set) => ({
  workspaces: EMPTY_WORKSPACES,
  isLoading: false,
  error: null,

  // {
  //   [id]: { isLoading, data, error }
  // }
  recordState: {},

  // ===== READ ALL =====
  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await workspacesClient.getWorkspaces();
      set({
        workspaces: res && res.length > 0 ? res : EMPTY_WORKSPACES,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err?.message || 'Failed to fetch workspaces',
      });
    }
  },

  // ===== READ ONE =====
  fetchWorkspaceById: async (id) => {
    set((state) => ({
      recordState: {
        ...state.recordState,
        [id]: {
          isLoading: true,
          data: state.recordState?.[id]?.data || null,
          error: null,
        },
      },
    }));

    try {
      const res = await workspacesClient.getWorkspace(id);
      const data = res || null;

      set((state) => ({
        recordState: {
          ...state.recordState,
          [id]: {
            isLoading: false,
            data,
            error: null,
          },
        },
      }));
    } catch (err) {
      set((state) => ({
        recordState: {
          ...state.recordState,
          [id]: {
            isLoading: false,
            data: state.recordState?.[id]?.data || null,
            error: err?.message || `Failed to fetch workspace ${id}`,
          },
        },
      }));
    }
  },

  // ===== CREATE =====
  createWorkspace: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await workspacesClient.createWorkspace(payload);
      const created = res || null;

      set((state) => ({
        workspaces: created ? [created, ...state.workspaces] : state.workspaces,
        isLoading: false,
      }));

      return created;
    } catch (err) {
      set({
        isLoading: false,
        error: err?.message || 'Failed to create workspace',
      });
      return null;
    }
  },

  // ===== UPDATE =====
  updateWorkspace: async (id, payload) => {
    set({ isLoading: true, error: null });

    // optional: set loading cho record cụ thể
    set((state) => ({
      recordState: {
        ...state.recordState,
        [id]: {
          isLoading: true,
          data: state.recordState?.[id]?.data || null,
          error: null,
        },
      },
    }));

    try {
      const res = await workspacesClient.updateWorkspace(id, payload);
      const updated = res || null;

      set((state) => ({
        workspaces: updated ? state.workspaces.map((w) => (w?.id === id ? updated : w)) : state.workspaces,
        isLoading: false,
        recordState: {
          ...state.recordState,
          [id]: {
            isLoading: false,
            data: updated,
            error: null,
          },
        },
      }));

      return updated;
    } catch (err) {
      set((state) => ({
        isLoading: false,
        error: err?.message || `Failed to update workspace ${id}`,
        recordState: {
          ...state.recordState,
          [id]: {
            isLoading: false,
            data: state.recordState?.[id]?.data || null,
            error: err?.message || `Failed to update workspace ${id}`,
          },
        },
      }));
      return null;
    }
  },

  // ===== DELETE =====
  deleteWorkspace: async (id) => {
    set({ isLoading: true, error: null });

    set((state) => ({
      recordState: {
        ...state.recordState,
        [id]: {
          isLoading: true,
          data: state.recordState?.[id]?.data || null,
          error: null,
        },
      },
    }));

    try {
      await workspacesClient.deleteWorkspace(id);

      set((state) => {
        const nextRecordState = { ...state.recordState };
        delete nextRecordState[id];

        return {
          workspaces: state.workspaces.filter((w) => w?.id !== id),
          isLoading: false,
          recordState: nextRecordState,
        };
      });

      return true;
    } catch (err) {
      set((state) => ({
        isLoading: false,
        error: err?.message || `Failed to delete workspace ${id}`,
        recordState: {
          ...state.recordState,
          [id]: {
            isLoading: false,
            data: state.recordState?.[id]?.data || null,
            error: err?.message || `Failed to delete workspace ${id}`,
          },
        },
      }));
      return false;
    }
  },

  // tiện ích nếu muốn reset 1 record
  resetRecordById: (id) => {
    set((state) => {
      const nextRecordState = { ...state.recordState };
      delete nextRecordState[id];
      return { recordState: nextRecordState };
    });
  },

  // tiện ích nếu muốn reset toàn bộ recordState
  resetAllRecordState: () => set({ recordState: {} }),
}));
