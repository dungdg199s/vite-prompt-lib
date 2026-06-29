import { mockData } from './gasApiMockData';

const clone = (value) => JSON.parse(JSON.stringify(value));

const mockDb = mockData || {
  workspaces: [],
  prompts: [],
  documents: [],
};

const matchPath = (pattern, path) => {
  const patternSegments = String(pattern).split('/').filter(Boolean);
  const pathSegments = String(path).split('/').filter(Boolean);

  if (patternSegments.length !== pathSegments.length) {
    return null;
  }

  const params = {};

  for (let i = 0; i < patternSegments.length; i += 1) {
    const patternSegment = patternSegments[i];
    const pathSegment = pathSegments[i];

    if (patternSegment.startsWith(':')) {
      params[patternSegment.slice(1)] = decodeURIComponent(pathSegment);
      continue;
    }

    if (patternSegment !== pathSegment) {
      return null;
    }
  }

  return params;
};

const findWorkspaceById = (id) => {
  return mockDb.workspaces.find((item) => item.id === String(id));
};

const findWorkspaceByName = (name) => {
  return mockDb.workspaces.find((item) => item.name === String(name));
};

const findPromptById = (id) => {
  return mockDb.prompts.find((item) => item.id === String(id));
};

const findDocumentById = (id) => {
  return mockDb.documents.find((item) => item.id === String(id));
};

const findDocumentByPreasheetId = (preasheetId) => {
  return mockDb.documents.find((item) => item.preasheetId === String(preasheetId));
};

