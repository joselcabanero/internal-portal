import type { NextConfig } from "next";

// Apps without their own subdomain are served under a portal path (multi-zone).
// Each zone app must set `basePath` to its portal path in its own next.config,
// so its assets and links are prefixed and the proxy below can forward them.
const zones = [
  {
    path: "/ontology",
    origin: "https://eatable-ontology-showcase.vercel.app",
  },
];

const nextConfig: NextConfig = {
  async rewrites() {
    return zones.flatMap(({ path, origin }) => [
      { source: path, destination: `${origin}${path}` },
      { source: `${path}/:path*`, destination: `${origin}${path}/:path*` },
    ]);
  },
};

export default nextConfig;
