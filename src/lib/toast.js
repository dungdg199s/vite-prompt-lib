import { useCallback, useContext, useMemo } from "react";
import { ToastContext } from "../contexts/ToastContext";

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
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
  const { showToast } = useToast();
  const label = safeEntityLabel(entityLabel);

  const success = useCallback(
    (action, duration = 3000) => {
      showToast({
        type: "success",
        message: `${label} ${action} successfully`,
        duration,
      });
    },
    [label, showToast],
  );

  const error = useCallback(
    (err, fallbackMessage) => {
      const message = getErrorMessage(
        err,
        fallbackMessage || `Cannot process ${label.toLowerCase()}`,
      );
      showToast({ type: "error", message });
      return message;
    },
    [label, showToast],
  );

  return useMemo(
    () => ({
      created: () => success("created"),
      updated: () => success("updated"),
      deleted: () => success("deleted"),
      synced: () => success("synced"),
      error,
    }),
    [error, success],
  );
};
