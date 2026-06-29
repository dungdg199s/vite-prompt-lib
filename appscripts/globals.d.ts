type FetchOptions = {
  enforceSharing?: boolean;
};

type Workspace = {
  id: string;
  name: string;
  description?: string;
  shareMode?: 'private' | 'shared' | 'public';
  sharedWith?: string[];

  prompts?: Prompt[];
  documents?: Document[];
  tabs?: Tab[];
};

type Prompt = {
  id: string;
  name: string;
  description?: string;
  content: string;
};

type Document = {
  id: string;
  name: string;
  description?: string;
  content: string;
};

type Tab = {
  id: string;
  name: string;
  type: 'workspace' | 'prompt' | 'document';
};
