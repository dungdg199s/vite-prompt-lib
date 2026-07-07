const AppRouters = [
  {
    method: "GET",
    path: "/api/workspaces",
    handler: () => {
      const workspaces = AppDatabase.Workspaces.findAll();
      const prompts = AppDatabase.Prompts.findAll();
      const documents = AppDatabase.Documents.findAll();

      workspaces.forEach((workspace) => {
        workspace.prompts = prompts.filter((prompt) => prompt.workspace === workspace.id);
        workspace.documents = documents.filter((document) => document.workspace === workspace.id);
      });
      return workspaces;
    },
  },
  {
    method: "GET",
    path: "/api/workspaces/:id",
    handler: ({ params }) => {
      const workspace = AppDatabase.Workspaces.findById(params.id);

      if (!workspace) {
        throw new Error(`Workspace "${params.id}" not found`);
      }

      workspace.prompts = AppDatabase.Prompts.find({ workspace: workspace.id });
      workspace.documents = AppDatabase.Documents.find({ workspace: workspace.id });

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

      const record = {
        name: String(body.name),
        description: String(body.description || ""),
        shareMode: body.shareMode || "private",
        shareWith: Array.isArray(body.shareWith) ? body.shareWith : [],
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

      const workspace = AppDatabase.Workspaces.findById(body.id);
      if (!workspace) {
        throw new Error(`Workspace "${body.id}" not found`);
      }
      workspace.name = String(body.name || workspace.name);
      workspace.description = String(body.description || "");
      workspace.shareMode = body.shareMode || "private";
      workspace.shareWith = Array.isArray(body.shareWith) ? body.shareWith : [];

      return AppDatabase.Workspaces.update(workspace);
    },
  },
  {
    method: "DELETE",
    path: "/api/workspaces/:id",
    handler: ({ params }) => {
      if (!params?.id) {
        throw new Error("Invalid payload for delete-workspace");
      }

      const workspace = AppDatabase.Workspaces.findById(params.id);
      if (!workspace) {
        throw new Error(`Workspace "${params.id}" not found`);
      }

      AppDatabase.Workspaces.delete({ id: workspace.id });
      AppDatabase.Prompts.delete({ workspace: workspace.id });
      AppDatabase.Documents.delete({ workspace: workspace.id });

      return true;
    },
  },
  {
    method: "GET",
    path: "/api/workspaces/:workspaceId/prompts",
    handler: ({ params }) => {
      const prompts = AppDatabase.Prompts.find({ workspace: params.workspaceId });
      return prompts;
    },
  },
  {
    method: "GET",
    path: "/api/workspaces/:workspaceId/documents",
    handler: ({ params }) => {
      const documents = AppDatabase.Documents.find({ workspace: params.workspaceId });
      return documents;
    },
  },
  {
    method: "GET",
    path: "/api/prompts/:id",
    handler: ({ params }) => {
      const prompt = AppDatabase.Prompts.findById(params.id);
      if (!prompt) {
        throw new Error(`Prompt "${params.id}" not found`);
      }
      return prompt;
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

      const record = {
        id: String(body.id || `prompt-${Date.now()}`),
        name: String(body.name),
        workspace: String(body.workspace || ""),
        description: String(body.description || ""),
        content: String(body.content || ""),
        shareMode: body.shareMode || "private",
        shareWith: Array.isArray(body.shareWith) ? body.shareWith : [],
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

      const prompt = AppDatabase.Prompts.findById(params.id);
      if (!prompt) {
        throw new Error(`Prompt "${params.id}" not found`);
      }

      prompt.name = String(body.name || prompt.name);
      prompt.workspace = String(body.workspace || prompt.workspace || "");
      prompt.description = String(body.description || "");
      prompt.content = String(body.content || "");
      prompt.shareMode = body.shareMode || "private";
      prompt.shareWith = Array.isArray(body.shareWith) ? body.shareWith : [];

      return AppDatabase.Prompts.update(prompt);
    },
  },
  {
    method: "DELETE",
    path: "/api/prompts/:id",
    handler: ({ params }) => {
      const prompt = AppDatabase.Prompts.findById(params.id);
      if (!prompt) {
        throw new Error(`Prompt "${params.id}" not found`);
      }

      AppDatabase.Prompts.delete({ id: params.id });
      return true;
    },
  },
  {
    method: "GET",
    path: "/api/documents",
    handler: () => AppDatabase.Documents.findAll(),
  },
  {
    method: "GET",
    path: "/api/documents/:id",
    handler: ({ params }) => {
      const document = AppDatabase.Documents.findById(params.id);
      if (!document) {
        throw new Error(`Document "${params.id}" not found`);
      }
      return document;
    },
  },
  {
    method: "GET",
    path: "/api/preasheet/:preasheetId",
    handler: ({ params }) => {
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
        shareMode: body.shareMode || "private",
        shareWith: Array.isArray(body.shareWith) ? body.shareWith : [],
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

      const document = AppDatabase.Documents.findById(params.id);
      if (!document) {
        throw new Error(`Document "${params.id}" not found`);
      }

      document.type = type;
      document.workspace = String(body.workspace || "");
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
      document.shareMode = body.shareMode || "private";
      document.shareWith = Array.isArray(body.shareWith) ? body.shareWith : [];

      return AppDatabase.Documents.update(document);
    },
  },
  {
    method: "DELETE",
    path: "/api/documents/:id",
    handler: ({ params }) => {
      const document = AppDatabase.Documents.findById(params.id);
      if (!document) {
        throw new Error(`Document "${params.id}" not found`);
      }
      AppDatabase.Documents.delete({ id: params.id });

      return true;
    },
  },
  {
    method: "POST",
    path: "/api/documents/:id/sync",
    handler: ({ params, body }) => {
      const document = AppDatabase.Documents.findById(params.id);
      if (!document) {
        throw new Error(`Document "${params.id}" not found`);
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
];
