import AppModal from "../shared/AppModal";

const inputClassName =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-200";
const secondaryButtonClassName =
  "rounded-lg border border-stone-300 bg-teal-50 px-3 py-2 text-sm font-medium text-slate-800 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50";
const primaryButtonClassName =
  "rounded-lg border border-teal-800 bg-teal-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50";

export default function DocumentForm({
  selectedDocumentName,
  form,
  editingMode,
  formPhase,
  workspaceList,
  isSaving,
  errorMessage,
  isModalOpen,
  isDeleteModalOpen,
  isSyncModalOpen,
  syncOptions,
  syncPreasheetName,
  syncSheetNames,
  isLoadingSyncMeta,
  onFormChange,
  onSyncOptionChange,
  onToggleSyncSheet,
  onToggleAllSheets,
  onNextPhase,
  onBackPhase,
  onSubmit,
  onSubmitSync,
  onNew,
  onEdit,
  onOpenDelete,
  onOpenSync,
  onDelete,
  onCloseModal,
  onCloseDelete,
  onCloseSync,
}) {
  const isSharedMode = form.shareMode === "shared";

  return (
    <section className="rounded-2xl border border-stone-300 bg-[#fffef8] p-4 shadow-[0_8px_24px_rgba(44,33,12,0.06)] md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {selectedDocumentName ? form.name || selectedDocumentName : "Document"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {selectedDocumentName
              ? form.description || "No description"
              : "Select a document or create a new one."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onNew} className={secondaryButtonClassName}>
            New
          </button>
          <button
            type="button"
            onClick={onEdit}
            disabled={isSaving || !selectedDocumentName}
            className={secondaryButtonClassName}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onOpenSync}
            disabled={isSaving || !selectedDocumentName}
            className={primaryButtonClassName}
          >
            Sync
          </button>
          <button
            type="button"
            className="rounded-lg border border-red-700 bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onOpenDelete}
            disabled={isSaving || !selectedDocumentName}
          >
            Delete
          </button>
        </div>
      </div>

      {selectedDocumentName ? (
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
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">File Name</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{form.fileName || "No file name"}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Share Mode</p>
            <p className="mt-1 text-sm font-medium capitalize text-slate-800">{form.shareMode}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3 md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Spreadsheet ID</p>
            <p className="mt-1 break-all text-sm font-medium text-slate-800">{form.preasheetId || "No spreadsheet id"}</p>
          </div>
          {isSharedMode ? (
            <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3 md:col-span-2">
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
          No document selected.
        </div>
      )}

      <AppModal
        isOpen={isModalOpen}
        title={editingMode === "create" ? "Create Document" : "Edit Document"}
        onClose={onCloseModal}
        size="lg"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              {editingMode === "create" ? "Create Document" : "Edit Document"}
            </h3>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              {formPhase === "details" ? "Step 1/2: Information" : "Step 2/2: Sync options"}
            </p>
          </div>
          <button type="button" className={secondaryButtonClassName} onClick={onCloseModal}>
            Close
          </button>
        </div>

        <form className="grid gap-3" onSubmit={onSubmit}>
          {formPhase === "details" ? (
            <>
              <label className="grid gap-1.5 text-sm">
                Document Name
                <input
                  className={inputClassName}
                  value={form.name}
                  onChange={(event) => onFormChange("name", event.target.value)}
                  disabled={editingMode === "edit"}
                  placeholder="my-document"
                />
              </label>

              <label className="grid gap-1.5 text-sm">
                Workspace
                <select
                  className={inputClassName}
                  value={form.workspace}
                  onChange={(event) => onFormChange("workspace", event.target.value)}
                >
                  <option value="">- No workspace -</option>
                  {workspaceList.map((workspace) => (
                    <option key={workspace.name} value={workspace.name}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-sm">
                File Name
                <input
                  className={inputClassName}
                  value={form.fileName}
                  onChange={(event) => onFormChange("fileName", event.target.value)}
                  placeholder="source-sheet-name"
                />
              </label>

              <label className="grid gap-1.5 text-sm">
                Spreadsheet ID
                <input
                  className={inputClassName}
                  value={form.preasheetId}
                  onChange={(event) => onFormChange("preasheetId", event.target.value)}
                  placeholder="1AbCdEfGh..."
                />
              </label>

              <label className="grid gap-1.5 text-sm">
                Description
                <textarea
                  className={inputClassName}
                  value={form.description}
                  onChange={(event) => onFormChange("description", event.target.value)}
                  rows={3}
                  placeholder="Short description of this document"
                />
              </label>

              <label className="grid gap-1.5 text-sm">
                Share Mode
                <select
                  className={inputClassName}
                  value={form.shareMode}
                  onChange={(event) => onFormChange("shareMode", event.target.value)}
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
                    onChange={(event) => onFormChange("shareWith", event.target.value)}
                    placeholder="a@company.com, b@company.com"
                  />
                </label>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button type="button" onClick={onCloseModal} className={secondaryButtonClassName}>
                  Cancel
                </button>
                <button type="button" disabled={isSaving} className={primaryButtonClassName} onClick={onNextPhase}>
                  Next
                </button>
              </div>

              {errorMessage ? (
                <p className="text-sm text-red-700">{errorMessage}</p>
              ) : null}
            </>
          ) : (
            <>
              <div className="rounded-lg border border-stone-200 bg-[#fffcf7] p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Spreadsheet Name
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {syncPreasheetName || "Unknown spreadsheet"}
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={syncOptions.includeEmptyRows}
                  onChange={(event) =>
                    onSyncOptionChange("includeEmptyRows", event.target.checked)
                  }
                />
                Include empty rows
              </label>

              <label className="grid gap-1.5 text-sm">
                Header Row (optional, 1-based)
                <input
                  type="number"
                  min={1}
                  className={inputClassName}
                  value={syncOptions.headerRow}
                  onChange={(event) => onSyncOptionChange("headerRow", event.target.value)}
                  placeholder="1"
                />
              </label>

              {isLoadingSyncMeta ? (
                <p className="text-sm text-slate-600">Loading sheets...</p>
              ) : null}

              {syncSheetNames.length ? (
                <div className="rounded-lg border border-stone-200 bg-[#fffcf7] p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Sheets
                  </p>
                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                      <input
                        type="checkbox"
                        checked={syncOptions.useAllSheets}
                        onChange={(event) => onToggleAllSheets(event.target.checked)}
                      />
                      all
                    </label>
                    {syncSheetNames.map((sheetName) => (
                      <label key={sheetName} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          disabled={syncOptions.useAllSheets}
                          checked={syncOptions.selectedSheets.includes(sheetName)}
                          onChange={(event) =>
                            onToggleSyncSheet(sheetName, event.target.checked)
                          }
                        />
                        {sheetName}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button type="button" onClick={onBackPhase} className={secondaryButtonClassName}>
                  Back
                </button>
                <button type="submit" disabled={isSaving} className={primaryButtonClassName}>
                  {editingMode === "create" ? "Create + Sync" : "Update + Sync"}
                </button>
              </div>

              {errorMessage ? (
                <p className="text-sm text-red-700">{errorMessage}</p>
              ) : null}
            </>
          )}
        </form>
      </AppModal>

      <AppModal
        isOpen={isSyncModalOpen}
        title="Sync Document"
        onClose={onCloseSync}
        size="lg"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold tracking-tight">Sync Options</h3>
          <button type="button" className={secondaryButtonClassName} onClick={onCloseSync}>
            Close
          </button>
        </div>

        <form className="grid gap-3" onSubmit={onSubmitSync}>
          <div className="rounded-lg border border-stone-200 bg-[#fffcf7] p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Spreadsheet Name
            </p>
            <p className="mt-1 text-sm font-medium text-slate-800">
              {syncPreasheetName || "Unknown spreadsheet"}
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={syncOptions.includeEmptyRows}
              onChange={(event) =>
                onSyncOptionChange("includeEmptyRows", event.target.checked)
              }
            />
            Include empty rows
          </label>

          <label className="grid gap-1.5 text-sm">
            Header Row (optional, 1-based)
            <input
              type="number"
              min={1}
              className={inputClassName}
              value={syncOptions.headerRow}
              onChange={(event) => onSyncOptionChange("headerRow", event.target.value)}
              placeholder="1"
            />
          </label>

          {isLoadingSyncMeta ? (
            <p className="text-sm text-slate-600">Loading sheets...</p>
          ) : null}

          {syncSheetNames.length ? (
            <div className="rounded-lg border border-stone-200 bg-[#fffcf7] p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Sheets
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={syncOptions.useAllSheets}
                    onChange={(event) => onToggleAllSheets(event.target.checked)}
                  />
                  all
                </label>
                {syncSheetNames.map((sheetName) => (
                  <label key={sheetName} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      disabled={syncOptions.useAllSheets}
                      checked={syncOptions.selectedSheets.includes(sheetName)}
                      onChange={(event) =>
                        onToggleSyncSheet(sheetName, event.target.checked)
                      }
                    />
                    {sheetName}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" onClick={onCloseSync} className={secondaryButtonClassName}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className={primaryButtonClassName}>
              Sync Now
            </button>
          </div>
        </form>
      </AppModal>

      <AppModal
        isOpen={isDeleteModalOpen}
        title="Delete Document"
        onClose={onCloseDelete}
      >
        <h3 className="text-lg font-semibold tracking-tight">Delete Document</h3>
        <p className="mt-2 text-sm text-slate-600">
          Delete <strong>{selectedDocumentName}</strong>? This action cannot be undone.
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
