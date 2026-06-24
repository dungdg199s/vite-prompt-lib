import { gasClient } from "./gas-client";

const workspaces = {}

export const workspacesClient = {
  getWorkspaces: () => gasClient.get("/api/workspaces"),
  getWorkspace: (name) => gasClient.get(`/api/workspaces/${name}`),
  createWorkspace: (payload) => gasClient.post("/api/workspaces", payload),
  updateWorkspace: (payload) => gasClient.put("/api/workspaces", payload),
  deleteWorkspace: (name) => gasClient.del(`/api/workspaces/${name}`),
};
