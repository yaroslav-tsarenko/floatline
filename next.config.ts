import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "community.steamstatic.com",
        pathname: "/economy/image/**",
      },
      {
        protocol: "https",
        hostname: "community.cloudflare.steamstatic.com",
        pathname: "/economy/image/**",
      },
    ],
  },
};

export default nextConfig;
