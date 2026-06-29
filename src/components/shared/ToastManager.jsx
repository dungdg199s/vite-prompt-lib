/**
 * MIGRATION IN PROGRESS: ToastManager now reads from Zustand toastStore.
 * Provider is kept as no-op for backward compatibility.
 */

import { useToastStore } from "../../stores/toastStore";

export const ToastProvider = ({ children }) => {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
};

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const onRemove = useToastStore((state) => state.removeToast);

  return (
    <div
      data-testid="toast-container"
      className="fixed left-1/2 top-4 z-50 flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4"
    >
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
