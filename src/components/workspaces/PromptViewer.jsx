import AppModal from "../shared/AppModal";

const inputClassName =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-200";
const generatorInputClassName = `${inputClassName} h-11`;
const generatorSelectClassName =
  `${generatorInputClassName} appearance-none bg-[linear-gradient(45deg,transparent_50%,#334155_50%),linear-gradient(135deg,#334155_50%,transparent_50%)] bg-[position:calc(100%-18px)_calc(50%+1px),calc(100%-12px)_calc(50%+1px)] bg-[size:6px_6px,6px_6px] bg-no-repeat pr-10`;
const secondaryButtonClassName =
  "rounded-lg border border-stone-300 bg-teal-50 px-3 py-2 text-sm font-medium text-slate-800 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50";
const primaryButtonClassName =
  "rounded-lg border border-teal-800 bg-teal-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50";

export default function PromptViewer({
  selectedPrompt,
  selectedPromptName,
  promptText,
  parsedTokens,
  generatedPrompt,
  promptInputValues,
  promptForm,
  workspaceList,
  promptEditingMode,
  isSavingPrompt,
  promptErrorMessage,
  isPromptModalOpen,
  isPromptDeleteModalOpen,
  onInputChange,
  onPromptFormChange,
  onPromptSubmit,
  onNewPrompt,
  onEditPrompt,
  onOpenDeletePrompt,
  onDeletePrompt,
  onClosePromptModal,
  onCloseDeletePrompt,
}) {
  return (
    <section className="rounded-2xl border border-stone-300 bg-[#fffef8] p-4 shadow-[0_8px_24px_rgba(44,33,12,0.06)] md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {selectedPrompt ? selectedPrompt.name : "Prompt"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {selectedPrompt
              ? selectedPrompt.description || "No description"
              : "Select a prompt from the sidebar or create a new one."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onNewPrompt} className={secondaryButtonClassName}>
            New
          </button>
          <button
            type="button"
            onClick={onEditPrompt}
            disabled={isSavingPrompt || !selectedPrompt}
            className={secondaryButtonClassName}
          >
            Edit
          </button>
          <button
            type="button"
            className="rounded-lg border border-red-700 bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onOpenDeletePrompt}
            disabled={isSavingPrompt || !selectedPrompt}
          >
            Delete
          </button>
        </div>
      </div>

      {!selectedPrompt ? (
        <p className="text-sm text-slate-600">Select a prompt from sidebar.</p>
      ) : (
        <>
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
                <label key={token.id} className="grid content-start gap-1.5 text-sm">
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
            <h3 className="text-sm font-semibold">Generated Prompt</h3>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-800 p-3 text-xs text-slate-50 whitespace-pre-wrap break-words">
              {generatedPrompt || "Generated prompt will appear here."}
            </pre>
          </div>
        </>
      )}

      <AppModal
        isOpen={isPromptModalOpen}
        title={promptEditingMode === "create" ? "Create Prompt" : "Edit Prompt"}
        onClose={onClosePromptModal}
        size="lg"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold tracking-tight">
            {promptEditingMode === "create" ? "Create Prompt" : "Edit Prompt"}
          </h3>
          <button type="button" className={secondaryButtonClassName} onClick={onClosePromptModal}>
            Close
          </button>
        </div>

        <form className="grid gap-3" onSubmit={onPromptSubmit}>
          <label className="grid gap-1.5 text-sm">
            Prompt Name
            <input
              className={inputClassName}
              value={promptForm.name}
              onChange={(e) => onPromptFormChange("name", e.target.value)}
              disabled={promptEditingMode === "edit"}
              placeholder="my-prompt-name"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            Workspace
            <select
              className={inputClassName}
              value={promptForm.workspace}
              onChange={(e) => onPromptFormChange("workspace", e.target.value)}
            >
              <option value="">— No workspace —</option>
              {workspaceList.map((workspace) => (
                <option key={workspace.name} value={workspace.name}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5 text-sm">
            Description
            <input
              className={inputClassName}
              value={promptForm.description}
              onChange={(e) => onPromptFormChange("description", e.target.value)}
              placeholder="Short description of this prompt"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            Content
            <textarea
              className={inputClassName}
              value={promptForm.content}
              onChange={(e) => onPromptFormChange("content", e.target.value)}
              rows={8}
              placeholder={"Write your prompt template here.\nUse ${VariableName|description} for tokens.\nExample: ${Topic|options:React,Vue,Angular}"}
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            Share Mode
            <select
              className={inputClassName}
              value={promptForm.shareMode}
              onChange={(e) => onPromptFormChange("shareMode", e.target.value)}
            >
              <option value="private">private</option>
              <option value="shared">shared</option>
              <option value="public">public</option>
            </select>
          </label>

          {promptForm.shareMode === "shared" ? (
            <label className="grid gap-1.5 text-sm">
              Share With (comma separated emails)
              <input
                className={inputClassName}
                value={promptForm.shareWith}
                onChange={(e) => onPromptFormChange("shareWith", e.target.value)}
                placeholder="a@company.com, b@company.com"
              />
            </label>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" onClick={onClosePromptModal} className={secondaryButtonClassName}>
              Cancel
            </button>
            <button type="submit" disabled={isSavingPrompt} className={primaryButtonClassName}>
              {promptEditingMode === "create" ? "Create" : "Update"}
            </button>
          </div>
        </form>
      </AppModal>

      <AppModal
        isOpen={isPromptDeleteModalOpen}
        title="Delete Prompt"
        onClose={onCloseDeletePrompt}
      >
        <h3 className="text-lg font-semibold tracking-tight">Delete Prompt</h3>
        <p className="mt-2 text-sm text-slate-600">
          Delete <strong>{selectedPromptName}</strong>? This action cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCloseDeletePrompt} className={secondaryButtonClassName}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg border border-red-700 bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onDeletePrompt}
            disabled={isSavingPrompt}
          >
            Delete
          </button>
        </div>
      </AppModal>

      {promptErrorMessage ? (
        <p className="mt-2 text-sm text-red-700">{promptErrorMessage}</p>
      ) : null}
    </section>
  );
}
