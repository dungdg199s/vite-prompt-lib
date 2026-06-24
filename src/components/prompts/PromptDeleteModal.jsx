import Modal from "../shared/Modal";
import Button from "../shared/Button";

export default function PromptDeleteModal({
  promptName,
  isOpen,
  isSaving,
  onClose,
  onDelete,
}) {
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
