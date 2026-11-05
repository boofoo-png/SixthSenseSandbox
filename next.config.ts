import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The development badge sits bottom-right so it does not cover the sidebar's profile.
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;
