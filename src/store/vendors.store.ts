'use client';

import { create } from 'zustand';
import type { AsyncStatus } from '@/types/common';
import type { Vendor } from '@/types/models';
import { removeById, upsertById } from '@/utils/collections';

interface VendorsState {
  vendors: Vendor[];
  query: string;
  status: AsyncStatus;
  error: string | null;
  /** Vendor currently open in the editor; null means "creating a new one". */
  editingId: string | null;
  isFormOpen: boolean;
  mutatingIds: string[];
}

interface VendorsActions {
  setVendors: (vendors: Vendor[]) => void;
  applyUpsert: (vendor: Vendor) => void;
  applyDelete: (id: string) => void;
  setQuery: (query: string) => void;
  setStatus: (status: AsyncStatus) => void;
  setError: (error: string | null) => void;
  openForm: (editingId?: string | null) => void;
  closeForm: () => void;
  markMutating: (id: string, mutating: boolean) => void;
  reset: () => void;
}

const initialState: VendorsState = {
  vendors: [],
  query: '',
  status: 'idle',
  error: null,
  editingId: null,
  isFormOpen: false,
  mutatingIds: [],
};

export const useVendorsStore = create<VendorsState & VendorsActions>()((set) => ({
  ...initialState,
  setVendors: (vendors) => set({ vendors, status: 'ready', error: null }),
  applyUpsert: (vendor) => set((s) => ({ vendors: upsertById(s.vendors, vendor) })),
  applyDelete: (id) => set((s) => ({ vendors: removeById(s.vendors, id) })),
  setQuery: (query) => set({ query }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error, status: error ? 'error' : 'ready' }),
  openForm: (editingId = null) => set({ isFormOpen: true, editingId }),
  closeForm: () => set({ isFormOpen: false, editingId: null }),
  markMutating: (id, mutating) =>
    set((s) => ({
      mutatingIds: mutating
        ? s.mutatingIds.includes(id)
          ? s.mutatingIds
          : [...s.mutatingIds, id]
        : s.mutatingIds.filter((value) => value !== id),
    })),
  reset: () => set(initialState),
}));

export const selectVendors = (s: VendorsState) => s.vendors;
export const selectVendorQuery = (s: VendorsState) => s.query;
export const selectVendorsStatus = (s: VendorsState) => s.status;
export const selectEditingId = (s: VendorsState) => s.editingId;
export const selectIsFormOpen = (s: VendorsState) => s.isFormOpen;
