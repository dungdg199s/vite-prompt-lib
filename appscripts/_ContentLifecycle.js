const ContentLifecycle = (function () {
  const STATUS = { DRAFT: "draft", PUBLISH: "publish" };

  /**
   * Snapshots `record`'s content fields into `versionsTable` as a new immutable version.
   * Does NOT mutate `record` itself — callers apply `status`/`publishedVersionId` afterwards.
   * @param {Object} versionsTable - a SheetTable (e.g. AppDatabase.PromptVersions)
   * @param {Object} record
   * @param {string} idField - "promptId" or "documentId"
   * @param {string[]} contentFields - fields to copy into the snapshot
   * @param {string} currentUserEmail
   * @returns {Object} the created version record
   */
  function publish(versionsTable, record, idField, contentFields, currentUserEmail) {
    const existingVersions = versionsTable.find({ [idField]: record.id });
    const versionNumber = existingVersions.length + 1;

    const snapshot = {
      [idField]: record.id,
      workspace: record.workspace,
      versionNumber,
      publishedAt: new Date().toISOString(),
      publishedBy: currentUserEmail,
    };

    contentFields.forEach((field) => {
      snapshot[field] = record[field];
    });

    return versionsTable.create(snapshot);
  }

  /**
   * Returns what a viewer without edit-all rights should see, or `null` if nothing is
   * legitimately visible to them (never-published, or a broken publishedVersionId pointer) —
   * callers should treat `null` as not-found / filter the record out of list responses.
   * @param {Object} record
   * @param {Object} versionsTable
   * @param {string[]} contentFields
   * @param {boolean} viewerCanEdit - AccessControl.canEditRecord(...) computed by the caller
   */
  function resolveViewerRecord(record, versionsTable, contentFields, viewerCanEdit) {
    if (viewerCanEdit) {
      return record;
    }

    if (record.status !== STATUS.PUBLISH || !record.publishedVersionId) {
      return null;
    }

    const version = versionsTable.findById(record.publishedVersionId);
    if (!version) {
      return null;
    }

    const view = { ...record };
    contentFields.forEach((field) => {
      view[field] = version[field];
    });
    view.viewingPublishedVersion = true;

    return view;
  }

  return { STATUS, publish, resolveViewerRecord };
})();
