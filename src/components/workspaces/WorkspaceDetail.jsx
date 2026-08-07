import Button from "../shared/Button";
import { uiClasses } from "../shared/uiClasses";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useWorkspace } from "../../hooks/useWorkspaces";

export default function WorkspaceDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const { workspace, isLoading } = useWorkspace(workspaceId);

  const historyFormat = (person, dateStr) => {
    if (!person) return "";
    if (!dateStr) return person;
    if (typeof dateStr === "string") {
      const d = new Date(dateStr);
      dateStr = d.toLocaleDateString() + " " + d.toLocaleTimeString();
    }
    return `${person}, ${dateStr}`;
  };

  const form =
    workspaceId && workspace
      ? workspace
      : {
          name: "Workspace",
          description: "Select a workspace or create a new one.",
        };

  const promptCount = form?.prompts?.length || 0;

  return (
    <section className={uiClasses.card}>
      <>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Workspace</p>
              {form?.name || ""}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {form?.description || "Select a workspace or create a new one."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() =>
                navigate(`/workspaces/new`, {
                  state: { backgroundLocation: location },
                })
              }
              variant="secondary"
            >
              New Workspace
            </Button>
            <Button
              type="button"
              onClick={() =>
                navigate(`/workspaces/${workspaceId}/edit`, {
                  state: { backgroundLocation: location },
                })
              }
              disabled={isLoading || !workspaceId}
              variant="secondary"
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() =>
                navigate(`/workspaces/${workspaceId}/delete`, {
                  state: { backgroundLocation: location },
                })
              }
              disabled={isLoading || !workspaceId}
            >
              Delete
            </Button>
          </div>
        </div>

        {workspaceId ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Name</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{form.name}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Prompt Count</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{promptCount}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Owner</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{form.owner || ""}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3 md:col-span-2 xl:col-span-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Create By</p>
                  <p className="mt-1 text-sm text-slate-700">{historyFormat(form.createdBy, form.createdAt)}</p>
                </div>
                <div className="">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Last Update</p>
                  <p className="mt-1 text-sm text-slate-700">{historyFormat(form.updatedBy, form.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-stone-300 bg-[#fffcf7] p-4 text-sm text-slate-600">
            No workspace selected.
          </div>
        )}
      </>
    </section>
  );
}
