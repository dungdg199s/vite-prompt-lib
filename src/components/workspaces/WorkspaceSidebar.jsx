import { useWorkspaces } from "../../store/workspaceStore";
import Button from "../shared/Button";
import { uiClasses } from "../shared/uiClasses";

export default function WorkspaceSidebar({
  selectedDocumentName,
  isLoadingList,
  onSelectPrompt,
  onSelectDocument,
  onCreatePrompt,
  onCreateDocument,
}) {
  const { setSelectedWorkspace, loadWorkspaces } = useWorkspaces();

  const workspaceList = useWorkspaces((state) => state.workspaces);
  const selectedWorkspace = useWorkspaces((state) => state.selectedWorkspace);
  const isLoadingWorkspace = useWorkspaces((state) => state.isLoading);

  const promptList = selectedWorkspace?.prompts || [];
  const docs = selectedWorkspace?.documents || [];
  const selectedPromptName = selectedWorkspace?.name || null;

  return (
    <aside className={uiClasses.sidebar}>
      <div className="mb-4 flex items-center gap-2.5">
        {selectedWorkspace ? (
          <>
            <h2 className="text-lg font-semibold tracking-tight">
              {selectedWorkspace?.name}
            </h2>
            <Button
              type="button"
              variant="secondary"
              // onClick={onRefresh}
              className="ml-auto"
            >
              ↻
            </Button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold tracking-tight">Workspaces</h2>
            <Button
              type="button"
              variant="secondary"
              onClick={() => loadWorkspaces()}
              className="ml-auto"
            >
              ↻
            </Button>
          </>
        )}
      </div>

      {selectedWorkspace ? (
        <>
          {/* <div className="mb-4 flex items-center justify-between gap-2.5">
            <button type="button" className={buttonClassName} onClick={onBack}>
              ←
            </button>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">{selectedWorkspaceName}</h3>
          </div> */}
          <div className="mb-2 flex items-center justify-between gap-2.5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
              Prompts
            </h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onCreatePrompt}
            >
              New
            </Button>
          </div>
          {isLoadingWorkspace ? (
            <p className="text-sm text-slate-600">Loading prompts...</p>
          ) : null}
          {!isLoadingWorkspace && !promptList.length ? (
            <p className="p-2.5 text-sm text-slate-600">
              No prompt in this workspace.
            </p>
          ) : null}
          <div className="mb-4 max-h-[calc(50vh-120px)] overflow-y-auto rounded-md border border-stone-300 bg-[#fffef8]">
            {promptList.map((prompt) => (
              <button
                key={prompt.name}
                type="button"
                className={`flex w-full items-center gap-2 border-b px-2.5 py-2 text-left transition last:border-b-0 ${
                  prompt.name === selectedPromptName
                    ? "border-stone-200 bg-teal-100 text-slate-900"
                    : "border-stone-200 bg-[#fffef8] text-slate-800 hover:bg-stone-100"
                }`}
                onClick={() => onSelectPrompt(prompt.name)}
                aria-current={
                  prompt.name === selectedPromptName ? "page" : undefined
                }
              >
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-teal-700/30 bg-teal-100 text-[10px] font-semibold text-teal-900">
                  P
                </span>
                <span className="truncate text-sm font-medium text-slate-800">
                  {prompt.name}
                </span>
              </button>
            ))}
          </div>

          <div className="mb-2 flex items-center justify-between gap-2.5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
              Documents
            </h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onCreateDocument}
            >
              New
            </Button>
          </div>
          {!docs.length ? (
            <p className="p-2.5 text-sm text-slate-600">
              No document in this workspace.
            </p>
          ) : (
            <div className="max-h-[calc(50vh-140px)] overflow-y-auto rounded-md border border-stone-300 bg-[#fffef8]">
              {docs.map((document) => (
                <button
                  key={document.name}
                  type="button"
                  className={`flex w-full items-center gap-2 border-b px-2.5 py-2 text-left transition last:border-b-0 ${
                    document.name === selectedDocumentName
                      ? "border-stone-200 bg-teal-100 text-slate-900"
                      : "border-stone-200 bg-[#fffef8] text-slate-800 hover:bg-stone-100"
                  }`}
                  onClick={() => onSelectDocument(document.name)}
                  aria-current={
                    document.name === selectedDocumentName ? "page" : undefined
                  }
                >
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-sky-700/30 bg-sky-100 text-[10px] font-semibold text-sky-900">
                    D
                  </span>
                  <span className="truncate text-sm font-medium text-slate-800">
                    {document.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex max-h-[calc(100vh-180px)] flex-col gap-2 overflow-y-auto pr-1">
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
              className={`grid cursor-pointer gap-1 rounded-xl border px-3 py-2 text-left transition ${
                workspace.name === selectedWorkspace?.name
                  ? "border-teal-700 bg-teal-100"
                  : "border-stone-300 bg-[#fffef8] hover:border-teal-700/40"
              }`}
              onClick={() => setSelectedWorkspace(workspace)}
            >
              <span className="font-medium">{workspace.name}</span>
              <small className="text-xs text-slate-500">
                {workspace.description || "No description"}
              </small>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
