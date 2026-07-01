import Modal from "../shared/Modal";
import Button from "../shared/Button";
import Input from "../shared/Input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspaces } from "../../hooks/useWorkspaces";

const DEFAULT_WORKSPACE_FORM = {
  name: "",
  description: "",
  shareMode: "private",
  shareWith: "",
};

export default function WorkspaceNewModal() {
  const navigate = useNavigate();
  const { createWorkspace, error } = useWorkspaces();

  const [form, setForm] = useState(DEFAULT_WORKSPACE_FORM);

  const [isSaving, setIsSaving] = useState(false);

  const onChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSave = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.name,
      description: form.description,
      shareMode: form.shareMode,
      shareWith: form.shareMode === "shared" ? form.shareWith.split(",").map((s) => s.trim()) : [],
    };

    setIsSaving(true);
    const created = await createWorkspace(payload);
    setIsSaving(false);

    if (created) {
      navigate(`/workspaces/${created.id}/view`);
    } else {
      alert("Failed to create workspace. Please try again." + (error || ""));
    }
  };

  return (
    <Modal isOpen={true} onSubmit={onSave} onClose={() => navigate(-1)} title="Create Workspace" size="lg">
      <div className="grid gap-3">
        <Input
          type="text"
          label="Workspace Name"
          value={form?.name || ""}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="workspace-name"
          required
        />

        <Input
          type="textarea"
          label="Description"
          value={form?.description || ""}
          onChange={(e) => onChange("description", e.target.value)}
          rows={3}
          placeholder="Workspace description"
        />

        <Input
          type="select"
          label="Share Mode"
          value={form?.shareMode || "private"}
          onChange={(e) => onChange("shareMode", e.target.value)}
          options={[
            { label: "private", value: "private" },
            { label: "shared", value: "shared" },
            { label: "public", value: "public" },
          ]}
        />

        {form?.shareMode === "shared" ? (
          <Input
            type="text"
            label="Share With (comma separated emails)"
            value={form?.shareWith || ""}
            onChange={(e) => onChange("shareWith", e.target.value)}
            placeholder="a@company.com, b@company.com"
          />
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 pt-2"></div>
      </div>
      <Modal.Actions>
        <Button type="button" onClick={() => navigate(-1)} variant="secondary">
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving} variant="primary">
          Create
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
