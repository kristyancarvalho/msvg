import { describe, it, expect } from "vitest";
import { renderSvg, altTextFor } from "../../src/render.js";
import type {
  FlowDiagram,
  TimelineDiagram,
  ComparisonDiagram,
} from "@markdown-utils/msvg-core";

const baseFlow: FlowDiagram = {
  type: "flow",
  title: "Pipeline",
  direction: "LR",
  nodes: [
    { id: "a", label: "Input", kind: "input" },
    { id: "b", label: "Output", kind: "output" },
  ],
  edges: [{ from: "a", to: "b", label: "step" }],
};

function titleId(svg: string): string {
  const match = svg.match(/id="([^"]*-title)"/);
  return match ? match[1] : "";
}

function markerId(svg: string): string {
  const match = svg.match(/<marker id="([^"]+)"/);
  return match ? match[1] : "";
}

describe("altTextFor — fallback chain", () => {
  it("prefers an explicit alt", () => {
    const diagram: FlowDiagram = { ...baseFlow, alt: "Explicit alt", description: "A description" };
    expect(altTextFor(diagram)).toBe("Explicit alt");
  });

  it("falls back to the description when alt is absent", () => {
    const diagram: FlowDiagram = { ...baseFlow, description: "A description" };
    expect(altTextFor(diagram)).toBe("A description");
  });

  it("falls back to a generated description when alt and description are absent", () => {
    const text = altTextFor(baseFlow);
    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toBe(baseFlow.title);
    expect(text.toLowerCase()).toContain("flow");
  });

  it("is exposed on the render result", () => {
    const result = renderSvg({ ...baseFlow, alt: "From render" });
    expect(result.altText).toBe("From render");
  });
});

describe("unique inline ids via idSalt", () => {
  it("produces distinct title ids for the same diagram with different salts", () => {
    const a = renderSvg(baseFlow, { idSalt: "0-1" });
    const b = renderSvg(baseFlow, { idSalt: "1-2" });
    expect(titleId(a.svg)).not.toBe("");
    expect(titleId(b.svg)).not.toBe("");
    expect(titleId(a.svg)).not.toBe(titleId(b.svg));
  });

  it("produces distinct marker ids for the same diagram with different salts", () => {
    const a = renderSvg(baseFlow, { idSalt: "0-1" });
    const b = renderSvg(baseFlow, { idSalt: "1-2" });
    expect(markerId(a.svg)).not.toBe("");
    expect(markerId(a.svg)).not.toBe(markerId(b.svg));
  });

  it("keeps aria-labelledby pointing at present ids", () => {
    const { svg } = renderSvg(baseFlow, { idSalt: "x" });
    const labelled = svg.match(/aria-labelledby="([^"]+)"/);
    expect(labelled).not.toBeNull();
    const ids = (labelled ? labelled[1] : "").split(/\s+/);
    for (const id of ids) {
      expect(svg).toContain(`id="${id}"`);
    }
  });
});

describe("non-color status indicators (timeline)", () => {
  const timeline: TimelineDiagram = {
    type: "timeline",
    title: "Roadmap",
    events: [
      { at: "Q1", title: "Launch", status: "done" },
      { at: "Q2", title: "Mitigate", status: "risk" },
      { at: "Q3", title: "Stop", status: "blocked" },
    ],
  };

  it("renders readable status labels, not color alone", () => {
    const { svg } = renderSvg(timeline);
    expect(svg).toContain("Done");
    expect(svg).toContain("At risk");
    expect(svg).toContain("Blocked");
  });
});

describe("non-color tone indicators (comparison)", () => {
  const comparison: ComparisonDiagram = {
    type: "comparison",
    title: "A vs B",
    columns: [
      { id: "a", label: "Option A", tone: "positive", items: ["Fast"] },
      { id: "b", label: "Option B", tone: "negative", items: ["Slow"] },
    ],
  };

  it("renders readable tone labels, not color alone", () => {
    const { svg } = renderSvg(comparison);
    expect(svg).toContain("Pros");
    expect(svg).toContain("Cons");
  });
});
