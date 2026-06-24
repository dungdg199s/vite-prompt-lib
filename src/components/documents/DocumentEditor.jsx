import AppModal from "../shared/AppModal";
import Button from "../shared/Button";

export default function DocumentEditor({
  isOpen,
  editingMode,
  documentData,
  workspaceList,
  onCloseModal,
  onDocumentSaved,
}) {
  const [formPhase, setFormPhase] = useState("type");
  const [formData, setFormData] = useState({
    name: documentData?.name || "",
    type: documentData?.type || "Spreadsheets",
  });

  const onSubmit = (event) => {
    event.preventDefault();
    
    
  }

  return (
    <AppModal
      isOpen={isOpen}
      title={editingMode === "create" ? "Create Document" : "Edit Document"}
      onClose={onCloseModal}
      size="lg"
    >
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">
            {editingMode === "create" ? "Create Document" : "Edit Document"}
          </h3>
          <p className="text-xs uppercase tracking-wider text-slate-500">
            {formPhase === "type"
              ? "Step 1/3: Select type"
              : formPhase === "details"
                ? `Step ${editingMode === "create" ? "2" : "1"}/${editingMode === "create" ? (isSpreadsheetType ? "3" : "2") : isSpreadsheetType ? "2" : "1"}: Information`
                : "Step 3/3: Sync options"}
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={onCloseModal}>
          Close
        </Button>
      </div>

      <form className="mt-4 flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
        {formPhase === "type" ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="grid gap-2">
                {["Spreadsheets", "Markdown", "JSON", "HTML"].map(
                  (typeItem) => (
                    <button
                      key={typeItem}
                      type="button"
                      onClick={() => onSelectType(typeItem)}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                        (form.type || "Spreadsheets") === typeItem
                          ? "border-teal-700 bg-teal-100"
                          : "border-stone-300 bg-white hover:border-teal-700/40"
                      }`}
                    >
                      {typeItem}
                    </button>
                  ),
                )}
              </div>
              {errorMessage ? (
                <p className="mt-3 text-sm text-red-700">{errorMessage}</p>
              ) : null}
            </div>

            <div className="sticky bottom-0 mt-3 flex shrink-0 flex-wrap justify-end gap-2 border-t border-stone-200 bg-[#fffef8] pt-3">
              <Button type="button" onClick={onCloseModal} variant="secondary">
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isSaving}
                variant="primary"
                onClick={onNextTypePhase}
              >
                Next
              </Button>
            </div>
          </>
        ) : formPhase === "details" ? (
          <>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
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
                Type
                <select
                  className={inputClassName}
                  value={form.type || "Spreadsheets"}
                  onChange={(event) => onFormChange("type", event.target.value)}
                >
                  <option value="Spreadsheets">Spreadsheets</option>
                  <option value="Markdown">Markdown</option>
                  <option value="JSON">JSON</option>
                  <option value="HTML">HTML</option>
                </select>
              </label>

              <label className="grid gap-1.5 text-sm">
                Workspace
                <select
                  className={inputClassName}
                  value={form.workspace}
                  onChange={(event) =>
                    onFormChange("workspace", event.target.value)
                  }
                >
                  <option value="">- No workspace -</option>
                  {workspaceList.map((workspace) => (
                    <option key={workspace.name} value={workspace.name}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
              </label>

              {isSpreadsheetType ? (
                <label className="grid gap-1.5 text-sm">
                  File Name
                  <input
                    className={inputClassName}
                    value={form.fileName || form.name || ""}
                    readOnly
                    disabled
                    placeholder="Auto-filled from spreadsheet"
                  />
                  <span className="text-xs text-slate-500">
                    Auto-filled. File name is managed by spreadsheet metadata.
                  </span>
                </label>
              ) : null}

              {isSpreadsheetType ? (
                <label className="grid gap-1.5 text-sm">
                  Spreadsheet ID
                  <input
                    className={inputClassName}
                    value={form.preasheetId}
                    onChange={(event) =>
                      onFormChange("preasheetId", event.target.value)
                    }
                    placeholder="1AbCdEfGh..."
                  />
                </label>
              ) : null}

              {form.type === "Markdown" ? (
                <label className="grid gap-1.5 text-sm">
                  Markdown Content
                  <textarea
                    className={inputClassName}
                    value={form.contentMarkdown}
                    onChange={(event) =>
                      onFormChange("contentMarkdown", event.target.value)
                    }
                    rows={8}
                    placeholder="Write markdown content..."
                  />
                </label>
              ) : null}

              {form.type === "JSON" ? (
                <label className="grid gap-1.5 text-sm">
                  JSON Content
                  <textarea
                    className={inputClassName}
                    value={form.contentJSON}
                    onChange={(event) =>
                      onFormChange("contentJSON", event.target.value)
                    }
                    rows={8}
                    placeholder='{"key": "value"}'
                  />
                </label>
              ) : null}

              {form.type === "HTML" ? (
                <label className="grid gap-1.5 text-sm">
                  HTML Content
                  <textarea
                    className={inputClassName}
                    value={form.contentHTML}
                    onChange={(event) =>
                      onFormChange("contentHTML", event.target.value)
                    }
                    rows={8}
                    placeholder="<h1>Title</h1>"
                  />
                </label>
              ) : null}

              <label className="grid gap-1.5 text-sm">
                Description
                <textarea
                  className={inputClassName}
                  value={form.description}
                  onChange={(event) =>
                    onFormChange("description", event.target.value)
                  }
                  rows={3}
                  placeholder="Short description of this document"
                />
              </label>

              <label className="grid gap-1.5 text-sm">
                Share Mode
                <select
                  className={inputClassName}
                  value={form.shareMode}
                  onChange={(event) =>
                    onFormChange("shareMode", event.target.value)
                  }
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
                    onChange={(event) =>
                      onFormChange("shareWith", event.target.value)
                    }
                    placeholder="a@company.com, b@company.com"
                  />
                </label>
              ) : null}
              {errorMessage ? (
                <p className="text-sm text-red-700">{errorMessage}</p>
              ) : null}
            </div>

            <div className="sticky bottom-0 mt-3 flex shrink-0 flex-wrap justify-end gap-2 border-t border-stone-200 bg-[#fffef8] pt-3">
              <Button type="button" onClick={onCloseModal} variant="secondary">
                Cancel
              </Button>
              {isSpreadsheetType ? (
                <Button
                  type="button"
                  disabled={isSaving}
                  variant="primary"
                  onClick={onNextPhase}
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isSaving} variant="primary">
                  {editingMode === "create" ? "Create" : "Update"}
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
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
                <select
                  className={inputClassName}
                  value={syncOptions.headerRow}
                  onChange={(event) =>
                    onSyncOptionChange("headerRow", event.target.value)
                  }
                >
                  <option value="">None header</option>
                  {Array.from({ length: 20 }, (_, index) =>
                    String(index + 1),
                  ).map((rowValue) => (
                    <option key={rowValue} value={rowValue}>
                      Row {rowValue}
                    </option>
                  ))}
                </select>
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
                        onChange={(event) =>
                          onToggleAllSheets(event.target.checked)
                        }
                      />
                      all
                    </label>
                    {syncSheetNames.map((sheetName) => (
                      <label
                        key={sheetName}
                        className="flex items-center gap-2 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          disabled={syncOptions.useAllSheets}
                          checked={syncOptions.selectedSheets.includes(
                            sheetName,
                          )}
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
              {errorMessage ? (
                <p className="text-sm text-red-700">{errorMessage}</p>
              ) : null}
            </div>

            <div className="sticky bottom-0 mt-3 flex shrink-0 flex-wrap justify-end gap-2 border-t border-stone-200 bg-[#fffef8] pt-3">
              <Button type="button" onClick={onBackPhase} variant="secondary">
                Back
              </Button>
              <Button type="submit" disabled={isSaving} variant="primary">
                {editingMode === "create" ? "Create" : "Update + Sync"}
              </Button>
            </div>
          </>
        )}
      </form>
    </AppModal>
  );
}
