export const DEFAULT_PROMPT_FORM = {
  name: "",
  workspace: "",
  description: "",
  content: "",
  shareMode: "private",
  shareWith: "",
};

export const createPromptSliceState = () => {
  return {
    inputValues: {},
    form: { ...DEFAULT_PROMPT_FORM },
    editingMode: "create",
    modal: {
      editor: false,
      delete: false,
    },
  };
};
