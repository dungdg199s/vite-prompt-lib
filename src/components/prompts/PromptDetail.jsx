import Button from "../shared/Button";
import PromptEditModal from "./PromptEditModal";
import PromptDeleteModal from "./PromptDeleteModal";
import { uiClasses } from "../shared/uiClasses";

export default function PromptDetail({
  selectedPromptName,
  form,
  editingMode,
  isSaving,
  errorMessage,
  isModalOpen,
  isDeleteModalOpen,
  onFormChange,
  onSubmit,
  onNew,
  onEdit,
  onOpenDelete,
  onDelete,
  onCloseModal,
  onCloseDelete,
}) {
  const isSharedMode = form.shareMode === "shared";

  return (
    <section className={uiClasses.card}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {selectedPromptName ? form.name || selectedPromptName : "Prompt"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {selectedPromptName
              ? form.description || "No description"
              : "Select a prompt or create a new one."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onNew} variant="secondary">
            New
          </Button>
          <Button
            type="button"
            onClick={onEdit}
            disabled={isSaving || !selectedPromptName}
            variant="secondary"
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onOpenDelete}
            disabled={isSaving || !selectedPromptName}
          >
            Delete
          </Button>
        </div>
      </div>

      {selectedPromptName ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Name</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{form.name}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Workspace</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{form.workspace || "No workspace"}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Share Mode</p>
            <p className="mt-1 text-sm font-medium capitalize text-slate-800">{form.shareMode}</p>
          </div>
          {isSharedMode ? (
            <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Share With</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{form.shareWith || "No shared members"}</p>
            </div>
          ) : null}
          <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3 md:col-span-2 xl:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Description</p>
            <p className="mt-1 text-sm text-slate-700">{form.description || "No description"}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-stone-300 bg-[#fffcf7] p-4 text-sm text-slate-600">
          No prompt selected.
        </div>
      )}

      <PromptEditModal
        prompt={form}
        isOpen={isModalOpen}
        editMode={editingMode}
        onClose={onCloseModal}
        onSubmit={onSubmit}
        onFormChange={onFormChange}
        isSaving={isSaving}
      />

      <PromptDeleteModal
        promptName={selectedPromptName}
        isOpen={isDeleteModalOpen}
        isSaving={isSaving}
        onClose={onCloseDelete}
        onDelete={onDelete}
      />

      {errorMessage ? (
        <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
      ) : null}
    </section>
  );
}
