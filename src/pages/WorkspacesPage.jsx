import { useEffect, useMemo, useState } from "react";
import { workspacesClient } from "../lib/workspaces-client";

const DEFAULT_WORKSPACE_FORM = {
  name: "",
  description: "",
  shareMode: "private",
  shareWith: "",
};

const TOKEN_REGEX = /\$\{([^}|]+)\|([^}]+)\}/g;

const normalizeShareWith = (raw) => {
  return String(raw || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const parsePromptTokens = (promptText) => {
  if (!promptText) {
    return [];
  }

  const tokens = [];
  let match;
  let index = 0;

  while ((match = TOKEN_REGEX.exec(promptText)) !== null) {
    const raw = match[0];
    const label = match[1].trim();
    const descriptor = match[2].trim();

    let inputType = "text";
    let options = [];

    if (descriptor.toLowerCase().startsWith("options:")) {
      inputType = "select";
      options = descriptor
        .slice("options:".length)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    } else if (descriptor.toLowerCase() === "textarea") {
      inputType = "textarea";
    }

    tokens.push({
      id: `${label}_${index}`,
      raw,
      label,
      descriptor,
      inputType,
      options,
    });
    index += 1;
  }

  return tokens;
};

const getPromptText = (prompt) => {
  if (!prompt) {
    return "";
  }

  return String(
    prompt.content || prompt.template || prompt.prompt || prompt.description || "",
  );
};

export default function WorkspacesPage() {
  const [workspaceList, setWorkspaceList] = useState([]);
  const [selectedWorkspaceName, setSelectedWorkspaceName] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [selectedPromptName, setSelectedPromptName] = useState("");
  const [promptInputValues, setPromptInputValues] = useState({});
  const [workspaceForm, setWorkspaceForm] = useState(DEFAULT_WORKSPACE_FORM);
  const [editingMode, setEditingMode] = useState("create");
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const inputClassName =
    "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-200";
  const buttonClassName =
    "rounded-lg border border-stone-300 bg-teal-50 px-3 py-2 text-sm font-medium text-slate-800 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50";

  const selectedPrompt = useMemo(() => {
    if (!selectedWorkspace?.prompts?.length) {
      return null;
    }
    return (
      selectedWorkspace.prompts.find((item) => item.name === selectedPromptName) || null
    );
  }, [selectedWorkspace, selectedPromptName]);

  const promptText = useMemo(() => getPromptText(selectedPrompt), [selectedPrompt]);

  const parsedTokens = useMemo(() => parsePromptTokens(promptText), [promptText]);

  const generatedPrompt = useMemo(() => {
    if (!promptText) {
      return "";
    }

    return parsedTokens.reduce((result, token) => {
      const tokenValue = promptInputValues[token.id] ?? "";
      return result.replaceAll(token.raw, tokenValue);
    }, promptText);
  }, [parsedTokens, promptInputValues, promptText]);

  const resetWorkspaceForm = () => {
    setWorkspaceForm(DEFAULT_WORKSPACE_FORM);
    setEditingMode("create");
  };

  const refreshWorkspaceList = async () => {
    setIsLoadingList(true);
    setErrorMessage("");

    try {
      const list = (await workspacesClient.getWorkspaces()) || [];
      setWorkspaceList(list);
    } catch (error) {
      setErrorMessage(error.message || "Can not load workspace list");
    } finally {
      setIsLoadingList(false);
    }
  };

  const openWorkspace = async (name) => {
    setSelectedWorkspaceName(name);
    setSelectedPromptName("");
    setPromptInputValues({});
    setIsLoadingWorkspace(true);
    setErrorMessage("");

    try {
      const workspace = await workspacesClient.getWorkspace(name);
      setSelectedWorkspace(workspace);
      setWorkspaceForm({
        name: workspace?.name || "",
        description: workspace?.description || "",
        shareMode: workspace?.shareMode || "private",
        shareWith: Array.isArray(workspace?.shareWith)
          ? workspace.shareWith.join(", ")
          : "",
      });
      setEditingMode("edit");
    } catch (error) {
      setErrorMessage(error.message || "Can not load workspace detail");
    } finally {
      setIsLoadingWorkspace(false);
    }
  };

  const handleSaveWorkspace = async (event) => {
    event.preventDefault();
    setIsSavingWorkspace(true);
    setErrorMessage("");

    const payload = {
      name: workspaceForm.name.trim(),
      description: workspaceForm.description.trim(),
      shareMode: workspaceForm.shareMode,
      shareWith: normalizeShareWith(workspaceForm.shareWith),
    };

    if (!payload.name) {
      setErrorMessage("Workspace name is required");
      setIsSavingWorkspace(false);
      return;
    }

    try {
      if (editingMode === "create") {
        await workspacesClient.createWorkspace(payload);
      } else {
        await workspacesClient.updateWorkspace(payload);
      }

      await refreshWorkspaceList();
      await openWorkspace(payload.name);
    } catch (error) {
      setErrorMessage(error.message || "Can not save workspace");
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!selectedWorkspaceName) {
      return;
    }

    setIsSavingWorkspace(true);
    setErrorMessage("");

    try {
      await workspacesClient.deleteWorkspace(selectedWorkspaceName);
      setSelectedWorkspaceName("");
      setSelectedWorkspace(null);
      setSelectedPromptName("");
      setPromptInputValues({});
      resetWorkspaceForm();
      await refreshWorkspaceList();
    } catch (error) {
      setErrorMessage(error.message || "Can not delete workspace");
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      refreshWorkspaceList();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#e3f1ea,_transparent_45%),radial-gradient(circle_at_bottom_left,_#f9ddbf,_transparent_40%)] bg-[#f5efe5] text-slate-800">
      <div className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 md:grid-cols-[320px_1fr]">
        <aside className="border-b border-stone-300 bg-[#faf5ec] p-5 md:border-r md:border-b-0">
        {!selectedWorkspaceName ? (
          <>
            <div className="mb-4 flex items-center justify-between gap-2.5">
              <h2 className="text-lg font-semibold tracking-tight">Workspaces</h2>
              <button type="button" onClick={refreshWorkspaceList} className={buttonClassName}>
                Refresh
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {isLoadingList ? <p className="text-sm text-slate-600">Loading workspaces...</p> : null}
              {!isLoadingList && !workspaceList.length ? (
                <p className="text-sm text-slate-600">No workspace found.</p>
              ) : null}
              {workspaceList.map((workspace) => (
                <button
                  key={workspace.name}
                  type="button"
                  className="grid cursor-pointer gap-1 rounded-xl border border-stone-300 bg-[#fffef8] px-3 py-2 text-left transition hover:border-teal-700/40"
                  onClick={() => openWorkspace(workspace.name)}
                >
                  <span className="font-medium">{workspace.name}</span>
                  <small className="text-xs text-slate-500">
                    {workspace.description || "No description"}
                  </small>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-2.5">
              <button
                type="button"
                className={buttonClassName}
                onClick={() => {
                  setSelectedWorkspaceName("");
                  setSelectedWorkspace(null);
                  setSelectedPromptName("");
                  setPromptInputValues({});
                  resetWorkspaceForm();
                }}
              >
                Back
              </button>
              <h2 className="text-base font-semibold tracking-tight">{selectedWorkspaceName}</h2>
            </div>

            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-600">
              Prompts
            </h3>
            <div className="flex flex-col gap-2">
              {isLoadingWorkspace ? <p className="text-sm text-slate-600">Loading prompts...</p> : null}
              {!isLoadingWorkspace && !selectedWorkspace?.prompts?.length ? (
                <p className="text-sm text-slate-600">No prompt in this workspace.</p>
              ) : null}
              {(selectedWorkspace?.prompts || []).map((prompt) => (
                <button
                  key={prompt.name}
                  type="button"
                  className={`grid cursor-pointer gap-1 rounded-xl border px-3 py-2 text-left transition ${
                    prompt.name === selectedPromptName
                      ? "border-teal-700 bg-teal-100"
                      : "border-stone-300 bg-[#fffef8] hover:border-teal-700/40"
                  }`}
                  onClick={() => {
                    setSelectedPromptName(prompt.name);
                    setPromptInputValues({});
                  }}
                >
                  <span className="font-medium">{prompt.name}</span>
                  <small className="text-xs text-slate-500">
                    {prompt.description || "No description"}
                  </small>
                </button>
              ))}
            </div>
          </>
        )}
        </aside>

        <main className="grid content-start gap-4 p-4 md:p-6">
          <section className="rounded-2xl border border-stone-300 bg-[#fffef8] p-4 shadow-[0_8px_24px_rgba(44,33,12,0.06)] md:p-5">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">
              {editingMode === "create" ? "Create Workspace" : "Workspace Detail"}
            </h2>

            <form className="grid gap-3" onSubmit={handleSaveWorkspace}>
              <label className="grid gap-1.5 text-sm">
              Workspace Name
              <input
                className={inputClassName}
                value={workspaceForm.name}
                onChange={(event) => {
                  const name = event.target.value;
                  setWorkspaceForm((prev) => ({ ...prev, name }));
                }}
                disabled={editingMode === "edit"}
                placeholder="workspace-name"
              />
            </label>

              <label className="grid gap-1.5 text-sm">
              Description
              <textarea
                className={inputClassName}
                value={workspaceForm.description}
                onChange={(event) => {
                  const description = event.target.value;
                  setWorkspaceForm((prev) => ({ ...prev, description }));
                }}
                rows={3}
                placeholder="Workspace description"
              />
            </label>

              <label className="grid gap-1.5 text-sm">
              Share Mode
              <select
                className={inputClassName}
                value={workspaceForm.shareMode}
                onChange={(event) => {
                  const shareMode = event.target.value;
                  setWorkspaceForm((prev) => ({ ...prev, shareMode }));
                }}
              >
                <option value="private">private</option>
                <option value="shared">shared</option>
                <option value="public">public</option>
              </select>
            </label>

              <label className="grid gap-1.5 text-sm">
              Share With (comma separated emails)
              <input
                className={inputClassName}
                value={workspaceForm.shareWith}
                onChange={(event) => {
                  const shareWith = event.target.value;
                  setWorkspaceForm((prev) => ({ ...prev, shareWith }));
                }}
                placeholder="a@company.com, b@company.com"
              />
            </label>

              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={isSavingWorkspace} className={buttonClassName}>
                {editingMode === "create" ? "Create" : "Update"}
              </button>
              <button
                type="button"
                onClick={resetWorkspaceForm}
                disabled={isSavingWorkspace}
                className={buttonClassName}
              >
                New
              </button>
              <button
                type="button"
                className="rounded-lg border border-red-700 bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleDeleteWorkspace}
                disabled={isSavingWorkspace || !selectedWorkspaceName}
              >
                Delete
              </button>
            </div>
          </form>

            {errorMessage ? <p className="mt-2 text-sm text-red-700">{errorMessage}</p> : null}
          </section>

          <section className="rounded-2xl border border-stone-300 bg-[#fffef8] p-4 shadow-[0_8px_24px_rgba(44,33,12,0.06)] md:p-5">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">Prompt Detail</h2>
            {!selectedPrompt ? <p className="text-sm text-slate-600">Select a prompt from sidebar.</p> : null}
          {selectedPrompt ? (
            <>
              <p className="text-sm">
                <strong>Name:</strong> {selectedPrompt.name}
              </p>
              <p className="mt-1 text-sm">
                <strong>Description:</strong> {selectedPrompt.description || "No description"}
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
                          onChange={(event) => {
                            const value = event.target.value;
                            setPromptInputValues((prev) => ({ ...prev, [token.id]: value }));
                          }}
                        />
                      ) : null}
                      {token.inputType === "select" ? (
                        <select
                          className={inputClassName}
                          value={promptInputValues[token.id] || ""}
                          onChange={(event) => {
                            const value = event.target.value;
                            setPromptInputValues((prev) => ({ ...prev, [token.id]: value }));
                          }}
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
                          onChange={(event) => {
                            const value = event.target.value;
                            setPromptInputValues((prev) => ({ ...prev, [token.id]: value }));
                          }}
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
          ) : null}
          </section>
        </main>
      </div>
    </div>
  );
}
