import { useState, useMemo } from "react";
import AppModal from "./AppModal";
import { documentsClient } from "../../lib/documents-client";

const inputClassName =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-200";
const secondaryButtonClassName =
  "rounded-lg border border-stone-300 bg-teal-50 px-3 py-2 text-sm font-medium text-slate-800 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50";
const primaryButtonClassName =
  "rounded-lg border border-teal-800 bg-teal-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50";

export default function DocumentSelectorModal({ isOpen, documents = [], workspaceList = [], onDocumentCreated, onClose, onSelectContent }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedContentType, setSelectedContentType] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSavingDocument, setIsSavingDocument] = useState(false);
  const [createErrorMessage, setCreateErrorMessage] = useState("");
  const [newDocumentForm, setNewDocumentForm] = useState({
    name: "",
    workspace: "",
    type: "Markdown",
    preasheetId: "",
    description: "",
    contentMarkdown: "",
    contentJSON: "",
    contentHTML: "",
  });

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const query = searchQuery.toLowerCase();
    return documents.filter(
      (doc) =>
        doc.name.toLowerCase().includes(query) || doc.description?.toLowerCase().includes(query) || doc.workspace?.toLowerCase().includes(query),
    );
  }, [documents, searchQuery]);

  const getAvailableContentTypes = (doc) => {
    const types = [];
    if (doc.contentMarkdown && String(doc.contentMarkdown).trim()) types.push("markdown");
    const jsonContent = typeof doc.contentJSON === "string" ? doc.contentJSON : JSON.stringify(doc.contentJSON || {});
    if (jsonContent && String(jsonContent).trim() && jsonContent !== "{}") types.push("json");
    if (doc.contentHTML && String(doc.contentHTML).trim()) types.push("html");
    return types;
  };

  const handleDocumentSelect = (doc) => {
    const availableTypes = getAvailableContentTypes(doc);
    if (availableTypes.length === 1) {
      // Auto-select if only one type available
      handleContentSelect(doc, availableTypes[0]);
    } else if (availableTypes.length > 1) {
      // Show content type selection
      setSelectedDocument(doc);
      setSelectedContentType(null);
    } else {
      alert("Document has no content");
    }
  };

  const handleContentSelect = (doc, contentType) => {
    let content = "";
    if (contentType === "markdown") {
      content = String(doc.contentMarkdown || "");
    } else if (contentType === "json") {
      const jsonData = doc.contentJSON;
      content = typeof jsonData === "string" ? jsonData : JSON.stringify(jsonData, null, 2);
    } else if (contentType === "html") {
      content = String(doc.contentHTML || "");
    }

    if (content.trim() && content !== "{}") {
      onSelectContent(content);
      resetModal();
    } else {
      alert(`No ${contentType} content available`);
    }
  };

  const resetModal = () => {
    setSearchQuery("");
    setSelectedDocument(null);
    setSelectedContentType(null);
    setIsAddModalOpen(false);
    setCreateErrorMessage("");
    setNewDocumentForm({
      name: "",
      workspace: "",
      type: "Markdown",
      preasheetId: "",
      description: "",
      contentMarkdown: "",
      contentJSON: "",
      contentHTML: "",
    });
    onClose();
  };

  const handleNewDocumentChange = (field, value) => {
    setCreateErrorMessage("");
    setNewDocumentForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateDocument = async (event) => {
    event.preventDefault();
    setIsSavingDocument(true);
    setCreateErrorMessage("");

    const payload = {
      name: String(newDocumentForm.name || "").trim(),
      workspace: String(newDocumentForm.workspace || "").trim(),
      type: newDocumentForm.type || "Markdown",
      preasheetId: String(newDocumentForm.preasheetId || "").trim(),
      fileName: String(newDocumentForm.name || "").trim(),
      description: String(newDocumentForm.description || "").trim(),
      contentMarkdown: newDocumentForm.contentMarkdown || "",
      contentJSON: newDocumentForm.contentJSON || "",
      contentHTML: newDocumentForm.contentHTML || "",
      shareMode: "private",
      shareWith: [],
      syncOptions: {
        includeEmptyRows: false,
        headerRow: null,
        sheets: [],
      },
    };

    if (!payload.name) {
      setCreateErrorMessage("Document name is required");
      setIsSavingDocument(false);
      return;
    }

    if (!payload.workspace) {
      setCreateErrorMessage("Workspace is required");
      setIsSavingDocument(false);
      return;
    }

    if (payload.type === "Spreadsheets" && !payload.preasheetId) {
      setCreateErrorMessage("Spreadsheet ID is required");
      setIsSavingDocument(false);
      return;
    }

    try {
      await documentsClient.createDocument(payload);
      if (typeof onDocumentCreated === "function") {
        await onDocumentCreated();
      }
      setIsAddModalOpen(false);
      setNewDocumentForm((prev) => ({
        ...prev,
        name: "",
        preasheetId: "",
        description: "",
        contentMarkdown: "",
        contentJSON: "",
        contentHTML: "",
      }));
    } catch (error) {
      console.log(error);
      setCreateErrorMessage(error?.message || "Cannot create document");
    } finally {
      setIsSavingDocument(false);
    }
  };

  if (isAddModalOpen) {
    const isSpreadsheetType = (newDocumentForm.type || "Markdown") === "Spreadsheets";

    return (
      <AppModal isOpen={isOpen} title="Add Document" onClose={resetModal} size="lg">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold">Add Document</h3>
          <button type="button" onClick={() => setIsAddModalOpen(false)} className={secondaryButtonClassName}>
            Back
          </button>
        </div>

        <form className="grid gap-3" onSubmit={handleCreateDocument}>
          <label className="grid gap-1.5 text-sm">
            Document Name
            <input
              className={inputClassName}
              value={newDocumentForm.name}
              onChange={(event) => handleNewDocumentChange("name", event.target.value)}
              placeholder="my-document"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            Workspace
            <select
              className={inputClassName}
              value={newDocumentForm.workspace}
              onChange={(event) => handleNewDocumentChange("workspace", event.target.value)}
            >
              <option value="">- Select workspace -</option>
              {workspaceList.map((workspace) => (
                <option key={workspace.name} value={workspace.name}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5 text-sm">
            Type
            <select className={inputClassName} value={newDocumentForm.type} onChange={(event) => handleNewDocumentChange("type", event.target.value)}>
              <option value="Markdown">Markdown</option>
              <option value="JSON">JSON</option>
              <option value="HTML">HTML</option>
              <option value="Spreadsheets">Spreadsheets</option>
            </select>
          </label>

          {isSpreadsheetType ? (
            <label className="grid gap-1.5 text-sm">
              Spreadsheet ID
              <input
                className={inputClassName}
                value={newDocumentForm.preasheetId}
                onChange={(event) => handleNewDocumentChange("preasheetId", event.target.value)}
                placeholder="1AbCdEfGh..."
              />
            </label>
          ) : null}

          {newDocumentForm.type === "Markdown" ? (
            <label className="grid gap-1.5 text-sm">
              Markdown Content
              <textarea
                className={inputClassName}
                rows={6}
                value={newDocumentForm.contentMarkdown}
                onChange={(event) => handleNewDocumentChange("contentMarkdown", event.target.value)}
                placeholder="Write markdown content..."
              />
            </label>
          ) : null}

          {newDocumentForm.type === "JSON" ? (
            <label className="grid gap-1.5 text-sm">
              JSON Content
              <textarea
                className={inputClassName}
                rows={6}
                value={newDocumentForm.contentJSON}
                onChange={(event) => handleNewDocumentChange("contentJSON", event.target.value)}
                placeholder='{"key": "value"}'
              />
            </label>
          ) : null}

          {newDocumentForm.type === "HTML" ? (
            <label className="grid gap-1.5 text-sm">
              HTML Content
              <textarea
                className={inputClassName}
                rows={6}
                value={newDocumentForm.contentHTML}
                onChange={(event) => handleNewDocumentChange("contentHTML", event.target.value)}
                placeholder="<h1>Title</h1>"
              />
            </label>
          ) : null}

          <label className="grid gap-1.5 text-sm">
            Description
            <input
              className={inputClassName}
              value={newDocumentForm.description}
              onChange={(event) => handleNewDocumentChange("description", event.target.value)}
              placeholder="Short description"
            />
          </label>

          {createErrorMessage ? <p className="text-sm text-red-700">{createErrorMessage}</p> : null}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className={secondaryButtonClassName}>
              Cancel
            </button>
            <button type="submit" disabled={isSavingDocument} className={primaryButtonClassName}>
              Create
            </button>
          </div>
        </form>
      </AppModal>
    );
  }

  if (selectedDocument) {
    const availableTypes = getAvailableContentTypes(selectedDocument);

    return (
      <AppModal isOpen={isOpen} title="Select Content Type" onClose={resetModal} size="sm">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold">
              Document: <strong>{selectedDocument.name}</strong>
            </h3>
            <p className="mt-1 text-xs text-slate-600">{selectedDocument.description || "No description"}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Content Type:</label>
            <div className="space-y-1">
              {availableTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedContentType(type)}
                  className={`w-full rounded-lg border-2 px-3 py-2 text-left text-sm font-medium transition ${
                    selectedContentType === type
                      ? "border-teal-700 bg-teal-50 text-teal-900"
                      : "border-stone-300 bg-white text-slate-800 hover:bg-stone-100"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setSelectedDocument(null)} className={secondaryButtonClassName}>
              Back
            </button>
            <button
              type="button"
              onClick={() => handleContentSelect(selectedDocument, selectedContentType)}
              disabled={!selectedContentType}
              className={primaryButtonClassName}
            >
              Insert
            </button>
          </div>
        </div>
      </AppModal>
    );
  }

  return (
    <AppModal isOpen={isOpen} title="Select Document" onClose={resetModal} size="lg">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={inputClassName}
          />
          <button
            type="button"
            onClick={() => {
              setCreateErrorMessage("");
              setIsAddModalOpen(true);
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-teal-700 bg-teal-700 text-base font-semibold text-white transition hover:bg-teal-800"
            title="Add document"
          >
            +
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filteredDocuments.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-600">{documents.length === 0 ? "No documents available" : "No matching documents"}</p>
          ) : (
            <div className="space-y-1">
              {filteredDocuments.map((doc) => (
                <button
                  key={doc.name}
                  type="button"
                  onClick={() => handleDocumentSelect(doc)}
                  className="w-full rounded-lg border border-stone-300 bg-white p-3 text-left transition hover:bg-stone-50"
                >
                  <div className="text-sm font-medium text-slate-800">{doc.name}</div>
                  <div className="mt-1 text-xs text-slate-600">{doc.description || "No description"}</div>
                  {doc.workspace && <div className="mt-1 text-xs text-teal-700">@ {doc.workspace}</div>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppModal>
  );
}
