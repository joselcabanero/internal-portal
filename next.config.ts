import type { NextConfig } from "next";
import { allZones, zoneRewrites } from "./lib/zones";

// Apps without their own subdomain are served under a portal path (multi-zone).
// Each zone app must set `basePath` to its portal path in its own next.config,
// so its assets and links are prefixed and the proxy below can forward them.
//
// The fixed zones and the platform app registry live in lib/zones.ts and
// lib/apps.ts. Platform apps are routed only when their ZONE_<ID>_URL env var
// is set; it is read at BUILD time, so changing it on Vercel means redeploying.
const nextConfig: NextConfig = {
  async rewrites() {
    return zoneRewrites(allZones(process.env));
  },
};

export default nextConfig;
