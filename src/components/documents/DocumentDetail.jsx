import Button from "../shared/Button";
import DocumentEditModal from "./DocumentEditModal";
import DocumentSyncModal from "./DocumentSyncModal";
import DocumentDeleteModal from "./DocumentDeleteModal";
import { uiClasses } from "../shared/uiClasses";

export default function DocumentDetail({
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
  onSelectType,
  onNextTypePhase,
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
  const isSpreadsheetType = (form.type || "Spreadsheets") === "Spreadsheets";

  return (
    <section className={uiClasses.card}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{selectedDocumentName ? form.name || selectedDocumentName : "Document"}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {selectedDocumentName ? form.description || "No description" : "Select a document or create a new one."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onNew} variant="secondary">
            New
          </Button>
          <Button type="button" onClick={onEdit} disabled={isSaving || !selectedDocumentName} variant="secondary">
            Edit
          </Button>
          <Button
            type="button"
            onClick={onOpenSync}
            disabled={isSaving || !selectedDocumentName || !isSpreadsheetType}
            variant="primary"
          >
            Sync
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onOpenDelete}
            disabled={isSaving || !selectedDocumentName}
          >
            Delete
          </Button>
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
          {isSpreadsheetType ? (
            <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">File Name</p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {form.fileName ? <a title="Open Google Sheet" className="text-blue-600 hover:text-blue-800 underline" href={`https://docs.google.com/spreadsheets/d/${form.preasheetId}/edit`} target="_blank">{form.fileName}</a> : "Auto-filled"}
              </p>
            </div>
          ) : null}
          <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Type</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{form.type || "Spreadsheets"}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Share Mode</p>
            <p className="mt-1 text-sm font-medium capitalize text-slate-800">{form.shareMode}</p>
          </div>
          {isSpreadsheetType ? (
            <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Spreadsheet ID</p>
              <p className="mt-1 break-all text-sm font-medium text-slate-800">{form.preasheetId || "No spreadsheet id"}</p>
            </div>
          ) : null}
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
        <div className="rounded-xl border border-dashed border-stone-300 bg-[#fffcf7] p-4 text-sm text-slate-600">No document selected.</div>
      )}

      <DocumentEditModal
        document={form}
        editMode={editingMode}
        formPhase={formPhase}
        workspaceList={workspaceList}
        isOpen={isModalOpen}
        isSaving={isSaving}
        errorMessage={errorMessage}
        syncOptions={syncOptions}
        syncPreasheetName={syncPreasheetName}
        syncSheetNames={syncSheetNames}
        isLoadingSyncMeta={isLoadingSyncMeta}
        onFormChange={onFormChange}
        onSyncOptionChange={onSyncOptionChange}
        onToggleSyncSheet={onToggleSyncSheet}
        onToggleAllSheets={onToggleAllSheets}
        onSelectType={onSelectType}
        onNextTypePhase={onNextTypePhase}
        onNextPhase={onNextPhase}
        onBackPhase={onBackPhase}
        onSubmit={onSubmit}
        onClose={onCloseModal}
      />

      <DocumentSyncModal
        isOpen={isSyncModalOpen}
        isSaving={isSaving}
        errorMessage={errorMessage}
        syncOptions={syncOptions}
        syncPreasheetName={syncPreasheetName}
        syncSheetNames={syncSheetNames}
        isLoadingSyncMeta={isLoadingSyncMeta}
        onSyncOptionChange={onSyncOptionChange}
        onToggleSyncSheet={onToggleSyncSheet}
        onToggleAllSheets={onToggleAllSheets}
        onSubmit={onSubmitSync}
        onClose={onCloseSync}
      />

      <DocumentDeleteModal
        documentName={selectedDocumentName}
        isOpen={isDeleteModalOpen}
        isSaving={isSaving}
        onClose={onCloseDelete}
        onDelete={onDelete}
      />

      {errorMessage ? <p className="mt-2 text-sm text-red-700">{errorMessage}</p> : null}
    </section>
  );
}
