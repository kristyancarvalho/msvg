import { describe, it, expect } from "vitest";
import { normalizeDiagram } from "../../src/normalizer.js";
import { DiagCodes } from "../../src/diagnostics.js";
import type {
  FlowDiagram,
  MindmapDiagram,
  LayersDiagram,
  ComparisonDiagram,
  SequenceDiagram,
  TimelineDiagram,
  ArchitectureDiagram,
} from "../../src/types.js";

const flowRaw = {
  type: "flow",
  title: "Test Flow",
  direction: "LR",
  nodes: {
    a: { label: "Node A", kind: "input" },
    b: { label: "Node B", kind: "process" },
  },
  edges: ["a -> b: \"connect\""],
};

describe("normalizeDiagram — flow", () => {
  it("normalizes a valid flow diagram", () => {
    const result = normalizeDiagram(flowRaw);
    expect(result.diagram).not.toBeNull();
    expect(result.diagram?.type).toBe("flow");
    const d = result.diagram as FlowDiagram;
    expect(d.title).toBe("Test Flow");
    expect(d.direction).toBe("LR");
    expect(d.nodes).toHaveLength(2);
    expect(d.nodes[0]).toMatchObject({ id: "a", label: "Node A", kind: "input" });
    expect(d.edges).toHaveLength(1);
    expect(d.edges[0]).toMatchObject({ from: "a", to: "b", label: "connect" });
  });

  it("returns error for flow without nodes", () => {
    const result = normalizeDiagram({ type: "flow", title: "X", edges: [] });
    expect(result.diagnostics.some((d) => d.code === DiagCodes.MISSING_NODES)).toBe(true);
  });

  it("returns error for flow without edges", () => {
    const result = normalizeDiagram({ type: "flow", title: "X", nodes: { a: { label: "A" } } });
    expect(result.diagnostics.some((d) => d.code === DiagCodes.MISSING_EDGES)).toBe(true);
  });

  it("returns error for invalid direction", () => {
    const result = normalizeDiagram({ ...flowRaw, direction: "INVALID" });
    expect(result.diagnostics.some((d) => d.code === DiagCodes.INVALID_DIRECTION)).toBe(true);
  });

  it("normalizes node as plain string label", () => {
    const raw = { type: "flow", title: "T", nodes: { a: "Label A" }, edges: [] };
    const result = normalizeDiagram(raw);
    const d = result.diagram as FlowDiagram | null;
    expect(d?.nodes[0]).toMatchObject({ id: "a", label: "Label A" });
  });
});

describe("normalizeDiagram — mindmap", () => {
  const mindmapRaw = {
    type: "mindmap",
    title: "Test Mindmap",
    root: "Root",
    branches: {
      "Branch A": ["Item 1", "Item 2"],
      "Branch B": ["Item 3"],
    },
  };

  it("normalizes a valid mindmap diagram", () => {
    const result = normalizeDiagram(mindmapRaw);
    expect(result.diagram).not.toBeNull();
    const d = result.diagram as MindmapDiagram;
    expect(d.root).toBe("Root");
    expect(d.branches).toHaveLength(2);
    expect(d.branches[0]).toMatchObject({ label: "Branch A", items: ["Item 1", "Item 2"] });
  });

  it("returns error for missing root", () => {
    const result = normalizeDiagram({ type: "mindmap", title: "X", branches: { A: [] } });
    expect(result.diagnostics.some((d) => d.code === DiagCodes.EMPTY_DIAGRAM)).toBe(true);
  });

  it("returns error for missing branches", () => {
    const result = normalizeDiagram({ type: "mindmap", title: "X", root: "R" });
    expect(result.diagnostics.some((d) => d.code === DiagCodes.MISSING_BRANCHES)).toBe(true);
  });
});

describe("normalizeDiagram — layers", () => {
  const layersRaw = {
    type: "layers",
    title: "Stack",
    layers: [
      { label: "Top", note: "Highest level" },
      { label: "Middle" },
      { label: "Bottom", emphasis: true },
    ],
  };

  it("normalizes a valid layers diagram", () => {
    const result = normalizeDiagram(layersRaw);
    expect(result.diagram).not.toBeNull();
    const d = result.diagram as LayersDiagram;
    expect(d.layers).toHaveLength(3);
    expect(d.layers[0]).toMatchObject({ label: "Top", note: "Highest level" });
    expect(d.layers[2]?.emphasis).toBe(true);
  });

  it("returns error for empty layers array", () => {
    const result = normalizeDiagram({ type: "layers", title: "X", layers: [] });
    expect(result.diagnostics.some((d) => d.code === DiagCodes.EMPTY_DIAGRAM)).toBe(true);
  });

  it("returns error for invalid direction", () => {
    const result = normalizeDiagram({ ...layersRaw, direction: "sideways" });
    expect(result.diagnostics.some((d) => d.code === DiagCodes.INVALID_DIRECTION)).toBe(true);
  });
});

describe("normalizeDiagram — comparison", () => {
  const compRaw = {
    type: "comparison",
    title: "Compare",
    columns: {
      left: { label: "Option A", tone: "positive", items: ["Fast", "Cheap"] },
      right: { label: "Option B", tone: "negative", items: ["Slow", "Expensive"] },
    },
  };

  it("normalizes a valid comparison diagram", () => {
    const result = normalizeDiagram(compRaw);
    expect(result.diagram).not.toBeNull();
    const d = result.diagram as ComparisonDiagram;
    expect(d.columns).toHaveLength(2);
    expect(d.columns[0]).toMatchObject({ id: "left", label: "Option A", tone: "positive" });
  });

  it("warns for invalid column tone", () => {
    const raw = { ...compRaw, columns: { a: { label: "A", tone: "rainbow", items: ["x"] } } };
    const result = normalizeDiagram(raw);
    expect(result.diagnostics.some((d) => d.code === DiagCodes.INVALID_COLUMN_TONE)).toBe(true);
  });

  it("returns error for missing columns", () => {
    const result = normalizeDiagram({ type: "comparison", title: "X" });
    expect(result.diagnostics.some((d) => d.code === DiagCodes.MISSING_COLUMNS)).toBe(true);
  });

  it("includes verdict when provided", () => {
    const raw = { ...compRaw, verdict: "Use Option A." };
    const result = normalizeDiagram(raw);
    const d = result.diagram as ComparisonDiagram | null;
    expect(d?.verdict).toBe("Use Option A.");
  });
});

