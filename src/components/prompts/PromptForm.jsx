import AppModal from "../shared/AppModal";

const inputClassName =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-200";
const secondaryButtonClassName =
  "rounded-lg border border-stone-300 bg-teal-50 px-3 py-2 text-sm font-medium text-slate-800 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50";
const primaryButtonClassName =
  "rounded-lg border border-teal-800 bg-teal-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50";

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
    <section className="rounded-2xl border border-stone-300 bg-[#fffef8] p-4 shadow-[0_8px_24px_rgba(44,33,12,0.06)] md:p-5">
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
          <button type="button" onClick={onNew} className={secondaryButtonClassName}>
            New
          </button>
          <button
            type="button"
            onClick={onEdit}
            disabled={isSaving || !selectedPromptName}
            className={secondaryButtonClassName}
          >
            Edit
          </button>
          <button
            type="button"
            className="rounded-lg border border-red-700 bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onOpenDelete}
            disabled={isSaving || !selectedPromptName}
          >
            Delete
          </button>
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
          <button type="button" className={secondaryButtonClassName} onClick={onCloseModal}>
            Close
          </button>
        </div>

        <form className="grid gap-3" onSubmit={onSubmit}>
          <label className="grid gap-1.5 text-sm">
            Prompt Name
            <input
              className={inputClassName}
              value={form.name}
              onChange={(e) => onFormChange("name", e.target.value)}
              disabled={editingMode === "edit"}
              placeholder="my-prompt-name"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            Workspace
            <select
              className={inputClassName}
              value={form.workspace}
              onChange={(e) => onFormChange("workspace", e.target.value)}
            >
              <option value="">— No workspace —</option>
              {workspaceList.map((ws) => (
                <option key={ws.name} value={ws.name}>
                  {ws.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5 text-sm">
            Description
            <input
              className={inputClassName}
              value={form.description}
              onChange={(e) => onFormChange("description", e.target.value)}
              placeholder="Short description of this prompt"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            Content
            <textarea
              className={inputClassName}
              value={form.content}
              onChange={(e) => onFormChange("content", e.target.value)}
              rows={8}
              placeholder={"Write your prompt template here.\nUse ${VariableName|description} for tokens.\nExample: ${Topic|options:React,Vue,Angular}"}
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            Share Mode
            <select
              className={inputClassName}
              value={form.shareMode}
              onChange={(e) => onFormChange("shareMode", e.target.value)}
            >
              <option value="private">private</option>
              <option value="shared">shared</option>
              <option value="public">public</option>
            </select>
          </label>

          {form.shareMode === "shared" ? (
            <label className="grid gap-1.5 text-sm">
              Share With (comma separated emails)
              <input
                className={inputClassName}
                value={form.shareWith}
                onChange={(e) => onFormChange("shareWith", e.target.value)}
                placeholder="a@company.com, b@company.com"
              />
            </label>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" onClick={onCloseModal} className={secondaryButtonClassName}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className={primaryButtonClassName}>
              {editingMode === "create" ? "Create" : "Update"}
            </button>
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
          <button type="button" onClick={onCloseDelete} className={secondaryButtonClassName}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg border border-red-700 bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onDelete}
            disabled={isSaving}
          >
            Delete
          </button>
        </div>
      </AppModal>

      {errorMessage ? (
        <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
      ) : null}
    </section>
  );
}
