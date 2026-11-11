import type { NextConfig } from "next";
import { allZones, legacyRedirects, zoneRewrites } from "./lib/zones";

// Apps without their own subdomain are served under a portal path (multi-zone).
// Each zone app must set `basePath` to its portal path in its own next.config,
// so its assets and links are prefixed and the proxy below can forward them.
//
// The fixed zones and the platform app registry live in lib/zones.ts and
// lib/apps.ts. Platform apps are routed only when their ZONE_<ID>_URL env var
// is set; it is read at BUILD time, so changing it on Vercel means redeploying.
const nextConfig: NextConfig = {
  // Local preview runs at 127.0.0.1 (another program owns localhost here).
  allowedDevOrigins: ["127.0.0.1"],
  // The dev "N" badge covered the sidebar's Collapse button and the phone Filters button (like the apps).
  devIndicators: false,
  // Moved zones (Data Navigator /navigator is now DataLab /datalab): old links keep working.
  async redirects() {
    return legacyRedirects();
  },
  async rewrites() {
    return zoneRewrites(allZones(process.env));
  },
};

export default nextConfig;
