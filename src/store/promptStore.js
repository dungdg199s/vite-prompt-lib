import { create } from "zustand";
import { promptsClient } from "../lib/prompts-client";

export const DEFAULT_PROMPT_FORM = {
  name: "",
  description: "",
  content: "",
};

export const PROMPT_NEW = "PROMPT_NEW";
export const PROMPT_EDIT = "PROMPT_EDIT";
export const PROMPT_DELETE = "PROMPT_DELETE";

export const usePrompts = create((set) => ({
  // --- STATE ---
  prompts: [],
  selectedPrompt: null,
  formData: null,
  screenMode: "view",
  isLoading: false,
  error: null,

  // --- UI ---
  openPromptNewModal: () =>
    set({ screenMode: PROMPT_NEW, formData: { ...DEFAULT_PROMPT_FORM } }),
  openPromptEditModal: (prompt) =>
    set({ screenMode: PROMPT_EDIT, formData: { ...prompt } }),
  openPromptDeleteModal: (prompt) =>
    set({ screenMode: PROMPT_DELETE, formData: { ...prompt } }),
  closeModal: () => set({ screenMode: "view", formData: null }),

  // --- ACTIONS ---
  setSelectedPrompt: (prompt) => set({ selectedPrompt: prompt }),

  // READ (ALL)
  fetchPrompts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await promptsClient.getPrompts();
      set({ prompts: response || [] });
    } catch (error) {
      console.error("Error fetching prompts:", error);
      set({ error: error?.message || "Failed to load prompts" });
    } finally {
      set({ isLoading: false });
    }
  },

  // READ (SINGLE)
  fetchPromptById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await promptsClient.getPrompt(id);
      set({ selectedPrompt: response });
    } catch (error) {
      console.error(`Error fetching prompt [ID: ${id}]:`, error);
      set({ error: error?.message || "Failed to load prompt" });
    } finally {
      set({ isLoading: false });
    }
  },

  // CREATE
  createPrompt: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await promptsClient.createPrompt(payload);
      const newPrompt = response || payload;

      set((state) => ({
        prompts: [...state.prompts, newPrompt],
        selectedPrompt: response,
        screenMode: "view",
        formData: null,
      }));
    } catch (error) {
      console.error("Error creating prompt:", error);
      set({ error: error?.message || "Failed to create prompt" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // UPDATE
  updatePrompt: async (payload) => {
    if (!payload.id) {
      console.error("Update failed: Payload missing 'id' field");
      set({ error: "Prompt ID is required for update" });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await promptsClient.updatePrompt(payload);
      const updatedPrompt = response || payload;

      set((state) => ({
        prompts: state.prompts.map((p) =>
          p.id === updatedPrompt.id ? updatedPrompt : p,
        ),
        selectedPrompt:
          state.selectedPrompt?.id === updatedPrompt.id
            ? updatedPrompt
            : state.selectedPrompt,
        screenMode: "view",
        formData: null,
      }));
    } catch (error) {
      console.error(`Error updating prompt [ID: ${payload.id}]:`, error);
      set({ error: error?.message || "Failed to update prompt" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // DELETE
  deletePrompt: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await promptsClient.deletePrompt(id);

      set((state) => ({
        prompts: state.prompts.filter((p) => p.id !== id),
        selectedPrompt:
          state.selectedPrompt?.id === id ? null : state.selectedPrompt,
        screenMode: "view",
        formData: null,
      }));
    } catch (error) {
      console.error(`Error deleting prompt [ID: ${id}]:`, error);
      set({ error: error?.message || "Failed to delete prompt" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // REFRESH
  refreshPrompts: async () => {
    set({ isLoading: true, error: null });
    try {
      const list = await promptsClient.getPrompts();
      set({ prompts: list || [] });
    } catch (error) {
      console.error("Error refreshing prompts:", error);
      set({ error: error?.message || "Failed to refresh prompts" });
    } finally {
      set({ isLoading: false });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
