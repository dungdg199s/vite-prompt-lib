export default function DocumentContentPreview({ contentMarkdown, contentJSON }) {
  const jsonPreview = contentJSON
    ? JSON.stringify(contentJSON, null, 2)
    : "";

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-2xl border border-stone-300 bg-[#fffef8] p-4 shadow-[0_8px_24px_rgba(44,33,12,0.06)] md:p-5">
        <h2 className="text-lg font-semibold tracking-tight">Markdown Content</h2>
        <p className="mt-1 text-sm text-slate-600">
          Synced markdown generated from spreadsheet data.
        </p>
        <pre className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-stone-200 bg-[#fffcf7] p-3 text-xs text-slate-700">
          {contentMarkdown || "No markdown content. Use Sync to generate output."}
        </pre>
      </article>

      <article className="rounded-2xl border border-stone-300 bg-[#fffef8] p-4 shadow-[0_8px_24px_rgba(44,33,12,0.06)] md:p-5">
        <h2 className="text-lg font-semibold tracking-tight">JSON Content</h2>
        <p className="mt-1 text-sm text-slate-600">
          Structured data generated during the same sync run.
        </p>
        <pre className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-stone-200 bg-[#fffcf7] p-3 text-xs text-slate-700">
          {jsonPreview || "No JSON content. Use Sync to generate output."}
        </pre>
      </article>
    </section>
  );
}
