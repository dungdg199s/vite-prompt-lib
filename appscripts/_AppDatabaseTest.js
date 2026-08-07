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
  const table = _openTestTable("workspaces-test", ["name", "description", "members"], ["members"]);

  const created = table.create({
    name: "Test Workspace",
    description: "A workspace for testing",
    members: [{ email: "owner@example.com", role: "owner" }],
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

  const before = table.findAll({ allowDeleted: false });
  const created = table.create({ name: "fresh record" });
  const after = table.findAll({ allowDeleted: false });

  if (after.length !== before.length + 1 || !after.some((record) => record.id === created.id)) {
    throw new Error("testCacheInvalidation FAILED: new record not visible immediately after create");
  }

  Logger.log("testCacheInvalidation: OK");
}

/** Pure permission-matrix checks against AccessControl — no DB/Session calls involved. */
function testAccessControlRoles() {
  const workspace = {
    id: "ws-1",
    members: [
      { email: "owner@example.com", role: "owner" },
      { email: "manager@example.com", role: "manager" },
      { email: "member@example.com", role: "member" },
    ],
  };

  const draftByMember = { owner: "member@example.com", status: "draft" };
  const draftByOther = { owner: "owner@example.com", status: "draft" };
  const publishedByOther = { owner: "owner@example.com", status: "publish" };

  const checks = [
    [AccessControl.canViewWorkspace(workspace, "owner@example.com"), true, "owner can view workspace"],
    [AccessControl.canViewWorkspace(workspace, "stranger@example.com"), false, "non-member cannot view workspace"],
    [AccessControl.canDeleteWorkspace(workspace, "manager@example.com"), false, "manager cannot delete workspace"],
    [AccessControl.canDeleteWorkspace(workspace, "owner@example.com"), true, "owner can delete workspace"],
    [AccessControl.canManageMembers(workspace, "manager@example.com"), true, "manager can manage members"],
    [AccessControl.canManageMembers(workspace, "member@example.com"), false, "plain member cannot manage members"],
    [AccessControl.canViewRecord(workspace, draftByMember, "member@example.com"), true, "member sees own draft"],
    [
      AccessControl.canViewRecord(workspace, draftByOther, "member@example.com"),
      false,
      "member cannot see someone else's draft",
    ],
    [
      AccessControl.canViewRecord(workspace, publishedByOther, "member@example.com"),
      true,
      "member sees someone else's published record",
    ],
    [
      AccessControl.canEditRecord(workspace, publishedByOther, "member@example.com"),
      false,
      "member cannot edit a record they don't own",
    ],
    [
      AccessControl.canEditRecord(workspace, publishedByOther, "manager@example.com"),
      true,
      "manager can edit any record",
    ],
    [
      AccessControl.canViewWorkspace(workspace, "stranger@example.com") === false &&
        AccessControl.canViewRecord(workspace, publishedByOther, "stranger@example.com") === false,
      true,
      "a non-member sees nothing, even published records",
    ],
  ];

  checks.forEach(([actual, expected, label]) => {
    if (actual !== expected) {
      throw new Error(`testAccessControlRoles FAILED: ${label} (got ${actual}, expected ${expected})`);
    }
  });

  Logger.log("testAccessControlRoles: OK");
}

/**
 * Core draft/publish contract: a non-editing viewer sees nothing before the first publish, sees
 * exactly the published snapshot afterwards, and keeps seeing that snapshot (not further draft
 * edits) until the record is published again — while an editor always sees the live draft.
 */
function testPublishAndResolveViewerRecord() {
  const table = _openTestTable("prompt-publish-test", [
    "workspace",
    "content",
    "status",
    "publishedVersionId",
    "publishedAt",
    "publishedBy",
  ]);
  const versionsTable = _openTestTable("prompt-publish-versions-test", [
    "promptId",
    "workspace",
    "versionNumber",
    "name",
    "description",
    "content",
    "publishedAt",
    "publishedBy",
  ]);

  const created = table.create({
    workspace: "ws-test",
    content: "draft content v1",
    status: "draft",
    publishedVersionId: null,
  });

  const beforePublish = ContentLifecycle.resolveViewerRecord(created, versionsTable, ["content"], false);
  if (beforePublish !== null) {
    throw new Error("testPublishAndResolveViewerRecord FAILED: draft record should not be visible to a non-editor");
  }

  const version1 = ContentLifecycle.publish(versionsTable, created, "promptId", ["content"], "owner@example.com");
  if (version1.versionNumber !== 1) {
    throw new Error("testPublishAndResolveViewerRecord FAILED: first version should be numbered 1");
  }

  const published = table.update({
    id: created.id,
    status: "publish",
    publishedVersionId: version1.id,
    publishedAt: version1.publishedAt,
    publishedBy: version1.publishedBy,
  });

  const viewerSeesV1 = ContentLifecycle.resolveViewerRecord(published, versionsTable, ["content"], false);
  if (!viewerSeesV1 || viewerSeesV1.content !== "draft content v1") {
    throw new Error("testPublishAndResolveViewerRecord FAILED: viewer did not see the published version content");
  }

  const editedDraft = table.update({ id: created.id, content: "draft content v2 (unpublished)" });
  const viewerStillSeesV1 = ContentLifecycle.resolveViewerRecord(editedDraft, versionsTable, ["content"], false);
  if (!viewerStillSeesV1 || viewerStillSeesV1.content !== "draft content v1") {
    throw new Error(
      "testPublishAndResolveViewerRecord FAILED: viewer should still see the old published content, not the new draft"
    );
  }

  const editorView = ContentLifecycle.resolveViewerRecord(editedDraft, versionsTable, ["content"], true);
  if (editorView.content !== "draft content v2 (unpublished)") {
    throw new Error("testPublishAndResolveViewerRecord FAILED: editor should see the live draft content");
  }

  const version2 = ContentLifecycle.publish(versionsTable, editedDraft, "promptId", ["content"], "owner@example.com");
  if (version2.versionNumber !== 2) {
    throw new Error("testPublishAndResolveViewerRecord FAILED: version number did not increment");
  }

  Logger.log("testPublishAndResolveViewerRecord: OK");
}
