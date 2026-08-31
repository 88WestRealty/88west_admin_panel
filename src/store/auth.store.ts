'use client';

import { create } from 'zustand';
import type { AsyncStatus } from '@/types/common';
import type { AdminUser } from '@/types/models';

interface AuthState {
  user: AdminUser | null;
  status: AsyncStatus;
  error: string | null;
}

interface AuthActions {
  setUser: (user: AdminUser | null) => void;
  setStatus: (status: AsyncStatus) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: AuthState = { user: null, status: 'idle', error: null };

/**
 * Session state, hydrated by `AuthProvider` from Supabase's own
 * `onAuthStateChange` stream.
 *
 * Note what is *not* here: no token, no refresh timer, no manual persistence.
 * Supabase already owns the session in cookies and rotates it; duplicating it
 * into our own storage would create a second source of truth that can go
 * stale. This store is a render-friendly projection of that stream.
 */
export const useAuthStore = create<AuthState & AuthActions>()((set) => ({
  ...initialState,
  setUser: (user) => set({ user, status: 'ready', error: null }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error, status: error ? 'error' : 'ready' }),
  reset: () => set({ ...initialState, status: 'ready' }),
}));

/** Atomic selectors — a component re-renders only when its slice changes. */
export const selectUser = (s: AuthState) => s.user;
export const selectIsAuthenticated = (s: AuthState) => s.user !== null;
export const selectAuthStatus = (s: AuthState) => s.status;
