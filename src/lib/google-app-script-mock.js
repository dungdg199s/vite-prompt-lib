const clone = (value) => JSON.parse(JSON.stringify(value));

const mockDb = {
  workspaces: [
    {
      name: "frontend-lab",
      description: "Workspace for UI prompt experiments",
      shareMode: "private",
      shareWith: [],
    },
    {
      name: "growth-team",
      description: "Marketing and growth prompt workspace",
      shareMode: "shared",
      shareWith: ["pm@example.com", "design@example.com"],
    },
  ],
  prompts: [
    {
      name: "Landing Hero Copy",
      workspace: "growth-team",
      description: "Generate hero section copy",
      content:
        "Write a hero headline in ${Language|options:English,Japan} for ${Product Name|text}. Tone: ${Tone|options:Bold,Friendly,Professional}",
    },
    {
      name: "Design Critic",
      workspace: "frontend-lab",
      description: "Review a design JSON and suggest improvements",
      content:
        "Analyze this design payload: ${Design JSON|textarea}. Reply in ${Language|options:English,Japan}",
    },
  ],
  documents: [
    {
      name: "growth-sheet-doc",
      workspace: "growth-team",
      fileName: "growth-kpis",
      preasheetId: "mock-sheet-id-001",
      description: "Weekly marketing KPI extract",
      contentMarkdown: "# growth-kpis\n\n## Overview\n\n| Metric | Value |\n| --- | --- |\n| CTR | 3.2% |",
      contentJSON: {
        name: "growth-kpis",
        sheets: [
          {
            name: "Overview",
            data: [{ Metric: "CTR", Value: "3.2%" }],
          },
        ],
      },
      syncOptions: {
        includeEmptyRows: false,
        headerRow: 1,
        sheets: [],
      },
      shareMode: "private",
      shareWith: [],
    },
  ],
};

const matchPath = (pattern, path) => {
  const patternSegments = String(pattern).split("/").filter(Boolean);
  const pathSegments = String(path).split("/").filter(Boolean);

  if (patternSegments.length !== pathSegments.length) {
    return null;
  }

  const params = {};

  for (let i = 0; i < patternSegments.length; i += 1) {
    const patternSegment = patternSegments[i];
    const pathSegment = pathSegments[i];

    if (patternSegment.startsWith(":")) {
      params[patternSegment.slice(1)] = decodeURIComponent(pathSegment);
      continue;
    }

    if (patternSegment !== pathSegment) {
      return null;
    }
  }

  return params;
};

const findWorkspaceByName = (name) => {
  return mockDb.workspaces.find((item) => item.name === String(name));
};

const findPromptByName = (name) => {
  return mockDb.prompts.find((item) => item.name === String(name));
};

const findDocumentByName = (name) => {
  return mockDb.documents.find((item) => item.name === String(name));
};

const findDocumentByPreasheetId = (preasheetId) => {
  return mockDb.documents.find(
    (item) => item.preasheetId === String(preasheetId),
  );
};

