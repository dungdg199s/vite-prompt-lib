import { useState } from "react";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import Input from "../shared/Input";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkspace } from "../../hooks/useWorkspaces";

export default function PromptNewModal() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const { createPrompt } = useWorkspace(workspaceId);

  const [formData, setFormData] = useState({
    name: "",
    workspace: workspaceId || "",
    description: "",
    content: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  const onChange = (prop, value) => {
    setFormData((prev) => ({
      ...prev,
      [prop]: value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const createdPrompt = await createPrompt({ ...formData, workspace: workspaceId });
    setIsSaving(false);
    if (createdPrompt?.id) {
      navigate(`/workspaces/${workspaceId}/prompts/${createdPrompt.id}/view`);
    }
  };

  return (
    <Modal isOpen={true} onSubmit={onSubmit} onClose={() => navigate(-1)} title="Create Prompt" size="lg">
      <Modal.Content>
        <div className="grid gap-3">
          <Input
            type="text"
            label="Prompt Name"
            value={formData.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="my-prompt-name"
            required
          ></Input>

          <Input
            type="text"
            label="Description"
            value={formData.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Short description of this prompt"
          ></Input>

          <Input
            type="textarea"
            label="Content"
            rows={8}
            value={formData.content}
            onChange={(e) => onChange("content", e.target.value)}
            placeholder="Write your prompt template here.\nUse ${VariableName|description} for tokens.\nExample: ${Topic|options:React,Vue,Angular}"
            required
          ></Input>
        </div>
      </Modal.Content>
      <Modal.Actions>
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSaving}>
          Create
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
