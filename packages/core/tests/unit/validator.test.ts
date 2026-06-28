import { describe, it, expect } from "vitest";
import { validateDiagram } from "../../src/validator.js";
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

function makeFlow(): FlowDiagram {
  return {
    type: "flow",
    title: "Test",
    nodes: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ],
    edges: [{ from: "a", to: "b", label: "go" }],
  };
}

describe("validateDiagram — flow", () => {
  it("validates a correct flow diagram", () => {
    const result = validateDiagram(makeFlow());
    expect(result.valid).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
  });

  it("reports duplicate node IDs", () => {
    const diagram: FlowDiagram = {
      ...makeFlow(),
      nodes: [
        { id: "a", label: "A" },
        { id: "a", label: "A duplicate" },
      ],
    };
    const result = validateDiagram(diagram);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((d) => d.code === DiagCodes.DUPLICATE_ID)).toBe(true);
  });

  it("reports unknown reference in edge from", () => {
    const diagram: FlowDiagram = {
      ...makeFlow(),
      edges: [{ from: "unknown", to: "a" }],
    };
    const result = validateDiagram(diagram);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((d) => d.code === DiagCodes.UNKNOWN_REFERENCE)).toBe(true);
  });

  it("reports unknown reference in edge to", () => {
    const diagram: FlowDiagram = {
      ...makeFlow(),
      edges: [{ from: "a", to: "ghost" }],
    };
    const result = validateDiagram(diagram);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((d) => d.code === DiagCodes.UNKNOWN_REFERENCE)).toBe(true);
  });

  it("warns for long labels", () => {
    const diagram: FlowDiagram = {
      ...makeFlow(),
      nodes: [
        { id: "a", label: "A".repeat(61) },
        { id: "b", label: "B" },
      ],
    };
    const result = validateDiagram(diagram);
    expect(result.diagnostics.some((d) => d.code === DiagCodes.LONG_LABEL)).toBe(true);
    expect(result.valid).toBe(true);
  });

  it("warns for unknown fields when warnUnknownFields is true", () => {
    const raw = {
      type: "flow",
      title: "T",
      nodes: { a: { label: "A" } },
      edges: [],
      colour: "red",
    };
    const normalizeResult = normalizeDiagram(raw);
    expect(normalizeResult.diagram).not.toBeNull();
    const vResult = validateDiagram(
      normalizeResult.diagram!,
      { warnUnknownFields: true },
      raw as Record<string, unknown>
    );
    expect(vResult.diagnostics.some((d) => d.code === DiagCodes.UNKNOWN_FIELD)).toBe(true);
  });

  it("does not warn for unknown fields when warnUnknownFields is false", () => {
    const raw = {
      type: "flow",
      title: "T",
      nodes: { a: { label: "A" } },
      edges: [],
      colour: "red",
    };
    const normalizeResult = normalizeDiagram(raw);
    const vResult = validateDiagram(
      normalizeResult.diagram!,
      { warnUnknownFields: false },
      raw as Record<string, unknown>
    );
    expect(vResult.diagnostics.some((d) => d.code === DiagCodes.UNKNOWN_FIELD)).toBe(false);
  });

  it("accepts the alt field without an unknown-field warning", () => {
    const raw = {
      type: "flow",
      title: "T",
      alt: "Readable summary",
      nodes: { a: { label: "A" } },
      edges: [],
    };
    const normalizeResult = normalizeDiagram(raw);
    const vResult = validateDiagram(
      normalizeResult.diagram!,
      { warnUnknownFields: true },
      raw as Record<string, unknown>
    );
    expect(vResult.diagnostics.some((d) => d.code === DiagCodes.UNKNOWN_FIELD)).toBe(false);
  });

  it("reports invalid node ID characters", () => {
    const diagram: FlowDiagram = {
      ...makeFlow(),
      nodes: [{ id: "node with spaces", label: "A" }, { id: "b", label: "B" }],
    };
    const result = validateDiagram(diagram);
    expect(result.diagnostics.some((d) => d.code === DiagCodes.INVALID_ID)).toBe(true);
  });

  it("validates group node references", () => {
    const diagram: FlowDiagram = {
      ...makeFlow(),
      groups: [{ id: "g1", label: "Group", nodeIds: ["a", "ghost"] }],
    };
    const result = validateDiagram(diagram);
    expect(result.diagnostics.some((d) => d.code === DiagCodes.UNKNOWN_REFERENCE)).toBe(true);
  });
});

describe("validateDiagram — mindmap", () => {
  const mindmap: MindmapDiagram = {
    type: "mindmap",
    title: "Map",
    root: "Root",
    branches: [{ label: "Branch A", items: ["Item 1"] }],
  };

  it("validates a correct mindmap", () => {
    const result = validateDiagram(mindmap);
    expect(result.valid).toBe(true);
  });

  it("warns for long branch labels", () => {
    const d: MindmapDiagram = {
      ...mindmap,
      branches: [{ label: "X".repeat(61), items: [] }],
    };
    const result = validateDiagram(d);
    expect(result.diagnostics.some((diag) => diag.code === DiagCodes.LONG_LABEL)).toBe(true);
  });
});

