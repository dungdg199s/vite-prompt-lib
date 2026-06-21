import { useState } from "react";

export default function DocumentContentPreview({
  type,
  contentMarkdown,
  contentJSON,
  contentHTML,
}) {
  const [copiedKey, setCopiedKey] = useState("");

  const copyText = async (content, key) => {
    const text = String(content || "").trim();
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(""), 1200);
    } catch {
      // Ignore clipboard failures in unsupported contexts.
    }
  };

  const jsonPreview =
    typeof contentJSON === "string"
      ? contentJSON
      : contentJSON
        ? JSON.stringify(contentJSON, null, 2)
        : "";

  if (type === "HTML") {
    return (
      <section className="grid gap-4">
        <article className="rounded-2xl border border-stone-300 bg-[#fffef8] p-4 shadow-[0_8px_24px_rgba(44,33,12,0.06)] md:p-5">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-semibold tracking-tight">HTML Content</h2>
            <button
              type="button"
              onClick={() => copyText(contentHTML, "html")}
              className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!String(contentHTML || "").trim()}
            >
              {copiedKey === "html" ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Stored HTML source for this document.
          </p>
          <pre className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-stone-200 bg-[#fffcf7] p-3 text-xs text-slate-700">
            {contentHTML || "No HTML content."}
          </pre>
        </article>
      </section>
    );
  }

  if (type === "JSON") {
    return (
      <section className="grid gap-4">
        <article className="rounded-2xl border border-stone-300 bg-[#fffef8] p-4 shadow-[0_8px_24px_rgba(44,33,12,0.06)] md:p-5">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-semibold tracking-tight">JSON Content</h2>
            <button
              type="button"
              onClick={() => copyText(jsonPreview, "json")}
              className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!String(jsonPreview || "").trim()}
            >
              {copiedKey === "json" ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Stored JSON source for this document.
          </p>
          <pre className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-stone-200 bg-[#fffcf7] p-3 text-xs text-slate-700">
            {jsonPreview || "No JSON content."}
          </pre>
        </article>
      </section>
    );
  }

  if (type === "Markdown") {
    return (
      <section className="grid gap-4">
        <article className="rounded-2xl border border-stone-300 bg-[#fffef8] p-4 shadow-[0_8px_24px_rgba(44,33,12,0.06)] md:p-5">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-semibold tracking-tight">Markdown Content</h2>
            <button
              type="button"
              onClick={() => copyText(contentMarkdown, "markdown")}
              className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!String(contentMarkdown || "").trim()}
            >
              {copiedKey === "markdown" ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Stored markdown source for this document.
          </p>
          <pre className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-stone-200 bg-[#fffcf7] p-3 text-xs text-slate-700">
            {contentMarkdown || "No markdown content."}
          </pre>
        </article>
      </section>
    );
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-2xl border border-stone-300 bg-[#fffef8] p-4 shadow-[0_8px_24px_rgba(44,33,12,0.06)] md:p-5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Markdown Content</h2>
          <button
            type="button"
            onClick={() => copyText(contentMarkdown, "spreadsheet-markdown")}
            className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!String(contentMarkdown || "").trim()}
          >
            {copiedKey === "spreadsheet-markdown" ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Synced markdown generated from spreadsheet data.
        </p>
        <pre className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-stone-200 bg-[#fffcf7] p-3 text-xs text-slate-700">
          {contentMarkdown || "No markdown content. Use Sync to generate output."}
        </pre>
      </article>

      <article className="rounded-2xl border border-stone-300 bg-[#fffef8] p-4 shadow-[0_8px_24px_rgba(44,33,12,0.06)] md:p-5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">JSON Content</h2>
          <button
            type="button"
            onClick={() => copyText(jsonPreview, "spreadsheet-json")}
            className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!String(jsonPreview || "").trim()}
          >
            {copiedKey === "spreadsheet-json" ? "Copied" : "Copy"}
          </button>
        </div>
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
