import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { documentsClient } from "../lib/documents-client";
import { promptsClient } from "../lib/prompts-client";
import { workspacesClient } from "../lib/workspaces-client";
import WorkspaceSidebar from "../components/workspaces/WorkspaceSidebar";
import WorkspaceDetail from "../components/workspaces/WorkspaceDetail";
import PromptViewer from "../components/prompts/PromptViewer";
import DocumentDetail from "../components/documents/DocumentDetail";
import DocumentContentPreview from "../components/documents/DocumentContentPreview";
import { uiClasses } from "../components/shared/uiClasses";
import { useCrudToast } from "../lib/toast";
import { useWorkspacePageState } from "../state/workspaces/useWorkspacePageState";
import {
  DEFAULT_DOCUMENT_FORM,
  DEFAULT_PROMPT_FORM,
} from "../state/workspaces/workspacePageState";
import {
  DRAFT_DOCUMENT_TAB_ID,
  WORKSPACE_OVERVIEW_TAB,
  getUrlTargetTab,
} from "../state/workspaces/tablistState";
import { createWorkspacePageActions } from "../state/workspaces/workspaceActionsController";
import {
  buildDocumentPayload,
  buildPromptPayload,
  buildWorkspacePayload,
} from "../state/workspaces/workspacePayloads";
import { useWorkspaces } from "../store/workspaceStore";
import { usePrompts } from "../store/promptStore";
import { useDocuments } from "../store/documentStore";

const TOKEN_REGEX = /\$\{([^}|]+)\|([^}]+)\}/g;

const parsePromptTokens = (promptText) => {
  if (!promptText) {
    return [];
  }

  const tokens = [];
  let match;
  let index = 0;

  while ((match = TOKEN_REGEX.exec(promptText)) !== null) {
    const raw = match[0];
    const label = match[1].trim();
    const descriptor = match[2].trim();

    let inputType = "text";
    let options = [];

    if (descriptor.toLowerCase().startsWith("options:")) {
      inputType = "select";
      options = descriptor
        .slice("options:".length)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    } else if (descriptor.toLowerCase() === "textarea") {
      inputType = "textarea";
    }

    tokens.push({
      id: `${label}_${index}`,
      raw,
      label,
      descriptor,
      inputType,
      options,
    });
    index += 1;
  }

  return tokens;
};

const getPromptText = (prompt) => {
  if (!prompt) {
    return "";
  }

  return String(
    prompt.content ||
      prompt.template ||
      prompt.prompt ||
      prompt.description ||
      "",
  );
};

const parseContentJSON = (rawContent) => {
  if (!rawContent) {
    return null;
  }

  if (typeof rawContent === "object") {
    return rawContent;
  }

  try {
    return JSON.parse(rawContent);
  } catch {
    return null;
  }
};

const stringifyContentJSON = (rawContent) => {
  if (rawContent === null || rawContent === undefined || rawContent === "") {
    return "";
  }

  if (typeof rawContent === "string") {
    return rawContent;
  }

  try {
    return JSON.stringify(rawContent, null, 2);
  } catch {
    return String(rawContent);
  }
};

const STORAGE_KEY = "workspacesPageState";

