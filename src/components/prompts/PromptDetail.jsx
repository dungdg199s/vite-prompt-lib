import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PromptGenerator from "./PromptGenerator";
import { useWorkspace } from "../../hooks/useWorkspaces";

const secondaryButtonClassName =
  "rounded-lg border border-stone-300 bg-teal-50 px-3 py-2 text-sm font-medium text-slate-800 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50";

export default function PromptDetail() {
  const { promptId, workspaceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { prompts, isLoading } = useWorkspace(workspaceId);
  const prompt = useMemo(() => prompts.find((item) => item.id === promptId), [promptId, prompts]);

  const historyFormat = (person, dateStr) => {
    if (!person) return "";
    if (!dateStr) return person;
    if (typeof dateStr === "string") {
      const d = new Date(dateStr);
      dateStr = d.toLocaleDateString() + " " + d.toLocaleTimeString();
    }
    return `${person}, ${dateStr}`;
  };

  return (
    <section className="border border-stone-300 bg-[#fffef8] p-4 shadow-[0_8px_24px_rgba(44,33,12,0.06)] md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{prompt ? prompt.name : "Prompt"}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {prompt ? prompt.description || "No description" : "Select a prompt from the sidebar or create a new one."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              navigate(`/workspaces/${workspaceId}/prompts/${prompt?.id}/edit`, {
                state: { backgroundLocation: location },
              })
            }
            disabled={isLoading || !prompt}
            className={secondaryButtonClassName}
          >
            Edit
          </button>
          <button
            type="button"
            className="rounded-lg border border-red-700 bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() =>
              navigate(`/workspaces/${workspaceId}/prompts/${prompt?.id}/delete`, {
                state: { backgroundLocation: location },
              })
            }
            disabled={isLoading || !prompt}
          >
            Delete
          </button>
        </div>
      </div>

      {!prompt ? (
        <p className="text-sm text-slate-600">Select a prompt from sidebar.</p>
      ) : (
        <>
          <PromptGenerator promptContent={prompt.content}></PromptGenerator>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3 md:col-span-2 xl:col-span-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Owner</p>
                  <p className="mt-1 text-sm text-slate-700">{prompt.owner || ""}</p>
                </div>
                <div className="">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Create By</p>
                  <p className="mt-1 text-sm text-slate-700">{historyFormat(prompt.createdBy, prompt.createdAt)}</p>
                </div>
                <div className="">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Last Update</p>
                  <p className="mt-1 text-sm text-slate-700">{historyFormat(prompt.updatedBy, prompt.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
