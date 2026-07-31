const AppDatabase = (function () {
  const BLOB_REF_PREFIX = "@@BLOBREF@@:";
  const BLOB_REF_KEY = "__appdb_blob_ref__";

  /**
   * @param {*} value
   * @returns {boolean} true if `value` is a decoded placeholder for content offloaded to Drive.
   */
  function _isBlobRef(value) {
    return value !== null && typeof value === "object" && value[BLOB_REF_KEY] === true;
  }

  /**
   * Encodes a field value for storage in a single Sheets cell. Objects/arrays (or fields
   * explicitly marked `structured`) are JSON-serialized; anything that ends up longer than
   * BlobStore's inline threshold is written to Drive instead, and the cell holds a short
   * reference (prefixed so it is unambiguous against arbitrary user text) rather than the
   * content itself.
   * @param {*} value
   * @param {boolean} structured
   * @param {{table: string, field: string, recordId?: string, existingRef?: {fileId: string}}} [ctx]
   * @returns {*} the value to write into the cell
   */
  function _encodeCellValue(value, structured, ctx) {
    if (_isBlobRef(value)) {
      // Value is already a resolved-later placeholder (e.g. an unchanged field carried
      // through an update that only touched other columns) — re-emit the same reference
      // without touching Drive.
      return BLOB_REF_PREFIX + JSON.stringify({ fileId: value.fileId, size: value.size });
    }

    if (value === undefined || value === null) {
      return structured ? "null" : "";
    }

    if (!structured && typeof value !== "string" && typeof value !== "object") {
      return value; // number/boolean/Date — Sheets stores these natively
    }

    const serialized = !structured && typeof value === "string" ? value : JSON.stringify(value);

    if (!BlobStore.shouldOffload(serialized)) {
      return serialized;
    }

    const existingFileId = ctx && ctx.existingRef && ctx.existingRef.fileId;
    const name = ctx && `${ctx.table}__${ctx.field}__${ctx.recordId || "new"}.blob`;
    const { fileId, size } = BlobStore.put(serialized, { existingFileId, name });

    return BLOB_REF_PREFIX + JSON.stringify({ fileId, size });
  }

  /**
   * Decodes a raw Sheets cell value back into the field's logical value. Blob references are
   * returned as an unresolved placeholder (`_isBlobRef(...)` true) — callers that need the real
   * content must resolve it explicitly (see `SheetTable.prototype._resolveBlobRefs`).
   * @param {*} raw
   * @param {boolean} structured
   * @returns {*}
   */
  function _decodeCellValue(raw, structured) {
    if (raw === "" || raw === undefined || raw === null) {
      return structured ? undefined : raw;
    }

    if (typeof raw === "string" && raw.indexOf(BLOB_REF_PREFIX) === 0) {
      try {
        const ref = JSON.parse(raw.slice(BLOB_REF_PREFIX.length));
        return { [BLOB_REF_KEY]: true, fileId: ref.fileId, size: ref.size, structured };
      } catch (_error) {
        return raw; // corrupted reference — surface the raw string rather than throwing
      }
    }

    if (structured) {
      if (typeof raw !== "string") {
        return raw; // already a native type (legacy cell written before this codec existed)
      }
      try {
        return JSON.parse(raw);
      } catch (_error) {
        return raw; // legacy/corrupted JSON — surface as-is rather than throwing
      }
    }

    return raw;
  }

  const errors = {
    conflict: (table, id, details) =>
      new Error(
        `CONFLICT::${JSON.stringify({
          code: "CONFLICT",
          table,
          id,
          message: "Record was modified by someone else",
          ...details,
        })}`
      ),
    notFound: (table, id) =>
      new Error(
        `NOT_FOUND::${JSON.stringify({ code: "NOT_FOUND", table, id, message: `Record "${id}" not found in ${table}` })}`
      ),
    locked: (table) =>
      new Error(`LOCKED::${JSON.stringify({ code: "LOCKED", table, message: "System is busy, please retry" })}`),
  };

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

    /**
     * @param {string} name
     * @param {{structuredFields?: string[]}} [options] - field names whose value is an object/array
     *   and must always be JSON-encoded (as opposed to plain string fields, which are only
     *   JSON-encoded if/when they get offloaded to a blob).
     */
    table(name, options = {}) {
      let sheet = this.spreadsheet.getSheetByName(name);
      if (!sheet) {
        sheet = this.spreadsheet.insertSheet(name);
        // Add header row
        sheet.appendRow(["id", "isDeleted", "data"]);
      }
      return new SheetTable(name, sheet, options);
    }
  }

  class SheetTable {
    constructor(name, worksheet, options = {}) {
      this.name = name;
      this.worksheet = worksheet;
      this.structuredFields = new Set(options.structuredFields || []);

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

    /** Reads the sheet range as-is (raw cell values, undecoded), tagged with each row's row index. */
    _readRawRows() {
      if (this.lastRow - this.headerRow <= 0) {
        return [];
      }

      return this.worksheet
        .getRange(this.headerRow + 1, 1, this.lastRow - this.headerRow, this.lastColumn)
        .getValues()
        .map((row, i) => {
          const datum = {};
          datum.rI = i + this.headerRow + 1;
          Object.keys(this.dict).forEach((key) => {
            datum[key] = row[this.dict[key] - 1];
          });
          return datum;
        });
    }

    /** Cached variant of `_readRawRows`, used by the public (read-only) query methods. */
    _readRawRowsCached() {
      const cache = CacheService.getScriptCache();
      const cacheKey = this._cacheKey();
      const cached = cache.get(cacheKey);

      if (cached !== null) {
        try {
          return JSON.parse(cached);
        } catch (_error) {
          // corrupted cache entry — fall through to a fresh read
        }
      }

      const rows = this._readRawRows();

      try {
        cache.put(cacheKey, JSON.stringify(rows), 300);
      } catch (_error) {
        // payload too large for CacheService (100KB/key) or cache unavailable — safe to skip caching
      }

      return rows;
    }

    _decodeRow(rawRow) {
      const decoded = { rI: rawRow.rI };
      Object.keys(this.dict).forEach((key) => {
        decoded[key] = _decodeCellValue(rawRow[key], this.structuredFields.has(key));
      });
      return decoded;
    }

    /** Uncached, always-fresh read+decode. Used by write paths, which need accurate row indexes. */
    _findAll() {
      this.all = this._readRawRows().map((row) => this._decodeRow(row));
      return this.all;
    }

    /** Cached read+decode. Used by the public query methods (findAll/find/findById). */
    _findAllCached() {
      return this._readRawRowsCached().map((row) => this._decodeRow(row));
    }

    _filterByConditions(records, conditions = {}) {
      return Object.keys(conditions).reduce(
        (list, key) => list.filter((item) => item[key] === conditions[key]),
        records
      );
    }

    _find(conditions = {}) {
      return this._filterByConditions(this._findAll(), conditions);
    }

    _pick(conditions = {}, index = 0) {
      return this._find(conditions)[index];
    }

    _encodeField(key, value, recordId, existingRef) {
      return _encodeCellValue(value, this.structuredFields.has(key), {
        table: this.name,
        field: key,
        recordId,
        existingRef,
      });
    }

    /**
     * Resolves any blob-ref placeholders on a decoded record into their real content.
     * @param {Object} record
     * @returns {Object}
     */
    _resolveBlobRefs(record) {
      if (!record) {
        return record;
      }

      const resolved = { ...record };

      Object.keys(resolved).forEach((key) => {
        if (_isBlobRef(resolved[key])) {
          const content = BlobStore.get(resolved[key].fileId);
          resolved[key] = resolved[key].structured ? JSON.parse(content) : content;
        }
      });

      return resolved;
    }

    /**
     * Writes `datum`'s fields into an existing row, leaving other columns untouched.
     * @param {number} rowIndex
     * @param {Object} datum
     * @param {string} [recordId]
     * @param {Object} [existingRecord] - the row's current decoded value, used so fields that
     *   already have a blob get overwritten in place instead of orphaning a new Drive file.
     */
    _writeRow(rowIndex, datum, recordId, existingRecord) {
      const range = this.worksheet.getRange(rowIndex, 1, 1, this.lastColumn);
      const values = range.getValues();

      Object.keys(datum).forEach((key) => {
        const col = this.dict[key];
        if (!col) {
          return;
        }

        const existingRef = existingRecord && _isBlobRef(existingRecord[key]) ? existingRecord[key] : undefined;
        values[0][col - 1] = this._encodeField(key, datum[key], recordId, existingRef);
      });

      range.setValues(values);
    }

    _insert(data) {
      if (Array.isArray(data)) {
        const startRow = this.worksheet.getLastRow() + 1;
        const l = data.length;
        const r = this.worksheet.getRange(startRow, 1, l, this.lastColumn);
        const v = r.getValues();
        data.forEach((datum, i) => {
          Object.keys(datum).forEach((k) => {
            const col = this.dict[k];
            if (!col) {
              return;
            }
            v[i][col - 1] = this._encodeField(k, datum[k], datum.id);
          });
        });
        r.setValues(v);
      } else {
        const startRow = this.worksheet.getLastRow() + 1;
        this._writeRow(startRow, data, data.id);
      }
      this.lastRow = this.worksheet.getLastRow();
    }

    _cacheKey() {
      return `sheetdb:v1:${this.name}:rows`;
    }

    _invalidateCache() {
      CacheService.getScriptCache().remove(this._cacheKey());
    }

    /** Serializes create/update/delete against this table across concurrent executions. */
    _withLock(fn) {
      const lock = LockService.getScriptLock();
      if (!lock.tryLock(10000)) {
        throw errors.locked(this.name);
      }
      try {
        return fn();
      } finally {
        lock.releaseLock();
      }
    }

    /**
     * Retrieves records from the sheet.
     * @param {FetchOptions} options
     * @returns {Array<Record<string, any>>}
     */
    findAll(options = { enforceSharing: true, allowDeleted: false }) {
      let records = this._findAllCached();

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

      records = records.map((record) => this._resolveBlobRefs(record));

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
      return this._filterByConditions(this._findAllCached(), conditions).map((record) => this._resolveBlobRefs(record));
    }

    findById(id) {
      const match = this._filterByConditions(this._findAllCached(), { id: String(id) })[0];
      return match ? this._resolveBlobRefs(match) : null;
    }

    create(record) {
      return this._withLock(() => {
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
        this._invalidateCache();

        return this._resolveBlobRefs(this._pick({ id: record.id }));
      });
    }

    /**
     * @param {Object} record - must include `id`. May include `expectedUpdatedAt` (the
     *   `updatedAt` value the caller last saw) to enable optimistic-concurrency checking;
     *   if provided and stale, the update is rejected with a CONFLICT error instead of
     *   silently overwriting someone else's change.
     */
    update(record) {
      const { id, expectedUpdatedAt, ...data } = record;

      return this._withLock(() => {
        const current = this._pick({ id });

        if (!current) {
          throw errors.notFound(this.name, id);
        }

        if (expectedUpdatedAt && current.updatedAt !== expectedUpdatedAt) {
          throw errors.conflict(this.name, id, {
            current: { updatedAt: current.updatedAt, updatedBy: current.updatedBy },
            expected: expectedUpdatedAt,
          });
        }

        const sysDate = new Date().toISOString();
        const sysUser = Session.getActiveUser().getEmail();
        const merged = { ...current, ...data, updatedAt: sysDate, updatedBy: sysUser };

        this._writeRow(current.rI, merged, id, current);
        this._invalidateCache();

        return this._resolveBlobRefs(this._pick({ id }));
      });
    }

    delete(conditions) {
      return this._withLock(() => {
        const matches = this._find(conditions);

        matches.forEach((record) => {
          Object.keys(record).forEach((key) => {
            if (_isBlobRef(record[key])) {
              BlobStore.remove(record[key].fileId);
            }
          });
          this._writeRow(record.rI, { isDeleted: true }, record.id);
        });

        if (matches.length > 0) {
          this._invalidateCache();
        }

        return matches.length > 0;
      });
    }
  }

  const db = new SheetDb().connect(Config.WORKSPACES_SPREADSHEET_NAME);

  return {
    Db: db,
    Workspaces: db.table("workspaces", { structuredFields: ["shareWith"] }),
    Prompts: db.table("prompts", { structuredFields: ["shareWith"] }),
    Documents: db.table("documents", { structuredFields: ["shareWith", "contentJSON", "syncOptions"] }),
    errors,
    isBlobRef: _isBlobRef,
  };
})();

