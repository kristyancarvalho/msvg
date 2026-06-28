import { describe, it, expect } from "vitest";
import { renderSvg } from "../../src/render.js";
import type {
  FlowDiagram,
  ComparisonDiagram,
  SequenceDiagram,
  ArchitectureDiagram,
  TimelineDiagram,
  MindmapDiagram,
  LayersDiagram,
  DiagramDocument,
} from "@markdown-utils/msvg-core";

const TOL = 4;

interface ViewBox {
  width: number;
  height: number;
}

function viewBoxOf(svg: string): ViewBox {
  const match = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (match === null) throw new Error("missing viewBox");
  return { width: Number(match[1]), height: Number(match[2]) };
}

function attrNumber(element: string, name: string): number | undefined {
  const match = element.match(new RegExp(`\\b${name}="(-?[\\d.]+)"`));
  return match === null ? undefined : Number(match[1]);
}

function elements(svg: string, tag: string): string[] {
  const matches = svg.match(new RegExp(`<${tag}\\b[^>]*>`, "g"));
  return matches === null ? [] : matches;
}

function assertWithinBounds(svg: string): void {
  const box = viewBoxOf(svg);

  for (const rect of elements(svg, "rect")) {
    const x = attrNumber(rect, "x") ?? 0;
    const y = attrNumber(rect, "y") ?? 0;
    const w = attrNumber(rect, "width") ?? 0;
    const h = attrNumber(rect, "height") ?? 0;
    expect(x, `rect left ${rect}`).toBeGreaterThanOrEqual(-TOL);
    expect(y, `rect top ${rect}`).toBeGreaterThanOrEqual(-TOL);
    expect(x + w, `rect right ${rect}`).toBeLessThanOrEqual(box.width + TOL);
    expect(y + h, `rect bottom ${rect}`).toBeLessThanOrEqual(box.height + TOL);
  }

  for (const circle of elements(svg, "circle")) {
    const cx = attrNumber(circle, "cx") ?? 0;
    const cy = attrNumber(circle, "cy") ?? 0;
    const r = attrNumber(circle, "r") ?? 0;
    expect(cx - r, `circle left ${circle}`).toBeGreaterThanOrEqual(-TOL);
    expect(cy - r, `circle top ${circle}`).toBeGreaterThanOrEqual(-TOL);
    expect(cx + r, `circle right ${circle}`).toBeLessThanOrEqual(box.width + TOL);
    expect(cy + r, `circle bottom ${circle}`).toBeLessThanOrEqual(box.height + TOL);
  }

  for (const text of elements(svg, "text")) {
    const x = attrNumber(text, "x") ?? 0;
    const y = attrNumber(text, "y") ?? 0;
    expect(x, `text x ${text}`).toBeGreaterThanOrEqual(-TOL);
    expect(y, `text y ${text}`).toBeGreaterThanOrEqual(-TOL);
    expect(x, `text x ${text}`).toBeLessThanOrEqual(box.width + TOL);
    expect(y, `text y ${text}`).toBeLessThanOrEqual(box.height + TOL);
  }
}

const longWord = "supercalifragilisticexpialidocioussupercalifragilistic";
const longLabel = "validate, normalize, persist and broadcast the incoming session token payload";

const flow: FlowDiagram = {
  type: "flow",
  title: "Flow bounds",
  direction: "LR",
  nodes: [
    { id: "a", label: longWord, kind: "input" },
    { id: "b", label: "Process", kind: "process" },
    { id: "c", label: "Decision", kind: "decision" },
  ],
  edges: [
    { from: "a", to: "b", label: longLabel },
    { from: "b", to: "c", label: "ok" },
  ],
};

const comparison: ComparisonDiagram = {
  type: "comparison",
  title: "Comparison bounds",
  columns: [
    { id: "x", label: "Option X", tone: "positive", items: [longLabel, "short"] },
    { id: "y", label: "Option Y", tone: "negative", items: ["one", longWord] },
  ],
  verdict:
    "Overall option X is preferable for most teams because it balances cost, reliability and long term maintenance effort across the whole platform without locking anyone in",
};

const sequence: SequenceDiagram = {
  type: "sequence",
  title: "Sequence bounds",
  participants: [
    { id: "u", label: "User" },
    { id: "s", label: "Service" },
  ],
  messages: [
    { from: "u", to: "s", label: "request" },
    { from: "s", to: "s", label: longLabel, note: longLabel },
  ],
};

const architecture: ArchitectureDiagram = {
  type: "architecture",
  title: "Architecture bounds",
  direction: "LR",
  components: [
    { id: "c1", label: "Client", kind: "client" },
    { id: "c2", label: "Service", kind: "service" },
    { id: "c3", label: "Database", kind: "database" },
  ],
  groups: [{ id: "g1", label: "Backend group", componentIds: ["c2", "c3"] }],
  connections: [
    { from: "c1", to: "c2", label: longLabel },
    { from: "c2", to: "c3", label: "writes" },
  ],
};

const timeline: TimelineDiagram = {
  type: "timeline",
  title: "Timeline bounds",
  events: [
    { at: "2024", title: "Kickoff", status: "done" },
    { at: "2025", title: longLabel, status: "risk" },
    { at: "2026", title: "Launch", status: "blocked" },
  ],
};

const mindmap: MindmapDiagram = {
  type: "mindmap",
  title: "Mindmap bounds",
  root: "Root",
  branches: [
    { label: "Left branch", items: [longWord, "short item"] },
    { label: "Right branch", items: ["a", "b"] },
  ],
};

const layers: LayersDiagram = {
  type: "layers",
  title: "Layers bounds",
  layers: [
    { label: longLabel, note: "note", emphasis: true },
    { label: "Layer 2" },
  ],
};

const cases: Array<{ name: string; diagram: DiagramDocument }> = [
  { name: "flow", diagram: flow },
  { name: "comparison", diagram: comparison },
  { name: "sequence", diagram: sequence },
  { name: "architecture", diagram: architecture },
  { name: "timeline", diagram: timeline },
  { name: "mindmap", diagram: mindmap },
  { name: "layers", diagram: layers },
];

describe("layout bounds", () => {
  for (const testCase of cases) {
    it(`keeps every rect, circle and text inside the viewBox for ${testCase.name}`, () => {
      const { svg } = renderSvg(testCase.diagram);
      assertWithinBounds(svg);
    });
  }

  it("reserves height for a multi-line comparison verdict", () => {
    const { svg } = renderSvg(comparison);
    const box = viewBoxOf(svg);
    const rects = elements(svg, "rect");
    const bottoms = rects.map((r) => (attrNumber(r, "y") ?? 0) + (attrNumber(r, "height") ?? 0));
    const maxBottom = Math.max(...bottoms);
    expect(maxBottom).toBeLessThanOrEqual(box.height + TOL);
  });
});
