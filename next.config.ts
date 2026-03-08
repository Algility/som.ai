import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/apple-touch-icon.png", destination: "/logo.png" },
      { source: "/apple-touch-icon-precomposed.png", destination: "/logo.png" },
    ];
  },
};

export default nextConfig;
