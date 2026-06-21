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
