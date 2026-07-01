import Modal from "../shared/Modal";
import Button from "../shared/Button";

const DEFAULT_SYNC_OPTIONS = {
  includeEmptyRows: false,
  headerRow: "",
  useAllSheets: true,
  selectedSheets: [],
};

const inputClassName =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-200";

export default function DocumentSyncModal({
  isOpen,
  isSaving,
  errorMessage,
  syncOptions,
  syncPreasheetName,
  syncSheetNames,
  isLoadingSyncMeta,
  onSyncOptionChange,
  onToggleSyncSheet,
  onToggleAllSheets,
  onSubmit,
  onClose,
}) {
  const safeSyncOptions = syncOptions || DEFAULT_SYNC_OPTIONS;
  const safeSyncSheetNames = Array.isArray(syncSheetNames) ? syncSheetNames : [];

  return (
    <Modal isOpen={isOpen} title="Sync Document" onClose={onClose} onSubmit={onSubmit} size="lg">
      <Modal.Content>
        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            <div className="rounded-lg border border-stone-200 bg-[#fffcf7] p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Spreadsheet Name</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{syncPreasheetName || "Unknown spreadsheet"}</p>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={safeSyncOptions.includeEmptyRows}
                onChange={(event) => onSyncOptionChange("includeEmptyRows", event.target.checked)}
              />
              Include empty rows
            </label>

            <label className="grid gap-1.5 text-sm">
              Header Row (optional, 1-based)
              <select
                className={inputClassName}
                value={safeSyncOptions.headerRow}
                onChange={(event) => onSyncOptionChange("headerRow", event.target.value)}
              >
                <option value="">None header</option>
                {Array.from({ length: 20 }, (_, index) => String(index + 1)).map((rowValue) => (
                  <option key={rowValue} value={rowValue}>
                    Row {rowValue}
                  </option>
                ))}
              </select>
            </label>

            {isLoadingSyncMeta ? <p className="text-sm text-slate-600">Loading sheets...</p> : null}

            {safeSyncSheetNames.length ? (
              <div className="rounded-lg border border-stone-200 bg-[#fffcf7] p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Sheets</p>
                <div className="grid gap-2 md:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={safeSyncOptions.useAllSheets}
                      onChange={(event) => onToggleAllSheets(event.target.checked)}
                    />
                    all
                  </label>
                  {safeSyncSheetNames.map((sheetName) => (
                    <label key={sheetName} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        disabled={safeSyncOptions.useAllSheets}
                        checked={safeSyncOptions.selectedSheets.includes(sheetName)}
                        onChange={(event) => onToggleSyncSheet(sheetName, event.target.checked)}
                      />
                      {sheetName}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}
          </div>
        </div>
      </Modal.Content>
      <Modal.Actions>
        <Button type="button" onClick={onClose} variant="secondary">
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving} variant="primary">
          Sync Now
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
