import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['bcrypt','cloudinary'],
  },};

export default nextConfig;
