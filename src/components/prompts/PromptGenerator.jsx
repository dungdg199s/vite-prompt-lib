import { useMemo, useState } from "react";
import DocumentSelectorModal from "../documents/DocumentSelectorModal";

const inputClassName =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-200";
const generatorInputClassName = `${inputClassName} h-11`;
const generatorSelectClassName = `${generatorInputClassName} appearance-none bg-[linear-gradient(45deg,transparent_50%,#334155_50%),linear-gradient(135deg,#334155_50%,transparent_50%)] bg-[position:calc(100%-18px)_calc(50%+1px),calc(100%-12px)_calc(50%+1px)] bg-[size:6px_6px,6px_6px] bg-no-repeat pr-10`;

export default function PromptGenerator({ promptContent }) {
  const [promptInputValues, setPromptInputValues] = useState({});
  const [isDocumentSelectorOpen, setIsDocumentSelectorOpen] = useState(false);
  const [editingTokenId, setEditingTokenId] = useState(null);

  const parsedTokens = useMemo(() => {
    if (!promptContent) return [];
    const tokenRegex = /\$\{([^}]+)\}/g;
    const tokens = [];
    let match;
    while ((match = tokenRegex.exec(promptContent)) !== null) {
      const [key, typePattern] = match[1].split("|");
      const [type, options] = typePattern ? typePattern.split(":") : ["text", ""];
      tokens.push({
        id: match[1],
        label: key,
        inputType: type || "text",
        options: type === "options" ? options.split(",") : [],
      });
    }
    return tokens;
  }, [promptContent]);

  const generatedPrompt = useMemo(() => {
    if (!promptContent) return "";
    const tokenRegex = /\$\{([^}]+)\}/g;
    const replacedPrompt = promptContent.replace(tokenRegex, (match, id) => {
      const value = promptInputValues[id] || "";
      return value;
    });
    return replacedPrompt;
  }, [promptContent, promptInputValues]);

  const onInputChange = (tokenId, value) => {
    setPromptInputValues((prevValues) => ({
      ...prevValues,
      [tokenId]: value,
    }));
  };

  const handleOpenDocumentSelector = (tokenId) => {
    setEditingTokenId(tokenId);
    setIsDocumentSelectorOpen(true);
  };

  const handleSelectDocumentContent = (content) => {
    if (editingTokenId) {
      onInputChange(editingTokenId, content);
      setIsDocumentSelectorOpen(false);
      setEditingTokenId(null);
    }
  };

  const copyToClipboard = () => {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt);
    }
  };

  const openGeminiWithPrompt = () => {
    window.top.postMessage(
      {
        source: "OPEN_GEMINI_WITH_PROMPT",
        action: "SEND_PROMPT_TO_EXTENSION",
        prompt: generatedPrompt,
      },
      "*"
    );
  };

  return (
    <>
      <div className="mt-4 rounded-xl border border-dashed border-stone-300 bg-[#fffcf7] p-3">
        <h3 className="text-sm font-semibold">Prompt Generator</h3>
        {!parsedTokens.length ? <p className="mt-2 text-sm text-slate-600">No token found in prompt.</p> : null}
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {parsedTokens.map((token) => (
            <label key={token.id} className="grid content-start gap-1.5 text-sm">
              {token.label}
              {token.inputType === "textarea" ? (
                <div className="relative">
                  <textarea
                    className={`${inputClassName} pr-10`}
                    rows={4}
                    value={promptInputValues[token.id] || ""}
                    onChange={(e) => onInputChange(token.id, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleOpenDocumentSelector(token.id)}
                    title="Select document content"
                    className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-md border border-stone-300 bg-teal-50 text-[10px] font-semibold text-slate-800 transition hover:brightness-95"
                  >
                    📄
                  </button>
                </div>
              ) : null}
              {token.inputType === "options" ? (
                <select
                  className={generatorSelectClassName}
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
                  className={generatorInputClassName}
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
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Generated Prompt</h3>
          <div>
            <button
              type="button"
              onClick={copyToClipboard}
              disabled={!generatedPrompt || generatedPrompt === "Generated prompt will appear here."}
              title="Copy to clipboard"
              className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={openGeminiWithPrompt}
              disabled={!generatedPrompt || generatedPrompt === "Generated prompt will appear here."}
              title="Open gemini"
              className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Open Gemini
            </button>
          </div>
        </div>
        <pre className="overflow-x-auto rounded-lg bg-slate-800 p-3 text-xs text-slate-50 whitespace-pre-wrap break-words">
          {generatedPrompt || "Generated prompt will appear here."}
        </pre>
      </div>

      <DocumentSelectorModal
        isOpen={isDocumentSelectorOpen}
        onClose={() => setIsDocumentSelectorOpen(false)}
        onSelectContent={handleSelectDocumentContent}
      />
    </>
  );
}
