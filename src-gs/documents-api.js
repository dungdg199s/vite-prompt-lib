import {
  convertPreashetToJSON,
  convertPreashetToMarkdown,
  getSpreadsheetInfo,
} from "./document-convertor";
import { sheetDb } from "./g-sheet-db";
import { gasServer } from "./gas-server";

/**
 * Document API
 * @typedef {Object} Document
 * @property {string} name - Unique name of the document
 * @property {string} type - Document type: Spreadsheets, Markdown, JSON, HTML
 * @property {string} workspace - Unique name of the workspace
 * @property {string} fileName - Unique name of the document file
 * @property {string} preasheetId - Unique ID of the document in the spreadsheet
 * @property {string} description - Description of the document
 * @property {string} contentMarkdown - Content of the document (e.g. markdown text)
 * @property {string} contentJSON - Content of the document in JSON format
 * @property {string} contentHTML - Content of the document in HTML format
 * @property {Object} syncOptions - Last used sync options
 * @property {string} shareMode - Sharing
 */

gasServer.get("/api/documents", () => {
  return sheetDb.table("documents").getAll();
});

gasServer.get("/api/preasheet/:preasheetId", (req) => {
  return getSpreadsheetInfo(req.params.preasheetId);
});

gasServer.get("/api/documents/:name", (req) => {
  const name = req.params.name;
  const documentRecord = sheetDb.table("documents").getByName(name);
  if (!documentRecord) {
    throw new Error(`Document "${name}" not found`);
  }
  return documentRecord;
});

gasServer.post("/api/documents/:name/sync", (req) => {
  const name = req.params.name;
  const options = req.body || {};

  // Retrieve the document record from the "documents" table
  const documentRecord = sheetDb.table("documents").getByName(name);
  if (!documentRecord) {
    throw new Error(`Document "${name}" not found`);
  }

  if ((documentRecord.type || "Spreadsheets") !== "Spreadsheets") {
    throw new Error("Sync is only available for Spreadsheets documents");
  }

  const syncOptions = {
    includeEmptyRows: options.includeEmptyRows !== false,
    headerRow: Number.isInteger(options.headerRow) ? options.headerRow : null,
    sheets: Array.isArray(options.sheets) ? options.sheets : [],
  };

  // Convert the content based on the requested type
  documentRecord.contentMarkdown = convertPreashetToMarkdown(
    documentRecord.preasheetId,
    options,
  );
  documentRecord.contentJSON = convertPreashetToJSON(
    documentRecord.preasheetId,
    options,
  );
  documentRecord.syncOptions = syncOptions;

  // update the document record in the "documents" table with the converted content
  sheetDb.table("documents").update(documentRecord);
  return documentRecord;
});

gasServer.post("/api/documents", (req) => {
  const payload = req.body;
  if (!payload || !payload.name) {
    throw new Error("Invalid payload for create-document");
  }

  if (!payload.workspace || !String(payload.workspace).trim()) {
    throw new Error("Workspace is required for document");
  }

  const type = payload.type || "Spreadsheets";
  if (type === "Spreadsheets" && !payload.preasheetId) {
    throw new Error("Spreadsheet ID is required for Spreadsheets type");
  }

  const record = {
    name: payload.name,
    type,
    workspace: payload.workspace || "",
    fileName: payload.fileName || "",
    preasheetId: payload.preasheetId || "",
    description: payload.description || "",
    contentMarkdown: payload.contentMarkdown || "",
    contentJSON: payload.contentJSON || "",
    contentHTML: payload.contentHTML || "",
    syncOptions: payload.syncOptions || {
      includeEmptyRows: false,
      headerRow: null,
      sheets: [],
    },
    shareMode: payload.shareMode || "private",
    shareWith: payload.shareWith || [],
  };

  if (type === "Spreadsheets") {
    record.contentMarkdown = convertPreashetToMarkdown(
      record.preasheetId,
      record.syncOptions,
    );
    record.contentJSON = convertPreashetToJSON(
      record.preasheetId,
      record.syncOptions,
    );
  }

  sheetDb.table("documents").create(record);
  return { success: true };
});

gasServer.put("/api/documents", (req) => {
  const payload = req.body;
  if (!payload || !payload.name) {
    throw new Error("Invalid payload for update-document");
  }

  if (!payload.workspace || !String(payload.workspace).trim()) {
    throw new Error("Workspace is required for document");
  }

  const type = payload.type || "Spreadsheets";
  if (type === "Spreadsheets" && !payload.preasheetId) {
    throw new Error("Spreadsheet ID is required for Spreadsheets type");
  }

  const updatedRecord = {
    id: payload.id,
    name: payload.name,
    type,
    workspace: payload.workspace || "",
    fileName: payload.fileName || "",
    preasheetId: payload.preasheetId || "",
    description: payload.description || "",
    contentMarkdown: payload.contentMarkdown || "",
    contentJSON: payload.contentJSON || "",
    contentHTML: payload.contentHTML || "",
    syncOptions: payload.syncOptions || {
      includeEmptyRows: false,
      headerRow: null,
      sheets: [],
    },
    shareMode: payload.shareMode || "private",
    shareWith: payload.shareWith || [],
  };

  const success = sheetDb.table("documents").update(updatedRecord);
  if (!success) {
    throw new Error("Document not found for update");
  }
  return { success: true };
});

gasServer.delete("/api/documents/:name", (req) => {
  const name = req.params.name;
  const success = sheetDb.table("documents").delete(name);
  if (!success) {
    throw new Error(`Document "${name}" not found for delete`);
  }
  return { success: true };
});
