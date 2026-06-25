import { create } from "zustand";

export const useToastStore = create((set) => ({
  // --- STATE ---
  toasts: [],

  // --- ACTIONS ---
  showToast: (input, legacyMessage, legacyDuration = 3000) => {
    // Support object API: showToast({ type, message, duration })
    // while preserving old signature: showToast(type, message, duration)
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
    const normalizedDuration = Number.isFinite(payload.duration)
      ? payload.duration
      : 3000;
    // Errors and warnings persist until manually closed
    const duration =
      type === "error" || type === "warning" ? 0 : normalizedDuration;

    if (!message) {
      return null;
    }

    const id = Date.now();
    const toast = { id, type, message };

    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    // Auto-dismiss if duration > 0
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAllToasts: () => {
    set({ toasts: [] });
  },
}));
