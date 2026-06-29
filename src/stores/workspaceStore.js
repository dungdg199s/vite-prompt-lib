import { create } from 'zustand';
import { workspacesClient } from '../lib/workspacesClient';
import { useToastStore } from './toastStore';

const toMessage = (err) => {
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
};

const safeArray = (val) => (Array.isArray(val) ? val : []);

const mergeById = (list, item) => {
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx === -1) return [item, ...list];
  const next = [...list];
  next[idx] = { ...next[idx], ...item };
  return next;
};

const removeById = (list, id) => list.filter((x) => x.id !== id);

// ===== Tabs helpers =====
const tabKey = (tab) => `${tab.type}:${tab.id}`;

const upsertTab = (tabs, tab) => {
  const i = tabs.findIndex((t) => tabKey(t) === tabKey(tab));
  if (i === -1) return [...tabs, tab];
  const next = [...tabs];
  next[i] = { ...next[i], ...tab };
  return next;
};

const normalizeTabs = (tabs, activeTabKey = null) => {
  // Rule: workspace tab luôn đứng đầu tiên (nếu có)
  const workspaceTabs = tabs.filter((t) => t.type === 'workspace');
  const otherTabs = tabs.filter((t) => t.type !== 'workspace');

  // giữ duy nhất tab workspace đầu tiên (tránh duplicated workspace tab)
  const firstWorkspace = workspaceTabs[0];
  const normalized = firstWorkspace ? [firstWorkspace, ...otherTabs] : otherTabs;

  let nextActiveKey = activeTabKey;
  if (nextActiveKey && !normalized.some((t) => tabKey(t) === nextActiveKey)) {
    nextActiveKey = normalized.length ? tabKey(normalized[0]) : null;
  }

  return { tabs: normalized, activeTabKey: nextActiveKey };
};

const withTabsNormalized = (state, updater) => {
  const { tabs, activeTabKey } = updater(state);
  const normalized = normalizeTabs(tabs, activeTabKey);
  return { ...state, ...normalized };
};

