import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import Input from "../shared/Input";
import { useWorkspace, useWorkspaces } from "../../hooks/useWorkspaces";

function PromptEditModalContent({
  prompt,
  workspaces = [],
  isOpen,
  editMode,
  onClose,
  onSubmit,
  onFormChange,
  isSaving,
}) {
  const onChange = (prop, value) => {
    if (typeof onFormChange === "function") {
      onFormChange(prop, value);
    }
  };

  const workspaceOptions = useMemo(
    () =>
      workspaces.map((workspace) => ({
        label: workspace.name,
        value: workspace.id,
      })),
    [workspaces]
  );

  const shareOptions = useMemo(() => {
    return ["private", "shared", "public"].map((value) => ({ label: value, value }));
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(event) => onSubmit(event, prompt)}
      title={editMode === "create" ? "Create Prompt" : "Edit Prompt"}
      size="lg"
    >
      <Modal.Content>
        <div className="grid gap-3">
          <Input
            type="text"
            label="Prompt Name"
            value={prompt?.name || ""}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder="my-prompt-name"
            required
          ></Input>

          <Input
            label="Workspace"
            type="select"
            value={prompt?.workspace || ""}
            onChange={(event) => onChange("workspace", event.target.value)}
            placeholder="— Select workspace —"
            options={workspaceOptions}
            required
          ></Input>

          <Input
            type="text"
            label="Description"
            value={prompt?.description || ""}
            onChange={(event) => onChange("description", event.target.value)}
            placeholder="Short description of this prompt"
          ></Input>

          <Input
            type="textarea"
            label="Content"
            rows={8}
            value={prompt?.content || ""}
            onChange={(event) => onChange("content", event.target.value)}
            placeholder="Write your prompt template here.\nUse ${VariableName|description} for tokens.\nExample: ${Topic|options:React,Vue,Angular}"
            required
          ></Input>

          <Input
            label="Share Mode"
            type="select"
            value={prompt?.shareMode || "private"}
            onChange={(event) => onChange("shareMode", event.target.value)}
            options={shareOptions}
            required
          ></Input>

          {prompt?.shareMode === "shared" ? (
            <Input
              type="text"
              label="Share With (comma separated emails)"
              value={prompt?.shareWith || ""}
              onChange={(event) => onChange("shareWith", event.target.value)}
              placeholder="a@company.com, b@company.com"
            ></Input>
          ) : null}
        </div>
      </Modal.Content>
      <Modal.Actions>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSaving}>
          {editMode === "create" ? "Create" : "Update"}
        </Button>
      </Modal.Actions>
    </Modal>
  );
}

function RoutePromptEditModal() {
  const navigate = useNavigate();
  const { workspaceId, promptId } = useParams();
  const { workspaces } = useWorkspaces();
  const { prompts, updatePrompt, isLoading } = useWorkspace(workspaceId);
  const prompt = useMemo(() => prompts.find((item) => item.id === promptId), [promptId, prompts]);
  const derivedForm = useMemo(
    () => ({
      id: prompt?.id || promptId || "",
      updatedAt: prompt?.updatedAt,
      name: prompt?.name || "",
      workspace: prompt?.workspace || workspaceId || "",
      description: prompt?.description || "",
      content: prompt?.content || "",
      shareMode: prompt?.shareMode || "private",
      shareWith: Array.isArray(prompt?.shareWith) ? prompt.shareWith.join(", ") : prompt?.shareWith || "",
    }),
    [prompt, promptId, workspaceId]
  );
  const [draft, setDraft] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const form = draft ?? derivedForm;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!promptId) {
      return;
    }

    setIsSaving(true);
    const updated = await updatePrompt(promptId, {
      ...form,
      shareWith:
        form.shareMode === "shared"
          ? String(form.shareWith || "")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
    });
    setIsSaving(false);

    if (updated) {
      navigate(`/workspaces/${workspaceId}/prompts/${promptId}/view`);
    }
  };

  return (
    <PromptEditModalContent
      prompt={form}
      workspaces={workspaces}
      isOpen={true}
      editMode="edit"
      onClose={() => navigate(-1)}
      onSubmit={handleSubmit}
      onFormChange={(prop, value) => setDraft((prev) => ({ ...(prev ?? form), [prop]: value }))}
      isSaving={isLoading || isSaving}
    />
  );
}

export default function PromptEditModal(props) {
  if (props.isOpen !== undefined || typeof props.onSubmit === "function") {
    return <PromptEditModalContent {...props} />;
  }

  return <RoutePromptEditModal />;
}
