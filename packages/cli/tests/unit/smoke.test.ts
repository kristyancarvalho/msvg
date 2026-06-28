import { describe, it, expect } from "vitest";
import * as cli from "../../src/index.js";

describe("cli entry point", () => {
  it("loads and exposes the public api", () => {
    expect(typeof cli.extractMsvgFences).toBe("function");
    expect(typeof cli.resolveInputFiles).toBe("function");
    expect(typeof cli.resolveInputs).toBe("function");
    expect(typeof cli.checkCommand).toBe("function");
    expect(typeof cli.buildCommand).toBe("function");
    expect(typeof cli.renderCommand).toBe("function");
    expect(typeof cli.inspectCommand).toBe("function");
  });
});
