const inputClassName =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-200";
const buttonClassName =
  "rounded-lg border border-stone-300 bg-teal-50 px-3 py-2 text-sm font-medium text-slate-800 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50";

export default function DocumentSidebar({
  documentList,
  workspaceList,
  selectedDocumentName,
  filterWorkspace,
  isLoadingList,
  onRefresh,
  onSelectDocument,
  onFilterChange,
}) {
  const filteredDocuments = filterWorkspace
    ? documentList.filter((doc) => doc.workspace === filterWorkspace)
    : documentList;

  return (
    <aside className="border-b border-stone-300 bg-[#faf5ec] p-5 md:border-r md:border-b-0">
      <div className="mb-4 flex items-center justify-between gap-2.5">
        <h2 className="text-lg font-semibold tracking-tight">Documents</h2>
        <button type="button" onClick={onRefresh} className={buttonClassName}>
          Refresh
        </button>
      </div>

      <select
        className={`${inputClassName} mb-3`}
        value={filterWorkspace}
        onChange={(event) => onFilterChange(event.target.value)}
      >
        <option value="">All workspaces</option>
        {workspaceList.map((workspace) => (
          <option key={workspace.name} value={workspace.name}>
            {workspace.name}
          </option>
        ))}
      </select>

      <div className="flex flex-col gap-2">
        {isLoadingList ? (
          <p className="text-sm text-slate-600">Loading documents...</p>
        ) : null}
        {!isLoadingList && !filteredDocuments.length ? (
          <p className="text-sm text-slate-600">No document found.</p>
        ) : null}
        {filteredDocuments.map((document) => (
          <button
            key={document.name}
            type="button"
            className={`grid cursor-pointer gap-1 rounded-xl border px-3 py-2 text-left transition ${
              document.name === selectedDocumentName
                ? "border-teal-700 bg-teal-100"
                : "border-stone-300 bg-[#fffef8] hover:border-teal-700/40"
            }`}
            onClick={() => onSelectDocument(document.name)}
          >
            <span className="font-medium">{document.name}</span>
            <small className="text-xs text-slate-500">
              {(document.workspace && `@${document.workspace}`) || "No workspace"}
              {" "}
              &middot; {document.description || "No description"}
            </small>
          </button>
        ))}
      </div>
    </aside>
  );
}
