import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import Input from "../shared/Input";
import { useWorkspace } from "../../hooks/useWorkspaces";

const documentTypeOptions = ["Spreadsheets", "Markdown", "JSON", "HTML"].map((value) => ({ label: value, value }));

const DEFAULT_DOCUMENT_FORM = {
  name: "",
  workspace: "",
  type: "Spreadsheets",
  fileName: "",
  preasheetId: "",
  description: "",
  contentMarkdown: "",
  contentJSON: "",
  contentHTML: "",
};

export default function DocumentNewModal() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const { createDocument, isLoading } = useWorkspace(workspaceId);

  const [form, setForm] = useState(DEFAULT_DOCUMENT_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => {
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      workspace: workspaceId,
    };
    setIsSaving(true);
    const saved = await createDocument(payload);
    setIsSaving(false);
    if (saved?.id || saved === true) {
      navigate(`/workspaces/${workspaceId}/documents/${saved?.id}/view`);
      return;
    }
  };

  return (
    <Modal isOpen={true} onSubmit={handleSubmit} onClose={() => navigate(-1)} title="Create Document" size="lg">
      <Modal.Content className="grid gap-3">
        <Input
          type="text"
          label="Document Name"
          value={form.name}
          onChange={(event) => handleChange("name", event.target.value)}
          placeholder="my-document"
          required
        />
        <Input
          label="Document Type"
          type="select"
          value={form.type}
          onChange={(event) => handleChange("type", event.target.value)}
          options={documentTypeOptions}
          required
        />
        {form.type === "Spreadsheets" ? (
          <Input
            type="text"
            label="Spreadsheet ID"
            value={form.preasheetId}
            onChange={(event) => handleChange("preasheetId", event.target.value)}
            placeholder="1AbCdEfGh..."
            required
          />
        ) : null}

        {form.type === "Markdown" ? (
          <Input
            type="textarea"
            label="Markdown Content"
            rows={8}
            value={form.contentMarkdown}
            onChange={(event) => handleChange("contentMarkdown", event.target.value)}
            placeholder="Write markdown content..."
            required
          />
        ) : null}

        {form.type === "JSON" ? (
          <Input
            type="textarea"
            label="JSON Content"
            rows={8}
            value={form.contentJSON}
            onChange={(event) => handleChange("contentJSON", event.target.value)}
            placeholder='{"key": "value"}'
            required
          />
        ) : null}

        {form.type === "HTML" ? (
          <Input
            type="textarea"
            label="HTML Content"
            rows={8}
            value={form.contentHTML}
            onChange={(event) => handleChange("contentHTML", event.target.value)}
            placeholder="<h1>Title</h1>"
            required
          />
        ) : null}

        <Input
          type="textarea"
          label="Description"
          rows={3}
          value={form.description}
          onChange={(event) => handleChange("description", event.target.value)}
          placeholder="Short description of this document"
        />
      </Modal.Content>
      <Modal.Actions>
        <Button type="button" onClick={() => navigate(-1)} variant="secondary">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || isSaving} variant="primary">
          Create
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
