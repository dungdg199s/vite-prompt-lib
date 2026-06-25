import { create } from "zustand";
import { documentsClient } from "../lib/documents-client";

export const DEFAULT_DOCUMENT_FORM = {
  name: "",
  description: "",
  content: "",
  contentType: "text",
};

export const DOCUMENT_NEW = "DOCUMENT_NEW";
export const DOCUMENT_EDIT = "DOCUMENT_EDIT";
export const DOCUMENT_DELETE = "DOCUMENT_DELETE";

export const useDocuments = create((set) => ({
  // --- STATE ---
  documents: [],
  selectedDocument: null,
  formData: null,
  screenMode: "view",
  isLoading: false,
  error: null,

  // --- UI ---
  openDocumentNewModal: () =>
    set({ screenMode: DOCUMENT_NEW, formData: { ...DEFAULT_DOCUMENT_FORM } }),
  openDocumentEditModal: (document) =>
    set({ screenMode: DOCUMENT_EDIT, formData: { ...document } }),
  openDocumentDeleteModal: (document) =>
    set({ screenMode: DOCUMENT_DELETE, formData: { ...document } }),
  closeModal: () => set({ screenMode: "view", formData: null }),

  // --- ACTIONS ---
  setSelectedDocument: (document) => set({ selectedDocument: document }),

  // READ (ALL)
  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await documentsClient.getDocuments();
      set({ documents: response || [] });
    } catch (error) {
      console.error("Error fetching documents:", error);
      set({ error: error?.message || "Failed to load documents" });
    } finally {
      set({ isLoading: false });
    }
  },

  // READ (SINGLE)
  fetchDocumentById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await documentsClient.getDocument(id);
      set({ selectedDocument: response });
    } catch (error) {
      console.error(`Error fetching document [ID: ${id}]:`, error);
      set({ error: error?.message || "Failed to load document" });
    } finally {
      set({ isLoading: false });
    }
  },

  // CREATE
  createDocument: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await documentsClient.createDocument(payload);
      const newDocument = response || payload;

      set((state) => ({
        documents: [...state.documents, newDocument],
        selectedDocument: response,
        screenMode: "view",
        formData: null,
      }));
    } catch (error) {
      console.error("Error creating document:", error);
      set({ error: error?.message || "Failed to create document" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // UPDATE
  updateDocument: async (payload) => {
    if (!payload.id) {
      console.error("Update failed: Payload missing 'id' field");
      set({ error: "Document ID is required for update" });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await documentsClient.updateDocument(payload);
      const updatedDocument = response || payload;

      set((state) => ({
        documents: state.documents.map((d) =>
          d.id === updatedDocument.id ? updatedDocument : d,
        ),
        selectedDocument:
          state.selectedDocument?.id === updatedDocument.id
            ? updatedDocument
            : state.selectedDocument,
        screenMode: "view",
        formData: null,
      }));
    } catch (error) {
      console.error(`Error updating document [ID: ${payload.id}]:`, error);
      set({ error: error?.message || "Failed to update document" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // DELETE
  deleteDocument: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await documentsClient.deleteDocument(id);

      set((state) => ({
        documents: state.documents.filter((d) => d.id !== id),
        selectedDocument:
          state.selectedDocument?.id === id ? null : state.selectedDocument,
        screenMode: "view",
        formData: null,
      }));
    } catch (error) {
      console.error(`Error deleting document [ID: ${id}]:`, error);
      set({ error: error?.message || "Failed to delete document" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // REFRESH
  refreshDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const list = await documentsClient.getDocuments();
      set({ documents: list || [] });
    } catch (error) {
      console.error("Error refreshing documents:", error);
      set({ error: error?.message || "Failed to refresh documents" });
    } finally {
      set({ isLoading: false });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
