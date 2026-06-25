import { create } from "zustand";

export const SEARCH_SCOPES = {
  ALL: "all",
  WORKSPACES: "workspaces",
  PROMPTS: "prompts",
  DOCUMENTS: "documents",
};

export const useUIStore = create((set) => ({
  // --- SEARCH STATE ---
  searchQuery: "",
  searchScope: SEARCH_SCOPES.ALL,

  // --- MODAL STATE ---
  isDocumentSelectorOpen: false,
  editingTokenId: null,

  // --- ACTIONS ---
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchScope: (scope) => set({ searchScope: scope }),

  openDocumentSelector: () => set({ isDocumentSelectorOpen: true }),
  closeDocumentSelector: () => set({ isDocumentSelectorOpen: false }),

  setEditingTokenId: (tokenId) => set({ editingTokenId: tokenId }),
  clearEditingTokenId: () => set({ editingTokenId: null }),
}));
