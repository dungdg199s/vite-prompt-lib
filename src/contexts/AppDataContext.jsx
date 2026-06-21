import { createContext, useContext, useState, useCallback } from "react";
import { workspacesClient } from "../lib/workspaces-client";
import { promptsClient } from "../lib/prompts-client";
import { documentsClient } from "../lib/documents-client";

const AppDataContext = createContext();

export const AppDataProvider = ({ children }) => {
  const [workspaces, setWorkspaces] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  const loadAllData = useCallback(async () => {
    setIsLoadingAll(true);
    try {
      const [workspacesList, promptsList, documentsList] = await Promise.all([
        workspacesClient.getWorkspaces(),
        promptsClient.getPrompts(),
        documentsClient.getDocuments(),
      ]);
      setWorkspaces(workspacesList || []);
      setPrompts(promptsList || []);
      setDocuments(documentsList || []);
    } catch (error) {
      console.error("Error loading all data:", error);
    } finally {
      setIsLoadingAll(false);
    }
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    setIsLoadingWorkspaces(true);
    try {
      const list = await workspacesClient.getWorkspaces();
      setWorkspaces(list || []);
    } catch (error) {
      console.error("Error refreshing workspaces:", error);
    } finally {
      setIsLoadingWorkspaces(false);
    }
  }, []);

  const refreshPrompts = useCallback(async () => {
    setIsLoadingPrompts(true);
    try {
      const list = await promptsClient.getPrompts();
      setPrompts(list || []);
    } catch (error) {
      console.error("Error refreshing prompts:", error);
    } finally {
      setIsLoadingPrompts(false);
    }
  }, []);

  const refreshDocuments = useCallback(async () => {
    setIsLoadingDocuments(true);
    try {
      const list = await documentsClient.getDocuments();
      setDocuments(list || []);
    } catch (error) {
      console.error("Error refreshing documents:", error);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);

  const refreshAfterWorkspaceCreate = useCallback(async () => {
    await refreshWorkspaces();
  }, [refreshWorkspaces]);

  const refreshAfterWorkspaceUpdate = useCallback(async () => {
    await refreshWorkspaces();
  }, [refreshWorkspaces]);

  const refreshAfterWorkspaceDelete = useCallback(async () => {
    await refreshWorkspaces();
  }, [refreshWorkspaces]);

  const refreshAfterPromptCreate = useCallback(async () => {
    await refreshPrompts();
  }, [refreshPrompts]);

  const refreshAfterPromptUpdate = useCallback(async () => {
    await refreshPrompts();
  }, [refreshPrompts]);

  const refreshAfterPromptDelete = useCallback(async () => {
    await refreshPrompts();
  }, [refreshPrompts]);

  const refreshAfterDocumentCreate = useCallback(async () => {
    await refreshDocuments();
  }, [refreshDocuments]);

  const refreshAfterDocumentUpdate = useCallback(async () => {
    await refreshDocuments();
  }, [refreshDocuments]);

  const refreshAfterDocumentDelete = useCallback(async () => {
    await refreshDocuments();
  }, [refreshDocuments]);

  const value = {
    workspaces,
    prompts,
    documents,
    isLoadingAll,
    isLoadingWorkspaces,
    isLoadingPrompts,
    isLoadingDocuments,
    loadAllData,
    refreshWorkspaces,
    refreshPrompts,
    refreshDocuments,
    refreshAfterWorkspaceCreate,
    refreshAfterWorkspaceUpdate,
    refreshAfterWorkspaceDelete,
    refreshAfterPromptCreate,
    refreshAfterPromptUpdate,
    refreshAfterPromptDelete,
    refreshAfterDocumentCreate,
    refreshAfterDocumentUpdate,
    refreshAfterDocumentDelete,
  };

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return context;
};
