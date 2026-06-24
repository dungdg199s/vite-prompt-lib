import { useState } from "react";
import Button from "../shared/Button";
import { uiClasses } from "../shared/uiClasses";

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
  const [searchPrompt, setSearchPrompt] = useState("");

  const filteredPrompts = (selectedWorkspace?.prompts || []).filter(
    (prompt) =>
      prompt.name.toLowerCase().includes(searchPrompt.toLowerCase()) || (prompt.description || "").toLowerCase().includes(searchPrompt.toLowerCase()),
  );

  return (
    <aside className={uiClasses.sidebar}>
      <div className="mb-4 flex items-center gap-2.5">
        {selectedWorkspaceName ? (
          <>
            <Button type="button" variant="secondary" onClick={onBack} aria-label="Back to workspace list">
              ←
            </Button>

            <h2 className="text-lg font-semibold tracking-tight">{selectedWorkspaceName}</h2>
            <Button type="button" variant="secondary" onClick={onRefresh} className="ml-auto">
              Refresh
            </Button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold tracking-tight">Workspaces</h2>
            <Button type="button" variant="secondary" onClick={onRefresh} className="ml-auto">
              Refresh
            </Button>
          </>
        )}
        {/* <button type="button" onClick={onRefresh} className={buttonClassName}>
          Refresh
        </button> */}
      </div>

      {selectedWorkspaceName ? (
        <>
          {/* <div className="mb-4 flex items-center justify-between gap-2.5">
            <button type="button" className={buttonClassName} onClick={onBack}>
              ←
            </button>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">{selectedWorkspaceName}</h3>
          </div> */}
      <div className="mb-2 flex items-center justify-between gap-2.5"> 
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">Prompts</h3>
      </div>

          <input
            type="text"
            placeholder="Search prompts..."
            value={searchPrompt}
            onChange={(e) => setSearchPrompt(e.target.value)}
            className={`${uiClasses.input} mb-3`}
          />
          <div className="flex max-h-[calc(100vh-220px)] flex-col gap-2 overflow-y-auto pr-1">
            {isLoadingWorkspace ? <p className="text-sm text-slate-600">Loading prompts...</p> : null}
            {!isLoadingWorkspace && !selectedWorkspace?.prompts?.length ? (
              <p className="text-sm text-slate-600">No prompt in this workspace.</p>
            ) : null}
            {filteredPrompts.map((prompt) => (
              <button
                key={prompt.name}
                type="button"
                className={`grid cursor-pointer gap-1 rounded-xl border px-3 py-2 text-left transition ${
                  prompt.name === selectedPromptName ? "border-teal-700 bg-teal-100" : "border-stone-300 bg-[#fffef8] hover:border-teal-700/40"
                }`}
                onClick={() => onSelectPrompt(prompt.name)}
              >
                <span className="font-medium">{prompt.name}</span>
                <small className="text-xs text-slate-500">{prompt.description || "No description"}</small>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="flex max-h-[calc(100vh-180px)] flex-col gap-2 overflow-y-auto pr-1">
          {isLoadingList ? <p className="text-sm text-slate-600">Loading workspaces...</p> : null}
          {!isLoadingList && !workspaceList.length ? <p className="text-sm text-slate-600">No workspace found.</p> : null}
          {workspaceList.map((workspace) => (
            <button
              key={workspace.name}
              type="button"
              className={`grid cursor-pointer gap-1 rounded-xl border px-3 py-2 text-left transition ${
                workspace.name === selectedWorkspaceName ? "border-teal-700 bg-teal-100" : "border-stone-300 bg-[#fffef8] hover:border-teal-700/40"
              }`}
              onClick={() => onSelectWorkspace(workspace.name)}
            >
              <span className="font-medium">{workspace.name}</span>
              <small className="text-xs text-slate-500">{workspace.description || "No description"}</small>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
