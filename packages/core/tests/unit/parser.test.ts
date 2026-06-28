import { describe, it, expect } from "vitest";
import { parseMSVG } from "../../src/parser.js";
import { DiagCodes } from "../../src/diagnostics.js";

describe("parseMSVG", () => {
  it("parses a valid YAML object", () => {
    const source = `type: flow\ntitle: My Diagram`;
    const result = parseMSVG(source);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.raw).toMatchObject({ type: "flow", title: "My Diagram" });
  });

  it("returns error for invalid YAML", () => {
    const source = `type: flow\n  invalid: [unclosed`;
    const result = parseMSVG(source);
    expect(result.raw).toBeNull();
    expect(result.diagnostics.some((d) => d.code === DiagCodes.PARSE_INVALID_YAML)).toBe(true);
  });

  it("returns error for empty source", () => {
    const result = parseMSVG("");
    expect(result.raw).toBeNull();
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(
      result.diagnostics.some(
        (d) => d.code === DiagCodes.PARSE_NOT_OBJECT || d.code === DiagCodes.PARSE_INVALID_YAML
      )
    ).toBe(true);
  });

  it("returns error for YAML scalar (non-object)", () => {
    const result = parseMSVG("just a string");
    expect(result.raw).toBeNull();
    expect(result.diagnostics.some((d) => d.code === DiagCodes.PARSE_NOT_OBJECT)).toBe(true);
  });

  it("returns error for YAML array (non-object)", () => {
    const result = parseMSVG("- a\n- b");
    expect(result.raw).toBeNull();
    expect(result.diagnostics.some((d) => d.code === DiagCodes.PARSE_NOT_OBJECT)).toBe(true);
  });

  it("attaches filePath to diagnostics when provided", () => {
    const result = parseMSVG("", { filePath: "test.md" });
    expect(result.diagnostics[0]?.filePath).toBe("test.md");
  });

  it("parses a complex YAML object without errors", () => {
    const source = `
type: flow
title: "Pipeline"
direction: LR
nodes:
  a:
    label: "A"
  b:
    label: "B"
edges:
  - a -> b: "link"
`;
    const result = parseMSVG(source);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.raw).not.toBeNull();
  });

  it("returns null raw for null YAML", () => {
    const result = parseMSVG("null");
    expect(result.raw).toBeNull();
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });

  it("reports a diagnostic for duplicate mapping keys", () => {
    const source = `type: flow\ntitle: First\ntitle: Second`;
    const result = parseMSVG(source);
    expect(result.raw).toBeNull();
    const dup = result.diagnostics.find((d) => d.code === DiagCodes.DUPLICATE_KEY);
    expect(dup).toBeDefined();
    expect(dup?.severity).toBe("error");
    expect(dup?.line).toBeGreaterThan(0);
    expect(dup?.column).toBeGreaterThan(0);
  });

  it("attaches a position to parse errors", () => {
    const source = `type: flow\ntitle: First\ntitle: Second`;
    const result = parseMSVG(source, { filePath: "dup.msvg.yml" });
    const dup = result.diagnostics.find((d) => d.code === DiagCodes.DUPLICATE_KEY);
    expect(dup?.filePath).toBe("dup.msvg.yml");
    expect(dup?.line).toBe(3);
  });

  it("resolves anchors and aliases without errors", () => {
    const source = `type: flow\ntitle: Anchors\nshared: &label hello\nalias: *label`;
    const result = parseMSVG(source);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.raw).toMatchObject({ shared: "hello", alias: "hello" });
  });
});
