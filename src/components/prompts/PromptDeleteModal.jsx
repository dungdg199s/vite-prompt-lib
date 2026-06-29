import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { useWorkspace } from '../../hooks/useWorkspaces';

function PromptDeleteModalContent({ promptName, isOpen, isSaving, onClose, onDelete }) {
  return (
    <Modal isOpen={isOpen} title="Delete Prompt" onClose={onClose}>
      <p className="mt-2 text-sm text-slate-600">
        Delete <strong>{promptName}</strong>? This action cannot be undone.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" onClick={onClose} variant="secondary">
          Cancel
        </Button>
        <Button type="button" variant="danger" onClick={onDelete} disabled={isSaving}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}

function RoutePromptDeleteModal() {
  const navigate = useNavigate();
  const { workspaceId, promptId } = useParams();
  const { prompts, deletePrompt, isLoading } = useWorkspace(workspaceId);
  const prompt = useMemo(() => prompts.find((item) => item.id === promptId), [promptId, prompts]);

  const handleDelete = async () => {
    const deleted = await deletePrompt(promptId, workspaceId);
    if (deleted) {
      navigate(`/workspaces/${workspaceId}/view`);
    }
  };

  return (
    <PromptDeleteModalContent
      promptName={prompt?.name}
      isOpen={true}
      isSaving={isLoading}
      onClose={() => navigate(-1)}
      onDelete={handleDelete}
    />
  );
}

export default function PromptDeleteModal(props) {
  if (props.isOpen !== undefined || typeof props.onDelete === 'function') {
    return <PromptDeleteModalContent {...props} />;
  }

  return <RoutePromptDeleteModal />;
}
