import { useState } from "react";
import Modal from "../shared/Modal";
import DocumentSelectorModal from "../documents/DocumentSelectorModal";
import PromptEditModal from "./PromptEditModal";
import Button from "../shared/Button";
import { uiClasses } from "../shared/uiClasses";

const inputClassName = uiClasses.input;
const generatorInputClassName = `${inputClassName} h-11`;
const generatorSelectClassName = `${generatorInputClassName} appearance-none bg-[linear-gradient(45deg,transparent_50%,#334155_50%),linear-gradient(135deg,#334155_50%,transparent_50%)] bg-[position:calc(100%-18px)_calc(50%+1px),calc(100%-12px)_calc(50%+1px)] bg-[size:6px_6px,6px_6px] bg-no-repeat pr-10`;

export default function PromptViewer({
  selectedPrompt,
  selectedPromptName,
  parsedTokens,
  generatedPrompt,
  promptInputValues,
  promptForm,
  workspaceList,
  documents = [],
  onDocumentCreated,
  promptEditingMode,
  isSavingPrompt,
  errorMessage,
  isPromptModalOpen,
  isPromptDeleteModalOpen,
  onInputChange,
  onPromptSubmit,
  onPromptDetailChange,
  onNewPrompt,
  onEditPrompt,
  onOpenDeletePrompt,
  onDeletePrompt,
  onClosePromptModal,
  onCloseDeletePrompt,
}) {
  const [isDocumentSelectorOpen, setIsDocumentSelectorOpen] = useState(false);
  const [editingTokenId, setEditingTokenId] = useState(null);

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

  const historyFormat = (person, dateStr) => {
    if (!person) return "";
    if (!dateStr) return person;
    if (typeof dateStr === "string") {
      const d = new Date(dateStr);
      dateStr = d.toLocaleDateString() + " " + d.toLocaleTimeString();
    }
    return `${person}, ${dateStr}`;
  };

  const openGeminiWithPrompt = () => {
    // window.open(`https://gemini.google.com/app?prompt=${encodeURIComponent(generatedPrompt)}`, "_blank");
    window.top.postMessage(
      {
        source: "OPEN_GEMINI_WITH_PROMPT",
        action: "SEND_PROMPT_TO_EXTENSION",
        prompt: generatedPrompt,
      },
      "*",
    );
  };

  return (
    <section className={uiClasses.card}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{selectedPrompt ? selectedPrompt.name : "Prompt"}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {selectedPrompt ? selectedPrompt.description || "No description" : "Select a prompt from the sidebar or create a new one."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onNewPrompt} variant="secondary">
            New Prompt
          </Button>
          <Button type="button" onClick={onEditPrompt} disabled={isSavingPrompt || !selectedPrompt} variant="secondary">
            Edit
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onOpenDeletePrompt}
            disabled={isSavingPrompt || !selectedPrompt}
          >
            Delete
          </Button>
        </div>
      </div>

      {!selectedPrompt ? (
        <p className="text-sm text-slate-600">Select a prompt from sidebar.</p>
      ) : (
        <>
          {/* <div className="mt-4 rounded-xl border border-dashed border-stone-300 bg-[#fffcf7] p-3">
            <h3 className="text-sm font-semibold">Original Prompt</h3>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-800 p-3 text-xs text-slate-50 whitespace-pre-wrap break-words">
              {promptText || "Prompt content is empty"}
            </pre>
          </div> */}

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
                  {token.inputType === "select" ? (
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
                <Button
                  type="button"
                  onClick={copyToClipboard}
                  disabled={!generatedPrompt || generatedPrompt === "Generated prompt will appear here."}
                  title="Copy to clipboard"
                  variant="ghost"
                  size="sm"
                >
                  Copy
                </Button>
                <Button
                  type="button"
                  onClick={openGeminiWithPrompt}
                  disabled={!generatedPrompt || generatedPrompt === "Generated prompt will appear here."}
                  title="Open gemini"
                  variant="ghost"
                  size="sm"
                >
                  Open Gemini
                </Button>
              </div>
            </div>
            <pre className="overflow-x-auto rounded-lg bg-slate-800 p-3 text-xs text-slate-50 whitespace-pre-wrap break-words">
              {generatedPrompt || "Generated prompt will appear here."}
            </pre>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3 md:col-span-2 xl:col-span-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Owner</p>
                  <p className="mt-1 text-sm text-slate-700">{promptForm.owner || ""}</p>
                </div>
                <div className="">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Create By</p>
                  <p className="mt-1 text-sm text-slate-700">{historyFormat(promptForm.createdBy, promptForm.createdAt)}</p>
                </div>
                <div className="">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Last Update</p>
                  <p className="mt-1 text-sm text-slate-700">{historyFormat(promptForm.updatedBy, promptForm.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <DocumentSelectorModal
        isOpen={isDocumentSelectorOpen}
        documents={documents}
        workspaceList={workspaceList}
        onDocumentCreated={onDocumentCreated}
        onClose={() => setIsDocumentSelectorOpen(false)}
        onSelectContent={handleSelectDocumentContent}
      />

      <PromptEditModal
        prompt={promptForm}
        isOpen={isPromptModalOpen}
        editMode={promptEditingMode}
        onClose={onClosePromptModal}
        onSubmit={onPromptSubmit}
        onFormChange={onPromptDetailChange}
        isSaving={isSavingPrompt}
      ></PromptEditModal>

      <Modal isOpen={isPromptDeleteModalOpen} title="Delete Prompt" onClose={onCloseDeletePrompt}>
        <h3 className="text-lg font-semibold tracking-tight">Delete Prompt</h3>
        <p className="mt-2 text-sm text-slate-600">
          Delete <strong>{selectedPromptName}</strong>? This action cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" onClick={onCloseDeletePrompt} variant="secondary">
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onDeletePrompt}
            disabled={isSavingPrompt}
          >
            Delete
          </Button>
        </div>
      </Modal>

      {errorMessage ? <p className="mt-2 text-sm text-red-700">{errorMessage}</p> : null}
    </section>
  );
}
