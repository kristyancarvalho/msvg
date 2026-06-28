import { describe, it, expect } from "vitest";
import msvgDefault, { msvgSvg } from "../../src/index.js";

describe("astro entry point", () => {
  it("loads and exposes the integration factory", () => {
    expect(typeof msvgDefault).toBe("function");
    expect(typeof msvgSvg).toBe("function");
  });
});