const routes = [
  {
    method: "GET",
    path: "/api/workspaces",
    handler: () => clone(mockDb.workspaces),
  },
  {
    method: "GET",
    path: "/api/workspaces/:name",
    handler: ({ params }) => {
      const workspace = findWorkspaceByName(params.name);

      if (!workspace) {
        throw new Error(`Workspace "${params.name}" not found`);
      }

      const prompts = mockDb.prompts.filter(
        (prompt) => prompt.workspace === workspace.name,
      );

      return clone({ ...workspace, prompts });
    },
  },
  {
    method: "POST",
    path: "/api/workspaces",
    handler: ({ body }) => {
      if (!body?.name) {
        throw new Error("Invalid payload for create-workspace");
      }

      if (findWorkspaceByName(body.name)) {
        throw new Error(`Workspace "${body.name}" already exists`);
      }

      const record = {
        name: String(body.name),
        description: String(body.description || ""),
        shareMode: body.shareMode || "private",
        shareWith: Array.isArray(body.shareWith) ? body.shareWith : [],
      };

      mockDb.workspaces.push(record);
      return { success: true };
    },
  },
  {
    method: "PUT",
    path: "/api/workspaces",
    handler: ({ body }) => {
      if (!body?.name) {
        throw new Error("Invalid payload for update-workspace");
      }

      const workspace = findWorkspaceByName(body.name);
      if (!workspace) {
        throw new Error(`Workspace "${body.name}" not found`);
      }

      workspace.description = String(body.description || "");
      workspace.shareMode = body.shareMode || "private";
      workspace.shareWith = Array.isArray(body.shareWith) ? body.shareWith : [];

      return { success: true };
    },
  },
  {
    method: "DELETE",
    path: "/api/workspaces/:name",
    handler: ({ params }) => {
      const previousLength = mockDb.workspaces.length;
      mockDb.workspaces = mockDb.workspaces.filter(
        (item) => item.name !== params.name,
      );

      if (mockDb.workspaces.length === previousLength) {
        throw new Error(`Workspace "${params.name}" not found`);
      }

      mockDb.prompts = mockDb.prompts.filter(
        (prompt) => prompt.workspace !== params.name,
      );

      return { success: true };
    },
  },
  {
    method: "GET",
    path: "/api/prompts",
    handler: () => clone(mockDb.prompts),
  },
  {
    method: "GET",
    path: "/api/prompts/:name",
    handler: ({ params }) => {
      const prompt = findPromptByName(params.name);
      if (!prompt) {
        throw new Error(`Prompt "${params.name}" not found`);
      }
      return clone(prompt);
    },
  },
  {
    method: "GET",
    path: "/api/documents",
    handler: () => clone(mockDb.documents),
  },
  {
    method: "GET",
    path: "/api/documents/:name",
    handler: ({ params }) => {
      const document = findDocumentByName(params.name);
      if (!document) {
        throw new Error(`Document "${params.name}" not found`);
      }
      return clone(document);
    },
  },
  {
    method: "GET",
    path: "/api/preasheet/:preasheetId",
    handler: ({ params }) => {
      const document = findDocumentByPreasheetId(params.preasheetId);
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
      if (!body?.name || !body?.preasheetId) {
        throw new Error("Invalid payload for create-document");
      }

      if (findDocumentByName(body.name)) {
        throw new Error(`Document "${body.name}" already exists`);
      }

      const record = {
        name: String(body.name),
        workspace: String(body.workspace || ""),
        fileName: String(body.fileName || ""),
        preasheetId: String(body.preasheetId),
        description: String(body.description || ""),
        contentMarkdown: String(body.contentMarkdown || ""),
        contentJSON: body.contentJSON || null,
        syncOptions: body.syncOptions || {
          includeEmptyRows: false,
          headerRow: 1,
          sheets: [],
        },
        shareMode: body.shareMode || "private",
        shareWith: Array.isArray(body.shareWith) ? body.shareWith : [],
      };

      mockDb.documents.push(record);
      return { success: true };
    },
  },
  {
    method: "PUT",
    path: "/api/documents",
    handler: ({ body }) => {
      if (!body?.name || !body?.preasheetId) {
        throw new Error("Invalid payload for update-document");
      }

      const document = findDocumentByName(body.name);
      if (!document) {
        throw new Error(`Document "${body.name}" not found`);
      }

      document.workspace = String(body.workspace || "");
      document.fileName = String(body.fileName || "");
      document.preasheetId = String(body.preasheetId);
      document.description = String(body.description || "");
      document.contentMarkdown = String(body.contentMarkdown || "");
      document.contentJSON = body.contentJSON || null;
      document.syncOptions = body.syncOptions || {
        includeEmptyRows: false,
        headerRow: 1,
        sheets: [],
      };
      document.shareMode = body.shareMode || "private";
      document.shareWith = Array.isArray(body.shareWith) ? body.shareWith : [];

      return { success: true };
    },
  },
  {
    method: "DELETE",
    path: "/api/documents/:name",
    handler: ({ params }) => {
      const previousLength = mockDb.documents.length;
      mockDb.documents = mockDb.documents.filter(
        (item) => item.name !== params.name,
      );

      if (mockDb.documents.length === previousLength) {
        throw new Error(`Document "${params.name}" not found`);
      }

      return { success: true };
    },
  },
  {
    method: "POST",
    path: "/api/documents/:name/sync",
    handler: ({ params, body }) => {
      const document = findDocumentByName(params.name);
      if (!document) {
        throw new Error(`Document "${params.name}" not found`);
      }

      const options = body || {};
      const sheetNames = Array.isArray(options.sheets) && options.sheets.length
        ? options.sheets
        : ["Overview", "Details"];

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

      return clone(document);
    },
  },
];

const executeMockRequest = (method, url, payload) => {
  const parsedUrl = new URL(url, "http://localhost");

  const route = routes.find((item) => {
    return (
      item.method === method &&
      matchPath(item.path, parsedUrl.pathname) !== null
    );
  });

  if (!route) {
    return {
      success: false,
      error: `No mock route for ${method}:${parsedUrl.pathname}`,
    };
  }

  try {
    const params = matchPath(route.path, parsedUrl.pathname) || {};
    const query = Object.fromEntries(parsedUrl.searchParams.entries());
    const data = route.handler({ params, query, body: payload });
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error?.message || "Mock request failed",
    };
  }
};

const createRunner = () => {
  let successHandler = () => {};
  let failureHandler = () => {};

  return {
    withSuccessHandler(handler) {
      successHandler = typeof handler === "function" ? handler : () => {};
      return this;
    },
    withFailureHandler(handler) {
      failureHandler = typeof handler === "function" ? handler : () => {};
      return this;
    },
    invoke(method, name, payload) {
      window.setTimeout(() => {
        try {
          const response = executeMockRequest(method, name, payload);
          successHandler(response);
        } catch (error) {
          failureHandler(error);
        }
      }, 100);
    },
  };
};

export const mockScriptsApi = {
  withSuccessHandler(handler) {
    return createRunner().withSuccessHandler(handler);
  },
  withFailureHandler(handler) {
    return createRunner().withFailureHandler(handler);
  },
  invoke(method, name, payload) {
    return createRunner().invoke(method, name, payload);
  },
};

export const __mockDb = mockDb;
