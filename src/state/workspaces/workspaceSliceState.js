export const DEFAULT_WORKSPACE_FORM = {
  name: "",
  description: "",
  shareMode: "private",
  shareWith: "",
};

export const createWorkspaceSliceState = () => {
  return {
    selected: null,
    form: { ...DEFAULT_WORKSPACE_FORM },
    loading: {
      workspace: false,
      document: false,
      documentSyncMeta: false,
    },
    saving: {
      workspace: false,
      prompt: false,
      document: false,
    },
    modal: {
      workspace: false,
      delete: false,
    },
    errorMessage: "",
  };
};
