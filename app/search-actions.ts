"use server";

import { parseCode } from "@/lib/codes";
import { withPlatform } from "@/lib/platform-server";
import { recordHref, type RecordHit } from "@/lib/record-search";

/**
 * Live ⌘K results: a typed code jumps straight to its record; otherwise organisations by name. Runs as the
 * signed-in person with their workspace. Empty when the Platform API cannot answer.
 */
export async function searchRecords(query: string): Promise<RecordHit[]> {
  const q = String(query ?? "").trim().slice(0, 200);
  if (q.length < 2) return [];
  const parsed = parseCode(q);
  if (parsed?.knownPrefix) {
    const hit = await withPlatform((c) => c.byCode(parsed.code));
    if (hit) return [{ id: `code:${hit.code}`, label: hit.name, hint: `${hit.code} · ${kindLabel(hit.kind)}`, href: recordHref(hit.kind, hit.id), kind: hit.kind }];
  }
  const rows = (await withPlatform((c) => c.searchOrganizations(q, 8))) ?? [];
  return rows.map((r) => ({
    id: `org:${r.id}`, label: r.name, hint: r.code ?? undefined,
    href: recordHref("organization", r.id), kind: "organization",
  }));
}

function kindLabel(kind: string): string {
  return kind === "person" ? "Person" : kind === "program" ? "Programme" : "Organisation";
}
