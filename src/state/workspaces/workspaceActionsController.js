import { DRAFT_DOCUMENT_TAB_ID, WORKSPACE_OVERVIEW_TAB } from "./tablistState";
import { DEFAULT_DOCUMENT_FORM, DEFAULT_PROMPT_FORM, DEFAULT_WORKSPACE_FORM } from "./workspacePageState";

const createTabItem = (type, name, label = name) => ({
  id: `${type}:${name}`,
  type,
  name,
  label,
});

export const createWorkspacePageActions = ({
  navigate,
  selectedWorkspaceName,
  selectedPromptName,
  selectedDocumentName,
  openTabs,
  activeTabId,
  documentEditingMode,
  setters,
}) => {
  const resetWorkspaceDetail = () => {
    setters.setWorkspaceDetail({ ...DEFAULT_WORKSPACE_FORM });
    setters.setEditingMode("create");
  };

  const resetPromptDetail = () => {
    setters.setPromptDetail({
      ...DEFAULT_PROMPT_FORM,
      workspace: selectedWorkspaceName || "",
    });
    setters.setPromptEditingMode("create");
  };

  const resetDocumentDetail = () => {
    setters.setDocumentDetail({
      ...DEFAULT_DOCUMENT_FORM,
      workspace: selectedWorkspaceName || "",
    });
    setters.setDocumentEditingMode("create");
    setters.setDocumentFormPhase("type");
  };

  const openChildTab = (type, name) => {
    const tabId = `${type}:${name}`;
    setters.setOpenTabs((prev) => {
      if (prev.some((tab) => tab.id === tabId)) {
        return prev;
      }

      return [...prev, createTabItem(type, name)];
    });
    setters.setActiveTabId(tabId);
  };

  const activateTab = (tab) => {
    if (!selectedWorkspaceName) {
      return;
    }

    if (tab.isDraft) {
      setters.setActiveTabId(tab.id);
      return;
    }

    if (tab.type === "workspace") {
      setters.setActiveTabId(tab.id);
      navigate(`/workspaces/${encodeURIComponent(selectedWorkspaceName)}`);
      return;
    }

    if (tab.type === "prompt") {
      setters.setActiveTabId(tab.id);
      navigate(`/workspaces/${encodeURIComponent(selectedWorkspaceName)}?prompt=${encodeURIComponent(tab.name)}`);
      return;
    }

    if (tab.type === "document") {
      setters.setActiveTabId(tab.id);
      navigate(`/workspaces/${encodeURIComponent(selectedWorkspaceName)}?document=${encodeURIComponent(tab.name)}`);
    }
  };

  const closeTab = (tabId) => {
    if (tabId === WORKSPACE_OVERVIEW_TAB.id) {
      return;
    }

    const currentIndex = openTabs.findIndex((tab) => tab.id === tabId);
    const nextTabs = openTabs.filter((tab) => tab.id !== tabId);
    const resolvedTabs = nextTabs.length ? nextTabs : [WORKSPACE_OVERVIEW_TAB];

    setters.setOpenTabs(resolvedTabs);

    if (activeTabId === tabId) {
      const fallbackTab = resolvedTabs[currentIndex - 1] || resolvedTabs[currentIndex] || resolvedTabs[0];
      if (fallbackTab) {
        activateTab(fallbackTab);
      }
    }
  };

  const openCreateModal = () => {
    setters.setErrorMessage("");
    resetWorkspaceDetail();
    setters.setIsDeleteModalOpen(false);
    setters.setIsWorkspaceModalOpen(true);
  };

  const openCreatePromptModal = () => {
    setters.setErrorMessage("");
    resetPromptDetail();
    setters.setIsPromptDeleteModalOpen(false);
    setters.setIsPromptModalOpen(true);
  };

  const openCreateDocumentModal = () => {
    setters.setErrorMessage("");
    resetDocumentDetail();
    setters.resetDocumentSyncOptions();
    setters.setDocumentFormPhase("type");
    setters.setIsDocumentDeleteModalOpen(false);
    setters.setIsDocumentSyncModalOpen(false);
    setters.setIsDocumentModalOpen(true);
  };

  const openCreateDocumentFromSidebar = () => {
    setters.setErrorMessage("");
    resetDocumentDetail();
    setters.resetDocumentSyncOptions();
    setters.setDocumentFormPhase("type");
    setters.setIsDocumentDeleteModalOpen(false);
    setters.setIsDocumentSyncModalOpen(false);

    setters.setOpenTabs((prev) => {
      if (prev.some((tab) => tab.id === DRAFT_DOCUMENT_TAB_ID)) {
        return prev;
      }

      return [
        ...prev,
        {
          id: DRAFT_DOCUMENT_TAB_ID,
          type: "document",
          label: "New Document",
          isDraft: true,
        },
      ];
    });

    setters.setActiveTabId(DRAFT_DOCUMENT_TAB_ID);
    setters.setIsDocumentModalOpen(true);
  };

  const openEditModal = () => {
    if (!selectedWorkspaceName) {
      return;
    }

    setters.setErrorMessage("");
    setters.setEditingMode("edit");
    setters.setIsDeleteModalOpen(false);
    setters.setIsWorkspaceModalOpen(true);
  };

  const openEditPromptModal = () => {
    if (!selectedPromptName) {
      return;
    }

    setters.setErrorMessage("");
    setters.setPromptEditingMode("edit");
    setters.setIsPromptDeleteModalOpen(false);
    setters.setIsPromptModalOpen(true);
  };

  const openEditDocumentModal = () => {
    if (!selectedDocumentName) {
      return;
    }

    setters.setErrorMessage("");
    setters.setDocumentEditingMode("edit");
    setters.setDocumentFormPhase("details");
    setters.setIsDocumentDeleteModalOpen(false);
    setters.setIsDocumentSyncModalOpen(false);
    setters.setIsDocumentModalOpen(true);
  };

  const openDeleteModal = () => {
    if (!selectedWorkspaceName) {
      return;
    }

    setters.setErrorMessage("");
    setters.setIsWorkspaceModalOpen(false);
    setters.setIsDeleteModalOpen(true);
  };

  const openDeletePromptModal = () => {
    if (!selectedPromptName) {
      return;
    }

    setters.setErrorMessage("");
    setters.setIsPromptModalOpen(false);
    setters.setIsPromptDeleteModalOpen(true);
  };

  const openDeleteDocumentModal = () => {
    if (!selectedDocumentName) {
      return;
    }

    setters.setErrorMessage("");
    setters.setIsDocumentModalOpen(false);
    setters.setIsDocumentSyncModalOpen(false);
    setters.setIsDocumentDeleteModalOpen(true);
  };

  const closeWorkspaceModal = () => setters.setIsWorkspaceModalOpen(false);
  const closePromptModal = () => setters.setIsPromptModalOpen(false);
  const closeDeleteModal = () => setters.setIsDeleteModalOpen(false);
  const closePromptDeleteModal = () => setters.setIsPromptDeleteModalOpen(false);
  const closeDocumentModal = () => {
    setters.setDocumentFormPhase(documentEditingMode === "create" ? "type" : "details");
    setters.setIsDocumentModalOpen(false);
  };
  const closeDocumentDeleteModal = () => setters.setIsDocumentDeleteModalOpen(false);
  const closeDocumentSyncModal = () => setters.setIsDocumentSyncModalOpen(false);

  const handleBack = () => {
    navigate("/workspaces");
    setters.resetTabList();
    setters.setSelectedWorkspace(null);
    setters.resetPromptInputs();
    setters.setPromptDetail({ ...DEFAULT_PROMPT_FORM });
    setters.setIsWorkspaceModalOpen(false);
    setters.setIsDeleteModalOpen(false);
    setters.setIsPromptModalOpen(false);
    setters.setIsPromptDeleteModalOpen(false);
    setters.setIsDocumentModalOpen(false);
    setters.setIsDocumentDeleteModalOpen(false);
    setters.setIsDocumentSyncModalOpen(false);
    resetWorkspaceDetail();
  };

  const openWorkspace = (name) => {
    setters.resetTabList();
    navigate(`/workspaces/${encodeURIComponent(name)}`);
  };

  const openPrompt = (name) => {
    if (!selectedWorkspaceName) return;
    openChildTab("prompt", name);
    navigate(`/workspaces/${encodeURIComponent(selectedWorkspaceName)}?prompt=${encodeURIComponent(name)}`);
  };

  const openDocument = (name) => {
    if (!selectedWorkspaceName) return;
    openChildTab("document", name);
    navigate(`/workspaces/${encodeURIComponent(selectedWorkspaceName)}?document=${encodeURIComponent(name)}`);
  };

  const refreshWorkspaceList = async (refreshWorkspaces) => {
    await refreshWorkspaces();
  };

  return {
    resetWorkspaceDetail,
    resetPromptDetail,
    resetDocumentDetail,
    openCreateModal,
    openCreatePromptModal,
    openCreateDocumentModal,
    openCreateDocumentFromSidebar,
    openEditModal,
    openEditPromptModal,
    openEditDocumentModal,
    openDeleteModal,
    openDeletePromptModal,
    openDeleteDocumentModal,
    closeWorkspaceModal,
    closePromptModal,
    closeDeleteModal,
    closePromptDeleteModal,
    closeDocumentModal,
    closeDocumentDeleteModal,
    closeDocumentSyncModal,
    handleBack,
    openChildTab,
    openWorkspace,
    openPrompt,
    openDocument,
    activateTab,
    closeTab,
    refreshWorkspaceList,
  };
};