/**
 * One-time migration: offloads any inline cell content that already exceeds the blob-offload
 * threshold into Drive, replacing the cell with a blob reference. Idempotent — records already
 * migrated (or still under the threshold) are left untouched. Run manually from the Apps Script
 * editor after backing up the spreadsheet (File > Version history, or Drive file copy).
 * @returns {Array<{table: string, id: string, fields: string[]}>}
 */
function migrateInlineContentToBlobs() {
  const targets = [
    { table: AppDatabase.Prompts, fields: ["content"] },
    { table: AppDatabase.Documents, fields: ["contentMarkdown", "contentJSON", "contentHTML"] },
  ];

  const report = [];

  targets.forEach(({ table, fields }) => {
    table._withLock(() => {
      const rows = table._findAll();

      rows.forEach((row) => {
        const updates = {};

        fields.forEach((field) => {
          const value = row[field];

          if (value === undefined || value === null || value === "" || AppDatabase.isBlobRef(value)) {
            return;
          }

          const structured = table.structuredFields.has(field);
          const serialized = structured || typeof value === "object" ? JSON.stringify(value) : String(value);

          if (!BlobStore.shouldOffload(serialized)) {
            return;
          }

          updates[field] = value;
        });

        if (Object.keys(updates).length > 0) {
          table._writeRow(row.rI, updates, row.id);
          report.push({ table: table.name, id: row.id, fields: Object.keys(updates) });
        }
      });

      table._invalidateCache();
    });
  });

  Logger.log(`migrateInlineContentToBlobs: migrated ${report.length} record(s)`);
  Logger.log(JSON.stringify(report, null, 2));

  return report;
}
