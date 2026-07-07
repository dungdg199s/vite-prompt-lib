import { useMemo } from "react";
import { useParams } from "react-router-dom";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import { useWorkspace } from "../../hooks/useWorkspaces";
import { useAppNavigate } from "../../hooks/useAppNavigate";

export default function DocumentDeleteModal() {
  const navigate = useAppNavigate();
  const { workspaceId, documentId } = useParams();
  const { documents, deleteDocument, isLoading } = useWorkspace(workspaceId);
  const document = useMemo(() => documents.find((item) => item.id === documentId), [documentId, documents]);

  const handleDelete = async () => {
    const deleted = await deleteDocument(documentId, workspaceId);
    if (deleted) {
      navigate({ object: "workspace", recordId: workspaceId, action: "view" });
    }
  };

  return (
    <Modal isOpen={true} title="Delete Document" onClose={() => navigate(-1)}>
      <Modal.Content>
        <p className="mt-2 text-sm text-slate-600">
          Delete <strong>{document?.name}</strong>? This action cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" onClick={() => navigate(-1)} variant="secondary">
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={handleDelete} disabled={isLoading}>
            Delete
          </Button>
        </div>
      </Modal.Content>
    </Modal>
  );
}
