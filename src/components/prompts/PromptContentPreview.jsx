export default function PromptContentPreview({ content }) {
  if (!content) return null;

  return (
    <section className="rounded-2xl border border-stone-300 bg-[#fffef8] p-4 shadow-[0_8px_24px_rgba(44,33,12,0.06)] md:p-5">
      <h2 className="mb-3 text-lg font-semibold tracking-tight">Content Preview</h2>
      <pre className="overflow-x-auto rounded-lg bg-slate-800 p-3 text-xs text-slate-50 whitespace-pre-wrap break-words">
        {content}
      </pre>
    </section>
  );
}
