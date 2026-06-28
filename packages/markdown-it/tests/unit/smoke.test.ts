import { describe, it, expect } from "vitest";
import * as markdownIt from "../../src/index.js";

describe("markdown-it entry point", () => {
  it("loads and exposes the public api", () => {
    expect(typeof markdownIt.msvgMarkdownIt).toBe("function");
  });
});
