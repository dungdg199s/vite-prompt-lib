import { useEffect, useState } from "react";
import { promptsClient } from "../lib/prompts-client";
import { workspacesClient } from "../lib/workspaces-client";
import PromptSidebar from "../components/prompts/PromptSidebar";
import PromptForm from "../components/prompts/PromptForm";
import PromptContentPreview from "../components/prompts/PromptContentPreview";

const DEFAULT_PROMPT_FORM = {
  name: "",
  workspace: "",
  description: "",
  content: "",
  shareMode: "private",
  shareWith: "",
};

const normalizeShareWith = (raw) => {
  return String(raw || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export default function PromptsPage() {
  const [promptList, setPromptList] = useState([]);
  const [workspaceList, setWorkspaceList] = useState([]);
  const [selectedPromptName, setSelectedPromptName] = useState("");
  const [promptForm, setPromptForm] = useState(DEFAULT_PROMPT_FORM);
  const [editingMode, setEditingMode] = useState("create");
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [filterWorkspace, setFilterWorkspace] = useState("");
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFormChange = (field, value) => {
    setPromptForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setPromptForm(DEFAULT_PROMPT_FORM);
    setSelectedPromptName("");
    setEditingMode("create");
  };

  const openCreateModal = () => {
    setErrorMessage("");
    resetForm();
    setIsDeleteModalOpen(false);
    setIsPromptModalOpen(true);
  };

  const openEditModal = () => {
    if (!selectedPromptName) {
      return;
    }
    setErrorMessage("");
    setEditingMode("edit");
    setIsDeleteModalOpen(false);
    setIsPromptModalOpen(true);
  };

  const openDeleteModal = () => {
    if (!selectedPromptName) {
      return;
    }
    setErrorMessage("");
    setIsPromptModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const closePromptModal = () => {
    setIsPromptModalOpen(false);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const refreshPromptList = async () => {
    setIsLoadingList(true);
    setErrorMessage("");
    try {
      const list = (await promptsClient.getPrompts()) || [];
      setPromptList(list);
    } catch (error) {
      setErrorMessage(error.message || "Cannot load prompt list");
    } finally {
      setIsLoadingList(false);
    }
  };

  const openPrompt = async (name) => {
    setSelectedPromptName(name);
    setErrorMessage("");
    try {
      const prompt = await promptsClient.getPrompt(name);
      setPromptForm({
        name: prompt?.name || "",
        workspace: prompt?.workspace || "",
        description: prompt?.description || "",
        content: prompt?.content || "",
        shareMode: prompt?.shareMode || "private",
        shareWith: Array.isArray(prompt?.shareWith)
          ? prompt.shareWith.join(", ")
          : "",
      });
      setEditingMode("edit");
    } catch (error) {
      setErrorMessage(error.message || "Cannot load prompt detail");
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    const payload = {
      name: promptForm.name.trim(),
      workspace: promptForm.workspace.trim(),
      description: promptForm.description.trim(),
      content: promptForm.content,
      shareMode: promptForm.shareMode,
      shareWith: normalizeShareWith(promptForm.shareWith),
    };

    if (!payload.name) {
      setErrorMessage("Prompt name is required");
      setIsSaving(false);
      return;
    }

    try {
      if (editingMode === "create") {
        await promptsClient.createPrompt(payload);
      } else {
        await promptsClient.updatePrompt(payload);
      }
      await refreshPromptList();
      await openPrompt(payload.name);
      setIsPromptModalOpen(false);
    } catch (error) {
      setErrorMessage(error.message || "Cannot save prompt");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPromptName) return;
    setIsSaving(true);
    setErrorMessage("");
    try {
      await promptsClient.deletePrompt(selectedPromptName);
      setIsDeleteModalOpen(false);
      resetForm();
      await refreshPromptList();
    } catch (error) {
      setErrorMessage(error.message || "Cannot delete prompt");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      refreshPromptList();
      workspacesClient.getWorkspaces().then((list) => setWorkspaceList(list || [])).catch(() => {});
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#e3f1ea,_transparent_45%),radial-gradient(circle_at_bottom_left,_#f9ddbf,_transparent_40%)] bg-[#f5efe5] text-slate-800">
      <div className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 md:grid-cols-[320px_1fr]">
        <PromptSidebar
          promptList={promptList}
          workspaceList={workspaceList}
          selectedPromptName={selectedPromptName}
          filterWorkspace={filterWorkspace}
          isLoadingList={isLoadingList}
          onRefresh={refreshPromptList}
          onSelectPrompt={openPrompt}
          onFilterChange={setFilterWorkspace}
        />

        <main className="grid content-start gap-4 p-4 md:p-6">
          <PromptForm
            selectedPromptName={selectedPromptName}
            form={promptForm}
            editingMode={editingMode}
            workspaceList={workspaceList}
            isSaving={isSaving}
            errorMessage={errorMessage}
            isModalOpen={isPromptModalOpen}
            isDeleteModalOpen={isDeleteModalOpen}
            onFormChange={handleFormChange}
            onSubmit={handleSave}
            onNew={openCreateModal}
            onEdit={openEditModal}
            onOpenDelete={openDeleteModal}
            onDelete={handleDelete}
            onCloseModal={closePromptModal}
            onCloseDelete={closeDeleteModal}
          />
          <PromptContentPreview content={promptForm.content} />
        </main>
      </div>
    </div>
  );
}
