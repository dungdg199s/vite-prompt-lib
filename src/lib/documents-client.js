import { gasClient } from "./gas-client";

export const documentsClient = {
  getDocuments: () => gasClient.get("/api/documents"),
  getDocument: (name) => gasClient.get(`/api/documents/${name}`),
  getPreasheet: (preasheetId) => gasClient.get(`/api/preasheet/${preasheetId}`),
  createDocument: (payload) => gasClient.post("/api/documents", payload),
  updateDocument: (payload) => gasClient.put("/api/documents", payload),
  deleteDocument: (name) => gasClient.del(`/api/documents/${name}`),
  syncDocument: (name, options) =>
    gasClient.post(`/api/documents/${name}/sync`, options),
};