describe("validateDiagram — layers", () => {
  const layers: LayersDiagram = {
    type: "layers",
    title: "Stack",
    layers: [{ label: "Top" }, { label: "Bottom" }],
  };

  it("validates a correct layers diagram", () => {
    const result = validateDiagram(layers);
    expect(result.valid).toBe(true);
  });

  it("warns for long notes", () => {
    const d: LayersDiagram = {
      ...layers,
      layers: [{ label: "Top", note: "N".repeat(61) }],
    };
    const result = validateDiagram(d);
    expect(result.diagnostics.some((diag) => diag.code === DiagCodes.LONG_LABEL)).toBe(true);
  });
});

describe("validateDiagram — comparison", () => {
  const comparison: ComparisonDiagram = {
    type: "comparison",
    title: "A vs B",
    columns: [
      { id: "a", label: "Option A", items: ["Fast"] },
      { id: "b", label: "Option B", items: ["Cheap"] },
    ],
  };

  it("validates a correct comparison diagram", () => {
    const result = validateDiagram(comparison);
    expect(result.valid).toBe(true);
  });

  it("reports duplicate column IDs", () => {
    const d: ComparisonDiagram = {
      ...comparison,
      columns: [
        { id: "a", label: "A", items: [] },
        { id: "a", label: "A dup", items: [] },
      ],
    };
    const result = validateDiagram(d);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((diag) => diag.code === DiagCodes.DUPLICATE_ID)).toBe(true);
  });
});

describe("validateDiagram — sequence", () => {
  const sequence: SequenceDiagram = {
    type: "sequence",
    title: "Auth",
    participants: [
      { id: "user", label: "User" },
      { id: "server", label: "Server" },
    ],
    messages: [{ from: "user", to: "server", label: "login" }],
  };

  it("validates a correct sequence diagram", () => {
    const result = validateDiagram(sequence);
    expect(result.valid).toBe(true);
  });

  it("reports unknown participant in message", () => {
    const d: SequenceDiagram = {
      ...sequence,
      messages: [{ from: "ghost", to: "server", label: "msg" }],
    };
    const result = validateDiagram(d);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((diag) => diag.code === DiagCodes.UNKNOWN_REFERENCE)).toBe(true);
  });

  it("reports duplicate participant IDs", () => {
    const d: SequenceDiagram = {
      ...sequence,
      participants: [
        { id: "user", label: "User" },
        { id: "user", label: "User dup" },
      ],
    };
    const result = validateDiagram(d);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((diag) => diag.code === DiagCodes.DUPLICATE_ID)).toBe(true);
  });
});

describe("validateDiagram — timeline", () => {
  const timeline: TimelineDiagram = {
    type: "timeline",
    title: "Roadmap",
    events: [{ at: "Q1", title: "Launch", status: "done" }],
  };

  it("validates a correct timeline", () => {
    const result = validateDiagram(timeline);
    expect(result.valid).toBe(true);
  });

  it("warns for long event titles", () => {
    const d: TimelineDiagram = {
      ...timeline,
      events: [{ at: "Q1", title: "T".repeat(61) }],
    };
    const result = validateDiagram(d);
    expect(result.diagnostics.some((diag) => diag.code === DiagCodes.LONG_LABEL)).toBe(true);
  });
});

describe("validateDiagram — architecture", () => {
  const architecture: ArchitectureDiagram = {
    type: "architecture",
    title: "System",
    components: [
      { id: "api", label: "API", kind: "service" },
      { id: "db", label: "DB", kind: "storage" },
    ],
    groups: [{ id: "backend", label: "Backend", componentIds: ["api", "db"] }],
    connections: [{ from: "api", to: "db", label: "query" }],
  };

  it("validates a correct architecture diagram", () => {
    const result = validateDiagram(architecture);
    expect(result.valid).toBe(true);
  });

  it("reports unknown component in connection", () => {
    const d: ArchitectureDiagram = {
      ...architecture,
      connections: [{ from: "ghost", to: "db" }],
    };
    const result = validateDiagram(d);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((diag) => diag.code === DiagCodes.UNKNOWN_REFERENCE)).toBe(true);
  });

  it("reports unknown component in group", () => {
    const d: ArchitectureDiagram = {
      ...architecture,
      groups: [{ id: "g", label: "G", componentIds: ["ghost"] }],
    };
    const result = validateDiagram(d);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((diag) => diag.code === DiagCodes.UNKNOWN_REFERENCE)).toBe(true);
  });

  it("reports duplicate component IDs", () => {
    const d: ArchitectureDiagram = {
      ...architecture,
      components: [
        { id: "api", label: "API" },
        { id: "api", label: "API dup" },
      ],
    };
    const result = validateDiagram(d);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((diag) => diag.code === DiagCodes.DUPLICATE_ID)).toBe(true);
  });
});