describe("normalizeDiagram — sequence", () => {
  const seqRaw = {
    type: "sequence",
    title: "Login flow",
    participants: { user: "User", server: "Server" },
    messages: [
      { from: "user", to: "server", label: "login" },
      { from: "server", to: "user", label: "token" },
    ],
  };

  it("normalizes a valid sequence diagram", () => {
    const result = normalizeDiagram(seqRaw);
    expect(result.diagram).not.toBeNull();
    const d = result.diagram as SequenceDiagram;
    expect(d.participants).toHaveLength(2);
    expect(d.messages).toHaveLength(2);
    expect(d.messages[0]).toMatchObject({ from: "user", to: "server", label: "login" });
  });

  it("returns error for missing participants", () => {
    const result = normalizeDiagram({ type: "sequence", title: "X", messages: [] });
    expect(result.diagnostics.some((d) => d.code === DiagCodes.MISSING_PARTICIPANTS)).toBe(true);
  });

  it("returns error for missing messages", () => {
    const result = normalizeDiagram({ type: "sequence", title: "X", participants: { a: "A" } });
    expect(result.diagnostics.some((d) => d.code === DiagCodes.MISSING_MESSAGES)).toBe(true);
  });
});

describe("normalizeDiagram — timeline", () => {
  const timelineRaw = {
    type: "timeline",
    title: "Roadmap",
    events: [
      { at: "Q1", title: "Launch", status: "done" },
      { at: "Q2", title: "Scale", status: "future" },
    ],
  };

  it("normalizes a valid timeline diagram", () => {
    const result = normalizeDiagram(timelineRaw);
    expect(result.diagram).not.toBeNull();
    const d = result.diagram as TimelineDiagram;
    expect(d.events).toHaveLength(2);
    expect(d.events[0]).toMatchObject({ at: "Q1", title: "Launch", status: "done" });
  });

  it("warns for invalid event status", () => {
    const raw = {
      ...timelineRaw,
      events: [{ at: "Q1", title: "X", status: "unknown-status" }],
    };
    const result = normalizeDiagram(raw);
    expect(result.diagnostics.some((d) => d.code === DiagCodes.INVALID_EVENT_STATUS)).toBe(true);
  });

  it("returns error for missing events", () => {
    const result = normalizeDiagram({ type: "timeline", title: "X" });
    expect(result.diagnostics.some((d) => d.code === DiagCodes.MISSING_EVENTS)).toBe(true);
  });
});

describe("normalizeDiagram — architecture", () => {
  const archRaw = {
    type: "architecture",
    title: "System",
    direction: "TB",
    components: {
      api: { label: "API", kind: "service" },
      db: { label: "Database", kind: "storage" },
    },
    groups: {
      backend: { label: "Backend", components: ["api", "db"] },
    },
    connections: ["api -> db: \"query\""],
  };

  it("normalizes a valid architecture diagram", () => {
    const result = normalizeDiagram(archRaw);
    expect(result.diagram).not.toBeNull();
    const d = result.diagram as ArchitectureDiagram;
    expect(d.components).toHaveLength(2);
    expect(d.groups).toHaveLength(1);
    expect(d.connections).toHaveLength(1);
    expect(d.connections[0]).toMatchObject({ from: "api", to: "db", label: "query" });
  });

  it("warns for invalid component kind", () => {
    const raw = {
      ...archRaw,
      components: { api: { label: "API", kind: "unknown-kind" } },
      connections: [],
    };
    const result = normalizeDiagram(raw);
    expect(result.diagnostics.some((d) => d.code === DiagCodes.INVALID_COMPONENT_KIND)).toBe(true);
  });

  it("returns error for missing components", () => {
    const result = normalizeDiagram({ type: "architecture", title: "X" });
    expect(result.diagnostics.some((d) => d.code === DiagCodes.MISSING_COMPONENTS)).toBe(true);
  });
});

describe("normalizeDiagram — base behavior", () => {
  it("returns error for unknown type", () => {
    const result = normalizeDiagram({ type: "galaxy", title: "X" });
    expect(result.diagram).toBeNull();
    expect(result.diagnostics.some((d) => d.code === DiagCodes.UNKNOWN_TYPE)).toBe(true);
  });

  it("returns error for missing type", () => {
    const result = normalizeDiagram({ title: "X" });
    expect(result.diagram).toBeNull();
    expect(result.diagnostics.some((d) => d.code === DiagCodes.MISSING_TYPE)).toBe(true);
  });

  it("returns error for non-object input", () => {
    const result = normalizeDiagram("just a string");
    expect(result.diagram).toBeNull();
    expect(result.diagnostics.some((d) => d.code === DiagCodes.PARSE_NOT_OBJECT)).toBe(true);
  });

  it("preserves optional base fields", () => {
    const raw = {
      ...flowRaw,
      description: "A description",
      caption: "A caption",
      id: "my-diagram",
    };
    const result = normalizeDiagram(raw);
    expect(result.diagram?.description).toBe("A description");
    expect(result.diagram?.caption).toBe("A caption");
    expect(result.diagram?.id).toBe("my-diagram");
  });
});
