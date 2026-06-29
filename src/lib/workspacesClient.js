import { gasClient } from './gasApi';

export const workspacesClient = {
  getWorkspaces: () => gasClient.get('/api/workspaces'),
  getWorkspace: (id) => gasClient.get(`/api/workspaces/${id}`),
  createWorkspace: (payload) => gasClient.post('/api/workspaces', payload),
  updateWorkspace: (id, payload) => gasClient.put(`/api/workspaces/${id}`, payload),
  deleteWorkspace: (id) => gasClient.del(`/api/workspaces/${id}`),

  getPromptById: (promptId) => gasClient.get(`/api/prompts/${promptId}`),

  createPrompt: (workspaceId, payload) => gasClient.post(`/api/workspaces/${workspaceId}/prompts`, payload),
  getPromptsByWorkspace: (workspaceId) => gasClient.get(`/api/workspaces/${workspaceId}/prompts`),
  updatePrompt: (workspaceId, promptId, payload) =>
    gasClient.put(`/api/workspaces/${workspaceId}/prompts/${promptId}`, payload),
  deletePrompt: (workspaceId, promptId) => gasClient.del(`/api/workspaces/${workspaceId}/prompts/${promptId}`),

  getDocumentById: (workspaceId, documentId) => gasClient.get(`/api/workspaces/${workspaceId}/documents/${documentId}`),
  getDocumentsByWorkspace: (workspaceId) => gasClient.get(`/api/workspaces/${workspaceId}/documents`),
  createDocument: (workspaceId, payload) => gasClient.post(`/api/workspaces/${workspaceId}/documents`, payload),
  updateDocument: (workspaceId, documentId, payload) =>
    gasClient.put(`/api/workspaces/${workspaceId}/documents/${documentId}`, payload),
  deleteDocument: (workspaceId, documentId) => gasClient.del(`/api/workspaces/${workspaceId}/documents/${documentId}`),
};
