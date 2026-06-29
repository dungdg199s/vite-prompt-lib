import { create } from 'zustand';
import { workspacesClient } from '../lib/workspacesClient';

const EMPTY_DOCUMENTS = [];

export const useDocumentsStore = create((set) => ({
  documents: EMPTY_DOCUMENTS,
  isLoading: false,
  error: null,

  // {
  //   [id]: { isLoading, data, error }
  // }
  recordState: {},

  // ===== READ ALL =====
  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await workspacesClient.getDocuments();
      set({
        documents: res && res.length > 0 ? res : EMPTY_DOCUMENTS,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err?.message || 'Failed to fetch documents',
      });
    }
  },

  // ===== READ ONE =====
  fetchDocumentById: async (id) => {
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
      const res = await workspacesClient.getDocument(id);
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
            error: err?.message || `Failed to fetch document ${id}`,
          },
        },
      }));
    }
  },

  // ===== CREATE =====
  createDocument: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await workspacesClient.createDocument(payload);
      const created = res || null;

      set((state) => ({
        documents: created ? [created, ...state.documents] : state.documents,
        isLoading: false,
      }));

      return created;
    } catch (err) {
      set({
        isLoading: false,
        error: err?.message || 'Failed to create document',
      });
      return null;
    }
  },

  // ===== UPDATE =====
  updateDocument: async (id, payload) => {
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
      const res = await workspacesClient.updateDocument(id, payload);
      const updated = res || null;

      set((state) => ({
        documents: updated ? state.documents.map((d) => (d?.id === id ? updated : d)) : state.documents,
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
        error: err?.message || `Failed to update document ${id}`,
        recordState: {
          ...state.recordState,
          [id]: {
            isLoading: false,
            data: state.recordState?.[id]?.data || null,
            error: err?.message || `Failed to update document ${id}`,
          },
        },
      }));
      return null;
    }
  },

  // ===== DELETE =====
  deleteDocument: async (id) => {
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
      await workspacesClient.deleteDocument(id);

      set((state) => {
        const nextRecordState = { ...state.recordState };
        delete nextRecordState[id];

        return {
          documents: state.documents.filter((d) => d?.id !== id),
          isLoading: false,
          recordState: nextRecordState,
        };
      });

      return true;
    } catch (err) {
      set((state) => ({
        isLoading: false,
        error: err?.message || `Failed to delete document ${id}`,
        recordState: {
          ...state.recordState,
          [id]: {
            isLoading: false,
            data: state.recordState?.[id]?.data || null,
            error: err?.message || `Failed to delete document ${id}`,
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