const routes = [
  {
    method: 'GET',
    path: '/api/workspaces',
    handler: () => {
      const workspaces = clone(mockDb.workspaces);
      workspaces.forEach((workspace) => {
        const prompts = mockDb.prompts.filter((prompt) => prompt.workspace === workspace.id);
        const documents = mockDb.documents.filter((document) => document.workspace === workspace.id);

        workspace.prompts = [...(workspace.prompts || []), ...prompts];
        workspace.documents = [...(workspace.documents || []), ...documents];
      });

      return workspaces;
    },
  },
  {
    method: 'GET',
    path: '/api/workspaces/:id',
    handler: ({ params }) => {
      const workspace = findWorkspaceById(params.id);

      if (!workspace) {
        throw new Error(`Workspace "${params.id}" not found`);
      }

      const prompts = mockDb.prompts.filter((prompt) => prompt.workspace === workspace.id);

      const documents = mockDb.documents.filter((document) => document.workspace === workspace.id);

      return clone({
        ...workspace,
        prompts: [...(workspace.prompts || []), ...prompts],
        documents: [...(workspace.documents || []), ...documents],
      });
    },
  },
  {
    method: 'POST',
    path: '/api/workspaces',
    handler: ({ body }) => {
      if (!body?.name) {
        throw new Error('Invalid payload for create-workspace');
      }

      if (findWorkspaceByName(body.name)) {
        throw new Error(`Workspace "${body.name}" already exists`);
      }

      const record = {
        id: String(body.id),
        name: String(body.name),
        description: String(body.description || ''),
        shareMode: body.shareMode || 'private',
        shareWith: Array.isArray(body.shareWith) ? body.shareWith : [],
      };

      mockDb.workspaces.push(record);
      return { success: true };
    },
  },
  {
    method: 'PUT',
    path: '/api/workspaces/:id',
    handler: ({ body }) => {
      if (!body?.id) {
        throw new Error('Invalid payload for update-workspace');
      }

      const workspace = findWorkspaceById(body.id);
      if (!workspace) {
        throw new Error(`Workspace "${body.id}" not found`);
      }

      workspace.name = String(body.name || workspace.name);
      workspace.description = String(body.description || '');
      workspace.shareMode = body.shareMode || 'private';
      workspace.shareWith = Array.isArray(body.shareWith) ? body.shareWith : [];

      return workspace;
    },
  },
  {
    method: 'DELETE',
    path: '/api/workspaces/:id',
    handler: ({ params }) => {
      const previousLength = mockDb.workspaces.length;
      mockDb.workspaces = mockDb.workspaces.filter((item) => item.id !== params.id);

      if (mockDb.workspaces.length === previousLength) {
        throw new Error(`Workspace "${params.id}" not found`);
      }

      mockDb.prompts = mockDb.prompts.filter((prompt) => prompt.workspace !== params.id);

      return { success: true };
    },
  },
  {
    method: 'GET',
    path: '/api/prompts',
    handler: () => clone(mockDb.prompts),
  },
  {
    method: 'POST',
    path: '/api/prompts',
    handler: ({ body }) => {
      body.id = body.id || `prompt-${Date.now()}`;
      mockDb.prompts.push(clone(body));
      return clone(body);
    },
  },
  {
    method: 'GET',
    path: '/api/prompts/:id',
    handler: ({ params }) => {
      const prompt = findPromptById(params.id);
      if (!prompt) {
        throw new Error(`Prompt "${params.id}" not found`);
      }
      return clone(prompt);
    },
  },
  {
    method: 'PUT',
    path: '/api/prompts/:id',
    handler: ({ params, body }) => {
      const prompt = findPromptById(params.id);
      if (!prompt) {
        throw new Error(`Prompt "${params.id}" not found`);
      }

      Object.assign(prompt, {
        ...prompt,
        ...clone(body),
        id: params.id,
      });

      return clone(prompt);
    },
  },
  {
    method: 'DELETE',
    path: '/api/prompts/:id',
    handler: ({ params }) => {
      const previousLength = mockDb.prompts.length;
      mockDb.prompts = mockDb.prompts.filter((item) => item.id !== params.id);

      if (mockDb.prompts.length === previousLength) {
        throw new Error(`Prompt "${params.id}" not found`);
      }

      return { success: true };
    },
  },
  {
    method: 'GET',
    path: '/api/documents',
    handler: () => clone(mockDb.documents),
  },
  {
    method: 'GET',
    path: '/api/documents/:id',
    handler: ({ params }) => {
      const document = findDocumentById(params.id);
      if (!document) {
        throw new Error(`Document "${params.id}" not found`);
      }
      return clone(document);
    },
  },
  {
    method: 'GET',
    path: '/api/preasheet/:preasheetId',
    handler: ({ params }) => {
      const document = findDocumentByPreasheetId(params.preasheetId);
      const sheets = document?.contentJSON?.sheets;
      const sheetNames = Array.isArray(sheets)
        ? sheets.map((sheet) => String(sheet?.name || '').trim()).filter(Boolean)
        : ['Overview', 'Details'];

      return {
        preasheetId: String(params.preasheetId),
        preasheetName: document?.fileName || `preasheet-${params.preasheetId}`,
        sheetNames,
      };
    },
  },
  {
    method: 'POST',
    path: '/api/documents',
    handler: ({ body }) => {
      if (!body?.name) {
        throw new Error('Invalid payload for create-document');
      }

      const type = body.type || 'Spreadsheets';
      if (type === 'Spreadsheets' && !body?.preasheetId) {
        throw new Error('Spreadsheet ID is required for Spreadsheets type');
      }

      if (findDocumentById(body.id)) {
        throw new Error(`Document "${body.id}" already exists`);
      }

      const record = {
        id: String(body.id),
        name: String(body.name),
        type,
        workspace: String(body.workspace || ''),
        fileName: String(body.fileName || ''),
        preasheetId: String(body.preasheetId || ''),
        description: String(body.description || ''),
        contentMarkdown: String(body.contentMarkdown || ''),
        contentJSON: body.contentJSON || null,
        contentHTML: String(body.contentHTML || ''),
        syncOptions: body.syncOptions || {
          includeEmptyRows: false,
          headerRow: 1,
          sheets: [],
        },
        shareMode: body.shareMode || 'private',
        shareWith: Array.isArray(body.shareWith) ? body.shareWith : [],
      };

      mockDb.documents.push(record);
      return clone(record);
    },
  },
  {
    method: 'PUT',
    path: '/api/documents/:id',
    handler: ({ params, body }) => {
      if (!body?.name) {
        throw new Error('Invalid payload for update-document');
      }

      const type = body.type || 'Spreadsheets';
      if (type === 'Spreadsheets' && !body?.preasheetId) {
        throw new Error('Spreadsheet ID is required for Spreadsheets type');
      }

      const document = findDocumentById(params.id);
      if (!document) {
        throw new Error(`Document "${params.id}" not found`);
      }

      document.type = type;
      document.workspace = String(body.workspace || '');
      document.fileName = String(body.fileName || '');
      document.preasheetId = String(body.preasheetId || '');
      document.description = String(body.description || '');
      document.contentMarkdown = String(body.contentMarkdown || '');
      document.contentJSON = body.contentJSON || null;
      document.contentHTML = String(body.contentHTML || '');
      document.syncOptions = body.syncOptions || {
        includeEmptyRows: false,
        headerRow: 1,
        sheets: [],
      };
      document.shareMode = body.shareMode || 'private';
      document.shareWith = Array.isArray(body.shareWith) ? body.shareWith : [];

      return clone(document);
    },
  },
  {
    method: 'DELETE',
    path: '/api/documents/:id',
    handler: ({ params }) => {
      const previousLength = mockDb.documents.length;
      mockDb.documents = mockDb.documents.filter((item) => item.id !== params.id);

      if (mockDb.documents.length === previousLength) {
        throw new Error(`Document "${params.id}" not found`);
      }

      return { success: true };
    },
  },
  {
    method: 'POST',
    path: '/api/documents/:id/sync',
    handler: ({ params, body }) => {
      const document = findDocumentById(params.id);
      if (!document) {
        throw new Error(`Document "${params.id}" not found`);
      }

      if ((document.type || 'Spreadsheets') !== 'Spreadsheets') {
        throw new Error('Sync is only available for Spreadsheets documents');
      }

      const options = body || {};
      const sheetNames =
        Array.isArray(options.sheets) && options.sheets.length ? options.sheets : ['Overview', 'Details'];

      document.syncOptions = {
        includeEmptyRows: options.includeEmptyRows !== false,
        headerRow: Number.isInteger(options.headerRow) ? options.headerRow : null,
        sheets: Array.isArray(options.sheets) ? options.sheets : [],
      };

      document.contentMarkdown = [
        `# ${document.fileName || document.name}`,
        '',
        ...sheetNames.map((sheetName) => `## ${sheetName}`),
      ].join('\n');

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
              Example: 'Mock synced data',
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
  const parsedUrl = new URL(url, 'http://localhost');

  const route = routes.find((item) => {
    return item.method === method && matchPath(item.path, parsedUrl.pathname) !== null;
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
    return data;
  } catch (error) {
    return {
      success: false,
      error: error?.message || 'Mock request failed',
    };
  }
};

const createRunner = () => {
  let successHandler = () => {};
  let failureHandler = () => {};

  return {
    withSuccessHandler(handler) {
      successHandler = typeof handler === 'function' ? handler : () => {};
      return this;
    },
    withFailureHandler(handler) {
      failureHandler = typeof handler === 'function' ? handler : () => {};
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
      }, 300);
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
