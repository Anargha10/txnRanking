import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Optimize for production builds
  poweredByHeader: false,
  // Configure images if needed
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
