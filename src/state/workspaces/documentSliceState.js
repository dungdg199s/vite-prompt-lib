export const DEFAULT_DOCUMENT_FORM = {
  name: "",
  type: "Spreadsheets",
  workspace: "",
  fileName: "",
  preasheetId: "",
  description: "",
  contentMarkdown: "",
  contentJSON: "",
  contentHTML: "",
  shareMode: "private",
  shareWith: "",
  syncOptions: null,
};

export const DEFAULT_SYNC_OPTIONS = {
  includeEmptyRows: false,
  headerRow: "",
  useAllSheets: true,
  selectedSheets: [],
};

export const createDocumentSliceState = () => {
  return {
    form: { ...DEFAULT_DOCUMENT_FORM },
    editingMode: "create",
    formPhase: "details",
    modal: {
      editor: false,
      delete: false,
      sync: false,
    },
    sync: {
      options: { ...DEFAULT_SYNC_OPTIONS },
      preasheetName: "",
      sheetNames: [],
    },
  };
};
