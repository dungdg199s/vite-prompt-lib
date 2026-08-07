const PROMPT_CONTENT_FIELDS = ["name", "description", "content"];
const DOCUMENT_CONTENT_FIELDS = ["name", "fileName", "description", "contentMarkdown", "contentJSON", "contentHTML"];

function _currentUser() {
  return AccessControl.getCurrentUserEmail();
}

function _requireVisibleWorkspace(workspaceId, email) {
  const workspace = AppDatabase.Workspaces.findById(workspaceId);
  if (!workspace || !AccessControl.canViewWorkspace(workspace, email)) {
    throw AppDatabase.errors.notFound("workspaces", workspaceId);
  }
  return workspace;
}

/** Fetches a prompt/document plus its owning workspace, enforcing view visibility. */
function _requireVisibleRecord(table, tableName, recordId, email) {
  const record = table.findById(recordId);
  if (!record) {
    throw AppDatabase.errors.notFound(tableName, recordId);
  }
  const workspace = AppDatabase.Workspaces.findById(record.workspace);
  if (!workspace || !AccessControl.canViewRecord(workspace, record, email)) {
    throw AppDatabase.errors.notFound(tableName, recordId);
  }
  return { record, workspace };
}

function _assertWorkspaceHasOwner(members, workspaceId) {
  const hasOwner = members.some((member) => member.role === AccessControl.ROLES.OWNER);
  if (!hasOwner) {
    throw new Error(`Workspace "${workspaceId}" must have at least one owner`);
  }
}

function _visibleRecordsForWorkspace(table, versionsTable, workspaceId, workspace, contentFields, email) {
  return table
    .find({ workspace: workspaceId })
    .filter((record) => AccessControl.canViewRecord(workspace, record, email))
    .map((record) =>
      ContentLifecycle.resolveViewerRecord(
        record,
        versionsTable,
        contentFields,
        AccessControl.canEditRecord(workspace, record, email)
      )
    )
    .filter(Boolean);
}

