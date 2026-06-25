import { describe, expect, it } from "vitest";
import { extractMsvgFences } from "../../src/fence-extractor.js";

describe("extractMsvgFences", () => {
  it("finds msvg fenced blocks", () => {
    const fences = extractMsvgFences("# Post\n```msvg\ntitle: Test\n```\n");
    expect(fences).toHaveLength(1);
    expect(fences[0]?.value).toContain("title: Test");
    expect(fences[0]?.line).toBe(2);
  });

  it("ignores unrelated fences", () => {
    expect(extractMsvgFences("```ts\nconst x = 1;\n```")).toHaveLength(0);
  });
});
