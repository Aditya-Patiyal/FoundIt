import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components / PPR intentionally left off: this app is auth-gated and
  // per-user, so pages that read cookies() render dynamically. Keeps v1 simple
  // (README §2). Revisit if we ever add heavy public, cacheable pages.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
