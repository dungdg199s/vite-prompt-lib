const BlobStore = (function () {
  const FOLDER_NAME = "blobs";
  const FOLDER_PROPERTY_KEY = "workspaces:folder:id:blobs";
  const INLINE_MAX_CHARS = 45000;

  let cachedFolder = null;

  /**
   * Gets (or lazily creates) the Drive folder used to store offloaded blob content.
   * The folder id is cached in Script Properties so repeated calls avoid a Drive search.
   * @returns {GoogleAppsScript.Drive.Folder}
   */
  function _getFolder() {
    if (cachedFolder) {
      return cachedFolder;
    }

    const properties = PropertiesService.getScriptProperties();
    const folderId = properties.getProperty(FOLDER_PROPERTY_KEY);

    if (folderId) {
      cachedFolder = DriveApp.getFolderById(folderId);
      return cachedFolder;
    }

    const parentFolder = DriveApp.getFolderById(Config.WORKSPACES_FOLDER_ID);
    const existing = parentFolder.getFoldersByName(FOLDER_NAME);
    const folder = existing.hasNext() ? existing.next() : parentFolder.createFolder(FOLDER_NAME);

    properties.setProperty(FOLDER_PROPERTY_KEY, folder.getId());
    cachedFolder = folder;
    return cachedFolder;
  }

  /**
   * Writes content to a Drive file, creating a new file or overwriting an existing one.
   * @param {string} content
   * @param {{existingFileId?: string, name?: string}} [opts]
   * @returns {{fileId: string, size: number}}
   */
  function put(content, opts = {}) {
    const text = String(content);

    if (opts.existingFileId) {
      const file = DriveApp.getFileById(opts.existingFileId);
      file.setContent(text);
      return { fileId: file.getId(), size: text.length };
    }

    const name = opts.name || `blob-${Utilities.getUuid()}`;
    const file = _getFolder().createFile(name, text, MimeType.PLAIN_TEXT);
    return { fileId: file.getId(), size: text.length };
  }

  /**
   * Reads the text content of a previously stored blob.
   * @param {string} fileId
   * @returns {string}
   */
  function get(fileId) {
    return DriveApp.getFileById(fileId).getBlob().getDataAsString();
  }

  /**
   * Soft-deletes a blob by moving it to Drive trash.
   * @param {string} fileId
   */
  function remove(fileId) {
    DriveApp.getFileById(fileId).setTrashed(true);
  }

  /**
   * Decides whether a serialized cell value is large enough to require offloading to Drive.
   * @param {string} serializedValue
   * @returns {boolean}
   */
  function shouldOffload(serializedValue) {
    return String(serializedValue).length > INLINE_MAX_CHARS;
  }

  return { put, get, remove, shouldOffload, INLINE_MAX_CHARS };
})();
