const buttonClassName =
  "rounded-lg border border-stone-300 bg-teal-50 px-3 py-2 text-sm font-medium text-slate-800 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50";

export default function WorkspaceSidebar({
  workspaceList,
  selectedWorkspaceName,
  selectedWorkspace,
  selectedPromptName,
  isLoadingList,
  isLoadingWorkspace,
  onRefresh,
  onSelectWorkspace,
  onSelectPrompt,
  onBack,
}) {
  return (
    <aside className="border-b border-stone-300 bg-[#faf5ec] p-5 md:border-r md:border-b-0">
      {!selectedWorkspaceName ? (
        <>
          <div className="mb-4 flex items-center justify-between gap-2.5">
            <h2 className="text-lg font-semibold tracking-tight">Workspaces</h2>
            <button type="button" onClick={onRefresh} className={buttonClassName}>
              Refresh
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {isLoadingList ? (
              <p className="text-sm text-slate-600">Loading workspaces...</p>
            ) : null}
            {!isLoadingList && !workspaceList.length ? (
              <p className="text-sm text-slate-600">No workspace found.</p>
            ) : null}
            {workspaceList.map((workspace) => (
              <button
                key={workspace.name}
                type="button"
                className="grid cursor-pointer gap-1 rounded-xl border border-stone-300 bg-[#fffef8] px-3 py-2 text-left transition hover:border-teal-700/40"
                onClick={() => onSelectWorkspace(workspace.name)}
              >
                <span className="font-medium">{workspace.name}</span>
                <small className="text-xs text-slate-500">
                  {workspace.description || "No description"}
                </small>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-2.5">
            <button type="button" className={buttonClassName} onClick={onBack}>
              Back
            </button>
            <h2 className="text-base font-semibold tracking-tight">{selectedWorkspaceName}</h2>
          </div>

          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-600">
            Prompts
          </h3>
          <div className="flex flex-col gap-2">
            {isLoadingWorkspace ? (
              <p className="text-sm text-slate-600">Loading prompts...</p>
            ) : null}
            {!isLoadingWorkspace && !selectedWorkspace?.prompts?.length ? (
              <p className="text-sm text-slate-600">No prompt in this workspace.</p>
            ) : null}
            {(selectedWorkspace?.prompts || []).map((prompt) => (
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
                  {prompt.description || "No description"}
                </small>
              </button>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
