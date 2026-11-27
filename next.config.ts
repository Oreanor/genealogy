import type { NextConfig } from 'next';

/** Conservative security headers that don't interfere with Leaflet tiles or inline theme script. */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  // Sub-path hosting (e.g. /genealogy on the home server); unset for a domain root such as Vercel.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  poweredByHeader: false,
  experimental: {
    // Inline the (single, ~15 KB gzip) global stylesheet into the HTML <head>
    // so it is no longer a render-blocking network request.
    inlineCss: true,
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
