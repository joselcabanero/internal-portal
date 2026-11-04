"use server";

import { ApiError } from "@/lib/platform-client";
import { loadWorkspaceCatalog, platformClient, type NoClient } from "@/lib/platform-server";
import { parseWorkspace, type WorkspaceCatalog, type WorkspacePreset, type WorkspaceResult, type WorkspaceSummary } from "@/lib/workspace";
import type { PlatformClient } from "@/lib/platform-client";

/**
 * Server actions behind the workspace selector (`WorkspaceActions`, ecosystem edition). They call the
 * Platform API as the signed-in person; the token stays on the server. When the API cannot be reached
 * they answer `{ ok: false }` and the selector degrades (built-in market names, "could not be loaded").
 */

const ids = (v: unknown) => parseWorkspace(Array.isArray(v) ? v.map(String).join(",") : "");

async function guard<T>(fn: (client: PlatformClient) => Promise<T>): Promise<WorkspaceResult<T>> {
  const c = await platformClient();
  if (!c.ok) return c satisfies NoClient;
  try {
    return { ok: true, ...(await fn(c.client)) };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, status: err.status, error: err.message };
    return { ok: false, status: 503, error: "The Platform API could not be reached." };
  }
}

export async function workspaceCatalog(): Promise<WorkspaceResult<{ catalog: WorkspaceCatalog }>> {
  const catalog = await loadWorkspaceCatalog();
  return catalog ? { ok: true, catalog } : { ok: false, status: 503, error: "The markets could not be loaded." };
}

export async function workspaceSummary(marketIds: string[]): Promise<WorkspaceResult<{ summary: WorkspaceSummary }>> {
  return guard(async (api) => ({ summary: await api.workspaceSummary(ids(marketIds)) }));
}

export async function saveWorkspacePreset(input: { name: string; marketIds: string[]; shared: boolean }): Promise<WorkspaceResult<{ preset: WorkspacePreset }>> {
  const name = String(input?.name ?? "").trim().slice(0, 60);
  const marketIds = ids(input?.marketIds);
  if (!name || marketIds.length === 0) return { ok: false, status: 400, error: "A preset needs a name and at least one market." };
  const r = await guard(async (api) => {
    const preset = await api.createWorkspacePreset({ name, marketIds, ...(input.shared ? { shared: true } : {}) });
    if (!preset) throw new ApiError(502, "The API did not return the preset.");
    return { preset };
  });
  if (!r.ok && r.status === 403) return { ...r, error: "Only admins can share a preset with the team." };
  return r;
}

export async function deleteWorkspacePreset(id: string): Promise<WorkspaceResult<{ deleted: true }>> {
  return guard(async (api) => {
    await api.deleteWorkspacePreset(String(id));
    return { deleted: true as const };
  });
}
