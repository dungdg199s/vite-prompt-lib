import { workspacesClient } from "../lib/workspaces-client";
import { promptsClient } from "../lib/prompts-client";
import { documentsClient } from "../lib/documents-client";
import { useWorkspaces } from "./workspaceStore";
import { usePrompts } from "./promptStore";
import { useDocuments } from "./documentStore";

/**
 * Load all data in parallel and populate individual stores
 * Call this once on app initialization (e.g., in App.jsx useEffect)
 */
export const loadAllAppData = async () => {

  try {
    // Set loading state across all stores
    useWorkspaces.setState({ isLoading: true });
    usePrompts.setState({ isLoading: true });
    useDocuments.setState({ isLoading: true });

    // Load all data in parallel
    const [workspacesList, promptsList, documentsList] = await Promise.all([
      workspacesClient.getWorkspaces(),
      promptsClient.getPrompts(),
      documentsClient.getDocuments(),
    ]);

    // Populate stores
    useWorkspaces.setState({ workspaces: workspacesList || [] });
    usePrompts.setState({ prompts: promptsList || [] });
    useDocuments.setState({ documents: documentsList || [] });
  } catch (error) {
    console.error("Error loading all app data:", error);
    // Set individual error states
    useWorkspaces.setState({ error: "Failed to load workspaces" });
    usePrompts.setState({ error: "Failed to load prompts" });
    useDocuments.setState({ error: "Failed to load documents" });
  } finally {
    // Clear loading state
    useWorkspaces.setState({ isLoading: false });
    usePrompts.setState({ isLoading: false });
    useDocuments.setState({ isLoading: false });
  }
};

/**
 * Refresh all stores with latest data
 */
export const refreshAllAppData = async () => {

  try {
    useWorkspaces.setState({ isLoading: true });
    usePrompts.setState({ isLoading: true });
    useDocuments.setState({ isLoading: true });

    const [workspacesList, promptsList, documentsList] = await Promise.all([
      workspacesClient.getWorkspaces(),
      promptsClient.getPrompts(),
      documentsClient.getDocuments(),
    ]);

    useWorkspaces.setState({
      workspaces: workspacesList || [],
      error: null,
    });
    usePrompts.setState({ prompts: promptsList || [], error: null });
    useDocuments.setState({ documents: documentsList || [], error: null });
  } catch (error) {
    console.error("Error refreshing all app data:", error);
  } finally {
    useWorkspaces.setState({ isLoading: false });
    usePrompts.setState({ isLoading: false });
    useDocuments.setState({ isLoading: false });
  }
};
