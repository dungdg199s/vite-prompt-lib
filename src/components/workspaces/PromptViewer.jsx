const inputClassName =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-200";

export default function PromptViewer({
  selectedPrompt,
  promptText,
  parsedTokens,
  generatedPrompt,
  promptInputValues,
  onInputChange,
}) {
  return (
    <section className="rounded-2xl border border-stone-300 bg-[#fffef8] p-4 shadow-[0_8px_24px_rgba(44,33,12,0.06)] md:p-5">
      <h2 className="mb-4 text-lg font-semibold tracking-tight">Prompt Detail</h2>

      {!selectedPrompt ? (
        <p className="text-sm text-slate-600">Select a prompt from sidebar.</p>
      ) : (
        <>
          <p className="text-sm">
            <strong>Name:</strong> {selectedPrompt.name}
          </p>
          <p className="mt-1 text-sm">
            <strong>Description:</strong>{" "}
            {selectedPrompt.description || "No description"}
          </p>

          <div className="mt-4 rounded-xl border border-dashed border-stone-300 bg-[#fffcf7] p-3">
            <h3 className="text-sm font-semibold">Original Prompt</h3>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-800 p-3 text-xs text-slate-50 whitespace-pre-wrap break-words">
              {promptText || "Prompt content is empty"}
            </pre>
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-stone-300 bg-[#fffcf7] p-3">
            <h3 className="text-sm font-semibold">Prompt Generator</h3>
            {!parsedTokens.length ? (
              <p className="mt-2 text-sm text-slate-600">No token found in prompt.</p>
            ) : null}
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {parsedTokens.map((token) => (
                <label key={token.id} className="grid gap-1.5 text-sm">
                  {token.label}
                  {token.inputType === "textarea" ? (
                    <textarea
                      className={inputClassName}
                      rows={4}
                      value={promptInputValues[token.id] || ""}
                      onChange={(e) => onInputChange(token.id, e.target.value)}
                    />
                  ) : null}
                  {token.inputType === "select" ? (
                    <select
                      className={inputClassName}
                      value={promptInputValues[token.id] || ""}
                      onChange={(e) => onInputChange(token.id, e.target.value)}
                    >
                      <option value="">Select an option</option>
                      {token.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  {token.inputType === "text" ? (
                    <input
                      className={inputClassName}
                      value={promptInputValues[token.id] || ""}
                      onChange={(e) => onInputChange(token.id, e.target.value)}
                      placeholder={token.descriptor || "Enter value"}
                    />
                  ) : null}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-stone-300 bg-[#fffcf7] p-3">
            <h3 className="text-sm font-semibold">Generated Prompt</h3>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-800 p-3 text-xs text-slate-50 whitespace-pre-wrap break-words">
              {generatedPrompt || "Generated prompt will appear here."}
            </pre>
          </div>
        </>
      )}
    </section>
  );
}
