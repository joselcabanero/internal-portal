/** A live ⌘K result from the Platform API, as plain data (the shell adds the icon). */
export interface RecordHit {
  id: string;
  label: string;
  hint?: string;
  href: string;
  kind: string;
}

/** Records open in Jarvis 2, the ecosystem's back office. */
export function recordHref(kind: string, id: string): string {
  const path = kind === "person" ? "people" : kind === "program" ? "programs" : "organizations";
  return `/jarvis/${path}/${encodeURIComponent(id)}`;
}
