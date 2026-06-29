import { create } from 'zustand';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const useToastStore = create((set, get) => ({
  toasts: [],

  push: (toast) => {
    const id = uid();
    const item = { id, duration: 3000, ...toast };

    set((s) => ({ toasts: [...s.toasts, item] }));

    if (item.duration && item.duration > 0) {
      setTimeout(() => {
        get().remove(id);
      }, item.duration);
    }

    return id;
  },

  remove: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  clear: () => set({ toasts: [] }),

  success: (message, duration = 2500) => get().push({ type: 'success', message, duration }),

  error: (message, duration = 4000) => get().push({ type: 'error', message, duration }),

  info: (message, duration = 3000) => get().push({ type: 'info', message, duration }),

  warning: (message, duration = 3000) => get().push({ type: 'warning', message, duration }),
}));
