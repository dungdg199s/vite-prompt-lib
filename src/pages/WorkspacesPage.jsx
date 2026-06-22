import { useEffect, useMemo, useState } from "react";
import { promptsClient } from "../lib/prompts-client";
import { workspacesClient } from "../lib/workspaces-client";
import { useAppData } from "../contexts/AppDataContext";
import WorkspaceSidebar from "../components/workspaces/WorkspaceSidebar";
import WorkspaceForm from "../components/workspaces/WorkspaceForm";
import PromptViewer from "../components/workspaces/PromptViewer";

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

  return String(
    prompt.content ||
      prompt.template ||
      prompt.prompt ||
      prompt.description ||
      "",
  );
};

export default function WorkspacesPage() {
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
  } = useAppData();

  const [selectedWorkspaceName, setSelectedWorkspaceName] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [selectedPromptName, setSelectedPromptName] = useState("");
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
    return (
      selectedWorkspace.prompts.find(
        (item) => item.name === selectedPromptName,
      ) || null
    );
  }, [selectedWorkspace, selectedPromptName]);

  const promptText = useMemo(
    () => getPromptText(selectedPrompt),
    [selectedPrompt],
  );

  const parsedTokens = useMemo(
    () => parsePromptTokens(promptText),
    [promptText],
  );

  const generatedPrompt = useMemo(() => {
    if (!promptText) {
      return "";
    }

    return parsedTokens.reduce((result, token) => {
      const tokenValue = promptInputValues[token.id] ?? "";
      return result.replaceAll(token.raw, tokenValue);
    }, promptText);
  }, [parsedTokens, promptInputValues, promptText]);

  const resetWorkspaceForm = () => {
    setWorkspaceForm(DEFAULT_WORKSPACE_FORM);
    setEditingMode("create");
  };

  const resetPromptForm = () => {
    setPromptForm({ ...DEFAULT_PROMPT_FORM, workspace: selectedWorkspaceName || "" });
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
    setSelectedWorkspaceName("");
    setSelectedWorkspace(null);
    setSelectedPromptName("");
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
    setSelectedWorkspaceName(name);
    setSelectedPromptName("");
    setPromptInputValues({});
    setIsLoadingWorkspace(true);
    setErrorMessage("");

    try {
      const workspace = await workspacesClient.getWorkspace(name);
      setSelectedWorkspace(workspace);
      setWorkspaceForm({
        name: workspace?.name || "",
        description: workspace?.description || "",
        shareMode: workspace?.shareMode || "private",
        shareWith: Array.isArray(workspace?.shareWith)
          ? workspace.shareWith.join(", ")
          : "",
      });
      setPromptForm((prev) => ({ ...prev, workspace: name }));
      setEditingMode("edit");
    } catch (error) {
      setErrorMessage(error.message || "Can not load workspace detail");
    } finally {
      setIsLoadingWorkspace(false);
    }
  };

  const openPrompt = async (name) => {
    setSelectedPromptName(name);
    setPromptInputValues({});
    setErrorMessage("");

    try {
      const prompt = await promptsClient.getPrompt(name);
      setPromptForm({
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
      setErrorMessage(error.message || "Can not load prompt detail");
    }
  };

  const handleSaveWorkspace = async (event) => {
    event.preventDefault();
    setIsSavingWorkspace(true);
    setErrorMessage("");

    const payload = {
      name: workspaceForm.name.trim(),
      description: workspaceForm.description.trim(),
      shareMode: workspaceForm.shareMode,
      shareWith:
        workspaceForm.shareMode === "shared"
          ? normalizeShareWith(workspaceForm.shareWith)
          : [],
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

      await openWorkspace(payload.name);
      setIsWorkspaceModalOpen(false);
    } catch (error) {
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
      setSelectedWorkspaceName("");
      setSelectedWorkspace(null);
      setSelectedPromptName("");
      setPromptInputValues({});
      setIsDeleteModalOpen(false);
      resetWorkspaceForm();
    } catch (error) {
      setErrorMessage(error.message || "Can not delete workspace");
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  const handleSavePrompt = async (event) => {
    event.preventDefault();
    setIsSavingPrompt(true);
    setErrorMessage("");

    const payload = {
      name: promptForm.name.trim(),
      workspace: promptForm.workspace.trim(),
      description: promptForm.description.trim(),
      content: promptForm.content,
      shareMode: promptForm.shareMode,
      shareWith:
        promptForm.shareMode === "shared"
          ? normalizeShareWith(promptForm.shareWith)
          : [],
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
        await refreshAfterPromptUpdate();
      }

      const targetWorkspaceName = payload.workspace || selectedWorkspaceName;
      if (targetWorkspaceName) {
        await openWorkspace(targetWorkspaceName);
      } else {
        await refreshWorkspaceList();
      }
      await openPrompt(payload.name);
      setIsPromptModalOpen(false);
    } catch (error) {
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
      setSelectedPromptName("");
      setPromptInputValues({});
      setPromptForm({ ...DEFAULT_PROMPT_FORM, workspace: selectedWorkspaceName || "" });
      setPromptEditingMode("create");
      setIsPromptDeleteModalOpen(false);
      if (selectedWorkspaceName) {
        await openWorkspace(selectedWorkspaceName);
      }
    } catch (error) {
      setErrorMessage(error.message || "Can not delete prompt");
    } finally {
      setIsSavingPrompt(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#e3f1ea,_transparent_45%),radial-gradient(circle_at_bottom_left,_#f9ddbf,_transparent_40%)] bg-[#f5efe5] text-slate-800">
      <div className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 md:grid-cols-[320px_1fr]">
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

        <main className="grid content-start gap-4 p-4 md:p-6">
          {selectedPromptName ? (
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
              promptEditingMode={promptEditingMode}
              isSavingPrompt={isSavingPrompt}
              errorMessage={errorMessage}
              isPromptModalOpen={isPromptModalOpen}
              isPromptDeleteModalOpen={isPromptDeleteModalOpen}
              onInputChange={(id, value) =>
                setPromptInputValues((prev) => ({ ...prev, [id]: value }))
              }
              onPromptFormChange={handlePromptFormChange}
              onPromptSubmit={handleSavePrompt}
              onNewPrompt={openCreatePromptModal}
              onEditPrompt={openEditPromptModal}
              onOpenDeletePrompt={openDeletePromptModal}
              onDeletePrompt={handleDeletePrompt}
              onClosePromptModal={closePromptModal}
              onCloseDeletePrompt={closePromptDeleteModal}
            />
          ) : (
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
        </main>
      </div>
    </div>
  );
}
