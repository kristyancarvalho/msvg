import { describe, it, expect } from "vitest";
import * as core from "../../src/index.js";

describe("core entry point", () => {
  it("loads and exposes the public api", () => {
    expect(typeof core.parseMSVG).toBe("function");
    expect(typeof core.normalizeDiagram).toBe("function");
    expect(typeof core.validateDiagram).toBe("function");
    expect(typeof core.parseAndValidate).toBe("function");
    expect(typeof core.hasErrors).toBe("function");
    expect(core.DiagCodes).toBeTypeOf("object");
  });
});
