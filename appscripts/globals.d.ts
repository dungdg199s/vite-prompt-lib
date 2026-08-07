type FetchOptions = {
  allowDeleted?: boolean;
  filter?: (record: any) => boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
  fields?: string[];
};

type WorkspaceRole = "owner" | "manager" | "member";

type WorkspaceMember = {
  email: string;
  role: WorkspaceRole;
};

type Workspace = {
  id: string;
  name: string;
  description?: string;
  members: WorkspaceMember[];
  owner: string;

  prompts?: Prompt[];
  documents?: Document[];
  tabs?: Tab[];
};

type PublishStatus = "draft" | "publish";

type Prompt = {
  id: string;
  name: string;
  workspace: string;
  description?: string;
  content: string;
  status: PublishStatus;
  publishedVersionId?: string | null;
  publishedAt?: string | null;
  publishedBy?: string | null;
  owner: string;
};

type PromptVersion = {
  id: string;
  promptId: string;
  workspace: string;
  versionNumber: number;
  name: string;
  description?: string;
  content: string;
  publishedAt: string;
  publishedBy: string;
};

type Document = {
  id: string;
  name: string;
  workspace: string;
  type?: string;
  fileName?: string;
  preasheetId?: string;
  description?: string;
  contentMarkdown?: string;
  contentJSON?: object | null;
  contentHTML?: string;
  syncOptions?: object;
  status: PublishStatus;
  publishedVersionId?: string | null;
  publishedAt?: string | null;
  publishedBy?: string | null;
  owner: string;
};

type DocumentVersion = {
  id: string;
  documentId: string;
  workspace: string;
  versionNumber: number;
  name: string;
  fileName?: string;
  description?: string;
  contentMarkdown?: string;
  contentJSON?: object | null;
  contentHTML?: string;
  publishedAt: string;
  publishedBy: string;
};

type Tab = {
  id: string;
  name: string;
  type: "workspace" | "prompt" | "document";
};
