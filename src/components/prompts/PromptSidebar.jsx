import Button from "../shared/Button";
import { uiClasses } from "../shared/uiClasses";

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
    <aside className={uiClasses.sidebar}>
      <div className="mb-4 flex items-center justify-between gap-2.5">
        <h2 className="text-lg font-semibold tracking-tight">Prompts</h2>
        <Button type="button" onClick={onRefresh} variant="secondary">
          Refresh
        </Button>
      </div>

      <select
        className={`${uiClasses.input} mb-3`}
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

      <div className="flex max-h-[calc(100vh-220px)] flex-col gap-2 overflow-y-auto pr-1">
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
