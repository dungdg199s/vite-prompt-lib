const inputClassName =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-200";
const buttonClassName =
  "rounded-lg border border-stone-300 bg-teal-50 px-3 py-2 text-sm font-medium text-slate-800 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50";

export default function PromptForm({
  form,
  editingMode,
  workspaceList,
  isSaving,
  errorMessage,
  onFormChange,
  onSubmit,
  onNew,
  onDelete,
}) {
  return (
    <section className="rounded-2xl border border-stone-300 bg-[#fffef8] p-4 shadow-[0_8px_24px_rgba(44,33,12,0.06)] md:p-5">
      <h2 className="mb-4 text-lg font-semibold tracking-tight">
        {editingMode === "create" ? "Create Prompt" : "Edit Prompt"}
      </h2>

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

        <label className="grid gap-1.5 text-sm">
          Share With (comma separated emails)
          <input
            className={inputClassName}
            value={form.shareWith}
            onChange={(e) => onFormChange("shareWith", e.target.value)}
            placeholder="a@company.com, b@company.com"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={isSaving} className={buttonClassName}>
            {editingMode === "create" ? "Create" : "Update"}
          </button>
          <button
            type="button"
            onClick={onNew}
            disabled={isSaving}
            className={buttonClassName}
          >
            New
          </button>
          <button
            type="button"
            className="rounded-lg border border-red-700 bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onDelete}
            disabled={isSaving || editingMode === "create"}
          >
            Delete
          </button>
        </div>
      </form>

      {errorMessage ? (
        <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
      ) : null}
    </section>
  );
}