const AppRouters = [
  {
    method: "GET",
    path: "/api/workspaces",
    handler: () => {
      const email = _currentUser();
      const workspaces = AppDatabase.Workspaces.findAll().filter((workspace) =>
        AccessControl.canViewWorkspace(workspace, email)
      );

      workspaces.forEach((workspace) => {
        workspace.prompts = _visibleRecordsForWorkspace(
          AppDatabase.Prompts,
          AppDatabase.PromptVersions,
          workspace.id,
          workspace,
          PROMPT_CONTENT_FIELDS,
          email
        );
        workspace.documents = _visibleRecordsForWorkspace(
          AppDatabase.Documents,
          AppDatabase.DocumentVersions,
          workspace.id,
          workspace,
          DOCUMENT_CONTENT_FIELDS,
          email
        );
      });

      return workspaces;
    },
  },
  {
    method: "GET",
    path: "/api/workspaces/:id",
    handler: ({ params }) => {
      const email = _currentUser();
      const workspace = _requireVisibleWorkspace(params.id, email);

      workspace.prompts = _visibleRecordsForWorkspace(
        AppDatabase.Prompts,
        AppDatabase.PromptVersions,
        workspace.id,
        workspace,
        PROMPT_CONTENT_FIELDS,
        email
      );
      workspace.documents = _visibleRecordsForWorkspace(
        AppDatabase.Documents,
        AppDatabase.DocumentVersions,
        workspace.id,
        workspace,
        DOCUMENT_CONTENT_FIELDS,
        email
      );

      return workspace;
    },
  },
  {
    method: "POST",
    path: "/api/workspaces",
    handler: ({ body }) => {
      if (!body?.name) {
        throw new Error("Invalid payload for create-workspace");
      }

      const email = _currentUser();
      const record = {
        name: String(body.name),
        description: String(body.description || ""),
        members: [{ email, role: AccessControl.ROLES.OWNER }],
      };

      return AppDatabase.Workspaces.create(record);
    },
  },
  {
    method: "PUT",
    path: "/api/workspaces/:id",
    handler: ({ body }) => {
      if (!body?.id) {
        throw new Error("Invalid payload for update-workspace");
      }

      const email = _currentUser();
      const workspace = _requireVisibleWorkspace(body.id, email);
      if (!AccessControl.canEditWorkspace(workspace, email)) {
        throw AccessControl.errors.forbidden("editWorkspace", { workspaceId: body.id });
      }

      workspace.expectedUpdatedAt = body.updatedAt;
      workspace.name = String(body.name || workspace.name);
      workspace.description = String(body.description || "");
      delete workspace.members; // members are only mutable via the members sub-resource

      return AppDatabase.Workspaces.update(workspace);
    },
  },
  {
    method: "DELETE",
    path: "/api/workspaces/:id",
    handler: ({ params }) => {
      const email = _currentUser();
      const workspace = _requireVisibleWorkspace(params.id, email);
      if (!AccessControl.canDeleteWorkspace(workspace, email)) {
        throw AccessControl.errors.forbidden("deleteWorkspace", { workspaceId: params.id });
      }

      AppDatabase.Workspaces.delete({ id: workspace.id });
      AppDatabase.Prompts.delete({ workspace: workspace.id });
      AppDatabase.Documents.delete({ workspace: workspace.id });
      AppDatabase.PromptVersions.delete({ workspace: workspace.id });
      AppDatabase.DocumentVersions.delete({ workspace: workspace.id });

      return true;
    },
  },
  {
    method: "GET",
    path: "/api/workspaces/:workspaceId/prompts",
    handler: ({ params }) => {
      const email = _currentUser();
      const workspace = _requireVisibleWorkspace(params.workspaceId, email);
      return _visibleRecordsForWorkspace(
        AppDatabase.Prompts,
        AppDatabase.PromptVersions,
        params.workspaceId,
        workspace,
        PROMPT_CONTENT_FIELDS,
        email
      );
    },
  },
  {
    method: "GET",
    path: "/api/workspaces/:workspaceId/documents",
    handler: ({ params }) => {
      const email = _currentUser();
      const workspace = _requireVisibleWorkspace(params.workspaceId, email);
      return _visibleRecordsForWorkspace(
        AppDatabase.Documents,
        AppDatabase.DocumentVersions,
        params.workspaceId,
        workspace,
        DOCUMENT_CONTENT_FIELDS,
        email
      );
    },
  },
  {
    method: "GET",
    path: "/api/workspaces/:workspaceId/members",
    handler: ({ params }) => {
      const email = _currentUser();
      const workspace = _requireVisibleWorkspace(params.workspaceId, email);
      return workspace.members || [];
    },
  },
  {
    method: "POST",
    path: "/api/workspaces/:workspaceId/members",
    handler: ({ params, body }) => {
      const email = _currentUser();
      const workspace = _requireVisibleWorkspace(params.workspaceId, email);
      if (!AccessControl.canManageMembers(workspace, email)) {
        throw AccessControl.errors.forbidden("manageMembers", { workspaceId: params.workspaceId });
      }
      if (!body?.email || !Object.values(AccessControl.ROLES).includes(body.role)) {
        throw new Error("Invalid payload for add-member");
      }

      const members = workspace.members || [];
      if (members.some((member) => member.email === body.email)) {
        throw new Error(`"${body.email}" is already a member of this workspace`);
      }

      const nextMembers = [...members, { email: String(body.email), role: body.role }];
      const updated = AppDatabase.Workspaces.update({ id: workspace.id, members: nextMembers });
      return updated.members;
    },
  },
  {
    method: "PUT",
    path: "/api/workspaces/:workspaceId/members/:email",
    handler: ({ params, body }) => {
      const email = _currentUser();
      const workspace = _requireVisibleWorkspace(params.workspaceId, email);
      if (!AccessControl.canManageMembers(workspace, email)) {
        throw AccessControl.errors.forbidden("manageMembers", { workspaceId: params.workspaceId });
      }
      if (!Object.values(AccessControl.ROLES).includes(body?.role)) {
        throw new Error("Invalid payload for update-member");
      }

      const members = workspace.members || [];
      if (!members.some((member) => member.email === params.email)) {
        throw AppDatabase.errors.notFound("workspace-members", params.email);
      }

      const nextMembers = members.map((member) =>
        member.email === params.email ? { ...member, role: body.role } : member
      );
      _assertWorkspaceHasOwner(nextMembers, workspace.id);

      const updated = AppDatabase.Workspaces.update({ id: workspace.id, members: nextMembers });
      return updated.members;
    },
  },
  {
    method: "DELETE",
    path: "/api/workspaces/:workspaceId/members/:email",
    handler: ({ params }) => {
      const email = _currentUser();
      const workspace = _requireVisibleWorkspace(params.workspaceId, email);
      if (!AccessControl.canManageMembers(workspace, email)) {
        throw AccessControl.errors.forbidden("manageMembers", { workspaceId: params.workspaceId });
      }

      const members = workspace.members || [];
      const nextMembers = members.filter((member) => member.email !== params.email);
      if (nextMembers.length === members.length) {
        throw AppDatabase.errors.notFound("workspace-members", params.email);
      }
      _assertWorkspaceHasOwner(nextMembers, workspace.id);

      const updated = AppDatabase.Workspaces.update({ id: workspace.id, members: nextMembers });
      return updated.members;
    },
  },
  {
    method: "GET",
    path: "/api/prompts/:id",
    handler: ({ params }) => {
      const email = _currentUser();
      const { record: prompt, workspace } = _requireVisibleRecord(AppDatabase.Prompts, "prompts", params.id, email);

      const view = ContentLifecycle.resolveViewerRecord(
        prompt,
        AppDatabase.PromptVersions,
        PROMPT_CONTENT_FIELDS,
        AccessControl.canEditRecord(workspace, prompt, email)
      );
      if (!view) {
        throw AppDatabase.errors.notFound("prompts", params.id);
      }
      return view;
    },
  },
  {
    method: "POST",
    path: "/api/prompts",
    handler: ({ body }) => {
      if (!body?.name) {
        throw new Error("Invalid payload for create-prompt");
      }
      if (!body?.workspace) {
        throw new Error("Workspace is required for prompt");
      }

      const email = _currentUser();
      const workspace = _requireVisibleWorkspace(body.workspace, email);
      if (!AccessControl.canCreateRecord(workspace, email)) {
        throw AccessControl.errors.forbidden("createRecord", { workspaceId: body.workspace });
      }

      const record = {
        name: String(body.name),
        workspace: String(body.workspace),
        description: String(body.description || ""),
        content: String(body.content || ""),
        status: ContentLifecycle.STATUS.DRAFT,
        publishedVersionId: null,
        publishedAt: null,
        publishedBy: null,
      };

      return AppDatabase.Prompts.create(record);
    },
  },
  {
    method: "PUT",
    path: "/api/prompts/:id",
    handler: ({ params, body }) => {
      if (!body?.name) {
        throw new Error("Invalid payload for update-prompt");
      }

      const email = _currentUser();
      const { record: prompt, workspace } = _requireVisibleRecord(AppDatabase.Prompts, "prompts", params.id, email);
      if (!AccessControl.canEditRecord(workspace, prompt, email)) {
        throw AccessControl.errors.forbidden("editRecord", { promptId: params.id });
      }

      prompt.expectedUpdatedAt = body.updatedAt;
      prompt.name = String(body.name || prompt.name);
      prompt.description = String(body.description || "");
      prompt.content = String(body.content || "");
      // Immutable via this route: workspace (changes access-control context) and
      // status/publishedVersionId/publishedAt/publishedBy (only the publish/unpublish routes touch these).
      delete prompt.workspace;
      delete prompt.status;
      delete prompt.publishedVersionId;
      delete prompt.publishedAt;
      delete prompt.publishedBy;

      return AppDatabase.Prompts.update(prompt);
    },
  },
  {
    method: "DELETE",
    path: "/api/prompts/:id",
    handler: ({ params }) => {
      const email = _currentUser();
      const { record: prompt, workspace } = _requireVisibleRecord(AppDatabase.Prompts, "prompts", params.id, email);
      if (!AccessControl.canDeleteRecord(workspace, prompt, email)) {
        throw AccessControl.errors.forbidden("deleteRecord", { promptId: params.id });
      }

      AppDatabase.Prompts.delete({ id: params.id });
      AppDatabase.PromptVersions.delete({ promptId: params.id });
      return true;
    },
  },
  {
    method: "POST",
    path: "/api/prompts/:id/publish",
    handler: ({ params }) => {
      const email = _currentUser();
      const { record: prompt, workspace } = _requireVisibleRecord(AppDatabase.Prompts, "prompts", params.id, email);
      if (!AccessControl.canPublishRecord(workspace, prompt, email)) {
        throw AccessControl.errors.forbidden("publishRecord", { promptId: params.id });
      }

      const version = ContentLifecycle.publish(
        AppDatabase.PromptVersions,
        prompt,
        "promptId",
        PROMPT_CONTENT_FIELDS,
        email
      );

      return AppDatabase.Prompts.update({
        id: prompt.id,
        status: ContentLifecycle.STATUS.PUBLISH,
        publishedVersionId: version.id,
        publishedAt: version.publishedAt,
        publishedBy: version.publishedBy,
      });
    },
  },
  {
    method: "POST",
    path: "/api/prompts/:id/unpublish",
    handler: ({ params }) => {
      const email = _currentUser();
      const { record: prompt, workspace } = _requireVisibleRecord(AppDatabase.Prompts, "prompts", params.id, email);
      if (!AccessControl.canPublishRecord(workspace, prompt, email)) {
        throw AccessControl.errors.forbidden("publishRecord", { promptId: params.id });
      }

      return AppDatabase.Prompts.update({ id: prompt.id, status: ContentLifecycle.STATUS.DRAFT });
    },
  },
  {
    method: "GET",
    path: "/api/prompts/:id/versions",
    handler: ({ params }) => {
      const email = _currentUser();
      const { record: prompt, workspace } = _requireVisibleRecord(AppDatabase.Prompts, "prompts", params.id, email);
      if (!AccessControl.canViewVersionHistory(workspace, prompt, email)) {
        throw AccessControl.errors.forbidden("viewVersionHistory", { promptId: params.id });
      }

      return AppDatabase.PromptVersions.find({ promptId: params.id }).sort((a, b) => b.versionNumber - a.versionNumber);
    },
  },
  {
    method: "GET",
    path: "/api/prompts/:id/versions/:versionId",
    handler: ({ params }) => {
      const email = _currentUser();
      const { record: prompt, workspace } = _requireVisibleRecord(AppDatabase.Prompts, "prompts", params.id, email);
      if (!AccessControl.canViewVersionHistory(workspace, prompt, email)) {
        throw AccessControl.errors.forbidden("viewVersionHistory", { promptId: params.id });
      }

      const version = AppDatabase.PromptVersions.findById(params.versionId);
      if (!version || version.promptId !== params.id) {
        throw AppDatabase.errors.notFound("prompt_versions", params.versionId);
      }
      return version;
    },
  },
  {
    method: "GET",
    path: "/api/documents",
    handler: () => {
      const email = _currentUser();
      const workspaceById = AppDatabase.Workspaces.findAll().reduce((acc, workspace) => {
        acc[workspace.id] = workspace;
        return acc;
      }, {});

      return AppDatabase.Documents.findAll()
        .filter((document) => {
          const workspace = workspaceById[document.workspace];
          return workspace && AccessControl.canViewRecord(workspace, document, email);
        })
        .map((document) => {
          const workspace = workspaceById[document.workspace];
          return ContentLifecycle.resolveViewerRecord(
            document,
            AppDatabase.DocumentVersions,
            DOCUMENT_CONTENT_FIELDS,
            AccessControl.canEditRecord(workspace, document, email)
          );
        })
        .filter(Boolean);
    },
  },
  {
    method: "GET",
    path: "/api/documents/:id",
    handler: ({ params }) => {
      const email = _currentUser();
      const { record: document, workspace } = _requireVisibleRecord(
        AppDatabase.Documents,
        "documents",
        params.id,
        email
      );

      const view = ContentLifecycle.resolveViewerRecord(
        document,
        AppDatabase.DocumentVersions,
        DOCUMENT_CONTENT_FIELDS,
        AccessControl.canEditRecord(workspace, document, email)
      );
      if (!view) {
        throw AppDatabase.errors.notFound("documents", params.id);
      }
      return view;
    },
  },
  {
    method: "GET",
    path: "/api/preasheet/:preasheetId",
    handler: ({ params }) => {
      // Unchanged/out of scope: still calls the nonexistent Documents.getAll() (pre-existing bug).
      const document = AppDatabase.Documents.getAll().find((doc) => doc.preasheetId === params.preasheetId);
      const sheets = document?.contentJSON?.sheets;
      const sheetNames = Array.isArray(sheets)
        ? sheets.map((sheet) => String(sheet?.name || "").trim()).filter(Boolean)
        : ["Overview", "Details"];

      return {
        preasheetId: String(params.preasheetId),
        preasheetName: document?.fileName || `preasheet-${params.preasheetId}`,
        sheetNames,
      };
    },
  },
  {
    method: "POST",
    path: "/api/documents",
    handler: ({ body }) => {
      if (!body?.name) {
        throw new Error("Invalid payload for create-document");
      }

      const type = body.type || "Spreadsheets";
      if (type === "Spreadsheets" && !body?.preasheetId) {
        throw new Error("Spreadsheet ID is required for Spreadsheets type");
      }

      const email = _currentUser();
      const workspace = _requireVisibleWorkspace(body.workspace, email);
      if (!AccessControl.canCreateRecord(workspace, email)) {
        throw AccessControl.errors.forbidden("createRecord", { workspaceId: body.workspace });
      }

      const record = {
        name: String(body.name),
        type,
        workspace: String(body.workspace || ""),
        fileName: String(body.fileName || ""),
        preasheetId: String(body.preasheetId || ""),
        description: String(body.description || ""),
        contentMarkdown: String(body.contentMarkdown || ""),
        contentJSON: body.contentJSON || null,
        contentHTML: String(body.contentHTML || ""),
        syncOptions: body.syncOptions || {
          includeEmptyRows: false,
          headerRow: 1,
          sheets: [],
        },
        status: ContentLifecycle.STATUS.DRAFT,
        publishedVersionId: null,
        publishedAt: null,
        publishedBy: null,
      };

      return AppDatabase.Documents.create(record);
    },
  },
  {
    method: "PUT",
    path: "/api/documents/:id",
    handler: ({ params, body }) => {
      if (!body?.name) {
        throw new Error("Invalid payload for update-document");
      }

      const type = body.type || "Spreadsheets";
      if (type === "Spreadsheets" && !body?.preasheetId) {
        throw new Error("Spreadsheet ID is required for Spreadsheets type");
      }

      const email = _currentUser();
      const { record: document, workspace } = _requireVisibleRecord(
        AppDatabase.Documents,
        "documents",
        params.id,
        email
      );
      if (!AccessControl.canEditRecord(workspace, document, email)) {
        throw AccessControl.errors.forbidden("editRecord", { documentId: params.id });
      }

      document.expectedUpdatedAt = body.updatedAt;
      document.type = type;
      document.fileName = String(body.fileName || "");
      document.preasheetId = String(body.preasheetId || "");
      document.description = String(body.description || "");
      document.contentMarkdown = String(body.contentMarkdown || "");
      document.contentJSON = body.contentJSON || null;
      document.contentHTML = String(body.contentHTML || "");
      document.syncOptions = body.syncOptions || {
        includeEmptyRows: false,
        headerRow: 1,
        sheets: [],
      };
      delete document.workspace;
      delete document.status;
      delete document.publishedVersionId;
      delete document.publishedAt;
      delete document.publishedBy;

      return AppDatabase.Documents.update(document);
    },
  },
  {
    method: "DELETE",
    path: "/api/documents/:id",
    handler: ({ params }) => {
      const email = _currentUser();
      const { record: document, workspace } = _requireVisibleRecord(
        AppDatabase.Documents,
        "documents",
        params.id,
        email
      );
      if (!AccessControl.canDeleteRecord(workspace, document, email)) {
        throw AccessControl.errors.forbidden("deleteRecord", { documentId: params.id });
      }

      AppDatabase.Documents.delete({ id: params.id });
      AppDatabase.DocumentVersions.delete({ documentId: params.id });
      return true;
    },
  },
  {
    method: "POST",
    path: "/api/documents/:id/sync",
    handler: ({ params, body }) => {
      // Sync logic itself stays mocked/unimplemented (out of scope) — this route previously had
      // NO permission check at all, so it gets the same guard as the other write routes.
      const email = _currentUser();
      const { record: document, workspace } = _requireVisibleRecord(
        AppDatabase.Documents,
        "documents",
        params.id,
        email
      );
      if (!AccessControl.canEditRecord(workspace, document, email)) {
        throw AccessControl.errors.forbidden("editRecord", { documentId: params.id });
      }

      if ((document.type || "Spreadsheets") !== "Spreadsheets") {
        throw new Error("Sync is only available for Spreadsheets documents");
      }

      const options = body || {};
      const sheetNames =
        Array.isArray(options.sheets) && options.sheets.length ? options.sheets : ["Overview", "Details"];

      document.syncOptions = {
        includeEmptyRows: options.includeEmptyRows !== false,
        headerRow: Number.isInteger(options.headerRow) ? options.headerRow : null,
        sheets: Array.isArray(options.sheets) ? options.sheets : [],
      };

      document.contentMarkdown = [
        `# ${document.fileName || document.name}`,
        "",
        ...sheetNames.map((sheetName) => `## ${sheetName}`),
      ].join("\n");

      document.contentJSON = {
        name: document.fileName || document.name,
        syncedAt: new Date().toISOString(),
        optionsApplied: {
          includeEmptyRows: document.syncOptions.includeEmptyRows,
          headerRow: document.syncOptions.headerRow,
          sheets: sheetNames,
        },
        sheets: sheetNames.map((sheetName) => ({
          name: sheetName,
          data: [
            {
              Example: "Mock synced data",
              HeaderRow: options.headerRow || 1,
            },
          ],
        })),
      };

      return document;
    },
  },
  {
    method: "POST",
    path: "/api/documents/:id/publish",
    handler: ({ params }) => {
      const email = _currentUser();
      const { record: document, workspace } = _requireVisibleRecord(
        AppDatabase.Documents,
        "documents",
        params.id,
        email
      );
      if (!AccessControl.canPublishRecord(workspace, document, email)) {
        throw AccessControl.errors.forbidden("publishRecord", { documentId: params.id });
      }

      const version = ContentLifecycle.publish(
        AppDatabase.DocumentVersions,
        document,
        "documentId",
        DOCUMENT_CONTENT_FIELDS,
        email
      );

      return AppDatabase.Documents.update({
        id: document.id,
        status: ContentLifecycle.STATUS.PUBLISH,
        publishedVersionId: version.id,
        publishedAt: version.publishedAt,
        publishedBy: version.publishedBy,
      });
    },
  },
  {
    method: "POST",
    path: "/api/documents/:id/unpublish",
    handler: ({ params }) => {
      const email = _currentUser();
      const { record: document, workspace } = _requireVisibleRecord(
        AppDatabase.Documents,
        "documents",
        params.id,
        email
      );
      if (!AccessControl.canPublishRecord(workspace, document, email)) {
        throw AccessControl.errors.forbidden("publishRecord", { documentId: params.id });
      }

      return AppDatabase.Documents.update({ id: document.id, status: ContentLifecycle.STATUS.DRAFT });
    },
  },
  {
    method: "GET",
    path: "/api/documents/:id/versions",
    handler: ({ params }) => {
      const email = _currentUser();
      const { record: document, workspace } = _requireVisibleRecord(
        AppDatabase.Documents,
        "documents",
        params.id,
        email
      );
      if (!AccessControl.canViewVersionHistory(workspace, document, email)) {
        throw AccessControl.errors.forbidden("viewVersionHistory", { documentId: params.id });
      }

      return AppDatabase.DocumentVersions.find({ documentId: params.id }).sort(
        (a, b) => b.versionNumber - a.versionNumber
      );
    },
  },
  {
    method: "GET",
    path: "/api/documents/:id/versions/:versionId",
    handler: ({ params }) => {
      const email = _currentUser();
      const { record: document, workspace } = _requireVisibleRecord(
        AppDatabase.Documents,
        "documents",
        params.id,
        email
      );
      if (!AccessControl.canViewVersionHistory(workspace, document, email)) {
        throw AccessControl.errors.forbidden("viewVersionHistory", { documentId: params.id });
      }

      const version = AppDatabase.DocumentVersions.findById(params.versionId);
      if (!version || version.documentId !== params.id) {
        throw AppDatabase.errors.notFound("document_versions", params.versionId);
      }
      return version;
    },
  },
];
