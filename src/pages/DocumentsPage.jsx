import { useEffect, useMemo, useState } from "react";
import DocumentSidebar from "../components/documents/DocumentSidebar";
import DocumentForm from "../components/documents/DocumentForm";
import DocumentContentPreview from "../components/documents/DocumentContentPreview";
import { documentsClient } from "../lib/documents-client";
import { workspacesClient } from "../lib/workspaces-client";

const DEFAULT_DOCUMENT_FORM = {
  name: "",
  workspace: "",
  fileName: "",
  preasheetId: "",
  description: "",
  contentMarkdown: "",
  contentJSON: "",
  shareMode: "private",
  shareWith: "",
  syncOptions: null,
};

const DEFAULT_SYNC_OPTIONS = {
  includeEmptyRows: false,
  headerRow: "1",
  useAllSheets: true,
  selectedSheets: [],
};

const normalizeShareWith = (raw) => {
  return String(raw || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseContentJSON = (rawContent) => {
  if (!rawContent) {
    return null;
  }

  if (typeof rawContent === "object") {
    return rawContent;
  }

  try {
    return JSON.parse(rawContent);
  } catch {
    return null;
  }
};

export default function DocumentsPage() {
  const [documentList, setDocumentList] = useState([]);
  const [workspaceList, setWorkspaceList] = useState([]);
  const [selectedDocumentName, setSelectedDocumentName] = useState("");
  const [documentForm, setDocumentForm] = useState(DEFAULT_DOCUMENT_FORM);
  const [editingMode, setEditingMode] = useState("create");
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [formPhase, setFormPhase] = useState("details");
  const [filterWorkspace, setFilterWorkspace] = useState("");
  const [syncOptions, setSyncOptions] = useState(DEFAULT_SYNC_OPTIONS);
  const [syncPreasheetName, setSyncPreasheetName] = useState("");
  const [syncSheetNames, setSyncSheetNames] = useState([]);
  const [isLoadingSyncMeta, setIsLoadingSyncMeta] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const parsedContentJSON = useMemo(
    () => parseContentJSON(documentForm.contentJSON),
    [documentForm.contentJSON],
  );

  const fallbackSheets = useMemo(() => {
    const sheets = parsedContentJSON?.sheets;
    if (!Array.isArray(sheets)) {
      return [];
    }

    return sheets
      .map((sheet) => String(sheet?.name || "").trim())
      .filter(Boolean);
  }, [parsedContentJSON]);

  const handleDocumentFormChange = (field, value) => {
    setErrorMessage("");
    setDocumentForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSyncOptionChange = (field, value) => {
    setSyncOptions((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleSyncSheet = (sheetName, checked) => {
    setSyncOptions((prev) => {
      const selected = new Set(prev.selectedSheets || []);
      if (checked) {
        selected.add(sheetName);
      } else {
        selected.delete(sheetName);
      }

      return {
        ...prev,
        useAllSheets: false,
        selectedSheets: Array.from(selected),
      };
    });
  };

  const handleToggleAllSheets = (checked) => {
    setSyncOptions((prev) => ({
      ...prev,
      useAllSheets: checked,
      selectedSheets: checked ? [] : prev.selectedSheets,
    }));
  };

  const resetDocumentForm = () => {
    setDocumentForm(DEFAULT_DOCUMENT_FORM);
    setSelectedDocumentName("");
    setEditingMode("create");
    setFormPhase("details");
  };

  const resetSyncOptions = () => {
    setSyncOptions(DEFAULT_SYNC_OPTIONS);
    setSyncPreasheetName("");
    setSyncSheetNames([]);
  };

  const openCreateModal = () => {
    setErrorMessage("");
    resetDocumentForm();
    setFormPhase("details");
    setIsDeleteModalOpen(false);
    setIsSyncModalOpen(false);
    setIsDocumentModalOpen(true);
  };

  const openEditModal = () => {
    if (!selectedDocumentName) {
      return;
    }

    setErrorMessage("");
    setEditingMode("edit");
    setFormPhase("details");
    setIsDeleteModalOpen(false);
    setIsSyncModalOpen(false);
    setIsDocumentModalOpen(true);
  };

  const loadPreasheetMetadata = async (preasheetId) => {
    setIsLoadingSyncMeta(true);

    try {
      const preasheet = await documentsClient.getPreasheet(preasheetId);
      const names = Array.isArray(preasheet?.sheetNames)
        ? preasheet.sheetNames.map((name) => String(name || "").trim()).filter(Boolean)
        : [];

      const finalSheetNames = names.length ? names : fallbackSheets;
      setSyncPreasheetName(preasheet?.preasheetName || documentForm.fileName || "");
      setSyncSheetNames(finalSheetNames);
      setSyncOptions((prev) => ({
        ...prev,
        selectedSheets: Array.isArray(prev.selectedSheets) ? prev.selectedSheets : [],
      }));
      return true;
    } catch (error) {
      setErrorMessage(error.message || "Cannot load spreadsheet metadata");
      return false;
    } finally {
      setIsLoadingSyncMeta(false);
    }
  };

  const handleNextFormPhase = async () => {
    const name = documentForm.name.trim();
    const preasheetId = documentForm.preasheetId.trim();

    if (!name) {
      setErrorMessage("Document name is required");
      return;
    }

    if (!preasheetId) {
      setErrorMessage("Spreadsheet ID is required");
      return;
    }

    setErrorMessage("");
    const loaded = await loadPreasheetMetadata(preasheetId);
    if (loaded) {
      setFormPhase("sync");
    }
  };

  const handleBackFormPhase = () => {
    setErrorMessage("");
    setFormPhase("details");
  };

  const openDeleteModal = () => {
    if (!selectedDocumentName) {
      return;
    }

    setErrorMessage("");
    setIsDocumentModalOpen(false);
    setIsSyncModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const openSyncModal = async () => {
    if (!selectedDocumentName) {
      return;
    }

    if (!documentForm.preasheetId) {
      setErrorMessage("Spreadsheet ID is required to sync");
      return;
    }

    setErrorMessage("");
    setIsDocumentModalOpen(false);
    setIsDeleteModalOpen(false);

    const loaded = await loadPreasheetMetadata(documentForm.preasheetId);
    if (loaded) {
      setIsSyncModalOpen(true);
    }
  };

  const closeDocumentModal = () => {
    setFormPhase("details");
    setIsDocumentModalOpen(false);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const closeSyncModal = () => {
    setIsSyncModalOpen(false);
  };

  const refreshDocumentList = async () => {
    setIsLoadingList(true);
    setErrorMessage("");

    try {
      const list = (await documentsClient.getDocuments()) || [];
      setDocumentList(list);
    } catch (error) {
      setErrorMessage(error.message || "Cannot load document list");
    } finally {
      setIsLoadingList(false);
    }
  };

  const loadWorkspaceList = async () => {
    try {
      const list = (await workspacesClient.getWorkspaces()) || [];
      setWorkspaceList(list);
    } catch {
      setWorkspaceList([]);
    }
  };

  const openDocument = async (name) => {
    setSelectedDocumentName(name);
    resetSyncOptions();
    setErrorMessage("");

    try {
      const document = await documentsClient.getDocument(name);
      setDocumentForm({
        name: document?.name || "",
        workspace: document?.workspace || "",
        fileName: document?.fileName || "",
        preasheetId: document?.preasheetId || "",
        description: document?.description || "",
        contentMarkdown: document?.contentMarkdown || "",
        contentJSON: document?.contentJSON || "",
        shareMode: document?.shareMode || "private",
        shareWith: Array.isArray(document?.shareWith)
          ? document.shareWith.join(", ")
          : "",
        syncOptions: document?.syncOptions || null,
      });

      const storedSyncOptions = document?.syncOptions || {};
      const storedSheets = Array.isArray(storedSyncOptions.sheets)
        ? storedSyncOptions.sheets.filter(Boolean)
        : [];
      setSyncOptions({
        includeEmptyRows: storedSyncOptions.includeEmptyRows === true,
        headerRow:
          storedSyncOptions.headerRow !== null &&
          storedSyncOptions.headerRow !== undefined
            ? String(storedSyncOptions.headerRow)
            : "1",
        useAllSheets: storedSheets.length === 0,
        selectedSheets: storedSheets,
      });
      setEditingMode("edit");
    } catch (error) {
      setErrorMessage(error.message || "Cannot load document detail");
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    const payload = {
      name: documentForm.name.trim(),
      workspace: documentForm.workspace.trim(),
      fileName: documentForm.fileName.trim(),
      preasheetId: documentForm.preasheetId.trim(),
      description: documentForm.description.trim(),
      contentMarkdown: documentForm.contentMarkdown,
      contentJSON: documentForm.contentJSON,
      shareMode: documentForm.shareMode,
      shareWith:
        documentForm.shareMode === "shared"
          ? normalizeShareWith(documentForm.shareWith)
          : [],
    };

    if (!payload.name) {
      setErrorMessage("Document name is required");
      setIsSaving(false);
      return;
    }

    if (!payload.preasheetId) {
      setErrorMessage("Spreadsheet ID is required");
      setIsSaving(false);
      return;
    }

    const mergedSheets = Array.from(new Set([...(syncOptions.selectedSheets || [])]));

    const normalizedSyncOptions = {
      includeEmptyRows: Boolean(syncOptions.includeEmptyRows),
    };

    const parsedHeaderRow = Number.parseInt(syncOptions.headerRow, 10);
    if (Number.isInteger(parsedHeaderRow) && parsedHeaderRow > 0) {
      normalizedSyncOptions.headerRow = parsedHeaderRow;
    }

    if (!syncOptions.useAllSheets) {
      if (!mergedSheets.length) {
        setErrorMessage("Please select at least one sheet or choose all");
        setIsSaving(false);
        return;
      }
      normalizedSyncOptions.sheets = mergedSheets;
    }

    payload.syncOptions = normalizedSyncOptions;

    try {
      if (editingMode === "create") {
        await documentsClient.createDocument(payload);
      } else {
        await documentsClient.updateDocument(payload);
      }

      await documentsClient.syncDocument(payload.name, normalizedSyncOptions);

      await refreshDocumentList();
      await openDocument(payload.name);
      setFormPhase("details");
      setIsDocumentModalOpen(false);
    } catch (error) {
      setErrorMessage(error.message || "Cannot save document");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDocumentName) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      await documentsClient.deleteDocument(selectedDocumentName);
      setIsDeleteModalOpen(false);
      resetDocumentForm();
      resetSyncOptions();
      await refreshDocumentList();
    } catch (error) {
      setErrorMessage(error.message || "Cannot delete document");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async (event) => {
    event.preventDefault();
    if (!selectedDocumentName) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    const mergedSheets = Array.from(new Set([...(syncOptions.selectedSheets || [])]));

    const normalizedOptions = {
      includeEmptyRows: Boolean(syncOptions.includeEmptyRows),
    };

    const parsedHeaderRow = Number.parseInt(syncOptions.headerRow, 10);
    if (Number.isInteger(parsedHeaderRow) && parsedHeaderRow > 0) {
      normalizedOptions.headerRow = parsedHeaderRow;
    }

    if (!syncOptions.useAllSheets) {
      if (!mergedSheets.length) {
        setErrorMessage("Please select at least one sheet or choose all");
        setIsSaving(false);
        return;
      }
      normalizedOptions.sheets = mergedSheets;
    }

    try {
      await documentsClient.syncDocument(selectedDocumentName, normalizedOptions);
      await refreshDocumentList();
      await openDocument(selectedDocumentName);
      setIsSyncModalOpen(false);
    } catch (error) {
      setErrorMessage(error.message || "Cannot sync document");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      refreshDocumentList();
      loadWorkspaceList();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#e3f1ea,_transparent_45%),radial-gradient(circle_at_bottom_left,_#f9ddbf,_transparent_40%)] bg-[#f5efe5] text-slate-800">
      <div className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 md:grid-cols-[320px_1fr]">
        <DocumentSidebar
          documentList={documentList}
          workspaceList={workspaceList}
          selectedDocumentName={selectedDocumentName}
          filterWorkspace={filterWorkspace}
          isLoadingList={isLoadingList}
          onRefresh={refreshDocumentList}
          onSelectDocument={openDocument}
          onFilterChange={setFilterWorkspace}
        />

        <main className="grid content-start gap-4 p-4 md:p-6">
          <DocumentForm
            selectedDocumentName={selectedDocumentName}
            form={documentForm}
            editingMode={editingMode}
            formPhase={formPhase}
            workspaceList={workspaceList}
            isSaving={isSaving}
            errorMessage={errorMessage}
            isModalOpen={isDocumentModalOpen}
            isDeleteModalOpen={isDeleteModalOpen}
            isSyncModalOpen={isSyncModalOpen}
            syncOptions={syncOptions}
            syncPreasheetName={syncPreasheetName}
            syncSheetNames={syncSheetNames}
            isLoadingSyncMeta={isLoadingSyncMeta}
            onFormChange={handleDocumentFormChange}
            onSyncOptionChange={handleSyncOptionChange}
            onToggleSyncSheet={handleToggleSyncSheet}
            onToggleAllSheets={handleToggleAllSheets}
            onNextPhase={handleNextFormPhase}
            onBackPhase={handleBackFormPhase}
            onSubmit={handleSave}
            onSubmitSync={handleSync}
            onNew={openCreateModal}
            onEdit={openEditModal}
            onOpenDelete={openDeleteModal}
            onOpenSync={openSyncModal}
            onDelete={handleDelete}
            onCloseModal={closeDocumentModal}
            onCloseDelete={closeDeleteModal}
            onCloseSync={closeSyncModal}
          />

          <DocumentContentPreview
            contentMarkdown={documentForm.contentMarkdown}
            contentJSON={parsedContentJSON || documentForm.contentJSON}
          />
        </main>
      </div>
    </div>
  );
}
