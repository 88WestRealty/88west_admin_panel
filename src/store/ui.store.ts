'use client';

import { create } from 'zustand';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
}

interface UiState {
  toasts: Toast[];
}

interface UiActions {
  pushToast: (tone: ToastTone, message: string) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

let toastSeq = 0;
const nextToastId = () => `toast-${++toastSeq}`;

/**
 * Transient UI state. Toasts live here rather than in feature stores so any
 * layer — a service call, an error boundary, a realtime disconnect — can
 * surface a message without prop-drilling a callback.
 *
 * Auto-dismiss is handled by the ToastViewport component, which owns the
 * timers and clears them on unmount. Timers deliberately do not live in the
 * store: a store outlives the React tree and would leak them.
 */
export const useUiStore = create<UiState & UiActions>()((set) => ({
  toasts: [],
  pushToast: (tone, message) => {
    const id = nextToastId();
    set((s) => ({ toasts: [...s.toasts, { id, tone, message }] }));
    return id;
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clearToasts: () => set({ toasts: [] }),
}));

export const selectToasts = (s: UiState) => s.toasts;
