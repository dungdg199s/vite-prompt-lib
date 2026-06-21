import { useState, useMemo } from "react";
import AppModal from "./AppModal";

const inputClassName =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-200";
const secondaryButtonClassName =
  "rounded-lg border border-stone-300 bg-teal-50 px-3 py-2 text-sm font-medium text-slate-800 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50";
const primaryButtonClassName =
  "rounded-lg border border-teal-800 bg-teal-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50";

export default function DocumentSelectorModal({
  isOpen,
  documents = [],
  onClose,
  onSelectContent,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedContentType, setSelectedContentType] = useState(null);

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const query = searchQuery.toLowerCase();
    return documents.filter(
      (doc) =>
        doc.name.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query) ||
        doc.workspace?.toLowerCase().includes(query)
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
    onClose();
  };

  if (selectedDocument) {
    const availableTypes = getAvailableContentTypes(selectedDocument);

    return (
      <AppModal isOpen={isOpen} title="Select Content Type" onClose={resetModal} size="sm">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold">
              Document: <strong>{selectedDocument.name}</strong>
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              {selectedDocument.description || "No description"}
            </p>
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
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={inputClassName}
        />

        <div className="max-h-96 overflow-y-auto">
          {filteredDocuments.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-600">
              {documents.length === 0 ? "No documents available" : "No matching documents"}
            </p>
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
                  <div className="mt-1 text-xs text-slate-600">
                    {doc.description || "No description"}
                  </div>
                  {doc.workspace && (
                    <div className="mt-1 text-xs text-teal-700">
                      @ {doc.workspace}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppModal>
  );
}
