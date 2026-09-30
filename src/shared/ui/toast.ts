import { create } from 'zustand';

export type ToastTone = 'info' | 'error' | 'success';

export interface Toast {
  id: number;
  text: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: Toast[];
  push: (text: string, tone?: ToastTone) => void;
  dismiss: (id: number) => void;
}

const LIFETIME_MS = 5000;
const MAX_VISIBLE = 3;
let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (text, tone = 'info') => {
    if (get().toasts.some((t) => t.text === text)) return;
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, text, tone }].slice(-MAX_VISIBLE) }));
    window.setTimeout(() => get().dismiss(id), LIFETIME_MS);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  info: (text: string) => useToastStore.getState().push(text, 'info'),
  error: (text: string) => useToastStore.getState().push(text, 'error'),
  success: (text: string) => useToastStore.getState().push(text, 'success'),
};
