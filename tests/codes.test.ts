import { describe, expect, it } from "vitest";
import { parseCode } from "@/lib/codes";
import { recordHref } from "@/lib/record-search";

describe("parseCode", () => {
  it("reads codes leniently: dash optional, numbers padded, any case", () => {
    expect(parseCode("stu-1")).toEqual({ code: "STU-00001", knownPrefix: true });
    expect(parseCode(" STU 2316 ")).toEqual({ code: "STU-02316", knownPrefix: true });
    expect(parseCode("per00001")).toEqual({ code: "PER-00001", knownPrefix: true });
    expect(parseCode("CORP-123456")).toEqual({ code: "CORP-123456", knownPrefix: true });
  });
  it("flags unknown prefixes and rejects non-codes", () => {
    expect(parseCode("XYZ-99999")).toEqual({ code: "XYZ-99999", knownPrefix: false });
    for (const v of ["gousto", "STU-", "S-1", "12345", ""]) expect(parseCode(v)).toBeNull();
  });
});

describe("recordHref", () => {
  it("opens records in Jarvis 2", () => {
    expect(recordHref("organization", "a b")).toBe("/jarvis/organizations/a%20b");
    expect(recordHref("person", "p1")).toBe("/jarvis/people/p1");
    expect(recordHref("program", "g1")).toBe("/jarvis/programs/g1");
  });
});
