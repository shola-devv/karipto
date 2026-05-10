import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},

  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };

    config.externals = [
      ...(Array.isArray(config.externals) ? config.externals : []),
      "pino-pretty",
      "lokijs",
      "encoding",
    ];

    return config;
  },
};

export default nextConfig;