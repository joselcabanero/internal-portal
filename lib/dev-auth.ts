// Dev-only escape hatch: SKIP_AUTH=1 previews the portal without signing in.
// Never enabled in production builds.
export const skipAuth =
  process.env.SKIP_AUTH === "1" && process.env.NODE_ENV !== "production";
