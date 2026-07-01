// {filePushOrder: 1}
const Config = (function () {
  const WORKSPACES_FOLDER_ID = process.env.WORKSPACES_FOLDER_ID;
  const TEMP_FOLDER_ID = process.env.WORKSPACES_FOLDER_ID;
  const WORKSPACES_SPREADSHEET_NAME = process.env.WORKSPACES_SPREADSHEET_NAME;
  const SYSTEM_ADMIN_EMAIL = process.env.SYSTEM_ADMIN_EMAIL.split(",");

  const WORKSPACES_SPREADSHEET_ID_KEY = "workspaces:spreadsheet:id";
  return {
    WORKSPACES_FOLDER_ID,
    WORKSPACES_SPREADSHEET_NAME,
    SYSTEM_ADMIN_EMAIL,
    WORKSPACES_SPREADSHEET_ID_KEY,
  };
})();
