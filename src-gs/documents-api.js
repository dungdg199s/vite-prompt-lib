import {
  convertPreashetToJSON,
  convertPreashetToMarkdown,
} from "./document-convertor";
import { sheetDb } from "./g-sheet-db";
import { gasServer } from "./gas-server";

/**
 * Document API
 * @typedef {Object} Document
 * @property {string} name - Unique name of the document
 * @property {string} workspace - Unique name of the workspace
 * @property {string} preasheetId - Unique ID of the document in the spreadsheet
 * @property {string} description - Description of the document
 * @property {string} contentMarkdown - Content of the document (e.g. markdown text)
 * @property {string} contentJSON - Content of the document in JSON format
 * @property {string} shareMode - Sharing
 */

gasServer.get("/api/documents", () => {
  return sheetDb.table("documents").getAll();
});

gasServer.get("/api/documents/:name", (req) => {
  const name = req.params.name;
  return sheetDb.table("documents").getByName(name);
});

gasServer.post("/api/documents/:name/convert", (req) => {
  const name = req.params.name;
  const type = req.query.type || "markdown";
  const options = req.body;

  // Retrieve the document record from the "documents" table
  const documentRecord = sheetDb.table("documents").getByName(name);
  if (!documentRecord) {
    throw new Error(`Document "${name}" not found`);
  }

  // Convert the content based on the requested type
  let convertedContent;
  if (type === "markdown") {
    convertedContent = convertPreashetToMarkdown(
      documentRecord.preasheetId,
      options,
    );
    documentRecord.contentMarkdown = convertedContent;
  } else if (type === "json") {
    convertedContent = convertPreashetToJSON(
      documentRecord.preasheetId,
      options,
    );
    documentRecord.contentJSON = convertedContent;
  } else {
    throw new Error(`Unsupported conversion type "${type}"`);
  }
  // update the document record in the "documents" table with the converted content
  sheetDb.table("documents").update(documentRecord);
  return { content: convertedContent };
});

gasServer.post("/api/documents", (req) => {
  const payload = req.body;
  if (!payload || !payload.name) {
    throw new Error("Invalid payload for create-document");
  }
  return sheetDb.table("documents").create(payload);
});

gasServer.put("/api/documents", (req) => {
  const payload = req.body;
  if (!payload || !payload.name) {
    throw new Error("Invalid payload for update-document");
  }
  const success = sheetDb.table("documents").update(payload);
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
