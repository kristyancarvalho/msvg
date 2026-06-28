import { describe, it, expect } from "vitest";
import * as svg from "../../src/index.js";

describe("svg entry point", () => {
  it("loads and exposes the public api", () => {
    expect(typeof svg.renderSvg).toBe("function");
    expect(typeof svg.layoutDiagram).toBe("function");
    expect(typeof svg.altTextFor).toBe("function");
    expect(typeof svg.resolveTheme).toBe("function");
    expect(typeof svg.resolveThemeResult).toBe("function");
    expect(typeof svg.isValidColor).toBe("function");
    expect(Array.isArray(svg.BUILT_IN_THEME_NAMES)).toBe(true);
  });
});
