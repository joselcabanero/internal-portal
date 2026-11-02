"use client";

import { createElement } from "react";
import { portalIcon } from "@/components/ads/portal";

/** An app's icon by its portal-contract name (portalIcon lives in a client module). */
export function PortalAppIcon({ name, className }: { name?: string; className?: string }) {
  return createElement(portalIcon(name), { className, strokeWidth: 1.5, "aria-hidden": true });
}
