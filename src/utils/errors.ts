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

/**
 * What the banner shows for a given failure.
 *
 * `tone` separates "you mistyped" (danger) from "this is expected, just not
 * for you" (warning). Painting a locked-out member's correct password in
 * alarm red reads as a system fault when it is a permissions boundary
 * working exactly as designed.
 */
export interface AuthMessage {
  message: string;
  tone: 'danger' | 'warning';
}

const AUTH_MESSAGES: Record<string, AuthMessage> = {
  // Deliberately vague about which half was wrong: naming the field would
  // confirm to anyone guessing that an address is a real admin account.
  invalid_credentials: { message: "Email or password doesn't match.", tone: 'danger' },
  email_not_confirmed: {
    message: 'This email address is not confirmed yet.',
    tone: 'warning',
  },
  over_request_rate_limit: { message: 'Too many sign-in attempts.', tone: 'warning' },
  not_admin: {
    message: 'This account cannot use the admin console.',
    tone: 'warning',
  },
};

/** Shown when nothing more specific applies and the message is unusable. */
const AUTH_FALLBACK: AuthMessage = {
  message: 'Unable to sign in right now.',
  tone: 'danger',
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

/**
 * Turns any sign-in failure into copy a human can act on.
 *
 * Codes are matched first because they are stable; the message text is only
 * consulted for failures that never reached Supabase (an offline browser has
 * no auth code), and even then it is run through `humanizeError` so a raw
 * `TypeError` never reaches the banner.
 */
export function toAuthMessage(error: AppError): AuthMessage {
  const known = error.code ? AUTH_MESSAGES[error.code] : undefined;
  if (known) return known;

  const humanized = humanizeError(error.message);
  // Nothing the user typed caused these, so they are not their error to fix.
  if (
    humanized === 'Could not reach the server.' ||
    humanized === 'The server took too long to respond.'
  ) {
    return { message: humanized, tone: 'warning' };
  }
  // Our own service copy is already written for a person; a generic
  // "Something went wrong." means humanizeError rejected the raw text, so
  // prefer the fallback, which at least names sign-in.
  return humanized && humanized !== 'Something went wrong.'
    ? { message: humanized, tone: 'danger' }
    : AUTH_FALLBACK;
}
