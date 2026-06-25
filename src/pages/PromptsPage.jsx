import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PromptSidebar from "../components/prompts/PromptSidebar";
import PromptDetail from "../components/prompts/PromptDetail";
import PromptContentPreview from "../components/prompts/PromptContentPreview";
import { uiClasses } from "../components/shared/uiClasses";
import { useCrudToast } from "../lib/toast";
import { usePrompts } from "../store/promptStore";
import { useWorkspaces } from "../store/workspaceStore";

const DEFAULT_PROMPT_FORM = {
  name: "",
  workspace: "",
  description: "",
  content: "",
  shareMode: "private",
  shareWith: "",
};

const STORAGE_KEY = "promptsPageState";

const normalizeShareWith = (raw) => {
  return String(raw || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export default function PromptsPage() {
  const navigate = useNavigate();
  const params = useParams();

  const promptList = usePrompts((state) => state.prompts);
  const isLoadingList = usePrompts((state) => state.isLoading);
  const refreshPrompts = usePrompts((state) => state.refreshPrompts);
  const fetchPromptById = usePrompts((state) => state.fetchPromptById);
  const createPrompt = usePrompts((state) => state.createPrompt);
  const updatePrompt = usePrompts((state) => state.updatePrompt);
  const deletePrompt = usePrompts((state) => state.deletePrompt);
  const workspaceList = useWorkspaces((state) => state.workspaces);
  const refreshWorkspaces = useWorkspaces((state) => state.refreshWorkspaces);

  const promptNameFromUrl = params["*"] || "";

  // Save URL state to localStorage
  useEffect(() => {
    if (promptNameFromUrl) {
      const state = {
        prompt: promptNameFromUrl,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [promptNameFromUrl]);

  // Restore state from localStorage if no URL hash
  useEffect(() => {
    if (!promptNameFromUrl) {
      try {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const { prompt } = JSON.parse(savedState);
          if (prompt) {
            navigate(`/prompts/${encodeURIComponent(prompt)}`, {
              replace: true,
            });
          }
        }
      } catch (error) {
        console.log(error);
        console.error("Failed to restore state from localStorage:", error);
      }
    }
  }, [promptNameFromUrl, navigate]);

  const [promptForm, setPromptDetail] = useState(DEFAULT_PROMPT_FORM);
  const [editingMode, setEditingMode] = useState("create");
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [filterWorkspace, setFilterWorkspace] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const promptToast = useCrudToast("Prompt");

  // Use URL params as source of truth
  const selectedPromptName = promptNameFromUrl;

  useEffect(() => {
    refreshPrompts();
    refreshWorkspaces();
  }, [refreshPrompts, refreshWorkspaces]);

  // Load prompt data when URL changes
  useEffect(() => {
    const loadPrompt = async () => {
      if (!selectedPromptName) {
        setPromptDetail(DEFAULT_PROMPT_FORM);
        setEditingMode("create");
        return;
      }

      setErrorMessage("");
      try {
        await fetchPromptById(selectedPromptName);
        const prompt = usePrompts.getState().selectedPrompt;
        setPromptDetail({
          id: prompt?.id,
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
        console.log(error);
        setErrorMessage(error.message || "Cannot load prompt detail");
      }
    };

    loadPrompt();
  }, [selectedPromptName, fetchPromptById]);

  const handleFormChange = (field, value) => {
    setPromptDetail((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setPromptDetail(DEFAULT_PROMPT_FORM);
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
    await refreshPrompts();
  };

  const openPrompt = async (name) => {
    navigate(`/prompts/${encodeURIComponent(name)}`);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    const payload = {
      id: promptForm?.id,
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
      setIsSaving(false);
      return;
    }

    if (!payload.workspace) {
      setErrorMessage("Workspace is required");
      setIsSaving(false);
      return;
    }

    try {
      if (editingMode === "create") {
        await createPrompt(payload);
        await refreshPrompts();
        promptToast.created();
      } else {
        await updatePrompt(payload);
        await refreshPrompts();
        promptToast.updated();
      }
      navigate(`/prompts/${encodeURIComponent(payload.name)}`);
      setIsPromptModalOpen(false);
    } catch (error) {
      console.log(error);
      const message = promptToast.error(error, "Cannot save prompt");
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPromptName) return;
    setIsSaving(true);
    setErrorMessage("");
    try {
      await deletePrompt(selectedPromptName);
      await refreshPrompts();
      navigate("/prompts");
      setIsDeleteModalOpen(false);
      resetForm();
      promptToast.deleted();
    } catch (error) {
      console.log(error);
      const message = promptToast.error(error, "Cannot delete prompt");
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={uiClasses.pageSurface}>
      <div className={uiClasses.pageGrid}>
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

        <main className="grid content-start gap-4 p-4 md:p-6 lg:p-8">
          <PromptDetail
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
