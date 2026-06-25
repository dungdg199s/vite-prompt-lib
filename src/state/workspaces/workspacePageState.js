import {
  DEFAULT_WORKSPACE_FORM,
  createWorkspaceSliceState,
} from "./workspaceSliceState";
import {
  DEFAULT_PROMPT_FORM,
  createPromptSliceState,
} from "./promptSliceState";
import {
  DEFAULT_DOCUMENT_FORM,
  createDocumentSliceState,
  DEFAULT_SYNC_OPTIONS,
} from "./documentSliceState";
import { createTabListState } from "./tablistState";

export const createWorkspacePageState = ({
  promptName = "",
  documentName = "",
} = {}) => {
  return {
    workspace: createWorkspaceSliceState(),
    prompt: createPromptSliceState(),
    document: createDocumentSliceState(),
    tablist: createTabListState({ promptName, documentName }),
  };
};

export const createWorkspaceForms = () => ({
  workspace: { ...DEFAULT_WORKSPACE_FORM },
  prompt: { ...DEFAULT_PROMPT_FORM },
  document: { ...DEFAULT_DOCUMENT_FORM },
  sync: { ...DEFAULT_SYNC_OPTIONS },
});

export {
  DEFAULT_WORKSPACE_FORM,
  DEFAULT_PROMPT_FORM,
  DEFAULT_DOCUMENT_FORM,
  DEFAULT_SYNC_OPTIONS,
};
