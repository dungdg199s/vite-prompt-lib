import { create } from "zustand";

const EMPTY_TABS = [];

export const useWorkspaceTabsStore = create((set, get) => ({
  tabsByWorkspace: {},

  getTabs: (workspaceId) => {
    const state = get();
    return state.tabsByWorkspace[workspaceId] || EMPTY_TABS;
  },

  addTab: (workspaceId, tab) => {
    if (!workspaceId || !tab?.id) return;

    set((state) => {
      const currentTabs = state.tabsByWorkspace[workspaceId] || [];
      const exists = currentTabs.some((t) => t.id === tab.id);
      if (exists) return state;

      return {
        tabsByWorkspace: {
          ...state.tabsByWorkspace,
          [workspaceId]: [...currentTabs, tab],
        },
      };
    });
  },

  closeTab: (workspaceId, tabId) => {
    if (!workspaceId || !tabId) return;

    set((state) => {
      const currentTabs = state.tabsByWorkspace[workspaceId] || [];
      return {
        tabsByWorkspace: {
          ...state.tabsByWorkspace,
          [workspaceId]: currentTabs.filter((t) => t.id !== tabId),
        },
      };
    });
  },

  setTabs: (workspaceId, tabs) => {
    if (!workspaceId) return;

    set((state) => ({
      tabsByWorkspace: {
        ...state.tabsByWorkspace,
        [workspaceId]: Array.isArray(tabs) ? tabs : [],
      },
    }));
  },

  clearWorkspaceTabs: (workspaceId) => {
    if (!workspaceId) return;

    set((state) => ({
      tabsByWorkspace: {
        ...state.tabsByWorkspace,
        [workspaceId]: [],
      },
    }));
  },

  removeWorkspaceTabs: (workspaceId) => {
    if (!workspaceId) return;

    set((state) => {
      const next = { ...state.tabsByWorkspace };
      delete next[workspaceId];
      return { tabsByWorkspace: next };
    });
  },
}));
