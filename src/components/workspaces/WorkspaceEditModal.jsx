import Modal from "../shared/Modal";
import Button from "../shared/Button";
import Input from "../shared/Input";
import { useWorkspaces } from "../../store/workspaceStore";
import { useState } from "react";

export default function WorkspaceEditModal({
  workspace,
  editMode,
  isOpen,
  onClose,
  isSaving,
  onSubmit: onSubmitProp,
  onFormChange: onFormChangeProp,
}) {
  const { createWorkspace, updateWorkspace } = useWorkspaces();

  const [localFormData, setLocalFormData] = useState(() => ({ ...workspace }));
  const formData = onFormChangeProp ? workspace : localFormData;

  const onFormChange = (propName, value) => {
    if (!onFormChangeProp) {
      setLocalFormData((prev) => ({ ...prev, [propName]: value }));
    }
    if (typeof onFormChangeProp === "function") {
      onFormChangeProp(propName, value);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (typeof onSubmitProp === "function") {
      await onSubmitProp(event, formData);
      return;
    }

    if (editMode === "create") {
      await createWorkspace(formData);
    } else {
      await updateWorkspace(formData);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editMode === "create" ? "Create Workspace" : "Edit Workspace"}
      size="lg"
    >
      <form className="grid gap-3" onSubmit={onSubmit}>
        <Input
          type="text"
          label="Workspace Name"
          value={formData?.name || ""}
          onChange={(e) => onFormChange("name", e.target.value)}
          disabled={editMode === "edit"}
          placeholder="workspace-name"
          required
        />

        <Input
          type="textarea"
          label="Description"
          value={formData?.description || ""}
          onChange={(e) => onFormChange("description", e.target.value)}
          rows={3}
          placeholder="Workspace description"
        />

        <Input
          type="select"
          label="Share Mode"
          value={formData?.shareMode || "private"}
          onChange={(e) => onFormChange("shareMode", e.target.value)}
          options={[
            { label: "private", value: "private" },
            { label: "shared", value: "shared" },
            { label: "public", value: "public" },
          ]}
        />

        {formData?.shareMode === "shared" ? (
          <Input
            type="text"
            label="Share With (comma separated emails)"
            value={formData?.shareWith || ""}
            onChange={(e) => onFormChange("shareWith", e.target.value)}
            placeholder="a@company.com, b@company.com"
          />
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button type="button" onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving} variant="primary">
            {editMode === "create" ? "Create" : "Update"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
