import Modal from "../shared/Modal";
import Button from "../shared/Button";
import Input from "../shared/Input";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkspace, useWorkspaces } from "../../hooks/useWorkspaces";

export default function WorkspaceEditModal() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const { workspace, isLoading, error } = useWorkspace(workspaceId);
  const { updateWorkspace } = useWorkspaces();

  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!workspace || initializedRef.current) return;

    initializedRef.current = true;
    setForm({
      name: workspace.name || "",
      description: workspace.description || "",
      shareMode: workspace.shareMode || "private",
      shareWith: workspace.shareWith || workspace?.shareWith?.join(", ") || "",
    });
  }, [workspace]);

  const onChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (!workspaceId) return;

    const payload = {
      id: workspaceId,
      name: form.name,
      description: form.description,
      shareMode: form.shareMode,
      shareWith: form.shareMode === "shared" ? form.shareWith.split(",").map((s) => s.trim()) : [],
    };

    setIsSaving(true);
    const updated = await updateWorkspace(workspaceId, payload);
    setIsSaving(false);

    if (updated) {
      navigate(`/workspaces/${workspaceId}/view`);
    } else {
      alert("Failed to update workspace. Please try again." + (error || ""));
    }
  };

  if (!workspaceId) return <div>Workspace ID is missing.</div>;

  return (
    <Modal isOpen={true} onSubmit={onSave} onClose={() => navigate(-1)} title="Edit Workspace" size="lg">
      <Modal.Content>
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
      </Modal.Content>
      <Modal.Actions>
        <Button type="button" onClick={() => navigate(-1)} variant="secondary">
          Cancel
        </Button>
        <Button type="button" onClick={onSave} disabled={isLoading || isSaving} variant="primary">
          Update
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
