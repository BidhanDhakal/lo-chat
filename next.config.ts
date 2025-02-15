import type { NextConfig } from "next";

const nextConfig = {
  async redirects() {
    return [
    {
      source: "/",
      destination: "/conversations",
      permanent: true
    }
    ]
  }
};

export default nextConfig;
