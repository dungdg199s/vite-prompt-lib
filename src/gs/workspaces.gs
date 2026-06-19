import { GasServer } from ".";

const WORKSPACES_FOLDER_ID = process.env.WORKSPACES_FOLDER_ID;
const WORKSPACES_CACHE_KEY = "workspaces:list:v2";
const WORKSPACES_CACHE_TTL_SECONDS = 120;
const WORKSPACES_SPREADSHEET_NAME = "workspaces-db";
const WORKSPACES_SPREADSHEET_ID_KEY = "workspaces:spreadsheet:id";
const WORKSPACES_SHEET_NAME = "Workspace";
const PROMPTS_SHEET_NAME = "Prompt";

const WORKSPACE_HEADERS = [
  "id",
  "name",
  "description",
  "author",
  "createdAt",
  "updatedAt",
  "updatedBy",
  "shareMode",
  "shareWith",
];

const PROMPT_HEADERS = [
  "id",
  "workspaceId",
  "name",
  "description",
  "content",
  "shareMode",
  "shareWith",
  "author",
  "createdAt",
  "updatedAt",
  "createdBy",
];

function parseShareWith(raw) {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function stringifyShareWith(value) {
  return JSON.stringify(Array.isArray(value) ? value : []);
}

function getWorkspaceIdFromPayload(payload) {
  if (!payload) {
    return "";
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (typeof payload.id === "string") {
    return payload.id;
  }

  return "";
}

function getOrCreateSpreadsheet() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty(WORKSPACES_SPREADSHEET_ID_KEY);

  if (spreadsheetId) {
    try {
      return SpreadsheetApp.openById(spreadsheetId);
    } catch (error) {}
  }

  const folder = DriveApp.getFolderById(WORKSPACES_FOLDER_ID);
  const existingFiles = folder.getFilesByType(MimeType.GOOGLE_SHEETS);
  if (existingFiles.hasNext()) {
    const file = existingFiles.next();
    const existingSpreadsheetId = file.getId();
    properties.setProperty(WORKSPACES_SPREADSHEET_ID_KEY, existingSpreadsheetId);
    return SpreadsheetApp.openById(existingSpreadsheetId);
  }

  const spreadsheet = SpreadsheetApp.create(WORKSPACES_SPREADSHEET_NAME);
  const spreadsheetFile = DriveApp.getFileById(spreadsheet.getId());
  folder.addFile(spreadsheetFile);

  properties.setProperty(WORKSPACES_SPREADSHEET_ID_KEY, spreadsheet.getId());
  return spreadsheet;
}

function ensureSheet(spreadsheet, sheetName, headers) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  const currentHeader = headerRange.getValues()[0];
  const headerMismatch = headers.some((value, index) => currentHeader[index] !== value);

  if (headerMismatch) {
    headerRange.setValues([headers]);
  }

  return sheet;
}

function ensureSheets() {
  const spreadsheet = getOrCreateSpreadsheet();
  const workspaceSheet = ensureSheet(spreadsheet, WORKSPACES_SHEET_NAME, WORKSPACE_HEADERS);
  const promptSheet = ensureSheet(spreadsheet, PROMPTS_SHEET_NAME, PROMPT_HEADERS);

  return {
    spreadsheet,
    workspaceSheet,
    promptSheet,
  };
}

function readRows(sheet, headers) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values.map((row) => {
    const data = {};
    headers.forEach((key, index) => {
      data[key] = row[index];
    });
    return data;
  });
}

