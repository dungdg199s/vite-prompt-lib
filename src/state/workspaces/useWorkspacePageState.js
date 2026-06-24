import { useMemo, useReducer } from "react";
import { setIn, updateIn } from "../treeState";
import {
  createWorkspacePageState,
} from "./workspacePageState";
import { createTabListState } from "./tablistState";
import { DEFAULT_WORKSPACE_FORM } from "./workspaceSliceState";
import { DEFAULT_PROMPT_FORM } from "./promptSliceState";
import { DEFAULT_DOCUMENT_FORM, DEFAULT_SYNC_OPTIONS } from "./documentSliceState";

const applyUpdate = (state, path, valueOrUpdater) => {
  if (typeof valueOrUpdater === "function") {
    return updateIn(state, path, valueOrUpdater);
  }

  return setIn(state, path, valueOrUpdater);
};

function reducer(state, action) {
  switch (action.type) {
    case "set":
      return applyUpdate(state, action.path, action.value);
    case "replace":
      return setIn(state, action.path, action.value);
    case "reset":
      return action.state;
    default:
      return state;
  }
}

const createPathSetter = (dispatch, path) => {
  return (valueOrUpdater) => {
    dispatch({ type: "set", path, value: valueOrUpdater });
  };
};

export function useWorkspacePageState({ promptNameFromUrl = "", documentNameFromUrl = "" } = {}) {
  const [state, dispatch] = useReducer(
    reducer,
    { promptNameFromUrl, documentNameFromUrl },
    ({ promptNameFromUrl: promptName, documentNameFromUrl: documentName }) =>
      createWorkspacePageState({ promptName, documentName }),
  );

  const actions = useMemo(() => {
    return {
      setSelectedWorkspace: createPathSetter(dispatch, ["workspace", "selected"]),
      setPromptInputValues: createPathSetter(dispatch, ["prompt", "inputValues"]),
      setPromptDetail: createPathSetter(dispatch, ["prompt", "form"]),
      setDocumentDetail: createPathSetter(dispatch, ["document", "form"]),
      setWorkspaceDetail: createPathSetter(dispatch, ["workspace", "form"]),
      setOpenTabs: createPathSetter(dispatch, ["tablist", "openTabs"]),
      setActiveTabId: createPathSetter(dispatch, ["tablist", "activeTabId"]),
      setEditingMode: createPathSetter(dispatch, ["workspace", "editingMode"]),
      setPromptEditingMode: createPathSetter(dispatch, ["prompt", "editingMode"]),
      setDocumentEditingMode: createPathSetter(dispatch, ["document", "editingMode"]),
      setDocumentFormPhase: createPathSetter(dispatch, ["document", "formPhase"]),
      setIsWorkspaceModalOpen: createPathSetter(dispatch, ["workspace", "modal", "workspace"]),
      setIsDeleteModalOpen: createPathSetter(dispatch, ["workspace", "modal", "delete"]),
      setIsPromptModalOpen: createPathSetter(dispatch, ["prompt", "modal", "editor"]),
      setIsPromptDeleteModalOpen: createPathSetter(dispatch, ["prompt", "modal", "delete"]),
      setIsDocumentModalOpen: createPathSetter(dispatch, ["document", "modal", "editor"]),
      setIsDocumentDeleteModalOpen: createPathSetter(dispatch, ["document", "modal", "delete"]),
      setIsDocumentSyncModalOpen: createPathSetter(dispatch, ["document", "modal", "sync"]),
      setIsLoadingWorkspace: createPathSetter(dispatch, ["workspace", "loading", "workspace"]),
      setIsLoadingDocument: createPathSetter(dispatch, ["workspace", "loading", "document"]),
      setIsLoadingDocumentSyncMeta: createPathSetter(dispatch, ["workspace", "loading", "documentSyncMeta"]),
      setIsSavingWorkspace: createPathSetter(dispatch, ["workspace", "saving", "workspace"]),
      setIsSavingPrompt: createPathSetter(dispatch, ["workspace", "saving", "prompt"]),
      setIsSavingDocument: createPathSetter(dispatch, ["workspace", "saving", "document"]),
      setDocumentSyncOptions: createPathSetter(dispatch, ["document", "sync", "options"]),
      setDocumentSyncPreasheetName: createPathSetter(dispatch, ["document", "sync", "preasheetName"]),
      setDocumentSyncSheetNames: createPathSetter(dispatch, ["document", "sync", "sheetNames"]),
      setErrorMessage: createPathSetter(dispatch, ["workspace", "errorMessage"]),
      resetDocumentSyncOptions: () => {
        dispatch({
          type: "set",
          path: ["document", "sync"],
          value: {
            ...DEFAULT_SYNC_OPTIONS,
          },
        });
      },
      resetWorkspaceForm: () => {
        dispatch({ type: "set", path: ["workspace", "form"], value: { ...DEFAULT_WORKSPACE_FORM } });
      },
      resetPromptForm: (workspaceName = "") => {
        dispatch({
          type: "set",
          path: ["prompt", "form"],
          value: {
            ...DEFAULT_PROMPT_FORM,
            workspace: workspaceName,
          },
        });
      },
      resetDocumentForm: (workspaceName = "") => {
        dispatch({
          type: "set",
          path: ["document", "form"],
          value: {
            ...DEFAULT_DOCUMENT_FORM,
            workspace: workspaceName,
          },
        });
      },
      resetTabList: () => {
        dispatch({ type: "set", path: ["tablist"], value: createTabListState() });
      },
      resetPromptInputs: () => {
        dispatch({ type: "set", path: ["prompt", "inputValues"], value: {} });
      },
      resetState: (nextState) => {
        dispatch({ type: "reset", state: nextState });
      },
    };
  }, [dispatch]);

  return useMemo(() => {
    return {
      tree: state,
      selectedWorkspace: state.workspace.selected,
      promptInputValues: state.prompt.inputValues,
      promptForm: state.prompt.form,
      documentForm: state.document.form,
      workspaceForm: state.workspace.form,
      openTabs: state.tablist.openTabs,
      activeTabId: state.tablist.activeTabId,
      editingMode: state.workspace.editingMode,
      promptEditingMode: state.prompt.editingMode,
      documentEditingMode: state.document.editingMode,
      documentFormPhase: state.document.formPhase,
      isWorkspaceModalOpen: state.workspace.modal.workspace,
      isDeleteModalOpen: state.workspace.modal.delete,
      isPromptModalOpen: state.prompt.modal.editor,
      isPromptDeleteModalOpen: state.prompt.modal.delete,
      isDocumentModalOpen: state.document.modal.editor,
      isDocumentDeleteModalOpen: state.document.modal.delete,
      isDocumentSyncModalOpen: state.document.modal.sync,
      isLoadingWorkspace: state.workspace.loading.workspace,
      isLoadingDocument: state.workspace.loading.document,
      isLoadingDocumentSyncMeta: state.workspace.loading.documentSyncMeta,
      isSavingWorkspace: state.workspace.saving.workspace,
      isSavingPrompt: state.workspace.saving.prompt,
      isSavingDocument: state.workspace.saving.document,
      documentSyncOptions: state.document.sync.options,
      documentSyncPreasheetName: state.document.sync.preasheetName,
      documentSyncSheetNames: state.document.sync.sheetNames,
      errorMessage: state.workspace.errorMessage,
      actions,
      tablist: state.tablist,
    };
  }, [actions, state]);
}
