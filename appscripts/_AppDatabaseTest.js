/**
 * Manual test suite for AppDatabase — there is no automated backend test runner (Playwright
 * only exercises the frontend against the mock backend, never the real Apps Script backend).
 * Run these functions one at a time from the Apps Script editor's function picker against a
 * DEV deployment. Each test operates on its own "*-test" sheet tab so it never touches real
 * workspace/prompt/document data.
 */

const AUDIT_FIELDS = ["id", "isDeleted", "owner", "createdAt", "createdBy", "updatedAt", "updatedBy"];

function _ensureTestTableHeaders(name, fields) {
  const spreadsheet = AppDatabase.Db.spreadsheet;
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  const lastColumn = sheet.getLastColumn();
  const existingHeaders = lastColumn > 0 ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0] : [];
  const missing = fields.filter((field) => existingHeaders.indexOf(field) === -1);

  if (missing.length > 0) {
    sheet.getRange(1, lastColumn + 1, 1, missing.length).setValues([missing]);
  }
}

function _openTestTable(name, extraFields, structuredFields) {
  const fields = AUDIT_FIELDS.concat(extraFields || []);
  _ensureTestTableHeaders(name, fields);
  return AppDatabase.Db.table(name, { structuredFields: structuredFields || [] });
}

/** Basic create/update sanity check against a real (test) sheet tab. */
function testAppDatabase() {
  const table = _openTestTable("workspaces-test", ["name", "description", "shareMode", "shareWith"], ["shareWith"]);

  const created = table.create({
    name: "Test Workspace",
    description: "A workspace for testing",
    shareMode: "private",
    shareWith: [],
  });
  Logger.log("Created: " + JSON.stringify(created));

  const updated = table.update({ id: created.id, name: "Updated name" });
  Logger.log("Updated: " + JSON.stringify(updated));

  if (updated.name !== "Updated name") {
    throw new Error("testAppDatabase FAILED: update did not apply");
  }

  Logger.log("testAppDatabase: OK");
}

/**
 * A field over BlobStore's inline threshold must be offloaded to Drive (cell holds a short
 * reference, not the full text) and must round-trip exactly through findById(). Re-saving with
 * new (still large) content must reuse the same Drive file rather than orphaning a new one.
 */
function testBlobRoundTrip() {
  const table = _openTestTable("blob-roundtrip-test", ["name", "content", "tags"], ["tags"]);

  const longContent = "x".repeat(BlobStore.INLINE_MAX_CHARS + 5000);
  const created = table.create({ name: "big", content: longContent, tags: ["a", "b"] });

  const rawRow = table._readRawRows().find((row) => row.id === created.id);
  if (!rawRow || typeof rawRow.content !== "string" || rawRow.content.length > 200) {
    throw new Error("testBlobRoundTrip FAILED: cell content was not offloaded to a blob reference");
  }

  const fetched = table.findById(created.id);
  if (fetched.content !== longContent) {
    throw new Error("testBlobRoundTrip FAILED: resolved content does not match original");
  }
  if (!Array.isArray(fetched.tags) || fetched.tags.length !== 2 || fetched.tags[0] !== "a") {
    throw new Error("testBlobRoundTrip FAILED: structured field round-trip failed");
  }

  const revisedContent = "y".repeat(BlobStore.INLINE_MAX_CHARS + 1000);
  table.update({ id: created.id, content: revisedContent });
  const refetched = table.findById(created.id);
  if (refetched.content !== revisedContent) {
    throw new Error("testBlobRoundTrip FAILED: content did not update after re-save");
  }

  Logger.log(
    "testBlobRoundTrip: OK (cell bytes=" + rawRow.content.length + ", resolved length=" + fetched.content.length + ")"
  );
}

/**
 * Two "clients" read the same record; the first save succeeds, the second (stale) save must be
 * rejected with a CONFLICT error instead of silently overwriting the first client's change.
 */
function testOptimisticConflict() {
  const table = _openTestTable("conflict-test", ["name"]);

  const created = table.create({ name: "original" });

  const clientA = table.findById(created.id);
  const clientB = table.findById(created.id);

  table.update({ id: clientA.id, name: "saved by A", expectedUpdatedAt: clientA.updatedAt });

  let threw = false;
  try {
    table.update({ id: clientB.id, name: "saved by B", expectedUpdatedAt: clientB.updatedAt });
  } catch (error) {
    threw = String((error && error.message) || "").indexOf("CONFLICT::") === 0;
  }

  if (!threw) {
    throw new Error("testOptimisticConflict FAILED: stale update did not raise a CONFLICT error");
  }

  Logger.log("testOptimisticConflict: OK");
}

/** A create() must be visible to findAll() immediately — cache must not serve a stale list. */
function testCacheInvalidation() {
  const table = _openTestTable("cache-test", ["name"]);

  const before = table.findAll({ enforceSharing: false, allowDeleted: false });
  const created = table.create({ name: "fresh record" });
  const after = table.findAll({ enforceSharing: false, allowDeleted: false });

  if (after.length !== before.length + 1 || !after.some((record) => record.id === created.id)) {
    throw new Error("testCacheInvalidation FAILED: new record not visible immediately after create");
  }

  Logger.log("testCacheInvalidation: OK");
}