function buildWorkspaceResponse(workspaceRows, promptRows) {
  const promptsByWorkspaceId = {};
  promptRows.forEach((promptRow) => {
    const prompt = {
      id: String(promptRow.id || ""),
      workspaceId: String(promptRow.workspaceId || ""),
      name: String(promptRow.name || ""),
      description: promptRow.description ? String(promptRow.description) : "",
      content: String(promptRow.content || ""),
      shareMode: String(promptRow.shareMode || "private"),
      shareWith: parseShareWith(promptRow.shareWith),
      author: String(promptRow.author || ""),
      createdAt: String(promptRow.createdAt || ""),
      updatedAt: String(promptRow.updatedAt || ""),
      createdBy: String(promptRow.createdBy || ""),
    };

    if (!promptsByWorkspaceId[prompt.workspaceId]) {
      promptsByWorkspaceId[prompt.workspaceId] = [];
    }
    promptsByWorkspaceId[prompt.workspaceId].push(prompt);
  });

  return workspaceRows.map((workspaceRow) => {
    const workspaceId = String(workspaceRow.id || "");
    return {
      id: workspaceId,
      name: String(workspaceRow.name || ""),
      description: workspaceRow.description ? String(workspaceRow.description) : "",
      author: String(workspaceRow.author || ""),
      createdAt: String(workspaceRow.createdAt || ""),
      updatedAt: String(workspaceRow.updatedAt || ""),
      updatedBy: String(workspaceRow.updatedBy || ""),
      shareMode: String(workspaceRow.shareMode || "private"),
      shareWith: parseShareWith(workspaceRow.shareWith),
      prompts: promptsByWorkspaceId[workspaceId] || [],
    };
  });
}

function writePromptRows(promptSheet, promptRows) {
  const maxRows = promptSheet.getMaxRows();
  if (maxRows > 1) {
    promptSheet.getRange(2, 1, maxRows - 1, PROMPT_HEADERS.length).clearContent();
  }

  if (!promptRows.length) {
    return;
  }

  promptSheet
    .getRange(2, 1, promptRows.length, PROMPT_HEADERS.length)
    .setValues(promptRows);
}

function replacePromptsForWorkspace(promptSheet, workspaceId, prompts) {
  const currentPromptRows = readRows(promptSheet, PROMPT_HEADERS);
  const keepRows = currentPromptRows.filter(
    (row) => String(row.workspaceId || "") !== workspaceId,
  );

  const newRows = prompts.map((prompt) => {
    const now = new Date().toISOString();
    return [
      String(prompt.id || Utilities.getUuid()),
      workspaceId,
      String(prompt.name || ""),
      prompt.description ? String(prompt.description) : "",
      String(prompt.content || ""),
      String(prompt.shareMode || "private"),
      stringifyShareWith(prompt.shareWith),
      String(prompt.author || ""),
      String(prompt.createdAt || now),
      String(prompt.updatedAt || now),
      String(prompt.createdBy || prompt.author || ""),
    ];
  });

  const allRows = keepRows
    .map((row) => [
      String(row.id || ""),
      String(row.workspaceId || ""),
      String(row.name || ""),
      row.description ? String(row.description) : "",
      String(row.content || ""),
      String(row.shareMode || "private"),
      String(row.shareWith || "[]"),
      String(row.author || ""),
      String(row.createdAt || ""),
      String(row.updatedAt || ""),
      String(row.createdBy || ""),
    ])
    .concat(newRows);

  writePromptRows(promptSheet, allRows);
}

function invalidateWorkspaceCache() {
  CacheService.getScriptCache().remove(WORKSPACES_CACHE_KEY);
}

GasServer.describle("get-workspaces", (_payload) => {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(WORKSPACES_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached);
  }

  const { workspaceSheet, promptSheet } = ensureSheets();
  const workspaceRows = readRows(workspaceSheet, WORKSPACE_HEADERS);
  const promptRows = readRows(promptSheet, PROMPT_HEADERS);
  const workspaces = buildWorkspaceResponse(workspaceRows, promptRows);

  cache.put(
    WORKSPACES_CACHE_KEY,
    JSON.stringify(workspaces),
    WORKSPACES_CACHE_TTL_SECONDS
  );

  return workspaces;
});

GasServer.describle("create-workspace", (payload) => {
  if (!payload || !payload.id || !payload.name) {
    throw new Error("Invalid payload for create-workspace");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const { workspaceSheet, promptSheet } = ensureSheets();
    const workspaceRows = readRows(workspaceSheet, WORKSPACE_HEADERS);
    const workspaceId = String(payload.id);

    const exists = workspaceRows.some((row) => String(row.id || "") === workspaceId);
    if (exists) {
      throw new Error("Workspace already exists");
    }

    const now = new Date().toISOString();
    workspaceSheet.appendRow([
      workspaceId,
      String(payload.name || ""),
      payload.description ? String(payload.description) : "",
      String(payload.author || ""),
      String(payload.createdAt || now),
      String(payload.updatedAt || now),
      String(payload.updatedBy || payload.author || ""),
      String(payload.shareMode || "private"),
      stringifyShareWith(payload.shareWith),
    ]);

    if (Array.isArray(payload.prompts) && payload.prompts.length) {
      replacePromptsForWorkspace(promptSheet, workspaceId, payload.prompts);
    }

    invalidateWorkspaceCache();
  } finally {
    lock.releaseLock();
  }

  return { success: true };
});

