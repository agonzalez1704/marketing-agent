import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Pin workspace root — avoids Next inferring a stray parent lockfile
  turbopack: { root: __dirname },
  // jsdom is a heavy Node lib; load at runtime instead of bundling
  serverExternalPackages: ["jsdom"],
  experimental: {
    // PDF + short video uploads go through server actions — raise the default 1MB cap
    serverActions: { bodySizeLimit: "50mb" },
  },
};

export default nextConfig;
