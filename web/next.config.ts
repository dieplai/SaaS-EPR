import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone', // Enable standalone output for Docker
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // NOTE: No rewrites needed!
  // API URLs are handled dynamically in src/lib/api.ts using environment variables:
  // - Production/Staging: NGINX proxy handles /api routing
  // - Docker Dev: Uses NEXT_PUBLIC_BROWSER_API_URL (http://localhost:8001/api/v1)
  // - Local Dev: Uses NEXT_PUBLIC_API_URL (http://localhost:8001/api/v1)
};

export default nextConfig;
