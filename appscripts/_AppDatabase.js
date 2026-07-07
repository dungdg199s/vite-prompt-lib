const AppDatabase = (function () {
  class SheetDb {
    /**
     * Connects to a Google Spreadsheet by name. If the spreadsheet does not exist, it will be created in the specified folder.
     * @param {string} dbName
     * @returns {SheetDb}
     */
    connect(dbName) {
      const spreadsheetKey = `${Config.WORKSPACES_SPREADSHEET_ID_KEY}:${dbName}`;
      const properties = PropertiesService.getScriptProperties();
      const spreadsheetId = properties.getProperty(spreadsheetKey);

      if (spreadsheetId) {
        this.spreadsheet = SpreadsheetApp.openById(spreadsheetId);
        return this;
      } else {
        const folder = DriveApp.getFolderById(Config.WORKSPACES_FOLDER_ID);
        const spreadsheet = SpreadsheetApp.create(dbName);
        const spreadsheetFile = DriveApp.getFileById(spreadsheet.getId());
        folder.addFile(spreadsheetFile);
        properties.setProperty(spreadsheetKey, spreadsheet.getId());
        this.spreadsheet = spreadsheet;
      }
      return this;
    }

    table(name) {
      let sheet = this.spreadsheet.getSheetByName(name);
      if (!sheet) {
        sheet = this.spreadsheet.insertSheet(name);
        // Add header row
        sheet.appendRow(["id", "isDeleted", "data"]);
      }
      return new SheetTable(name, sheet);
    }
  }

  class SheetTable {
    constructor(name, worksheet) {
      this.name = name;
      this.worksheet = worksheet;

      this.lastRow = this.worksheet.getLastRow();
      this.lastColumn = this.worksheet.getLastColumn();
      this.headerRow = 1;
    }

    set headerRow(rowNumber) {
      this._headerRow = rowNumber;
      this.dict = this._genDict();
    }

    get headerRow() {
      return this._headerRow || 1;
    }

    _genDict() {
      const map = {};
      if (this.lastColumn > 0) {
        this.worksheet
          .getRange(this.headerRow, 1, 1, this.lastColumn)
          .getValues()[0]
          .forEach((key, idx) => {
            map[key] = idx + 1;
          });
      }
      return map;
    }

    _findAll() {
      if (this.lastRow - this.headerRow > 0) {
        this.all = this.worksheet
          .getRange(this.headerRow + 1, 1, this.lastRow - this.headerRow, this.lastColumn)
          .getValues()
          .map((row, i) => {
            return ((dict) => {
              const datum = {};
              datum.rI = i + this.headerRow + 1;
              Object.keys(dict).forEach((key) => {
                datum[key] = row[dict[key] - 1];
              });
              return datum;
            })(this.dict);
          });
      } else {
        this.all = [];
      }
      return this.all;
    }

    _find(conditions = {}) {
      const flow =
        (funcs) =>
        (...args) =>
          funcs.reduce((prev, fnc) => [fnc(...prev)], args)[0];

      return flow(Object.keys(conditions).map((k) => (s) => s.filter((o) => o[k] === conditions[k])))(this._findAll());
    }

    _pick(conditions = {}, index = 0) {
      return this._find(conditions)[index];
    }

    _insert(data) {
      if (Array.isArray(data)) {
        const l = data.length;
        const r = this.worksheet.getRange(this.lastRow + 1, 1, l, this.lastColumn);
        const v = r.getValues();
        data.forEach((datum, i) => {
          Object.keys(datum).forEach((k) => {
            v[i][this.dict[k] - 1] = datum[k];
          });
        });
        r.setValues(v);
      } else {
        const r = this.worksheet.getRange(this.lastRow + 1, 1, 1, this.lastColumn);
        const v = r.getValues();
        Object.keys(data).forEach((k) => {
          v[0][this.dict[k] - 1] = data[k];
        });
        r.setValues(v);
      }
      this.lastRow = this.worksheet.getLastRow();
    }

    _upsert(data, conditions) {
      if (this._find(conditions).length > 0) {
        this._update(data, conditions);
      } else {
        this._insert(data);
      }
    }

    _update(data, conditions) {
      const flow =
        (funcs) =>
        (...args) =>
          funcs.reduce((prev, fnc) => [fnc(...prev)], args)[0];
      let updated = false;
      if (conditions) {
        flow(Object.keys(conditions).map((k) => (s) => s.filter((o) => o[k] === conditions[k])))(
          this._findAll()
        ).forEach((x) => {
          const r = this.worksheet.getRange(x.rI, 1, 1, this.lastColumn);
          const v = r.getValues();
          Object.keys(data).forEach((k) => {
            v[0][this.dict[k] - 1] = data[k];
          });
          r.setValues(v);
          updated = true;
        });
      }
      return updated;
    }

    /**
     * Retrieves all records from the sheet.
     * @param {FetchOptions} options
     * @returns {Array<Record<string, any>>}
     */
    findAll(options = { enforceSharing: true, allowDeleted: false }) {
      let records = this._findAll();

      if (!options.allowDeleted) {
        records = records.filter((r) => !r.isDeleted);
      }

      const currentUser = Session.getActiveUser().getEmail();

      if (options.enforceSharing && !Config.SYSTEM_ADMIN_EMAIL.includes(currentUser)) {
        const effectiveUser = currentUser;
        records = records.filter(
          (record) =>
            record.shareMode === "public" ||
            record.owner === effectiveUser ||
            (record.shareMode === "shared" &&
              Array.isArray(record.shareWith) &&
              record.shareWith.includes(effectiveUser))
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

    find(conditions = {}) {
      const all = this._find(conditions);
      return all;
    }

    findById(id) {
      const all = this._find({ id: String(id) });
      return all.length > 0 ? all[0] : null;
    }

    create(record) {
      const uuid = Utilities.getUuid();
      const sysDate = new Date().toISOString();
      const sysUser = Session.getActiveUser().getEmail();

      record.id = uuid;
      record.isDeleted = false;
      record.owner = sysUser;
      record.createdAt = sysDate;
      record.createdBy = sysUser;
      record.updatedAt = sysDate;
      record.updatedBy = sysUser;

      this._insert(record);
      return this.findById(record.id);
    }

    update(record) {
      const { id, ...data } = record;

      const sysDate = new Date().toISOString();
      const sysUser = Session.getActiveUser().getEmail();
      data.updatedBy = sysUser;
      data.updatedAt = sysDate;

      const row = this._find({ id: record.id })[0];

      if (!row) {
        throw new Error(`Record with id "${record.id}" not found`);
      }

      this._update({ ...row, ...data }, { id });

      return this.findById(record.id);
    }

    delete(conditions) {
      return this._update({ isDeleted: true }, conditions);
    }
  }

  const db = new SheetDb().connect(Config.WORKSPACES_SPREADSHEET_NAME);

  return {
    Db: db,
    Workspaces: db.table("workspaces"),
    Prompts: db.table("prompts"),
    Documents: db.table("documents"),
  };
})();
