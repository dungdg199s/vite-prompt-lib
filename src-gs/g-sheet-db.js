const WORKSPACES_FOLDER_ID = process.env.WORKSPACES_FOLDER_ID;
const WORKSPACES_SPREADSHEET_NAME = process.env.WORKSPACES_SPREADSHEET_NAME;
const WORKSPACES_SPREADSHEET_ID_KEY = "workspaces:spreadsheet:id";

export class SheetDb {
  connect(dbName) {
    const spreadsheetKey = `${WORKSPACES_SPREADSHEET_ID_KEY}:${dbName}`;
    const properties = PropertiesService.getScriptProperties();
    const spreadsheetId = properties.getProperty(spreadsheetKey);

    if (spreadsheetId) {
      try {
        this.preadsheet = SpreadsheetApp.openById(spreadsheetId);
        return this;
      } catch (error) {
        const folder = DriveApp.getFolderById(WORKSPACES_FOLDER_ID);
        const existingFiles = folder.getFilesByType(MimeType.GOOGLE_SHEETS);
        if (existingFiles.hasNext()) {
          const file = existingFiles.next();
          const existingSpreadsheetId = file.getId();
          properties.setProperty(spreadsheetKey, existingSpreadsheetId);
          this.preadsheet = SpreadsheetApp.openById(existingSpreadsheetId);
          return this;
        }

        const spreadsheet = SpreadsheetApp.create(dbName);
        const spreadsheetFile = DriveApp.getFileById(spreadsheet.getId());
        folder.addFile(spreadsheetFile);

        properties.setProperty(spreadsheetKey, spreadsheet.getId());
        this.preadsheet = spreadsheet;
        return this;
      }
    }
  }

  table(name) {
    const sheet =
      this.preadsheet.getSheetByName(name) || this.preadsheet.insertSheet(name);
    return new SheetTable(name, sheet);
  }
}

class SheetTable {
  constructor(name, worksheet) {
    this.name = name;
    this.worksheet = worksheet;
  }

  getAll(options = { enforceSharing: true }) {
    const lastRow = this.worksheet.getLastRow();
    const lastColumn = this.worksheet.getLastColumn();
    if (lastRow <= 1) {
      return [];
    }

    // columns:
    // A: name
    // B: data (JSON stringified)
    const values = this.worksheet
      .getRange(2, 1, lastRow - 1, lastColumn)
      .getValues();

    let records = values.map((row, idx) => {
      const record = {};
      record.__rowIndex = idx + 2;
      record.name = String(row[0] || "");
      const data = row[1] ? JSON.parse(row[1]) : {};
      Object.assign(record, data);
      return record;
    });

    if (options.enforceSharing) {
      const effectiveUser = Session.getEffectiveUser().getEmail();
      records = records.filter(
        (record) =>
          record.shareMode === "public" ||
          record.author === effectiveUser ||
          (record.shareMode === "shared" &&
            Array.isArray(record.shareWith) &&
            record.shareWith.includes(effectiveUser)),
      );
    }

    if (options.filter) {
      records = records.filter(options.filter);
    }

    if (options.sortBy) {
      records = records.sort((a, b) => {
        const aValue = a[options.sortBy];
        const bValue = b[options.sortBy];
        if (aValue < bValue) {
          return options.sortOrder === "desc" ? 1 : -1;
        }
        if (aValue > bValue) {
          return options.sortOrder === "desc" ? -1 : 1;
        }
        return 0;
      });
    }

    if (options.limit) {
      records = records.slice(0, options.limit);
    }

    if (options.offset) {
      records = records.slice(options.offset);
    }

    if (options.fields) {
      records = records.map((record) => {
        const filteredRecord = {};
        options.fields.forEach((field) => {
          filteredRecord[field] = record[field];
        });
        return filteredRecord;
      });
    }

    return records;
  }

  getByName(name) {
    const all = this.getAll();
    return all.find((row) => String(row.name || "") === String(name));
  }

  create(record) {
    const { name, ...data } = record;

    const sysDate = new Date().toISOString();
    const sysUser = Session.getEffectiveUser().getEmail();

    data.createdAt = sysDate;
    data.createdBy = sysUser;

    data.updatedAt = sysDate;
    data.updatedBy = sysUser;

    data.owner = sysUser;

    const newRow = [name, JSON.stringify(data)];
    this.worksheet.appendRow(newRow);
  }

  update(record) {
    const { name, ...data } = record;

    const sysDate = new Date().toISOString();
    const sysUser = Session.getEffectiveUser().getEmail();

    data.updatedBy = sysUser;
    data.updatedAt = sysDate;

    // update a row by name in the sheet
    const row = this.getByName(name);
    if (!row) {
      return false;
    }

    this.worksheet
      .getRange(row.__rowIndex, 1, 1, 2)
      .setValues([[name, JSON.stringify(data)]]);
    return true;
  }

  delete(record) {
    const name = record.name || record;
    // delete a row by name from the sheet
    const row = this.getByName(name);
    if (!row) {
      return false;
    }
    this.worksheet.deleteRow(row.__rowIndex);
    return true;
  }
}

export const sheetDb = new SheetDb(WORKSPACES_SPREADSHEET_NAME).connect();
