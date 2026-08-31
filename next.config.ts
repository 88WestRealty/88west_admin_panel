import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Statically checks every <Link href> and router.push against the real
  // route tree, so a renamed page fails the build instead of 404-ing at runtime.
  typedRoutes: true,
};

export default nextConfig;
