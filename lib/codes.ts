/**
 * Entity codes (STU-00042, PER-00007…): the same lenient reading in every ecosystem app. The dash is optional
 * and short numbers are padded, so "stu-1", "STU 1" and "stu00001" all read STU-00001.
 */
export const KNOWN_CODE_PREFIXES = ["STU", "INV", "CORP", "OPR", "RES", "PER", "PRG", "ORG"] as const;

const CODE = /^\s*([A-Za-z]{2,5})\s*-?\s*(\d{1,9})\s*$/;

export function parseCode(input: string): { code: string; knownPrefix: boolean } | null {
  const m = CODE.exec(input ?? "");
  if (!m) return null;
  const prefix = m[1].toUpperCase();
  return { code: `${prefix}-${m[2].padStart(5, "0")}`, knownPrefix: (KNOWN_CODE_PREFIXES as readonly string[]).includes(prefix) };
}
