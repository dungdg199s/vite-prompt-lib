import { useEffect, useMemo, useState } from "react";
import AppModal from "../shared/AppModal";
import Button from "../shared/Button";
import Input from "../shared/Input";
import { workspacesClient } from "../../lib/workspacesClient";

export default function PromptEditor({
  prompt,
  isOpen,
  editMode,
  onClose,
  onSubmit,
  isSaving,
}) {
  const [promptForm, setPromptForm] = useState(prompt);
  const [workspaces, setWorkspaces] = useState([]);

  useEffect(() => {
    workspacesClient.getWorkspaces().then((data) => {
      setWorkspaces(data);
    });
  }, []);

  const onChange = (prop, value) => {
    setPromptForm((prev) => ({ ...prev, [prop]: value }));
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
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={editMode === "create" ? "Create Prompt" : "Edit Prompt"}
      size="lg"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight">
          {editMode === "create" ? "Create Prompt" : "Edit Prompt"}
        </h3>
        <Button variant="primary" onClick={onClose}>
          Close
        </Button>
      </div>

      <form className="grid gap-3" onSubmit={(e) => onSubmit(e, promptForm)}>
        <Input
          type="text"
          label="Prompt Name"
          value={promptForm.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="my-prompt-name"
          required
        ></Input>

        <Input
          label="Workspace"
          type="select"
          value={promptForm.workspace}
          onChange={(e) => onChange("workspace", e.target.value)}
          placeholder="— Select workspace —"
          options={workspaceOptions}
          required
        ></Input>

        <Input
          type="text"
          label="Description"
          value={promptForm.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Short description of this prompt"
        ></Input>

        <Input
          type="textarea"
          label="Content"
          rows={8}
          value={promptForm.content}
          onChange={(e) => onChange("content", e.target.value)}
          placeholder="Write your prompt template here.\nUse ${VariableName|description} for tokens.\nExample: ${Topic|options:React,Vue,Angular}"
          required
        ></Input>

        <Input
          label="Share Mode"
          type="select"
          value={promptForm.shareMode}
          onChange={(e) => onChange("shareMode", e.target.value)}
          options={shareOptions}
          required
        ></Input>

        {promptForm.shareMode === "shared" ? (
          <Input
            type="text"
            label="Share With (comma separated emails)"
            value={promptForm.shareWith}
            onChange={(e) => onChange("shareWith", e.target.value)}
            placeholder="a@company.com, b@company.com"
          ></Input>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="secondary" disabled={isSaving}>
            {editMode === "create" ? "Create" : "Update"}
          </Button>
        </div>
      </form>
    </AppModal>
  );
}
