import { useState, useCallback } from "react";
import { ToastContext } from "../../contexts/ToastContext";

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((input, legacyMessage, legacyDuration = 3000) => {
    // Support object API: showToast({ type, message, duration }) while preserving old signature.
    const payload =
      typeof input === "object" && input !== null
        ? input
        : {
            type: input,
            message: legacyMessage,
            duration: legacyDuration,
          };

    const type = payload.type || "info";
    const message = String(payload.message || "").trim();
    const normalizedDuration = Number.isFinite(payload.duration) ? payload.duration : 3000;
    const duration = type === "error" || type === "warning" ? 0 : normalizedDuration;

    if (!message) {
      return null;
    }

    const id = Date.now();
    const toast = { id, type, message };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed left-1/2 top-4 z-50 flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}

function Toast({ toast, onRemove }) {
  const getStyles = () => {
    switch (toast.type) {
      case "success":
        return {
          container: "border border-green-200 bg-green-50 text-green-900",
          close: "text-green-700 hover:bg-green-100",
        };
      case "error":
        return {
          container: "border border-red-200 bg-red-50 text-red-900",
          close: "text-red-700 hover:bg-red-100",
        };
      case "warning":
        return {
          container: "border border-amber-200 bg-amber-50 text-amber-900",
          close: "text-amber-700 hover:bg-amber-100",
        };
      case "info":
        return {
          container: "border border-blue-200 bg-blue-50 text-blue-900",
          close: "text-blue-700 hover:bg-blue-100",
        };
      default:
        return {
          container: "border border-slate-200 bg-slate-50 text-slate-900",
          close: "text-slate-700 hover:bg-slate-100",
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`${styles.container} px-4 py-3 rounded-lg shadow-[0_8px_20px_rgba(15,23,42,0.12)] flex items-center justify-between gap-4 min-w-[300px] animate-in fade-in slide-in-from-top-4 duration-300`}
    >
      <span>{toast.message}</span>
      <button
        onClick={onRemove}
        className={`${styles.close} inline-flex h-6 w-6 items-center justify-center rounded-md transition`}
      >
        ✕
      </button>
    </div>
  );
}
