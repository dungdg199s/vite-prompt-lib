import Modal from "../shared/Modal";
import Button from "../shared/Button";
import { useWorkspace, useWorkspaces } from "../../hooks/useWorkspaces";
import { useNavigate, useParams } from "react-router-dom";

export default function WorkspaceDeleteModal() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const { workspace: form = {}, isLoading } = useWorkspace(workspaceId);

  const { deleteWorkspace } = useWorkspaces();
  return (
    <Modal isOpen={true} title="Delete Workspace" onClose={() => navigate(-1)}>
      <Modal.Content>
        <p className="mt-2 text-sm text-slate-600">
          Delete <strong>{form?.name}</strong>? This action cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" onClick={() => navigate(-1)} variant="secondary">
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() =>
              deleteWorkspace(workspaceId).then((deleted) => {
                if (deleted) {
                  navigate("/workspaces");
                }
              })
            }
            disabled={isLoading}
          >
            Delete
          </Button>
        </div>
      </Modal.Content>
    </Modal>
  );
}
