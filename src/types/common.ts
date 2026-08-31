/** Shared shapes used across features. */

export type AsyncStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Discriminated result — forces callers to handle failure explicitly. */
export type Result<T, E = AppError> =
  | { ok: true; data: T }
  | { ok: false; error: E };

export const ok = <T>(data: T): Result<T, never> => ({ ok: true, data });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export interface AppError {
  message: string;
  code?: string;
  cause?: unknown;
}

export interface VendorFormValues {
  name: string;
  category: string;
  /** Kept as a string: an in-progress "" or "1" must not become 0 or NaN. */
  discountPercent: string;
  /** Path of a logo already in storage; null until one has been saved. */
  logoPath: string | null;
}

/**
 * Form state plus the not-yet-uploaded file.
 *
 * The `File` is deliberately outside `VendorFormValues`: that type is what
 * gets persisted as a draft in localStorage, and a File cannot be serialised
 * to JSON. Keeping it separate means the draft stays storable while the
 * pending upload lives only for the life of the open form.
 */
export interface VendorDraftState {
  values: VendorFormValues;
  pendingLogo: File | null;
}

export interface LoginFormValues {
  email: string;
  password: string;
}