export default function WorkspacesPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const hasRestoredState = useRef(false);
  const previousWorkspaceRef = useRef("");

  const fetchWorkspaces = useWorkspaces((state) => state.fetchWorkspaces);
  const workspaceList = useWorkspaces((state) => state.workspaces);
  const isLoadingWorkspaces = useWorkspaces((state) => state.isLoading);
  const refreshWorkspaces = useWorkspaces((state) => state.refreshWorkspaces);
  const refreshPrompts = usePrompts((state) => state.refreshPrompts);
  const documents = useDocuments((state) => state.documents);
  const refreshDocuments = useDocuments((state) => state.refreshDocuments);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const refreshAfterWorkspaceCreate = refreshWorkspaces;
  const refreshAfterWorkspaceUpdate = refreshWorkspaces;
  const refreshAfterWorkspaceDelete = refreshWorkspaces;
  const refreshAfterPromptCreate = refreshPrompts;
  const refreshAfterPromptUpdate = refreshPrompts;
  const refreshAfterPromptDelete = refreshPrompts;
  const refreshAfterDocumentCreate = refreshDocuments;
  const refreshAfterDocumentUpdate = refreshDocuments;
  const refreshAfterDocumentDelete = refreshDocuments;

  const workspaceNameFromUrl = params["*"] || "";
  const promptNameFromUrl = searchParams.get("prompt") || "";
  const documentNameFromUrl = searchParams.get("document") || "";

  const workspacePageState = useWorkspacePageState({
    promptNameFromUrl,
    documentNameFromUrl,
  });

  const {
    selectedWorkspace,
    promptInputValues,
    promptForm,
    documentForm,
    workspaceForm,
    openTabs,
    activeTabId,
    editingMode,
    promptEditingMode,
    documentEditingMode,
    documentFormPhase,
    isWorkspaceModalOpen,
    isDeleteModalOpen,
    isPromptModalOpen,
    isPromptDeleteModalOpen,
    isDocumentModalOpen,
    isDocumentDeleteModalOpen,
    isDocumentSyncModalOpen,
    isLoadingWorkspace,
    isLoadingDocument,
    isLoadingDocumentSyncMeta,
    isSavingWorkspace,
    isSavingPrompt,
    isSavingDocument,
    documentSyncOptions,
    documentSyncPreasheetName,
    documentSyncSheetNames,
    errorMessage,
    actions: {
      setSelectedWorkspace,
      setPromptInputValues,
      setPromptDetail,
      setDocumentDetail,
      setWorkspaceDetail,
      setOpenTabs,
      setActiveTabId,
      setEditingMode,
      setPromptEditingMode,
      setDocumentEditingMode,
      setDocumentFormPhase,
      setIsWorkspaceModalOpen,
      setIsDeleteModalOpen,
      setIsPromptModalOpen,
      setIsPromptDeleteModalOpen,
      setIsDocumentModalOpen,
      setIsDocumentDeleteModalOpen,
      setIsDocumentSyncModalOpen,
      setIsLoadingWorkspace,
      setIsLoadingDocument,
      setIsLoadingDocumentSyncMeta,
      setIsSavingWorkspace,
      setIsSavingPrompt,
      setIsSavingDocument,
      setDocumentSyncOptions,
      setDocumentSyncPreasheetName,
      setDocumentSyncSheetNames,
      setErrorMessage,
      resetDocumentSyncOptions,
      resetTabList,
      resetPromptInputs,
    },
  } = workspacePageState;

  // Save URL state to localStorage
  useEffect(() => {
    if (workspaceNameFromUrl || promptNameFromUrl || documentNameFromUrl) {
      const state = {
        workspace: workspaceNameFromUrl,
        prompt: promptNameFromUrl,
        document: documentNameFromUrl,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [workspaceNameFromUrl, promptNameFromUrl, documentNameFromUrl]);

  // Restore state from localStorage if no URL hash
  useEffect(() => {
    if (hasRestoredState.current) {
      return;
    }

    hasRestoredState.current = true;

    if (!workspaceNameFromUrl && !promptNameFromUrl && !documentNameFromUrl) {
      try {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const { workspace, prompt, document } = JSON.parse(savedState);
          if (workspace) {
            const targetQuery = prompt
              ? `?prompt=${encodeURIComponent(prompt)}`
              : document
                ? `?document=${encodeURIComponent(document)}`
                : "";
            const targetUrl = `/workspaces/${encodeURIComponent(workspace)}${targetQuery}`;
            navigate(targetUrl, { replace: true });
          }
        }
      } catch (error) {
        console.log(error);
        console.error("Failed to restore state from localStorage:", error);
      }
    }
  }, [workspaceNameFromUrl, promptNameFromUrl, documentNameFromUrl, navigate]);

  const workspaceToast = useCrudToast("Workspace");
  const promptToast = useCrudToast("Prompt");
  const documentToast = useCrudToast("Document");

  // Use URL params as source of truth
  const selectedWorkspaceName = workspaceNameFromUrl;
  const selectedPromptName = promptNameFromUrl;
  const selectedDocumentName = documentNameFromUrl;

  const {
    resetWorkspaceDetail,
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
  } = createWorkspacePageActions({
    navigate,
    selectedWorkspaceName,
    selectedPromptName,
    selectedDocumentName,
    openTabs,
    activeTabId,
    documentEditingMode,
    setters: {
      setSelectedWorkspace,
      setPromptInputValues,
      setPromptDetail,
      setDocumentDetail,
      setWorkspaceDetail,
      setOpenTabs,
      setActiveTabId,
      setEditingMode,
      setPromptEditingMode,
      setDocumentEditingMode,
      setDocumentFormPhase,
      setIsWorkspaceModalOpen,
      setIsDeleteModalOpen,
      setIsPromptModalOpen,
      setIsPromptDeleteModalOpen,
      setIsDocumentModalOpen,
      setIsDocumentDeleteModalOpen,
      setIsDocumentSyncModalOpen,
      setErrorMessage,
      resetDocumentSyncOptions,
      resetTabList,
      resetPromptInputs,
    },
  });

  useEffect(() => {
    const previousWorkspace = previousWorkspaceRef.current;
    if (selectedWorkspaceName === previousWorkspace) {
      return;
    }

    previousWorkspaceRef.current = selectedWorkspaceName;

    const initialTabs = [WORKSPACE_OVERVIEW_TAB];
    if (selectedPromptName) {
      initialTabs.push({
        id: `prompt:${selectedPromptName}`,
        type: "prompt",
        name: selectedPromptName,
        label: selectedPromptName,
      });
    } else if (selectedDocumentName) {
      initialTabs.push({
        id: `document:${selectedDocumentName}`,
        type: "document",
        name: selectedDocumentName,
        label: selectedDocumentName,
      });
    }

    queueMicrotask(() => {
      setOpenTabs(initialTabs);
      setActiveTabId(
        getUrlTargetTab(selectedPromptName, selectedDocumentName).id,
      );
    });
  }, [
    selectedWorkspaceName,
    selectedPromptName,
    selectedDocumentName,
    setActiveTabId,
    setOpenTabs,
  ]);

  useEffect(() => {
    if (!selectedWorkspaceName) {
      return;
    }

    const targetTab = getUrlTargetTab(selectedPromptName, selectedDocumentName);

    queueMicrotask(() => {
      setOpenTabs((prev) => {
        const tabs = prev.length ? prev : [WORKSPACE_OVERVIEW_TAB];

        if (targetTab.type === "workspace") {
          return tabs;
        }

        if (tabs.some((tab) => tab.id === targetTab.id)) {
          return tabs;
        }

        return [...tabs, targetTab];
      });

      setActiveTabId(targetTab.id);
    });
  }, [
    selectedWorkspaceName,
    selectedPromptName,
    selectedDocumentName,
    setActiveTabId,
    setOpenTabs,
  ]);

  // Load workspace data when URL changes
  useEffect(() => {
    const loadWorkspace = async () => {
      if (!selectedWorkspaceName) {
        setSelectedWorkspace(null);
        setEditingMode("create");
        return;
      }

      setIsLoadingWorkspace(true);
      setErrorMessage("");

      try {
        const workspace = await workspacesClient.getWorkspace(
          selectedWorkspaceName,
        );
        setSelectedWorkspace(workspace);
        setWorkspaceDetail({
          ...workspace,
          id: workspace?.id,
          name: workspace?.name || "",
          description: workspace?.description || "",
          shareMode: workspace?.shareMode || "private",
          shareWith: Array.isArray(workspace?.shareWith)
            ? workspace.shareWith.join(", ")
            : "",
        });
        setPromptDetail((prev) => ({
          ...prev,
          workspace: selectedWorkspaceName,
        }));
        setEditingMode("edit");
      } catch (error) {
        console.log(error);
        setErrorMessage(error.message || "Can not load workspace detail");
      } finally {
        setIsLoadingWorkspace(false);
      }
    };

    loadWorkspace();
  }, [
    selectedWorkspaceName,
    setEditingMode,
    setErrorMessage,
    setIsLoadingWorkspace,
    setPromptDetail,
    setSelectedWorkspace,
    setWorkspaceDetail,
  ]);

  const loadSyncPrompt = async () => {
    if (!selectedPromptName) {
      setPromptInputValues({});
      setPromptEditingMode("create");
      return;
    }

    setErrorMessage("");
    try {
      const prompt = await promptsClient.getPrompt(selectedPromptName);
      setPromptDetail({
        ...prompt,
        id: prompt?.id,
        name: prompt?.name || "",
        workspace: prompt?.workspace || selectedWorkspaceName || "",
        description: prompt?.description || "",
        content: prompt?.content || "",
        shareMode: prompt?.shareMode || "private",
        shareWith: Array.isArray(prompt?.shareWith)
          ? prompt.shareWith.join(", ")
          : "",
      });
      setPromptEditingMode("edit");
    } catch (error) {
      console.log(error);
      setErrorMessage(error.message || "Can not load prompt detail");
    }
  };

  // Load prompt data when URL changes
  useEffect(() => {
    const loadPrompt = async () => {
      if (!selectedPromptName) {
        setPromptInputValues({});
        setPromptEditingMode("create");
        return;
      }

      setErrorMessage("");
      try {
        const prompt = await promptsClient.getPrompt(selectedPromptName);
        setPromptDetail({
          ...prompt,
          id: prompt?.id,
          name: prompt?.name || "",
          workspace: prompt?.workspace || selectedWorkspaceName || "",
          description: prompt?.description || "",
          content: prompt?.content || "",
          shareMode: prompt?.shareMode || "private",
          shareWith: Array.isArray(prompt?.shareWith)
            ? prompt.shareWith.join(", ")
            : "",
        });
        setPromptEditingMode("edit");
      } catch (error) {
        console.log(error);
        setErrorMessage(error.message || "Can not load prompt detail");
      }
    };

    if (selectedPromptName && selectedWorkspaceName) {
      loadPrompt();
    }
  }, [
    selectedPromptName,
    selectedWorkspaceName,
    setErrorMessage,
    setPromptDetail,
    setPromptEditingMode,
    setPromptInputValues,
  ]);

  useEffect(() => {
    const loadDocument = async () => {
      if (!selectedDocumentName || !selectedWorkspaceName) {
        setDocumentDetail(DEFAULT_DOCUMENT_FORM);
        setDocumentEditingMode("create");
        setDocumentFormPhase("type");
        resetDocumentSyncOptions();
        return;
      }

      setErrorMessage("");
      setIsLoadingDocument(true);
      try {
        const document =
          await documentsClient.getDocument(selectedDocumentName);
        setDocumentDetail({
          id: document?.id,
          name: document?.name || "",
          type: document?.type || "Spreadsheets",
          workspace: document?.workspace || selectedWorkspaceName,
          fileName: document?.fileName || "",
          preasheetId: document?.preasheetId || "",
          description: document?.description || "",
          contentMarkdown: document?.contentMarkdown || "",
          contentJSON: stringifyContentJSON(document?.contentJSON),
          contentHTML: document?.contentHTML || "",
          shareMode: document?.shareMode || "private",
          shareWith: Array.isArray(document?.shareWith)
            ? document.shareWith.join(", ")
            : "",
          syncOptions: document?.syncOptions || null,
        });

        const storedSyncOptions = document?.syncOptions || {};
        const storedSheets = Array.isArray(storedSyncOptions.sheets)
          ? storedSyncOptions.sheets.filter(Boolean)
          : [];
        setDocumentSyncOptions({
          includeEmptyRows: storedSyncOptions.includeEmptyRows === true,
          headerRow:
            storedSyncOptions.headerRow !== null &&
            storedSyncOptions.headerRow !== undefined
              ? String(storedSyncOptions.headerRow)
              : "",
          useAllSheets: storedSheets.length === 0,
          selectedSheets: storedSheets,
        });
        setDocumentEditingMode("edit");
        setDocumentFormPhase("details");
      } catch (error) {
        console.log(error);
        setErrorMessage(error.message || "Can not load document detail");
      } finally {
        setIsLoadingDocument(false);
      }
    };

    loadDocument();
  }, [
    selectedDocumentName,
    selectedWorkspaceName,
    resetDocumentSyncOptions,
    setDocumentDetail,
    setDocumentEditingMode,
    setDocumentFormPhase,
    setDocumentSyncOptions,
    setErrorMessage,
    setIsLoadingDocument,
  ]);

  const handleFormChange = (field, value) => {
    setWorkspaceDetail((prev) => ({ ...prev, [field]: value }));
  };

  const handlePromptDetailChange = (field, value) => {
    setPromptDetail((prev) => ({ ...prev, [field]: value }));
  };

  const selectedPrompt = useMemo(() => {
    if (!selectedWorkspace?.prompts?.length) {
      return null;
    }
    return (
      selectedWorkspace.prompts.find(
        (item) => item.name === selectedPromptName,
      ) || null
    );
  }, [selectedWorkspace, selectedPromptName]);

  const workspaceDocuments = useMemo(() => {
    if (!selectedWorkspaceName) {
      return [];
    }
    return (documents || []).filter(
      (document) => document.workspace === selectedWorkspaceName,
    );
  }, [documents, selectedWorkspaceName]);

  const promptSource =
    selectedPrompt || (selectedPromptName ? promptForm : null);
  const promptText = getPromptText(promptSource);

  const parsedTokens = parsePromptTokens(promptText);

  const generatedPrompt = (() => {
    if (!promptText) {
      return "";
    }

    return parsedTokens.reduce((result, token) => {
      const tokenValue = promptInputValues[token.id] ?? "";
      return result.replaceAll(token.raw, tokenValue);
    }, promptText);
  })();

  const parsedDocumentJSON = useMemo(
    () => parseContentJSON(documentForm.contentJSON),
    [documentForm.contentJSON],
  );

  const fallbackDocumentSheets = useMemo(() => {
    const sheets = parsedDocumentJSON?.sheets;
    if (!Array.isArray(sheets)) {
      return [];
    }

    return sheets
      .map((sheet) => String(sheet?.name || "").trim())
      .filter(Boolean);
  }, [parsedDocumentJSON]);

  const activeTab = useMemo(() => {
    return (
      openTabs.find((tab) => tab.id === activeTabId) ||
      openTabs[0] || {
        id: "workspace:overview",
        type: "workspace",
        label: "Overview",
      }
    );
  }, [openTabs, activeTabId]);

  const handleDocumentDetailChange = (field, value) => {
    setErrorMessage("");
    setDocumentDetail((prev) => {
      if (field === "name") {
        return {
          ...prev,
          name: value,
          fileName:
            (prev.type || "Spreadsheets") === "Spreadsheets"
              ? String(value || "").trim()
              : prev.fileName,
        };
      }

      if (field !== "type") {
        return { ...prev, [field]: value };
      }

      const nextType = value || "Spreadsheets";
      return {
        ...prev,
        type: nextType,
        fileName:
          nextType === "Spreadsheets"
            ? String(prev.fileName || prev.name || "").trim()
            : "",
        preasheetId: nextType === "Spreadsheets" ? prev.preasheetId : "",
      };
    });
  };

  const handleDocumentSyncOptionChange = (field, value) => {
    setDocumentSyncOptions((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleDocumentSyncSheet = (sheetName, checked) => {
    setDocumentSyncOptions((prev) => {
      const selected = new Set(prev.selectedSheets || []);
      if (checked) {
        selected.add(sheetName);
      } else {
        selected.delete(sheetName);
      }

      return {
        ...prev,
        useAllSheets: false,
        selectedSheets: Array.from(selected),
      };
    });
  };

  const handleToggleAllDocumentSheets = (checked) => {
    setDocumentSyncOptions((prev) => ({
      ...prev,
      useAllSheets: checked,
      selectedSheets: checked ? [] : prev.selectedSheets,
    }));
  };

  const handleSelectDocumentType = (type) => {
    setErrorMessage("");
    setDocumentDetail((prev) => ({
      ...prev,
      type,
      preasheetId: type === "Spreadsheets" ? prev.preasheetId : "",
    }));
  };

  const handleNextDocumentTypePhase = () => {
    if (!documentForm.type) {
      setErrorMessage("Document type is required");
      return;
    }

    setErrorMessage("");
    setDocumentFormPhase("details");
  };

  const loadDocumentPreasheetMetadata = async (preasheetId) => {
    setIsLoadingDocumentSyncMeta(true);

    try {
      const preasheet = await documentsClient.getPreasheet(preasheetId);
      const names = Array.isArray(preasheet?.sheetNames)
        ? preasheet.sheetNames
            .map((name) => String(name || "").trim())
            .filter(Boolean)
        : [];

      const finalSheetNames = names.length ? names : fallbackDocumentSheets;
      const nextFileName = String(
        preasheet?.preasheetName ||
          documentForm.fileName ||
          documentForm.name ||
          "",
      ).trim();

      setDocumentDetail((prev) => ({
        ...prev,
        fileName: nextFileName,
      }));
      setDocumentSyncPreasheetName(
        preasheet?.preasheetName || documentForm.fileName || "",
      );
      setDocumentSyncSheetNames(finalSheetNames);
      setDocumentSyncOptions((prev) => ({
        ...prev,
        selectedSheets: Array.isArray(prev.selectedSheets)
          ? prev.selectedSheets
          : [],
      }));

      return true;
    } catch (error) {
      console.log(error);
      setErrorMessage(error.message || "Cannot load spreadsheet metadata");
      return false;
    } finally {
      setIsLoadingDocumentSyncMeta(false);
    }
  };

  const handleNextDocumentFormPhase = async () => {
    const name = documentForm.name.trim();

    if (!name) {
      setErrorMessage("Document name is required");
      return;
    }

    if (documentForm.type !== "Spreadsheets") {
      return;
    }

    const preasheetId = documentForm.preasheetId.trim();
    if (!preasheetId) {
      setErrorMessage("Spreadsheet ID is required");
      return;
    }

    setErrorMessage("");
    const loaded = await loadDocumentPreasheetMetadata(preasheetId);
    if (loaded) {
      setDocumentFormPhase("sync");
    }
  };

  const handleBackDocumentFormPhase = () => {
    setErrorMessage("");
    setDocumentFormPhase(documentEditingMode === "create" ? "type" : "details");
  };

  const openDocumentSyncModal = async () => {
    if (!selectedDocumentName) {
      return;
    }

    if ((documentForm.type || "Spreadsheets") !== "Spreadsheets") {
      setErrorMessage("Sync is only available for Spreadsheets documents");
      return;
    }

    if (!documentForm.preasheetId) {
      setErrorMessage("Spreadsheet ID is required to sync");
      return;
    }

    setErrorMessage("");
    setIsDocumentModalOpen(false);
    setIsDocumentDeleteModalOpen(false);

    const loaded = await loadDocumentPreasheetMetadata(
      documentForm.preasheetId,
    );
    if (loaded) {
      setIsDocumentSyncModalOpen(true);
    }
  };

  const refreshWorkspaceList = async () => {
    await refreshWorkspaces();
  };

  const handleSaveWorkspace = async (event) => {
    event.preventDefault();
    setIsSavingWorkspace(true);
    setErrorMessage("");

    const payload = buildWorkspacePayload(workspaceForm);

    if (!payload.name) {
      setErrorMessage("Workspace name is required");
      setIsSavingWorkspace(false);
      return;
    }

    try {
      if (editingMode === "create") {
        await workspacesClient.createWorkspace(payload);
        await refreshAfterWorkspaceCreate();
        workspaceToast.created();
      } else {
        await workspacesClient.updateWorkspace(payload);
        await refreshAfterWorkspaceUpdate();
        workspaceToast.updated();
      }

      navigate(`/workspaces/${encodeURIComponent(payload.name)}`);
      setIsWorkspaceModalOpen(false);
    } catch (error) {
      console.log(error);
      const message = workspaceToast.error(error, "Can not save workspace");
      setErrorMessage(message);
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!selectedWorkspaceName) {
      return;
    }

    setIsSavingWorkspace(true);
    setErrorMessage("");

    try {
      await workspacesClient.deleteWorkspace(selectedWorkspaceName);
      await refreshAfterWorkspaceDelete();
      navigate("/workspaces");
      setIsDeleteModalOpen(false);
      resetWorkspaceDetail();
      workspaceToast.deleted();
    } catch (error) {
      console.log(error);
      const message = workspaceToast.error(error, "Can not delete workspace");
      setErrorMessage(message);
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  const handleSavePrompt = async (event, formData) => {
    event.preventDefault();
    setIsSavingPrompt(true);
    setErrorMessage("");

    const payload = buildPromptPayload(formData);

    if (!payload.name) {
      setErrorMessage("Prompt name is required");
      setIsSavingPrompt(false);
      return;
    }

    if (!payload.workspace) {
      setErrorMessage("Workspace is required");
      setIsSavingPrompt(false);
      return;
    }

    try {
      if (promptEditingMode === "create") {
        await promptsClient.createPrompt(payload);
        await refreshAfterPromptCreate();
        promptToast.created();
      } else {
        await promptsClient.updatePrompt(payload);
        await loadSyncPrompt();
        await refreshAfterPromptUpdate();
        promptToast.updated();
      }

      const targetWorkspaceName = payload.workspace || selectedWorkspaceName;
      if (targetWorkspaceName) {
        openChildTab("prompt", payload.name);
        navigate(
          `/workspaces/${encodeURIComponent(targetWorkspaceName)}?prompt=${encodeURIComponent(payload.name)}`,
        );
      } else {
        await refreshWorkspaceList();
      }
      setIsPromptModalOpen(false);
    } catch (error) {
      console.log(error);
      const message = promptToast.error(error, "Can not save prompt");
      setErrorMessage(message);
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleDeletePrompt = async () => {
    if (!selectedPromptName) {
      return;
    }

    setIsSavingPrompt(true);
    setErrorMessage("");

    try {
      await promptsClient.deletePrompt(selectedPromptName);
      await refreshAfterPromptDelete();

      if (selectedWorkspaceName) {
        navigate(`/workspaces/${encodeURIComponent(selectedWorkspaceName)}`);
      }

      setPromptDetail({
        ...DEFAULT_PROMPT_FORM,
        workspace: selectedWorkspaceName || "",
      });
      setPromptEditingMode("create");
      setIsPromptDeleteModalOpen(false);
      promptToast.deleted();
    } catch (error) {
      console.log(error);
      const message = promptToast.error(error, "Can not delete prompt");
      setErrorMessage(message);
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleSaveDocument = async (event) => {
    event.preventDefault();
    setIsSavingDocument(true);
    setErrorMessage("");

    const {
      payload,
      isSpreadsheetType,
      syncOptions: normalizedSyncOptions,
    } = buildDocumentPayload({
      documentForm,
      selectedWorkspaceName,
      documentSyncOptions,
    });

    if (!payload.name) {
      setErrorMessage("Document name is required");
      setIsSavingDocument(false);
      return;
    }

    if (!payload.workspace) {
      setErrorMessage("Workspace is required");
      setIsSavingDocument(false);
      return;
    }

    if (isSpreadsheetType && !payload.preasheetId) {
      setErrorMessage("Spreadsheet ID is required");
      setIsSavingDocument(false);
      return;
    }

    if (
      isSpreadsheetType &&
      !documentSyncOptions.useAllSheets &&
      !(normalizedSyncOptions.sheets || []).length
    ) {
      setErrorMessage("Please select at least one sheet or choose all");
      setIsSavingDocument(false);
      return;
    }

    payload.syncOptions = normalizedSyncOptions;

    try {
      if (documentEditingMode === "create") {
        await documentsClient.createDocument(payload);
        await refreshAfterDocumentCreate();
        documentToast.created();
      } else {
        await documentsClient.updateDocument(payload);
        await refreshAfterDocumentUpdate();
        documentToast.updated();
      }

      if (isSpreadsheetType && documentEditingMode !== "create") {
        await documentsClient.syncDocument(payload.name, normalizedSyncOptions);
        documentToast.synced();
      }

      setOpenTabs((prev) =>
        prev.filter((tab) => tab.id !== DRAFT_DOCUMENT_TAB_ID),
      );
      setDocumentFormPhase("details");
      setIsDocumentModalOpen(false);
      openDocument(payload.name);
    } catch (error) {
      console.log(error);
      const message = documentToast.error(error, "Cannot save document");
      setErrorMessage(message);
    } finally {
      setIsSavingDocument(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!selectedDocumentName) {
      return;
    }

    setIsSavingDocument(true);
    setErrorMessage("");

    try {
      await documentsClient.deleteDocument(selectedDocumentName);
      await refreshAfterDocumentDelete();
      setIsDocumentDeleteModalOpen(false);
      resetDocumentDetail();
      resetDocumentSyncOptions();
      documentToast.deleted();
      navigate(`/workspaces/${encodeURIComponent(selectedWorkspaceName)}`);
    } catch (error) {
      console.log(error);
      const message = documentToast.error(error, "Cannot delete document");
      setErrorMessage(message);
    } finally {
      setIsSavingDocument(false);
    }
  };

  const handleSyncDocument = async (event) => {
    event.preventDefault();

    if (!selectedDocumentName) {
      return;
    }

    if ((documentForm.type || "Spreadsheets") !== "Spreadsheets") {
      setErrorMessage("Sync is only available for Spreadsheets documents");
      return;
    }

    setIsSavingDocument(true);
    setErrorMessage("");

    const mergedSheets = Array.from(
      new Set([...(documentSyncOptions.selectedSheets || [])]),
    );

    const normalizedOptions = {
      includeEmptyRows: Boolean(documentSyncOptions.includeEmptyRows),
    };

    const parsedHeaderRow = Number.parseInt(documentSyncOptions.headerRow, 10);
    if (Number.isInteger(parsedHeaderRow) && parsedHeaderRow > 0) {
      normalizedOptions.headerRow = parsedHeaderRow;
    }

    if (!documentSyncOptions.useAllSheets) {
      if (!mergedSheets.length) {
        setErrorMessage("Please select at least one sheet or choose all");
        setIsSavingDocument(false);
        return;
      }
      normalizedOptions.sheets = mergedSheets;
    }

    try {
      await documentsClient.syncDocument(
        selectedDocumentName,
        normalizedOptions,
      );
      await refreshAfterDocumentUpdate();
      setIsDocumentSyncModalOpen(false);
      documentToast.synced();
    } catch (error) {
      console.log(error);
      const message = documentToast.error(error, "Cannot sync document");
      setErrorMessage(message);
    } finally {
      setIsSavingDocument(false);
    }
  };

  return (
    <div className={uiClasses.pageSurface}>
      <div className={uiClasses.pageGrid}>
        <WorkspaceSidebar
          workspaceList={workspaceList}
          documentList={workspaceDocuments}
          selectedWorkspaceName={selectedWorkspaceName}
          selectedWorkspace={selectedWorkspace}
          selectedPromptName={selectedPromptName}
          selectedDocumentName={selectedDocumentName}
          isLoadingList={isLoadingWorkspaces}
          isLoadingWorkspace={isLoadingWorkspace}
          onRefresh={refreshWorkspaceList}
          onSelectWorkspace={openWorkspace}
          onSelectPrompt={openPrompt}
          onSelectDocument={openDocument}
          onCreatePrompt={openCreatePromptModal}
          onCreateDocument={openCreateDocumentFromSidebar}
          onBack={handleBack}
        />

        <main className="grid content-start gap-0">
          {selectedWorkspaceName ? (
            <div className="overflow-x-auto border-x border-t border-stone-300 bg-[#fffef8]">
              <div className="flex min-w-max items-center gap-1 px-2 py-1">
                {openTabs.map((tab) => (
                  <div
                    key={tab.id}
                    className={`flex items-center gap-1 border px-2.5 py-1.5 text-sm ${
                      activeTab.id === tab.id
                        ? "border-teal-700 bg-teal-100 text-slate-900"
                        : "border-stone-300 bg-white text-slate-700"
                    }`}
                    role="tab"
                    aria-selected={activeTab.id === tab.id}
                    tabIndex={0}
                  >
                    <button
                      type="button"
                      className="max-w-[180px] truncate text-left"
                      onClick={() => activateTab(tab)}
                      title={tab.label}
                    >
                      {tab.type === "workspace" ? "Workspace" : tab.label}
                    </button>
                    {tab.type !== "workspace" ? (
                      <button
                        type="button"
                        className="rounded px-1 text-xs text-slate-600 hover:bg-stone-200"
                        onClick={() => closeTab(tab.id)}
                        aria-label={`Close ${tab.label} tab`}
                      >
                        x
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab.type === "workspace" ? (
            <WorkspaceDetail
              selectedWorkspaceName={selectedWorkspaceName}
              selectedPromptName={selectedPromptName}
              form={workspaceForm}
              promptCount={selectedWorkspace?.prompts?.length || 0}
              editingMode={editingMode}
              isSaving={isSavingWorkspace}
              errorMessage={errorMessage}
              isModalOpen={isWorkspaceModalOpen}
              isDeleteModalOpen={isDeleteModalOpen}
              onFormChange={handleFormChange}
              onSubmit={handleSaveWorkspace}
              onNew={openCreateModal}
              onEdit={openEditModal}
              onOpenDelete={openDeleteModal}
              onDelete={handleDeleteWorkspace}
              onCloseModal={closeWorkspaceModal}
              onCloseDelete={closeDeleteModal}
              embedded={true}
            />
          ) : null}

          {activeTab.type === "prompt" ? (
            <PromptViewer
              selectedPrompt={promptSource}
              selectedPromptName={selectedPromptName}
              promptText={promptText}
              parsedTokens={parsedTokens}
              generatedPrompt={generatedPrompt}
              promptInputValues={promptInputValues}
              promptForm={promptForm}
              workspaceList={workspaceList}
              documents={documents}
              onDocumentCreated={refreshAfterDocumentCreate}
              promptEditingMode={promptEditingMode}
              isSavingPrompt={isSavingPrompt}
              errorMessage={errorMessage}
              isPromptModalOpen={isPromptModalOpen}
              isPromptDeleteModalOpen={isPromptDeleteModalOpen}
              onInputChange={(id, value) =>
                setPromptInputValues((prev) => ({ ...prev, [id]: value }))
              }
              onPromptDetailChange={handlePromptDetailChange}
              onPromptSubmit={handleSavePrompt}
              onNewPrompt={openCreatePromptModal}
              onEditPrompt={openEditPromptModal}
              onOpenDeletePrompt={openDeletePromptModal}
              onDeletePrompt={handleDeletePrompt}
              onClosePromptModal={closePromptModal}
              onCloseDeletePrompt={closePromptDeleteModal}
              embedded={true}
              showNewButton={false}
            />
          ) : null}

          {activeTab.type === "document" ? (
            <>
              <DocumentDetail
                selectedDocumentName={selectedDocumentName}
                form={documentForm}
                editingMode={documentEditingMode}
                formPhase={documentFormPhase}
                workspaceList={workspaceList}
                isSaving={isSavingDocument}
                errorMessage={errorMessage}
                isModalOpen={isDocumentModalOpen}
                isDeleteModalOpen={isDocumentDeleteModalOpen}
                isSyncModalOpen={isDocumentSyncModalOpen}
                syncOptions={documentSyncOptions}
                syncPreasheetName={documentSyncPreasheetName}
                syncSheetNames={documentSyncSheetNames}
                isLoadingSyncMeta={isLoadingDocumentSyncMeta}
                onFormChange={handleDocumentDetailChange}
                onSyncOptionChange={handleDocumentSyncOptionChange}
                onToggleSyncSheet={handleToggleDocumentSyncSheet}
                onToggleAllSheets={handleToggleAllDocumentSheets}
                onSelectType={handleSelectDocumentType}
                onNextTypePhase={handleNextDocumentTypePhase}
                onNextPhase={handleNextDocumentFormPhase}
                onBackPhase={handleBackDocumentFormPhase}
                onSubmit={handleSaveDocument}
                onSubmitSync={handleSyncDocument}
                onNew={openCreateDocumentModal}
                onEdit={openEditDocumentModal}
                onOpenDelete={openDeleteDocumentModal}
                onOpenSync={openDocumentSyncModal}
                onDelete={handleDeleteDocument}
                onCloseModal={closeDocumentModal}
                onCloseDelete={closeDocumentDeleteModal}
                onCloseSync={closeDocumentSyncModal}
                embedded={true}
                showNewButton={false}
              />

              {isLoadingDocument ? (
                <p className="text-sm text-slate-600">Loading document...</p>
              ) : null}

              {!isLoadingDocument && selectedDocumentName ? (
                <div className="mt-4">
                  <DocumentContentPreview
                    type={documentForm.type}
                    contentMarkdown={documentForm.contentMarkdown}
                    contentJSON={parsedDocumentJSON || documentForm.contentJSON}
                    contentHTML={documentForm.contentHTML}
                  />
                </div>
              ) : null}
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
