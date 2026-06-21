const inputClassName =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-200";
const buttonClassName =
  "rounded-lg border border-stone-300 bg-teal-50 px-3 py-2 text-sm font-medium text-slate-800 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50";

export default function PromptSidebar({
  promptList,
  workspaceList,
  selectedPromptName,
  filterWorkspace,
  isLoadingList,
  onRefresh,
  onSelectPrompt,
  onFilterChange,
}) {
  const filteredPrompts = filterWorkspace
    ? promptList.filter((p) => p.workspace === filterWorkspace)
    : promptList;

  return (
    <aside className="border-b border-stone-300 bg-[#faf5ec] p-5 md:border-r md:border-b-0">
      <div className="mb-4 flex items-center justify-between gap-2.5">
        <h2 className="text-lg font-semibold tracking-tight">Prompts</h2>
        <button type="button" onClick={onRefresh} className={buttonClassName}>
          Refresh
        </button>
      </div>

      <select
        className={`${inputClassName} mb-3`}
        value={filterWorkspace}
        onChange={(e) => onFilterChange(e.target.value)}
      >
        <option value="">All workspaces</option>
        {workspaceList.map((ws) => (
          <option key={ws.name} value={ws.name}>
            {ws.name}
          </option>
        ))}
      </select>

      <div className="flex flex-col gap-2">
        {isLoadingList ? (
          <p className="text-sm text-slate-600">Loading prompts...</p>
        ) : null}
        {!isLoadingList && !filteredPrompts.length ? (
          <p className="text-sm text-slate-600">No prompt found.</p>
        ) : null}
        {filteredPrompts.map((prompt) => (
          <button
            key={prompt.name}
            type="button"
            className={`grid cursor-pointer gap-1 rounded-xl border px-3 py-2 text-left transition ${
              prompt.name === selectedPromptName
                ? "border-teal-700 bg-teal-100"
                : "border-stone-300 bg-[#fffef8] hover:border-teal-700/40"
            }`}
            onClick={() => onSelectPrompt(prompt.name)}
          >
            <span className="font-medium">{prompt.name}</span>
            <small className="text-xs text-slate-500">
              {prompt.workspace ? `@${prompt.workspace}` : "No workspace"}{" "}
              &middot; {prompt.description || "No description"}
            </small>
          </button>
        ))}
      </div>
    </aside>
  );
}
