import { invoke } from "./gasApi";

export const getAllWorkspaces = () => invoke("get-workspaces");

export const createWorkspace = (payload) => invoke("create-workspace", payload);

export const updateWorkspace = (payload) => invoke("update-workspace", payload);

export const deleteWorkspace = (payload) => invoke("delete-workspace", payload);
