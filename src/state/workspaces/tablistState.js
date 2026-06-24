export const WORKSPACE_OVERVIEW_TAB = {
  id: "workspace:overview",
  type: "workspace",
  label: "Overview",
};

export const DRAFT_DOCUMENT_TAB_ID = "document:create";

export const createInitialTabs = (promptName = "", documentName = "") => {
  const tabs = [WORKSPACE_OVERVIEW_TAB];

  if (promptName) {
    tabs.push({ id: `prompt:${promptName}`, type: "prompt", name: promptName, label: promptName });
  } else if (documentName) {
    tabs.push({ id: `document:${documentName}`, type: "document", name: documentName, label: documentName });
  }

  return tabs;
};

export const getUrlTargetTab = (promptName = "", documentName = "") => {
  if (promptName) {
    return { id: `prompt:${promptName}`, type: "prompt", name: promptName, label: promptName };
  }

  if (documentName) {
    return { id: `document:${documentName}`, type: "document", name: documentName, label: documentName };
  }

  return WORKSPACE_OVERVIEW_TAB;
};

export const createTabListState = ({ promptName = "", documentName = "" } = {}) => {
  const activeTab = getUrlTargetTab(promptName, documentName);

  return {
    openTabs: createInitialTabs(promptName, documentName),
    activeTabId: activeTab.id,
  };
};
