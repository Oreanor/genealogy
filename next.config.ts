import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // Inline the (single, ~15 KB gzip) global stylesheet into the HTML <head>
    // so it is no longer a render-blocking network request.
    inlineCss: true,
  },
};

export default nextConfig;
