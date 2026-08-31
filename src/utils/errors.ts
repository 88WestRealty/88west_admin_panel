import type { AppError } from '@/types/common';

/**
 * Normalises anything thrown — PostgrestError, AuthError, DOMException,
 * a rejected fetch, a bare string — into one `AppError`, so the UI never
 * has to branch on error provenance.
 */
export function toAppError(cause: unknown, fallback = 'Something went wrong.'): AppError {
  if (isRecord(cause)) {
    const message = typeof cause.message === 'string' ? cause.message : fallback;
    const code =
      typeof cause.code === 'string'
        ? cause.code
        : typeof cause.status === 'number'
          ? String(cause.status)
          : undefined;
    return { message, code, cause };
  }
  if (typeof cause === 'string' && cause.trim()) return { message: cause, cause };
  return { message: fallback, cause };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** True when a fetch/subscription was cancelled deliberately — not worth showing. */
export const isAbortError = (cause: unknown): boolean =>
  isRecord(cause) && (cause.name === 'AbortError' || cause.code === '20');

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: 'That email and password combination is not recognised.',
  email_not_confirmed: 'Confirm your email address before signing in.',
  over_request_rate_limit: 'Too many attempts. Wait a minute and try again.',
};

/**
 * Raw exception text that should never be shown to a user, mapped to language
 * that says what happened.
 *
 * `TypeError: Failed to fetch` is the browser's wording for "the request never
 * left" — unreachable host, offline, CORS, blocked by an extension. It tells
 * an operator nothing and looks like a crash.
 */
const TECHNICAL_PATTERNS: ReadonlyArray<[RegExp, string]> = [
  [/failed to fetch|networkerror|load failed/i, 'Could not reach the server.'],
  [/timeout|timed out|aborted/i, 'The server took too long to respond.'],
  [/jwt|token|unauthorized|401/i, 'Your session has expired.'],
  [/permission|forbidden|403|row-level security|violates/i,
    'You do not have permission to do that.'],
  [/payload too large|413|exceeded the maximum/i, 'That file is too large.'],
  [/bucket not found|404/i, 'Storage is not configured yet.'],
];

export function humanizeError(message: string): string {
  for (const [pattern, friendly] of TECHNICAL_PATTERNS) {
    if (pattern.test(message)) return friendly;
  }
  // Anything already written for humans (our own service messages) passes
  // through; a stray stack-shaped string is replaced rather than displayed.
  return /^[A-Z]\w+Error:/.test(message) ? 'Something went wrong.' : message;
}

/** Turns Supabase auth codes into copy a human can act on. */
export function toAuthMessage(error: AppError): string {
  return (error.code && AUTH_MESSAGES[error.code]) ?? error.message;
}
