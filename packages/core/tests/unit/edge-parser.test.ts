import { describe, it, expect } from "vitest";
import { parseEdgeShorthand, parseEdgeList } from "../../src/edge-parser.js";
import { DiagCodes } from "../../src/diagnostics.js";

describe("parseEdgeShorthand", () => {
  it("parses 'a -> b' shorthand string", () => {
    const result = parseEdgeShorthand("a -> b");
    expect(result.diagnostics).toHaveLength(0);
    expect(result.edge).toMatchObject({ from: "a", to: "b" });
    expect(result.edge?.label).toBeUndefined();
  });

  it("parses 'a -> b: \"label\"' shorthand with quoted label", () => {
    const result = parseEdgeShorthand('a -> b: "my label"');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.edge).toMatchObject({ from: "a", to: "b", label: "my label" });
  });

  it("parses object with from/to/label fields", () => {
    const result = parseEdgeShorthand({ from: "a", to: "b", label: "go" });
    expect(result.diagnostics).toHaveLength(0);
    expect(result.edge).toMatchObject({ from: "a", to: "b", label: "go" });
  });

  it("parses object with from/to only", () => {
    const result = parseEdgeShorthand({ from: "x", to: "y" });
    expect(result.diagnostics).toHaveLength(0);
    expect(result.edge).toMatchObject({ from: "x", to: "y" });
    expect(result.edge?.label).toBeUndefined();
  });

  it("returns error for object missing 'from'", () => {
    const result = parseEdgeShorthand({ to: "b" });
    expect(result.edge).toBeNull();
    expect(result.diagnostics.some((d) => d.code === DiagCodes.INVALID_EDGE)).toBe(true);
  });

  it("returns error for object missing 'to'", () => {
    const result = parseEdgeShorthand({ from: "a" });
    expect(result.edge).toBeNull();
    expect(result.diagnostics.some((d) => d.code === DiagCodes.INVALID_EDGE)).toBe(true);
  });

  it("returns error for unrecognizable string", () => {
    const result = parseEdgeShorthand("not an edge at all !!!");
    expect(result.edge).toBeNull();
    expect(result.diagnostics.some((d) => d.code === DiagCodes.INVALID_EDGE)).toBe(true);
  });

  it("parses unquoted label shorthand", () => {
    const result = parseEdgeShorthand("a -> b: some label");
    expect(result.edge).toMatchObject({ from: "a", to: "b", label: "some label" });
  });

  it("returns error for non-string, non-object input", () => {
    const result = parseEdgeShorthand(42);
    expect(result.edge).toBeNull();
    expect(result.diagnostics.some((d) => d.code === DiagCodes.INVALID_EDGE)).toBe(true);
  });
});

describe("parseEdgeList", () => {
  it("parses a list of shorthand strings", () => {
    const { edges, diagnostics } = parseEdgeList(["a -> b", "b -> c"]);
    expect(diagnostics).toHaveLength(0);
    expect(edges).toHaveLength(2);
    expect(edges[0]).toMatchObject({ from: "a", to: "b" });
    expect(edges[1]).toMatchObject({ from: "b", to: "c" });
  });

  it("parses YAML key shorthand objects", () => {
    const raw = [{ "a -> b": "link label" }];
    const { edges, diagnostics } = parseEdgeList(raw);
    expect(diagnostics).toHaveLength(0);
    expect(edges[0]).toMatchObject({ from: "a", to: "b", label: "link label" });
  });

  it("parses mixed shorthand and object form", () => {
    const raw = ["a -> b", { from: "b", to: "c", label: "next" }];
    const { edges, diagnostics } = parseEdgeList(raw);
    expect(diagnostics).toHaveLength(0);
    expect(edges).toHaveLength(2);
  });

  it("accumulates errors for invalid entries", () => {
    const { edges, diagnostics } = parseEdgeList(["not-an-edge !!!!"]);
    expect(edges).toHaveLength(0);
    expect(diagnostics.some((d) => d.code === DiagCodes.INVALID_EDGE)).toBe(true);
  });

  it("handles empty array", () => {
    const { edges, diagnostics } = parseEdgeList([]);
    expect(edges).toHaveLength(0);
    expect(diagnostics).toHaveLength(0);
  });
});
