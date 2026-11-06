import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The development badge sits bottom-right so it does not cover the sidebar.
  devIndicators: { position: "bottom-right" },
  // Older pages that were replaced keep working by sending people to their replacements
  // (temporary, since the prototype may still change).
  redirects() {
    return [
      { source: "/ai-studio", destination: "/ai-management", permanent: false },
      { source: "/analytics", destination: "/insights", permanent: false },
      { source: "/reports", destination: "/insights", permanent: false },
      { source: "/competitors/:slug", destination: "/competitors", permanent: false },
      { source: "/findings", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
