import { describe, expect, it } from "vitest";
import { assetName, hashContent, imageHtml, normalizePublicPath, slugify } from "../../src/assets.js";

describe("asset helpers", () => {
  it("creates deterministic hashes", () => {
    expect(hashContent("abc")).toBe(hashContent("abc"));
    expect(hashContent("abc")).not.toBe(hashContent("abcd"));
  });

  it("creates safe slugs", () => {
    expect(slugify("My Diagram!")).toBe("my-diagram");
    expect(slugify("!!!")).toBe("diagram");
  });

  it("creates slug hash asset names", () => {
    expect(assetName("Flow Chart", "<svg/>")).toMatch(/^flow-chart-[a-f0-9]{10}\.svg$/);
  });

  it("normalizes public paths", () => {
    expect(normalizePublicPath("images/generated/")).toBe("/images/generated");
  });

  it("escapes figure HTML", () => {
    const html = imageHtml("/x.svg", "<Title>", "<Caption>", "flow");
    expect(html).toContain("&lt;Title&gt;");
    expect(html).toContain("&lt;Caption&gt;");
    expect(html).toContain("<figure");
  });
});
