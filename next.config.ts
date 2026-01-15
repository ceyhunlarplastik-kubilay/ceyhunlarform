import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'standalone',

  images: {
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      /* {
        protocol: "https",
        hostname: `cdn.${process.env.DOMAIN}`,
      },
      {
        protocol: "https",
        hostname: `cdn.dev.${process.env.DOMAIN}`,
      }, */
    ],
  },

  // Move outputFileTracingExcludes to top level (not in experimental)
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/@esbuild/linux-x64',
    ],
  },

};

export default nextConfig;