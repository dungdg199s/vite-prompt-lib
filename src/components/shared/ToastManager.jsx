import { useState, useCallback } from "react";
import { ToastContext } from "../../contexts/ToastContext";

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((type, message, duration = 3000) => {
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
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
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
        return "bg-green-500 text-white";
      case "error":
        return "bg-red-500 text-white";
      case "warning":
        return "bg-yellow-500 text-white";
      case "info":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div
      className={`${getStyles()} px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-4 min-w-[300px] animate-in fade-in slide-in-from-bottom-4 duration-300`}
    >
      <span>{toast.message}</span>
      <button
        onClick={onRemove}
        className="text-white hover:opacity-80 transition"
      >
        ✕
      </button>
    </div>
  );
}
