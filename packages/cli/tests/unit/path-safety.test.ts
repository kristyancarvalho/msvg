import { describe, expect, it } from "vitest";
import { safeOutputPath } from "../../src/path-safety.js";

describe("safeOutputPath", () => {
  it("allows paths inside the output directory", () => {
    expect(safeOutputPath("/tmp/out", "a/b.svg")).toBe("/tmp/out/a/b.svg");
  });

  it("rejects traversal", () => {
    expect(() => safeOutputPath("/tmp/out", "../x.svg")).toThrow();
  });

  it("rejects absolute paths", () => {
    expect(() => safeOutputPath("/tmp/out", "/tmp/x.svg")).toThrow();
  });
});
