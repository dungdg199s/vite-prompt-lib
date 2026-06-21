import { useEffect, useMemo, useState } from "react";
import { workspacesClient } from "../lib/workspaces-client";
import WorkspaceSidebar from "../components/workspaces/WorkspaceSidebar";
import WorkspaceForm from "../components/workspaces/WorkspaceForm";
import PromptViewer from "../components/workspaces/PromptViewer";

const DEFAULT_WORKSPACE_FORM = {
  name: "",
  description: "",
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
  const [workspaceList, setWorkspaceList] = useState([]);
  const [selectedWorkspaceName, setSelectedWorkspaceName] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [selectedPromptName, setSelectedPromptName] = useState("");
  const [promptInputValues, setPromptInputValues] = useState({});
  const [workspaceForm, setWorkspaceForm] = useState(DEFAULT_WORKSPACE_FORM);
  const [editingMode, setEditingMode] = useState("create");
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFormChange = (field, value) => {
    setWorkspaceForm((prev) => ({ ...prev, [field]: value }));
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

  const openCreateModal = () => {
    setErrorMessage("");
    resetWorkspaceForm();
    setIsDeleteModalOpen(false);
    setIsWorkspaceModalOpen(true);
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

  const openDeleteModal = () => {
    if (!selectedWorkspaceName) {
      return;
    }
    setErrorMessage("");
    setIsWorkspaceModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const closeWorkspaceModal = () => {
    setIsWorkspaceModalOpen(false);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleBack = () => {
    setSelectedWorkspaceName("");
    setSelectedWorkspace(null);
    setSelectedPromptName("");
    setPromptInputValues({});
    setIsWorkspaceModalOpen(false);
    setIsDeleteModalOpen(false);
    resetWorkspaceForm();
  };

  const refreshWorkspaceList = async () => {
    setIsLoadingList(true);
    setErrorMessage("");

    try {
      const list = (await workspacesClient.getWorkspaces()) || [];
      setWorkspaceList(list);
    } catch (error) {
      setErrorMessage(error.message || "Can not load workspace list");
    } finally {
      setIsLoadingList(false);
    }
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
      setEditingMode("edit");
    } catch (error) {
      setErrorMessage(error.message || "Can not load workspace detail");
    } finally {
      setIsLoadingWorkspace(false);
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
      shareWith: normalizeShareWith(workspaceForm.shareWith),
    };

    if (!payload.name) {
      setErrorMessage("Workspace name is required");
      setIsSavingWorkspace(false);
      return;
    }

    try {
      if (editingMode === "create") {
        await workspacesClient.createWorkspace(payload);
      } else {
        await workspacesClient.updateWorkspace(payload);
      }

      await refreshWorkspaceList();
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
      setSelectedWorkspaceName("");
      setSelectedWorkspace(null);
      setSelectedPromptName("");
      setPromptInputValues({});
      setIsDeleteModalOpen(false);
      resetWorkspaceForm();
      await refreshWorkspaceList();
    } catch (error) {
      setErrorMessage(error.message || "Can not delete workspace");
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      refreshWorkspaceList();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#e3f1ea,_transparent_45%),radial-gradient(circle_at_bottom_left,_#f9ddbf,_transparent_40%)] bg-[#f5efe5] text-slate-800">
      <div className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 md:grid-cols-[320px_1fr]">
        <WorkspaceSidebar
          workspaceList={workspaceList}
          selectedWorkspaceName={selectedWorkspaceName}
          selectedWorkspace={selectedWorkspace}
          selectedPromptName={selectedPromptName}
          isLoadingList={isLoadingList}
          isLoadingWorkspace={isLoadingWorkspace}
          isSaving={isSavingWorkspace}
          onRefresh={refreshWorkspaceList}
          onSelectWorkspace={openWorkspace}
          onSelectPrompt={(name) => {
            setSelectedPromptName(name);
            setPromptInputValues({});
          }}
          onBack={handleBack}
          onNew={openCreateModal}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
        />

        <main className="grid content-start gap-4 p-4 md:p-6">
          {selectedPromptName ? (
            <PromptViewer
              selectedPrompt={selectedPrompt}
              promptText={promptText}
              parsedTokens={parsedTokens}
              generatedPrompt={generatedPrompt}
              promptInputValues={promptInputValues}
              onInputChange={(id, value) =>
                setPromptInputValues((prev) => ({ ...prev, [id]: value }))
              }
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
