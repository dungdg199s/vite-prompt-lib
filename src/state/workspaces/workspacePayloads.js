export const normalizeShareWith = (raw) => {
  return String(raw || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const buildWorkspacePayload = (workspaceForm) => {
  return {
    id: workspaceForm.id,
    name: String(workspaceForm.name || "").trim(),
    description: String(workspaceForm.description || "").trim(),
    shareMode: workspaceForm.shareMode,
    shareWith: workspaceForm.shareMode === "shared" ? normalizeShareWith(workspaceForm.shareWith) : [],
  };
};

export const buildPromptPayload = (formData) => {
  return {
    id: formData.id,
    name: String(formData.name || "").trim(),
    workspace: String(formData.workspace || "").trim(),
    description: String(formData.description || "").trim(),
    content: formData.content,
    shareMode: formData.shareMode,
    shareWith: formData.shareMode === "shared" ? normalizeShareWith(formData.shareWith) : [],
  };
};

export const buildDocumentSyncOptions = (documentSyncOptions) => {
  const mergedSheets = Array.from(new Set([...(documentSyncOptions.selectedSheets || [])]));
  const normalizedOptions = {
    includeEmptyRows: Boolean(documentSyncOptions.includeEmptyRows),
  };

  const parsedHeaderRow = Number.parseInt(documentSyncOptions.headerRow, 10);
  if (Number.isInteger(parsedHeaderRow) && parsedHeaderRow > 0) {
    normalizedOptions.headerRow = parsedHeaderRow;
  }

  if (!documentSyncOptions.useAllSheets) {
    normalizedOptions.sheets = mergedSheets;
  }

  return normalizedOptions;
};

export const buildDocumentPayload = ({ documentForm, selectedWorkspaceName, documentSyncOptions }) => {
  const workspace = String(documentForm.workspace || selectedWorkspaceName || "").trim();
  const isSpreadsheetType = (documentForm.type || "Spreadsheets") === "Spreadsheets";
  const fileName = isSpreadsheetType
    ? String(documentForm.fileName || documentForm.name || "").trim()
    : "";

  const payload = {
    id: documentForm.id,
    name: String(documentForm.name || "").trim(),
    type: documentForm.type || "Spreadsheets",
    workspace,
    fileName,
    preasheetId: String(documentForm.preasheetId || "").trim(),
    description: String(documentForm.description || "").trim(),
    contentMarkdown: documentForm.contentMarkdown,
    contentJSON: documentForm.contentJSON,
    contentHTML: documentForm.contentHTML,
    shareMode: documentForm.shareMode,
    shareWith: documentForm.shareMode === "shared" ? normalizeShareWith(documentForm.shareWith) : [],
  };

  const syncOptions = isSpreadsheetType ? buildDocumentSyncOptions(documentSyncOptions) : { includeEmptyRows: false, headerRow: 1, sheets: [] };

  return {
    payload,
    isSpreadsheetType,
    syncOptions,
  };
};
