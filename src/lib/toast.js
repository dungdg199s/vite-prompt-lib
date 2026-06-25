/**
 * MIGRATION IN PROGRESS: useToast now uses Zustand toastStore instead of Context.
 * Maintains backward-compatible API.
 */

import { useToastStore } from "../store/toastStore";

export const useToast = () => {
  return useToastStore();
};

const safeEntityLabel = (entity) => String(entity || "Item").trim() || "Item";

const getErrorMessage = (error, fallbackMessage) => {
  const message = error?.message;
  if (typeof message === "string" && message.trim()) {
    return message;
  }
  return fallbackMessage;
};

export const useCrudToast = (entityLabel) => {
  const { showToast } = useToastStore();
  const label = safeEntityLabel(entityLabel);

  const success = (action, duration = 3000) => {
    showToast({
      type: "success",
      message: `${label} ${action} successfully`,
      duration,
    });
  };

  const error = (err, fallbackMessage) => {
    const message = getErrorMessage(
      err,
      fallbackMessage || `Cannot process ${label.toLowerCase()}`,
    );
    showToast({ type: "error", message });
    return message;
  };

  return {
    created: () => success("created"),
    updated: () => success("updated"),
    deleted: () => success("deleted"),
    synced: () => success("synced"),
    error,
  };
};

