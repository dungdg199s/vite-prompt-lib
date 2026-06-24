import { useEffect, useMemo, useState } from "react";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import Input from "../shared/Input";
import { workspacesClient } from "../../lib/workspaces-client";

export default function PromptEditModal({
  prompt,
  isOpen,
  editMode,
  onClose,
  onSubmit,
  onFormChange,
  isSaving,
}) {
  const [workspaces, setWorkspaces] = useState([]);

  useEffect(() => {
    workspacesClient.getWorkspaces().then((data) => {
      setWorkspaces(data);
    });
  }, []);

  const onChange = (prop, value) => {
    if (typeof onFormChange === "function") {
      onFormChange(prop, value);
    }
  };

  const workspaceOptions = useMemo(() => {
    return workspaces.map((workspace) => ({
      label: workspace.name,
      value: workspace.name,
    }));
  }, [workspaces]);

  const shareOptions = useMemo(() => {
    return ["private", "shared", "public"].map((v) => ({ label: v, value: v }));
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editMode === "create" ? "Create Prompt" : "Edit Prompt"}
      size="lg"
     
    >
      <form className="grid gap-3" onSubmit={(e) => onSubmit(e, prompt)}>
        <Input
          type="text"
          label="Prompt Name"
          value={prompt?.name || ""}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="my-prompt-name"
          required
        ></Input>

        <Input
          label="Workspace"
          type="select"
          value={prompt?.workspace || ""}
          onChange={(e) => onChange("workspace", e.target.value)}
          placeholder="— Select workspace —"
          options={workspaceOptions}
          required
        ></Input>

        <Input
          type="text"
          label="Description"
          value={prompt?.description || ""}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Short description of this prompt"
        ></Input>

        <Input
          type="textarea"
          label="Content"
          rows={8}
          value={prompt?.content || ""}
          onChange={(e) => onChange("content", e.target.value)}
          placeholder="Write your prompt template here.\nUse ${VariableName|description} for tokens.\nExample: ${Topic|options:React,Vue,Angular}"
          required
        ></Input>

        <Input
          label="Share Mode"
          type="select"
          value={prompt?.shareMode || "private"}
          onChange={(e) => onChange("shareMode", e.target.value)}
          options={shareOptions}
          required
        ></Input>

        {prompt?.shareMode === "shared" ? (
          <Input
            type="text"
            label="Share With (comma separated emails)"
            value={prompt?.shareWith || ""}
            onChange={(e) => onChange("shareWith", e.target.value)}
            placeholder="a@company.com, b@company.com"
          ></Input>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {editMode === "create" ? "Create" : "Update"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
