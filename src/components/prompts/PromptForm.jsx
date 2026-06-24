import AppModal from "../shared/AppModal";
import Button from "../shared/Button";
import Input from "../shared/Input";
import { uiClasses } from "../shared/uiClasses";

export default function PromptForm({
  selectedPromptName,
  form,
  editingMode,
  workspaceList,
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

      <AppModal
        isOpen={isModalOpen}
        title={editingMode === "create" ? "Create Prompt" : "Edit Prompt"}
        onClose={onCloseModal}
        size="lg"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold tracking-tight">
            {editingMode === "create" ? "Create Prompt" : "Edit Prompt"}
          </h3>
          <Button type="button" variant="secondary" onClick={onCloseModal}>
            Close
          </Button>
        </div>

        <form className="grid gap-3" onSubmit={onSubmit}>
          <Input
            type="text"
            label="Prompt Name"
            value={form.name}
            onChange={(e) => onFormChange("name", e.target.value)}
            disabled={editingMode === "edit"}
            placeholder="my-prompt-name"
            required
          />

          <Input
            type="select"
            label="Workspace"
            value={form.workspace}
            onChange={(e) => onFormChange("workspace", e.target.value)}
            noneLabel="- No workspace -"
            options={workspaceList.map((ws) => ({ label: ws.name, value: ws.name }))}
            required
          />

          <Input
            type="text"
            label="Description"
            value={form.description}
            onChange={(e) => onFormChange("description", e.target.value)}
            placeholder="Short description of this prompt"
          />

          <Input
            type="textarea"
            label="Content"
            value={form.content}
            onChange={(e) => onFormChange("content", e.target.value)}
            rows={8}
            placeholder={"Write your prompt template here.\nUse ${VariableName|description} for tokens.\nExample: ${Topic|options:React,Vue,Angular}"}
            required
          />

          <Input
            type="select"
            label="Share Mode"
            value={form.shareMode}
            onChange={(e) => onFormChange("shareMode", e.target.value)}
            options={[
              { label: "private", value: "private" },
              { label: "shared", value: "shared" },
              { label: "public", value: "public" },
            ]}
          />

          {form.shareMode === "shared" ? (
            <Input
              type="text"
              label="Share With (comma separated emails)"
              value={form.shareWith}
              onChange={(e) => onFormChange("shareWith", e.target.value)}
              placeholder="a@company.com, b@company.com"
            />
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" onClick={onCloseModal} variant="secondary">
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} variant="primary">
              {editingMode === "create" ? "Create" : "Update"}
            </Button>
          </div>
        </form>
      </AppModal>

      <AppModal
        isOpen={isDeleteModalOpen}
        title="Delete Prompt"
        onClose={onCloseDelete}
      >
        <h3 className="text-lg font-semibold tracking-tight">Delete Prompt</h3>
        <p className="mt-2 text-sm text-slate-600">
          Delete <strong>{selectedPromptName}</strong>? This action cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" onClick={onCloseDelete} variant="secondary">
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onDelete}
            disabled={isSaving}
          >
            Delete
          </Button>
        </div>
      </AppModal>

      {errorMessage ? (
        <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
      ) : null}
    </section>
  );
}
