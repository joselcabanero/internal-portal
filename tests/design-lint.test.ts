import { describe, expect, it } from "vitest";
import { findDesignViolations } from "@/components/ads/lint";

describe("design system", () => {
  it("has no design-system violations (tokens, Lucide 1.5, no other chart libraries)", () => {
    expect(findDesignViolations(["app", "components", "lib", "styles"])).toEqual([]);
  });
});
