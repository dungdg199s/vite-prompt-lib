import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { promptsClient } from "../lib/prompts-client";
import { workspacesClient } from "../lib/workspaces-client";
import { useAppData } from "../contexts/AppDataContext";
import WorkspaceSidebar from "../components/workspaces/WorkspaceSidebar";
import WorkspaceForm from "../components/workspaces/WorkspaceForm";
import PromptViewer from "../components/workspaces/PromptViewer";
import { uiClasses } from "../components/shared/uiClasses";

const DEFAULT_WORKSPACE_FORM = {
  name: "",
  description: "",
  shareMode: "private",
  shareWith: "",
};

const DEFAULT_PROMPT_FORM = {
  name: "",
  workspace: "",
  description: "",
  content: "",
  shareMode: "private",
  shareWith: "",
};

const TOKEN_REGEX = /\$\{([^}|]+)\|([^}]+)\}/g;

const normalizeShareWith = (raw) => {
  return String(raw || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

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

  return String(prompt.content || prompt.template || prompt.prompt || prompt.description || "");
};

const STORAGE_KEY = "workspacesPageState";

export default function WorkspacesPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();

  const {
    workspaces: workspaceList,
    documents,
    isLoadingWorkspaces,
    refreshWorkspaces,
    refreshAfterWorkspaceCreate,
    refreshAfterWorkspaceUpdate,
    refreshAfterWorkspaceDelete,
    refreshAfterPromptCreate,
    refreshAfterPromptUpdate,
    refreshAfterPromptDelete,
    refreshAfterDocumentCreate,
  } = useAppData();

  const workspaceNameFromUrl = params["*"] || "";
  const promptNameFromUrl = searchParams.get("prompt") || "";

  // Save URL state to localStorage
  useEffect(() => {
    if (workspaceNameFromUrl || promptNameFromUrl) {
      const state = {
        workspace: workspaceNameFromUrl,
        prompt: promptNameFromUrl,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [workspaceNameFromUrl, promptNameFromUrl]);

  // Restore state from localStorage if no URL hash
  useEffect(() => {
    if (!workspaceNameFromUrl && !promptNameFromUrl) {
      try {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const { workspace, prompt } = JSON.parse(savedState);
          if (workspace) {
            const targetUrl = prompt
              ? `/workspaces/${encodeURIComponent(workspace)}?prompt=${encodeURIComponent(prompt)}`
              : `/workspaces/${encodeURIComponent(workspace)}`;
            navigate(targetUrl, { replace: true });
          }
        }
      } catch (error) {
        console.log(error);
        console.error("Failed to restore state from localStorage:", error);
      }
    }
  }, []);

  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [promptInputValues, setPromptInputValues] = useState({});
  const [promptForm, setPromptForm] = useState(DEFAULT_PROMPT_FORM);
  const [workspaceForm, setWorkspaceForm] = useState(DEFAULT_WORKSPACE_FORM);
  const [editingMode, setEditingMode] = useState("create");
  const [promptEditingMode, setPromptEditingMode] = useState("create");
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isPromptDeleteModalOpen, setIsPromptDeleteModalOpen] = useState(false);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Use URL params as source of truth
  const selectedWorkspaceName = workspaceNameFromUrl;
  const selectedPromptName = promptNameFromUrl;

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
        const workspace = await workspacesClient.getWorkspace(selectedWorkspaceName);
        setSelectedWorkspace(workspace);
        setWorkspaceForm({
          ...workspace,
          id: workspace?.id,
          name: workspace?.name || "",
          description: workspace?.description || "",
          shareMode: workspace?.shareMode || "private",
          shareWith: Array.isArray(workspace?.shareWith) ? workspace.shareWith.join(", ") : "",
        });
        setPromptForm((prev) => ({ ...prev, workspace: selectedWorkspaceName }));
        setEditingMode("edit");
      } catch (error) {
        console.log(error);
        setErrorMessage(error.message || "Can not load workspace detail");
      } finally {
        setIsLoadingWorkspace(false);
      }
    };

    loadWorkspace();
  }, [selectedWorkspaceName]);

  const loadSyncPrompt = async () => {
    if (!selectedPromptName) {
      setPromptInputValues({});
      setPromptEditingMode("create");
      return;
    }

    setErrorMessage("");
    try {
      const prompt = await promptsClient.getPrompt(selectedPromptName);
      setPromptForm({
        ...prompt,
        id: prompt?.id,
        name: prompt?.name || "",
        workspace: prompt?.workspace || selectedWorkspaceName || "",
        description: prompt?.description || "",
        content: prompt?.content || "",
        shareMode: prompt?.shareMode || "private",
        shareWith: Array.isArray(prompt?.shareWith) ? prompt.shareWith.join(", ") : "",
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
        setPromptForm({
          ...prompt,
          id: prompt?.id,
          name: prompt?.name || "",
          workspace: prompt?.workspace || selectedWorkspaceName || "",
          description: prompt?.description || "",
          content: prompt?.content || "",
          shareMode: prompt?.shareMode || "private",
          shareWith: Array.isArray(prompt?.shareWith) ? prompt.shareWith.join(", ") : "",
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
  }, [selectedPromptName, selectedWorkspaceName]);

  const handleFormChange = (field, value) => {
    setWorkspaceForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePromptFormChange = (field, value) => {
    setPromptForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectedPrompt = useMemo(() => {
    if (!selectedWorkspace?.prompts?.length) {
      return null;
    }
    return selectedWorkspace.prompts.find((item) => item.name === selectedPromptName) || null;
  }, [selectedWorkspace, selectedPromptName]);

  const promptText = getPromptText(selectedPrompt);

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

  const resetWorkspaceForm = () => {
    setWorkspaceForm(DEFAULT_WORKSPACE_FORM);
    setEditingMode("create");
  };

  const resetPromptForm = () => {
    setPromptForm({
      ...DEFAULT_PROMPT_FORM,
      workspace: selectedWorkspaceName || "",
    });
    setPromptEditingMode("create");
  };

  const openCreateModal = () => {
    setErrorMessage("");
    resetWorkspaceForm();
    setIsDeleteModalOpen(false);
    setIsWorkspaceModalOpen(true);
  };

  const openCreatePromptModal = () => {
    setErrorMessage("");
    resetPromptForm();
    setIsPromptDeleteModalOpen(false);
    setIsPromptModalOpen(true);
  };

  const openEditModal = () => {
    if (!selectedWorkspaceName) {
      return;
    }
    setErrorMessage("");
    setEditingMode("edit");
    setIsDeleteModalOpen(false);
    setIsWorkspaceModalOpen(true);
  };

  const openEditPromptModal = () => {
    if (!selectedPromptName) {
      return;
    }
    setErrorMessage("");
    setPromptEditingMode("edit");
    setIsPromptDeleteModalOpen(false);
    setIsPromptModalOpen(true);
  };

  const openDeleteModal = () => {
    if (!selectedWorkspaceName) {
      return;
    }
    setErrorMessage("");
    setIsWorkspaceModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const openDeletePromptModal = () => {
    if (!selectedPromptName) {
      return;
    }
    setErrorMessage("");
    setIsPromptModalOpen(false);
    setIsPromptDeleteModalOpen(true);
  };

  const closeWorkspaceModal = () => {
    setIsWorkspaceModalOpen(false);
  };

  const closePromptModal = () => {
    setIsPromptModalOpen(false);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const closePromptDeleteModal = () => {
    setIsPromptDeleteModalOpen(false);
  };

  const handleBack = () => {
    navigate("/workspaces");
    setSelectedWorkspace(null);
    setPromptInputValues({});
    setPromptForm(DEFAULT_PROMPT_FORM);
    setIsWorkspaceModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsPromptModalOpen(false);
    setIsPromptDeleteModalOpen(false);
    resetWorkspaceForm();
  };

  const refreshWorkspaceList = async () => {
    await refreshWorkspaces();
  };

  const openWorkspace = async (name) => {
    navigate(`/workspaces/${encodeURIComponent(name)}`);
  };

  const openPrompt = async (name) => {
    if (!selectedWorkspaceName) return;
    navigate(`/workspaces/${encodeURIComponent(selectedWorkspaceName)}?prompt=${encodeURIComponent(name)}`);
  };

  const handleSaveWorkspace = async (event) => {
    event.preventDefault();
    setIsSavingWorkspace(true);
    setErrorMessage("");

    const payload = {
      id: workspaceForm.id,
      name: workspaceForm.name.trim(),
      description: workspaceForm.description.trim(),
      shareMode: workspaceForm.shareMode,
      shareWith: workspaceForm.shareMode === "shared" ? normalizeShareWith(workspaceForm.shareWith) : [],
    };

    if (!payload.name) {
      setErrorMessage("Workspace name is required");
      setIsSavingWorkspace(false);
      return;
    }

    try {
      if (editingMode === "create") {
        await workspacesClient.createWorkspace(payload);
        await refreshAfterWorkspaceCreate();
      } else {
        await workspacesClient.updateWorkspace(payload);
        await refreshAfterWorkspaceUpdate();
      }

      navigate(`/workspaces/${encodeURIComponent(payload.name)}`);
      setIsWorkspaceModalOpen(false);
    } catch (error) {
      console.log(error);
      setErrorMessage(error.message || "Can not save workspace");
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
      resetWorkspaceForm();
    } catch (error) {
      console.log(error);
      setErrorMessage(error.message || "Can not delete workspace");
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  const handleSavePrompt = async (event, formData) => {
    event.preventDefault();
    setIsSavingPrompt(true);
    setErrorMessage("");

    const payload = {
      id: formData.id,
      name: formData.name.trim(),
      workspace: formData.workspace.trim(),
      description: formData.description.trim(),
      content: formData.content,
      shareMode: formData.shareMode,
      shareWith: formData.shareMode === "shared" ? normalizeShareWith(promptForm.shareWith) : [],
    };

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
      } else {
        await promptsClient.updatePrompt(payload);
        await loadSyncPrompt();
        await refreshAfterPromptUpdate();
      }

      const targetWorkspaceName = payload.workspace || selectedWorkspaceName;
      if (targetWorkspaceName) {
        navigate(`/workspaces/${encodeURIComponent(targetWorkspaceName)}?prompt=${encodeURIComponent(payload.name)}`);
      } else {
        await refreshWorkspaceList();
      }
      setIsPromptModalOpen(false);
    } catch (error) {
      console.log(error);
      setErrorMessage(error.message || "Can not save prompt");
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

      setPromptForm({
        ...DEFAULT_PROMPT_FORM,
        workspace: selectedWorkspaceName || "",
      });
      setPromptEditingMode("create");
      setIsPromptDeleteModalOpen(false);
    } catch (error) {
      console.log(error);
      setErrorMessage(error.message || "Can not delete prompt");
    } finally {
      setIsSavingPrompt(false);
    }
  };

  return (
    <div className={uiClasses.pageSurface}>
      <div className={uiClasses.pageGrid}>
        <WorkspaceSidebar
          workspaceList={workspaceList}
          selectedWorkspaceName={selectedWorkspaceName}
          selectedWorkspace={selectedWorkspace}
          selectedPromptName={selectedPromptName}
          isLoadingList={isLoadingWorkspaces}
          isLoadingWorkspace={isLoadingWorkspace}
          onRefresh={refreshWorkspaceList}
          onSelectWorkspace={openWorkspace}
          onSelectPrompt={openPrompt}
          onBack={handleBack}
        />

        <main className="grid content-start gap-4 p-4 md:p-6 lg:p-8">
          {selectedPromptName ? null : (
            <WorkspaceForm
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
            />
          )}
          <PromptViewer
            selectedPrompt={selectedPrompt}
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
            onInputChange={(id, value) => setPromptInputValues((prev) => ({ ...prev, [id]: value }))}
            onPromptFormChange={handlePromptFormChange}
            onPromptSubmit={handleSavePrompt}
            onNewPrompt={openCreatePromptModal}
            onEditPrompt={openEditPromptModal}
            onOpenDeletePrompt={openDeletePromptModal}
            onDeletePrompt={handleDeletePrompt}
            onClosePromptModal={closePromptModal}
            onCloseDeletePrompt={closePromptDeleteModal}
          />
        </main>
      </div>
    </div>
  );
}
