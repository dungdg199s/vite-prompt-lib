import Button from "./components/shared/Button";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMemo } from "react";
import documentIcon from "./assets/documents.png";
import promptIcon from "./assets/prompts.png";
import { uiClasses } from "./components/shared/uiClasses";
import { useWorkspace, useWorkspaces } from "./hooks/useWorkspaces";

export default function AppSidebar() {
  const { workspaceId, promptId, documentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaces, isLoading, fetchWorkspaces } = useWorkspaces();
  const { workspace, addTab } = useWorkspace();

  const [selectedWorkspace, promptList, documentList] = useMemo(() => {
    if (workspace) {
      return [workspace, workspace.prompts || [], workspace.documents || []];
    }
    return [null, [], []];
  }, [workspace]);

  return (
    <aside className={uiClasses.sidebar}>
      <div className="mb-4 flex items-center gap-2.5">
        <h2 className="text-lg font-semibold tracking-tight">{workspace?.name || "Workspaces"}</h2>
        <Button type="button" variant="secondary" onClick={() => fetchWorkspaces()} className="ml-auto">
          ↻
        </Button>
      </div>

      {workspace ? (
        <>
          {/* <div className="mb-4 flex items-center justify-between gap-2.5">
            <button type="button" className={buttonClassName} onClick={onBack}>
              ←
            </button>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">{selectedWorkspaceName}</h3>
          </div> */}
          <div className="mb-2 flex items-center justify-between gap-2.5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">Prompts</h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                navigate(`/workspaces/${workspace.id}/prompts/new`, {
                  state: { backgroundLocation: location },
                })
              }
            >
              New
            </Button>
          </div>
          {isLoading ? <p className="text-sm text-slate-600">Loading prompts...</p> : null}
          {!isLoading && !promptList.length ? (
            <p className="p-2.5 text-sm text-slate-600">No prompt in this workspace.</p>
          ) : null}
          <div className="mb-4 max-h-[calc(50vh-120px)] overflow-y-auto rounded-md border border-stone-300 bg-[#fffef8]">
            {promptList.map((prompt) => (
              <button
                key={prompt.name}
                type="button"
                className={`flex w-full items-center gap-2 border-b px-2.5 py-2 text-left transition last:border-b-0 ${
                  prompt.id === promptId
                    ? "border-stone-200 bg-teal-100 text-slate-900"
                    : "border-stone-200 bg-[#fffef8] text-slate-800 hover:bg-stone-100"
                }`}
                onClick={() => {
                  navigate(`/workspaces/${workspace.id}/prompts/${prompt.id}/view`);
                  addTab({
                    id: prompt.id,
                    type: "prompt",
                    workspaceId: workspace.id,
                    name: prompt.name,
                  });
                }}
                aria-current={prompt.id === promptId ? "page" : undefined}
              >
                <img src={promptIcon} alt="" className="h-5 w-5 shrink-0 rounded-md object-cover" aria-hidden="true" />
                <span className="truncate text-sm font-medium text-slate-800">{prompt.name}</span>
              </button>
            ))}
          </div>

          <div className="mb-2 flex items-center justify-between gap-2.5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">Documents</h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                navigate(`/workspaces/${workspaceId}/documents/new`, {
                  state: { backgroundLocation: location },
                })
              }
            >
              New
            </Button>
          </div>
          {!documentList.length ? (
            <p className="p-2.5 text-sm text-slate-600">No document in this workspace.</p>
          ) : (
            <div className="max-h-[calc(50vh-140px)] overflow-y-auto rounded-md border border-stone-300 bg-[#fffef8]">
              {documentList.map((document) => (
                <button
                  key={document.name}
                  type="button"
                  className={`flex w-full items-center gap-2 border-b px-2.5 py-2 text-left transition last:border-b-0 ${
                    document.id === documentId
                      ? "border-stone-200 bg-teal-100 text-slate-900"
                      : "border-stone-200 bg-[#fffef8] text-slate-800 hover:bg-stone-100"
                  }`}
                  onClick={() => {
                    navigate(`/workspaces/${workspaceId}/documents/${document.id}/view`);
                    addTab({
                      id: document.id,
                      type: "document",
                      workspaceId,
                      name: document.name,
                    });
                  }}
                  aria-current={document.id === documentId ? "page" : undefined}
                >
                  <img
                    src={documentIcon}
                    alt=""
                    className="h-5 w-5 shrink-0 rounded-md object-cover"
                    aria-hidden="true"
                  />
                  <span className="truncate text-sm font-medium text-slate-800">{document.name}</span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex max-h-[calc(100vh-180px)] flex-col gap-2 overflow-y-auto pr-1">
          {isLoading ? <p className="text-sm text-slate-600">Loading workspaces...</p> : null}
          {!isLoading && !workspaces.length ? <p className="text-sm text-slate-600">No workspace found.</p> : null}
          {workspaces.map((workspace) => (
            <button
              key={workspace.name}
              type="button"
              className={`grid cursor-pointer gap-1 rounded-xl border px-3 py-2 text-left transition ${
                workspace.name === selectedWorkspace?.name
                  ? "border-teal-700 bg-teal-100"
                  : "border-stone-300 bg-[#fffef8] hover:border-teal-700/40"
              }`}
              onClick={() => {
                navigate(`/workspaces/${workspace.id}/view`);
                addTab({
                  id: workspace.id,
                  type: "workspace",
                  name: workspace.name,
                });
              }}
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
