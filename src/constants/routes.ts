export const ROUTES = {
  login: '/login',
  members: '/members',
  vendors: '/vendors',
  root: '/',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/** Paths reachable without a session. Consulted by the auth middleware. */
export const PUBLIC_ROUTES: readonly string[] = [ROUTES.login];

export const isPublicRoute = (pathname: string): boolean =>
  PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

/**
 * Marks a /login visit as the result of a failed *authorisation* check rather
 * than a missing session.
 *
 * Without it the two gates deadlock: the dashboard layout rejects a
 * non-admin and sends them to /login, while the proxy sees their perfectly
 * valid session and sends them straight back — ERR_TOO_MANY_REDIRECTS. This
 * flag tells the proxy to let that user land, so the login screen can explain
 * what happened and offer a way out.
 */
export const DENIED_PARAM = 'denied';
