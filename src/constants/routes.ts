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
