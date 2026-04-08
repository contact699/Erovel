import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Needed because src/proxy.ts buffers request bodies before route handlers.
    // Set above the 250MB video cap to account for multipart/form-data overhead.
    proxyClientMaxBodySize: "260mb",
  },
};

export default nextConfig;
