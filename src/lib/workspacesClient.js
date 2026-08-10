import { gasClient } from "./gasApi";

export const workspacesClient = {
  getWorkspaces: () => gasClient.get("/api/workspaces"),
  getWorkspace: (id) => gasClient.get(`/api/workspaces/${id}`),
  createWorkspace: (payload) => gasClient.post("/api/workspaces", payload),
  updateWorkspace: (id, payload) => gasClient.put(`/api/workspaces/${id}`, payload),
  deleteWorkspace: (id) => gasClient.del(`/api/workspaces/${id}`),

  getPrompts: (workspaceId) => gasClient.get(`/api/workspaces/${workspaceId}/prompts`),
  getPrompt: (id) => gasClient.get(`/api/prompts/${id}`),
  createPrompt: (payload) => gasClient.post("/api/prompts", payload),
  updatePrompt: (id, payload) => gasClient.put(`/api/prompts/${id}`, payload),
  deletePrompt: (id) => gasClient.del(`/api/prompts/${id}`),

  getDocuments: (workspaceId) => gasClient.get(`/api/workspaces/${workspaceId}/documents`),
  getDocument: (id) => gasClient.get(`/api/documents/${id}`),
  createDocument: (payload) => gasClient.post("/api/documents", payload),
  updateDocument: (id, payload) => gasClient.put(`/api/documents/${id}`, payload),
  deleteDocument: (id) => gasClient.del(`/api/documents/${id}`),

  createMember: (workspaceId, payload) => gasClient.post(`/api/workspaces/${workspaceId}/members`, payload),
  updateMember: (workspaceId, email, payload) =>
    gasClient.put(`/api/workspaces/${workspaceId}/members/${encodeURIComponent(email)}`, payload),
  deleteMember: (workspaceId, email) =>
    gasClient.del(`/api/workspaces/${workspaceId}/members/${encodeURIComponent(email)}`),
};
