const AccessControl = (function () {
  const ROLES = { OWNER: "owner", MANAGER: "manager", MEMBER: "member" };

  /** The single point that reads the current user's identity from the GAS session. */
  function getCurrentUserEmail() {
    return Session.getActiveUser().getEmail();
  }

  function isSystemAdmin(email) {
    return Config.SYSTEM_ADMIN_EMAIL.includes(email);
  }

  /**
   * @param {{members?: Array<{email: string, role: string}>}} workspace
   * @param {string} email
   * @returns {string|null} the user's role in this workspace, or null if they're not a member.
   */
  function getRoleInWorkspace(workspace, email) {
    const members = (workspace && workspace.members) || [];
    const match = members.find((member) => member.email === email);
    return match ? match.role : null;
  }

  function canViewWorkspace(workspace, email) {
    return isSystemAdmin(email) || getRoleInWorkspace(workspace, email) !== null;
  }

  function canEditWorkspace(workspace, email) {
    if (isSystemAdmin(email)) {
      return true;
    }
    const role = getRoleInWorkspace(workspace, email);
    return role === ROLES.OWNER || role === ROLES.MANAGER;
  }

  function canManageMembers(workspace, email) {
    return canEditWorkspace(workspace, email);
  }

  function canDeleteWorkspace(workspace, email) {
    if (isSystemAdmin(email)) {
      return true;
    }
    return getRoleInWorkspace(workspace, email) === ROLES.OWNER;
  }

  /** Any workspace member (including plain "member") can create prompts/documents. */
  function canCreateRecord(workspace, email) {
    return isSystemAdmin(email) || getRoleInWorkspace(workspace, email) !== null;
  }

  /**
   * @param {Object} workspace
   * @param {{status?: string, owner?: string}} record
   * @param {string} email
   */
  function canViewRecord(workspace, record, email) {
    if (isSystemAdmin(email)) {
      return true;
    }
    const role = getRoleInWorkspace(workspace, email);
    if (role === ROLES.OWNER || role === ROLES.MANAGER) {
      return true;
    }
    if (role === ROLES.MEMBER) {
      return record.status === "publish" || record.owner === email;
    }
    return false;
  }

  /** Owner/manager can edit anything; a plain member can only edit records they created. */
  function canEditRecord(workspace, record, email) {
    if (isSystemAdmin(email)) {
      return true;
    }
    const role = getRoleInWorkspace(workspace, email);
    if (role === ROLES.OWNER || role === ROLES.MANAGER) {
      return true;
    }
    if (role === ROLES.MEMBER) {
      return record.owner === email;
    }
    return false;
  }

  const errors = {
    forbidden: (action, details) =>
      new Error(
        `FORBIDDEN::${JSON.stringify({
          code: "FORBIDDEN",
          action,
          message: "You do not have permission to perform this action",
          ...details,
        })}`
      ),
  };

  return {
    ROLES,
    getCurrentUserEmail,
    isSystemAdmin,
    getRoleInWorkspace,
    canViewWorkspace,
    canEditWorkspace,
    canManageMembers,
    canDeleteWorkspace,
    canCreateRecord,
    canViewRecord,
    canEditRecord,
    // Deleting/publishing/viewing history follow the same rule as editing (see plan notes):
    // owner/manager act on everything, a plain member only on records they created.
    canDeleteRecord: canEditRecord,
    canPublishRecord: canEditRecord,
    canViewVersionHistory: canEditRecord,
    errors,
  };
})();