export const useWorkspaceStore = create((set) => ({
  // ===== Data =====
  workspaces: [],
  workspaceById: {},

  promptsByWorkspace: {},
  promptById: {},

  documentsByWorkspace: {},
  documentById: {},

  // tabs client-side
  tabs: [],
  activeTabKey: null, // format: `${type}:${id}`

  // ===== Loading =====
  listLoading: {
    workspaces: false,
    promptsByWorkspace: {},
    documentsByWorkspace: {},
  },

  recordLoading: {
    workspace: {},
    prompt: {},
    document: {},

    creatingWorkspace: false,
    creatingPrompt: false,
    creatingDocument: false,
  },

  // ===== Error map =====
  errorByKey: {},

  clearError: (key) =>
    set((s) => {
      if (!key) {
        return { errorByKey: {} };
      }

      const nextErrors = { ...s.errorByKey };
      delete nextErrors[key];
      return { errorByKey: nextErrors };
    }),

  // ===== tabs actions =====
  openTab: (tab) =>
    set((s) => {
      const nextTabs = upsertTab(s.tabs, tab);
      const nextState = { tabs: nextTabs, activeTabKey: tabKey(tab) };
      return withTabsNormalized(s, () => nextState);
    }),

  setActiveTab: (tabOrKey) =>
    set((s) => {
      const key = typeof tabOrKey === 'string' ? tabOrKey : tabKey(tabOrKey);
      const exists = s.tabs.some((t) => tabKey(t) === key);
      return { activeTabKey: exists ? key : s.activeTabKey };
    }),

  closeTab: (tabOrKey) =>
    set((s) => {
      const key = typeof tabOrKey === 'string' ? tabOrKey : tabKey(tabOrKey);
      const idx = s.tabs.findIndex((t) => tabKey(t) === key);
      if (idx === -1) return s;

      const nextTabs = s.tabs.filter((t) => tabKey(t) !== key);

      let nextActiveKey = s.activeTabKey;
      if (s.activeTabKey === key) {
        // ưu tiên tab bên trái, nếu không có thì tab đầu tiên
        const left = nextTabs[idx - 1];
        const fallback = nextTabs[0];
        nextActiveKey = left ? tabKey(left) : fallback ? tabKey(fallback) : null;
      }

      return withTabsNormalized(s, () => ({
        tabs: nextTabs,
        activeTabKey: nextActiveKey,
      }));
    }),

  renameTab: (tabOrKey, name) =>
    set((s) => {
      const key = typeof tabOrKey === 'string' ? tabOrKey : tabKey(tabOrKey);
      const nextTabs = s.tabs.map((t) => (tabKey(t) === key ? { ...t, name } : t));
      return withTabsNormalized(s, () => ({
        tabs: nextTabs,
        activeTabKey: s.activeTabKey,
      }));
    }),

  clearTabs: () => set({ tabs: [], activeTabKey: null }),

  // Sync route -> tabs
  // route shape:
  // /workspaces/:workspaceId/view
  // /workspaces/:workspaceId/prompts/:promptId/view
  // /workspaces/:workspaceId/documents/:documentId/view
  syncTabsWithRoute: ({ workspaceId, promptId, documentId }) =>
    set((s) => {
      let nextTabs = [...s.tabs];
      let nextActiveKey = s.activeTabKey;

      if (!workspaceId) {
        return withTabsNormalized(s, () => ({
          tabs: nextTabs,
          activeTabKey: nextActiveKey,
        }));
      }

      const ws = s.workspaceById[workspaceId];
      const workspaceTab = {
        id: workspaceId,
        type: 'workspace',
        name: ws?.name || 'Workspace',
      };
      nextTabs = upsertTab(nextTabs, workspaceTab);

      if (promptId) {
        const p = s.promptById[promptId];
        nextTabs = upsertTab(nextTabs, {
          id: promptId,
          type: 'prompt',
          name: p?.name || 'Prompt',
        });
        nextActiveKey = `prompt:${promptId}`;
      } else if (documentId) {
        const d = s.documentById[documentId];
        nextTabs = upsertTab(nextTabs, {
          id: documentId,
          type: 'document',
          name: d?.name || 'Document',
        });
        nextActiveKey = `document:${documentId}`;
      } else {
        nextActiveKey = `workspace:${workspaceId}`;
      }

      return withTabsNormalized(s, () => ({
        tabs: nextTabs,
        activeTabKey: nextActiveKey,
      }));
    }),

  // ===== Workspace CRUD =====
  fetchWorkspaces: async () => {
    set((s) => ({
      listLoading: { ...s.listLoading, workspaces: true },
      errorByKey: { ...s.errorByKey, fetchWorkspaces: undefined },
    }));

    try {
      const res = await workspacesClient.getWorkspaces();
      const items = safeArray(res?.data ?? res);

      const byId = items.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});

      set((s) => ({
        workspaces: items,
        workspaceById: { ...s.workspaceById, ...byId },
        tabs: s.tabs.map((t) => {
          if (t.type !== 'workspace') return t;
          const ws = byId[t.id] || s.workspaceById[t.id];
          return ws ? { ...t, name: ws.name } : t;
        }),
      }));
    } catch (err) {
      const message = toMessage(err);
      set((s) => ({
        errorByKey: { ...s.errorByKey, fetchWorkspaces: message },
      }));
      useToastStore.getState().error(`Load workspaces failed: ${message}`);
    } finally {
      set((s) => ({
        listLoading: { ...s.listLoading, workspaces: false },
      }));
    }
  },

  fetchWorkspace: async (id) => {
    set((s) => ({
      recordLoading: {
        ...s.recordLoading,
        workspace: { ...s.recordLoading.workspace, [id]: true },
      },
      errorByKey: { ...s.errorByKey, [`fetchWorkspace:${id}`]: undefined },
    }));

    try {
      const res = await workspacesClient.getWorkspace(id);
      const item = res?.data ?? res;

      set((s) => {
        const nextTabs = s.tabs.map((t) => (t.type === 'workspace' && t.id === id ? { ...t, name: item.name } : t));
        return {
          workspaceById: { ...s.workspaceById, [id]: item },
          workspaces: mergeById(s.workspaces, item),
          ...normalizeTabs(nextTabs, s.activeTabKey),
        };
      });

      return item;
    } catch (err) {
      const message = toMessage(err);
      set((s) => ({
        errorByKey: { ...s.errorByKey, [`fetchWorkspace:${id}`]: message },
      }));
      useToastStore.getState().error(`Load workspace failed: ${message}`);
      return undefined;
    } finally {
      set((s) => ({
        recordLoading: {
          ...s.recordLoading,
          workspace: { ...s.recordLoading.workspace, [id]: false },
        },
      }));
    }
  },

  createWorkspace: async (payload) => {
    set((s) => ({
      recordLoading: { ...s.recordLoading, creatingWorkspace: true },
      errorByKey: { ...s.errorByKey, createWorkspace: undefined },
    }));

    try {
      const res = await workspacesClient.createWorkspace(payload);
      const created = res?.data ?? res;

      set((s) => ({
        workspaces: [created, ...s.workspaces],
        workspaceById: { ...s.workspaceById, [created.id]: created },
      }));

      return created;
    } catch (err) {
      const message = toMessage(err);
      set((s) => ({
        errorByKey: { ...s.errorByKey, createWorkspace: message },
      }));
      useToastStore.getState().error(`Create workspace failed: ${message}`);
      return undefined;
    } finally {
      set((s) => ({
        recordLoading: { ...s.recordLoading, creatingWorkspace: false },
      }));
    }
  },

  updateWorkspace: async (id, payload) => {
    set((s) => ({
      recordLoading: {
        ...s.recordLoading,
        workspace: { ...s.recordLoading.workspace, [id]: true },
      },
      errorByKey: { ...s.errorByKey, [`updateWorkspace:${id}`]: undefined },
    }));

    try {
      const res = await workspacesClient.updateWorkspace(id, payload);
      const updated = res?.data ?? res;

      set((s) => {
        const nextTabs = s.tabs.map((t) => (t.type === 'workspace' && t.id === id ? { ...t, name: updated.name } : t));
        return {
          workspaceById: { ...s.workspaceById, [id]: updated },
          workspaces: mergeById(s.workspaces, updated),
          ...normalizeTabs(nextTabs, s.activeTabKey),
        };
      });

      return updated;
    } catch (err) {
      const message = toMessage(err);
      set((s) => ({
        errorByKey: { ...s.errorByKey, [`updateWorkspace:${id}`]: message },
      }));
      useToastStore.getState().error(`Update workspace failed: ${message}`);
      return undefined;
    } finally {
      set((s) => ({
        recordLoading: {
          ...s.recordLoading,
          workspace: { ...s.recordLoading.workspace, [id]: false },
        },
      }));
    }
  },

  deleteWorkspace: async (id) => {
    set((s) => ({
      recordLoading: {
        ...s.recordLoading,
        workspace: { ...s.recordLoading.workspace, [id]: true },
      },
      errorByKey: { ...s.errorByKey, [`deleteWorkspace:${id}`]: undefined },
    }));

    try {
      await workspacesClient.deleteWorkspace(id);

      set((s) => {
        const nextById = { ...s.workspaceById };
        delete nextById[id];

        const nextPrompts = { ...s.promptsByWorkspace };
        const nextDocs = { ...s.documentsByWorkspace };
        delete nextPrompts[id];
        delete nextDocs[id];

        const nextTabs = s.tabs.filter((t) => {
          if (t.type === 'workspace' && t.id === id) return false;
          return true;
        });

        return {
          workspaceById: nextById,
          workspaces: removeById(s.workspaces, id),
          promptsByWorkspace: nextPrompts,
          documentsByWorkspace: nextDocs,
          ...normalizeTabs(nextTabs, s.activeTabKey),
        };
      });

      return true;
    } catch (err) {
      const message = toMessage(err);
      set((s) => ({
        errorByKey: { ...s.errorByKey, [`deleteWorkspace:${id}`]: message },
      }));
      useToastStore.getState().error(`Delete workspace failed: ${message}`);
      return false;
    } finally {
      set((s) => ({
        recordLoading: {
          ...s.recordLoading,
          workspace: { ...s.recordLoading.workspace, [id]: false },
        },
      }));
    }
  },

  // ===== Prompt CRUD =====
  fetchPrompts: async (workspaceId) => {
    set((s) => ({
      listLoading: {
        ...s.listLoading,
        promptsByWorkspace: { ...s.listLoading.promptsByWorkspace, [workspaceId]: true },
      },
      errorByKey: { ...s.errorByKey, [`fetchPrompts:${workspaceId}`]: undefined },
    }));

    try {
      const res = await workspacesClient.getPrompts(workspaceId);
      const items = safeArray(res?.data ?? res);

      const map = items.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {});

      set((s) => {
        const nextTabs = s.tabs.map((t) => {
          if (t.type !== 'prompt') return t;
          const latest = map[t.id] || s.promptById[t.id];
          return latest ? { ...t, name: latest.name } : t;
        });

        return {
          promptsByWorkspace: { ...s.promptsByWorkspace, [workspaceId]: items },
          promptById: { ...s.promptById, ...map },
          ...normalizeTabs(nextTabs, s.activeTabKey),
        };
      });
    } catch (err) {
      const message = toMessage(err);
      set((s) => ({
        errorByKey: { ...s.errorByKey, [`fetchPrompts:${workspaceId}`]: message },
      }));
      useToastStore.getState().error(`Load prompts failed: ${message}`);
    } finally {
      set((s) => ({
        listLoading: {
          ...s.listLoading,
          promptsByWorkspace: { ...s.listLoading.promptsByWorkspace, [workspaceId]: false },
        },
      }));
    }
  },

  fetchPrompt: async (id) => {
    set((s) => ({
      recordLoading: { ...s.recordLoading, prompt: { ...s.recordLoading.prompt, [id]: true } },
      errorByKey: { ...s.errorByKey, [`fetchPrompt:${id}`]: undefined },
    }));

    try {
      const res = await workspacesClient.getPrompt(id);
      const item = res?.data ?? res;

      set((s) => {
        const nextTabs = s.tabs.map((t) => (t.type === 'prompt' && t.id === id ? { ...t, name: item.name } : t));
        return {
          promptById: { ...s.promptById, [id]: item },
          ...normalizeTabs(nextTabs, s.activeTabKey),
        };
      });

      return item;
    } catch (err) {
      const message = toMessage(err);
      set((s) => ({
        errorByKey: { ...s.errorByKey, [`fetchPrompt:${id}`]: message },
      }));
      useToastStore.getState().error(`Load prompt failed: ${message}`);
      return undefined;
    } finally {
      set((s) => ({
        recordLoading: { ...s.recordLoading, prompt: { ...s.recordLoading.prompt, [id]: false } },
      }));
    }
  },

  createPrompt: async (payload) => {
    set((s) => ({
      recordLoading: { ...s.recordLoading, creatingPrompt: true },
      errorByKey: { ...s.errorByKey, createPrompt: undefined },
    }));

    try {
      const res = await workspacesClient.createPrompt(payload);
      const created = res?.data ?? res;
      const workspaceId = payload.workspaceId;

      set((s) => ({
        promptById: { ...s.promptById, [created.id]: created },
        promptsByWorkspace: {
          ...s.promptsByWorkspace,
          [workspaceId]: [created, ...(s.promptsByWorkspace[workspaceId] ?? [])],
        },
      }));

      return created;
    } catch (err) {
      const message = toMessage(err);
      set((s) => ({
        errorByKey: { ...s.errorByKey, createPrompt: message },
      }));
      useToastStore.getState().error(`Create prompt failed: ${message}`);
      return undefined;
    } finally {
      set((s) => ({
        recordLoading: { ...s.recordLoading, creatingPrompt: false },
      }));
    }
  },

  updatePrompt: async (id, payload) => {
    set((s) => ({
      recordLoading: { ...s.recordLoading, prompt: { ...s.recordLoading.prompt, [id]: true } },
      errorByKey: { ...s.errorByKey, [`updatePrompt:${id}`]: undefined },
    }));

    try {
      const res = await workspacesClient.updatePrompt(id, payload);
      const updated = res?.data ?? res;

      set((s) => {
        const nextPromptsByWorkspace = {};
        for (const wsId of Object.keys(s.promptsByWorkspace)) {
          nextPromptsByWorkspace[wsId] = s.promptsByWorkspace[wsId].map((p) =>
            p.id === id ? { ...p, ...updated } : p
          );
        }

        const nextTabs = s.tabs.map((t) => (t.type === 'prompt' && t.id === id ? { ...t, name: updated.name } : t));

        return {
          promptById: { ...s.promptById, [id]: updated },
          promptsByWorkspace: nextPromptsByWorkspace,
          ...normalizeTabs(nextTabs, s.activeTabKey),
        };
      });

      return updated;
    } catch (err) {
      const message = toMessage(err);
      set((s) => ({
        errorByKey: { ...s.errorByKey, [`updatePrompt:${id}`]: message },
      }));
      useToastStore.getState().error(`Update prompt failed: ${message}`);
      return undefined;
    } finally {
      set((s) => ({
        recordLoading: { ...s.recordLoading, prompt: { ...s.recordLoading.prompt, [id]: false } },
      }));
    }
  },

  deletePrompt: async (id, workspaceId) => {
    set((s) => ({
      recordLoading: { ...s.recordLoading, prompt: { ...s.recordLoading.prompt, [id]: true } },
      errorByKey: { ...s.errorByKey, [`deletePrompt:${id}`]: undefined },
    }));

    try {
      await workspacesClient.deletePrompt(id);

      set((s) => {
        const nextPromptById = { ...s.promptById };
        delete nextPromptById[id];

        const nextPromptsByWorkspace = { ...s.promptsByWorkspace };
        if (workspaceId) {
          nextPromptsByWorkspace[workspaceId] = removeById(nextPromptsByWorkspace[workspaceId] ?? [], id);
        } else {
          for (const wsId of Object.keys(nextPromptsByWorkspace)) {
            nextPromptsByWorkspace[wsId] = removeById(nextPromptsByWorkspace[wsId] ?? [], id);
          }
        }

        const nextTabs = s.tabs.filter((t) => !(t.type === 'prompt' && t.id === id));

        return {
          promptById: nextPromptById,
          promptsByWorkspace: nextPromptsByWorkspace,
          ...normalizeTabs(nextTabs, s.activeTabKey),
        };
      });

      return true;
    } catch (err) {
      const message = toMessage(err);
      set((s) => ({
        errorByKey: { ...s.errorByKey, [`deletePrompt:${id}`]: message },
      }));
      useToastStore.getState().error(`Delete prompt failed: ${message}`);
      return false;
    } finally {
      set((s) => ({
        recordLoading: { ...s.recordLoading, prompt: { ...s.recordLoading.prompt, [id]: false } },
      }));
    }
  },

  // ===== Document CRUD =====
  fetchDocuments: async (workspaceId) => {
    set((s) => ({
      listLoading: {
        ...s.listLoading,
        documentsByWorkspace: { ...s.listLoading.documentsByWorkspace, [workspaceId]: true },
      },
      errorByKey: { ...s.errorByKey, [`fetchDocuments:${workspaceId}`]: undefined },
    }));

    try {
      const res = await workspacesClient.getDocuments(workspaceId);
      const items = safeArray(res?.data ?? res);

      const map = items.reduce((acc, d) => {
        acc[d.id] = d;
        return acc;
      }, {});

      set((s) => {
        const nextTabs = s.tabs.map((t) => {
          if (t.type !== 'document') return t;
          const latest = map[t.id] || s.documentById[t.id];
          return latest ? { ...t, name: latest.name } : t;
        });

        return {
          documentsByWorkspace: { ...s.documentsByWorkspace, [workspaceId]: items },
          documentById: { ...s.documentById, ...map },
          ...normalizeTabs(nextTabs, s.activeTabKey),
        };
      });
    } catch (err) {
      const message = toMessage(err);
      set((s) => ({
        errorByKey: { ...s.errorByKey, [`fetchDocuments:${workspaceId}`]: message },
      }));
      useToastStore.getState().error(`Load documents failed: ${message}`);
    } finally {
      set((s) => ({
        listLoading: {
          ...s.listLoading,
          documentsByWorkspace: { ...s.listLoading.documentsByWorkspace, [workspaceId]: false },
        },
      }));
    }
  },

  fetchDocument: async (id) => {
    set((s) => ({
      recordLoading: {
        ...s.recordLoading,
        document: { ...s.recordLoading.document, [id]: true },
      },
      errorByKey: { ...s.errorByKey, [`fetchDocument:${id}`]: undefined },
    }));

    try {
      const res = await workspacesClient.getDocument(id);
      const item = res?.data ?? res;

      set((s) => {
        const nextTabs = s.tabs.map((t) => (t.type === 'document' && t.id === id ? { ...t, name: item.name } : t));
        return {
          documentById: { ...s.documentById, [id]: item },
          ...normalizeTabs(nextTabs, s.activeTabKey),
        };
      });

      return item;
    } catch (err) {
      const message = toMessage(err);
      set((s) => ({
        errorByKey: { ...s.errorByKey, [`fetchDocument:${id}`]: message },
      }));
      useToastStore.getState().error(`Load document failed: ${message}`);
      return undefined;
    } finally {
      set((s) => ({
        recordLoading: {
          ...s.recordLoading,
          document: { ...s.recordLoading.document, [id]: false },
        },
      }));
    }
  },

  createDocument: async (payload) => {
    set((s) => ({
      recordLoading: { ...s.recordLoading, creatingDocument: true },
      errorByKey: { ...s.errorByKey, createDocument: undefined },
    }));

    try {
      const res = await workspacesClient.createDocument(payload);
      const created = res?.data ?? res;
      const workspaceId = payload.workspaceId;

      set((s) => ({
        documentById: { ...s.documentById, [created.id]: created },
        documentsByWorkspace: {
          ...s.documentsByWorkspace,
          [workspaceId]: [created, ...(s.documentsByWorkspace[workspaceId] ?? [])],
        },
      }));

      return created;
    } catch (err) {
      const message = toMessage(err);
      set((s) => ({
        errorByKey: { ...s.errorByKey, createDocument: message },
      }));
      useToastStore.getState().error(`Create document failed: ${message}`);
      return undefined;
    } finally {
      set((s) => ({
        recordLoading: { ...s.recordLoading, creatingDocument: false },
      }));
    }
  },

  updateDocument: async (id, payload) => {
    set((s) => ({
      recordLoading: {
        ...s.recordLoading,
        document: { ...s.recordLoading.document, [id]: true },
      },
      errorByKey: { ...s.errorByKey, [`updateDocument:${id}`]: undefined },
    }));

    try {
      const res = await workspacesClient.updateDocument(id, payload);
      const updated = res?.data ?? res;

      set((s) => {
        const nextDocumentsByWorkspace = {};
        for (const wsId of Object.keys(s.documentsByWorkspace)) {
          nextDocumentsByWorkspace[wsId] = s.documentsByWorkspace[wsId].map((d) =>
            d.id === id ? { ...d, ...updated } : d
          );
        }

        const nextTabs = s.tabs.map((t) => (t.type === 'document' && t.id === id ? { ...t, name: updated.name } : t));

        return {
          documentById: { ...s.documentById, [id]: updated },
          documentsByWorkspace: nextDocumentsByWorkspace,
          ...normalizeTabs(nextTabs, s.activeTabKey),
        };
      });

      return updated;
    } catch (err) {
      const message = toMessage(err);
      set((s) => ({
        errorByKey: { ...s.errorByKey, [`updateDocument:${id}`]: message },
      }));
      useToastStore.getState().error(`Update document failed: ${message}`);
      return undefined;
    } finally {
      set((s) => ({
        recordLoading: {
          ...s.recordLoading,
          document: { ...s.recordLoading.document, [id]: false },
        },
      }));
    }
  },

  deleteDocument: async (id, workspaceId) => {
    set((s) => ({
      recordLoading: {
        ...s.recordLoading,
        document: { ...s.recordLoading.document, [id]: true },
      },
      errorByKey: { ...s.errorByKey, [`deleteDocument:${id}`]: undefined },
    }));

    try {
      await workspacesClient.deleteDocument(id);

      set((s) => {
        const nextDocumentById = { ...s.documentById };
        delete nextDocumentById[id];

        const nextDocumentsByWorkspace = { ...s.documentsByWorkspace };
        if (workspaceId) {
          nextDocumentsByWorkspace[workspaceId] = removeById(nextDocumentsByWorkspace[workspaceId] ?? [], id);
        } else {
          for (const wsId of Object.keys(nextDocumentsByWorkspace)) {
            nextDocumentsByWorkspace[wsId] = removeById(nextDocumentsByWorkspace[wsId] ?? [], id);
          }
        }

        const nextTabs = s.tabs.filter((t) => !(t.type === 'document' && t.id === id));

        return {
          documentById: nextDocumentById,
          documentsByWorkspace: nextDocumentsByWorkspace,
          ...normalizeTabs(nextTabs, s.activeTabKey),
        };
      });

      return true;
    } catch (err) {
      const message = toMessage(err);
      set((s) => ({
        errorByKey: { ...s.errorByKey, [`deleteDocument:${id}`]: message },
      }));
      useToastStore.getState().error(`Delete document failed: ${message}`);
      return false;
    } finally {
      set((s) => ({
        recordLoading: {
          ...s.recordLoading,
          document: { ...s.recordLoading.document, [id]: false },
        },
      }));
    }
  },
}));