GasServer.describle("update-workspace", (payload) => {
  if (!payload || !payload.id) {
    throw new Error("Invalid payload for update-workspace");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const { workspaceSheet, promptSheet } = ensureSheets();
    const workspaceRows = readRows(workspaceSheet, WORKSPACE_HEADERS);
    const workspaceId = String(payload.id);

    const rowIndex = workspaceRows.findIndex(
      (row) => String(row.id || "") === workspaceId,
    );
    if (rowIndex < 0) {
      throw new Error("Workspace not found");
    }

    const current = workspaceRows[rowIndex];
    const merged = {
      ...current,
      ...payload,
      id: workspaceId,
      updatedAt: payload.updatedAt || new Date().toISOString(),
    };

    workspaceSheet
      .getRange(rowIndex + 2, 1, 1, WORKSPACE_HEADERS.length)
      .setValues([
        [
          String(merged.id || ""),
          String(merged.name || ""),
          merged.description ? String(merged.description) : "",
          String(merged.author || ""),
          String(merged.createdAt || ""),
          String(merged.updatedAt || ""),
          String(merged.updatedBy || ""),
          String(merged.shareMode || "private"),
          stringifyShareWith(merged.shareWith),
        ],
      ]);

    if (Array.isArray(payload.prompts)) {
      replacePromptsForWorkspace(promptSheet, workspaceId, payload.prompts);
    }

    invalidateWorkspaceCache();
  } finally {
    lock.releaseLock();
  }

  return { success: true };
});

GasServer.describle("delete-workspace", (payload) => {
  const workspaceId = getWorkspaceIdFromPayload(payload);
  if (!workspaceId) {
    throw new Error("Invalid payload for delete-workspace");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const { workspaceSheet, promptSheet } = ensureSheets();
    const workspaceRows = readRows(workspaceSheet, WORKSPACE_HEADERS);
    const promptRows = readRows(promptSheet, PROMPT_HEADERS);

    const nextWorkspaceRows = workspaceRows
      .filter((row) => String(row.id || "") !== workspaceId)
      .map((row) => [
        String(row.id || ""),
        String(row.name || ""),
        row.description ? String(row.description) : "",
        String(row.author || ""),
        String(row.createdAt || ""),
        String(row.updatedAt || ""),
        String(row.updatedBy || ""),
        String(row.shareMode || "private"),
        String(row.shareWith || "[]"),
      ]);

    const workspaceMaxRows = workspaceSheet.getMaxRows();
    if (workspaceMaxRows > 1) {
      workspaceSheet
        .getRange(2, 1, workspaceMaxRows - 1, WORKSPACE_HEADERS.length)
        .clearContent();
    }
    if (nextWorkspaceRows.length) {
      workspaceSheet
        .getRange(2, 1, nextWorkspaceRows.length, WORKSPACE_HEADERS.length)
        .setValues(nextWorkspaceRows);
    }

    const nextPromptRows = promptRows
      .filter((row) => String(row.workspaceId || "") !== workspaceId)
      .map((row) => [
        String(row.id || ""),
        String(row.workspaceId || ""),
        String(row.name || ""),
        row.description ? String(row.description) : "",
        String(row.content || ""),
        String(row.shareMode || "private"),
        String(row.shareWith || "[]"),
        String(row.author || ""),
        String(row.createdAt || ""),
        String(row.updatedAt || ""),
        String(row.createdBy || ""),
      ]);
    writePromptRows(promptSheet, nextPromptRows);

    invalidateWorkspaceCache();
  } finally {
    lock.releaseLock();
  }

  return { success: true };
});
