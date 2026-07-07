import { useMemo } from "react";
import { useParams } from "react-router-dom";
import Button from "../shared/Button";
import { uiClasses } from "../shared/uiClasses";
import { useWorkspace } from "../../hooks/useWorkspaces";
import { useAppNavigate } from "../../hooks/useAppNavigate";

export default function DocumentDetail() {
  const navigate = useAppNavigate();
  const { workspaceId, documentId } = useParams();
  const { documents, isLoading } = useWorkspace(workspaceId);
  const document = useMemo(() => documents.find((item) => item.id === documentId), [documentId, documents]);

  const form = document || {
    name: "Document",
    description: "Select a document or create a new one.",
    type: "Spreadsheets",
    shareMode: "private",
  };

  return (
    <section className={uiClasses.card}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{form.name}</h2>
          <p className="mt-1 text-sm text-slate-600">{form.description || "Select a document or create a new one."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => navigate({ object: "document", recordId: documentId, action: "edit" })}
            disabled={isLoading || !document}
            variant="secondary"
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => navigate({ object: "document", recordId: documentId, action: "delete" })}
            disabled={isLoading || !document}
          >
            Delete
          </Button>
        </div>
      </div>

      {document ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Name</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{document.name}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Workspace</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{document.workspace || workspaceId}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Type</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{document.type || "Spreadsheets"}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Share Mode</p>
            <p className="mt-1 text-sm font-medium capitalize text-slate-800">{document.shareMode || "private"}</p>
          </div>
          {document.preasheetId ? (
            <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Spreadsheet ID</p>
              <p className="mt-1 break-all text-sm font-medium text-slate-800">{document.preasheetId}</p>
            </div>
          ) : null}
          {document.fileName ? (
            <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">File Name</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{document.fileName}</p>
            </div>
          ) : null}
          <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3 md:col-span-2 xl:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Description</p>
            <p className="mt-1 text-sm text-slate-700">{document.description || "No description"}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-stone-300 bg-[#fffcf7] p-4 text-sm text-slate-600">
          No document selected.
        </div>
      )}
    </section>
  );
}
