export interface GasServer {
  handlers: { [key: string]: Function };
  describle: (name: string, callback: Function) => void;
  invoke: (name: string, payload: any) => any;
}

type ShareMode = "private" | "public" | "shared";

export type Workspace = {
  id: string;
  name: string;
  description?: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  shareMode: ShareMode;
  shareWith?: string[];
  prompts: Prompt[];
};

export type Prompt = {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  content: string;
  shareMode: ShareMode;
  shareWith?: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};
