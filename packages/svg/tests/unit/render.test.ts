import { describe, it, expect } from "vitest";
import { renderSvg, layoutDiagram } from "../../src/render.js";
import type {
  FlowDiagram,
  MindmapDiagram,
  LayersDiagram,
  ComparisonDiagram,
  SequenceDiagram,
  TimelineDiagram,
  ArchitectureDiagram,
} from "@markdown-utils/msvg-core";

const flow: FlowDiagram = {
  type: "flow",
  title: "Pipeline",
  description: "A simple pipeline",
  direction: "LR",
  nodes: [
    { id: "a", label: "Input", kind: "input" },
    { id: "b", label: "Process", kind: "process" },
    { id: "c", label: "Output", kind: "output" },
  ],
  edges: [
    { from: "a", to: "b", label: "step 1" },
    { from: "b", to: "c", label: "step 2" },
  ],
};

const mindmap: MindmapDiagram = {
  type: "mindmap",
  title: "Concepts",
  root: "MSVG",
  branches: [
    { label: "Rendering", items: ["SVG", "Themes"] },
    { label: "Authoring", items: ["YAML", "Markdown"] },
  ],
};

const layers: LayersDiagram = {
  type: "layers",
  title: "Stack",
  layers: [
    { label: "Top", note: "User-facing" },
    { label: "Middle" },
    { label: "Bottom", emphasis: true },
  ],
};

const comparison: ComparisonDiagram = {
  type: "comparison",
  title: "A vs B",
  columns: [
    { id: "a", label: "Option A", tone: "positive", items: ["Fast", "Cheap"] },
    { id: "b", label: "Option B", tone: "negative", items: ["Slow", "Expensive"] },
  ],
  verdict: "Use Option A.",
};

const sequence: SequenceDiagram = {
  type: "sequence",
  title: "Auth Flow",
  participants: [
    { id: "user", label: "User" },
    { id: "server", label: "Server" },
  ],
  messages: [
    { from: "user", to: "server", label: "login" },
    { from: "server", to: "user", label: "token" },
    { from: "user", to: "user", label: "store" },
  ],
};

const timeline: TimelineDiagram = {
  type: "timeline",
  title: "Roadmap",
  events: [
    { at: "Q1", title: "Launch", description: "Initial release", status: "done" },
    { at: "Q2", title: "Scale", status: "current" },
    { at: "Q3", title: "Expand", status: "future" },
  ],
};

const architecture: ArchitectureDiagram = {
  type: "architecture",
  title: "System",
  direction: "LR",
  components: [
    { id: "api", label: "API", kind: "service" },
    { id: "db", label: "Database", kind: "storage" },
    { id: "client", label: "Client", kind: "client" },
  ],
  groups: [{ id: "backend", label: "Backend", componentIds: ["api", "db"] }],
  connections: [
    { from: "client", to: "api", label: "request" },
    { from: "api", to: "db", label: "query" },
  ],
};

const ALL_DIAGRAMS = [flow, mindmap, layers, comparison, sequence, timeline, architecture];

describe("renderSvg — core SVG validity", () => {
  for (const diagram of ALL_DIAGRAMS) {
    it(`renders ${diagram.type} without throwing`, () => {
      const result = renderSvg(diagram);
      expect(result.svg).toBeTruthy();
      expect(result.svg.length).toBeGreaterThan(100);
    });

    it(`${diagram.type} SVG has correct xmlns`, () => {
      const { svg } = renderSvg(diagram);
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it(`${diagram.type} SVG has viewBox`, () => {
      const { svg } = renderSvg(diagram);
      expect(svg).toContain("viewBox=");
    });

    it(`${diagram.type} SVG has title element (accessibility)`, () => {
      const { svg } = renderSvg(diagram);
      expect(svg).toContain("<title");
      expect(svg).toContain(diagram.title);
    });

    it(`${diagram.type} SVG has role="img" (accessibility)`, () => {
      const { svg } = renderSvg(diagram);
      expect(svg).toContain('role="img"');
    });

    it(`${diagram.type} output is deterministic`, () => {
      const r1 = renderSvg(diagram);
      const r2 = renderSvg(diagram);
      expect(r1.svg).toBe(r2.svg);
    });

    it(`${diagram.type} SVG does not contain <script>`, () => {
      const { svg } = renderSvg(diagram);
      expect(svg.toLowerCase()).not.toContain("<script");
    });

    it(`${diagram.type} SVG does not contain event handlers`, () => {
      const { svg } = renderSvg(diagram);
      expect(svg).not.toMatch(/\bon\w+\s*=/);
    });

    it(`${diagram.type} SVG does not contain external URLs`, () => {
      const { svg } = renderSvg(diagram);
      const withoutNamespace = svg.replace('xmlns="http://www.w3.org/2000/svg"', "");
      expect(withoutNamespace).not.toContain("http://");
      expect(withoutNamespace).not.toContain("https://");
      expect(withoutNamespace).not.toMatch(/\b(?:href|src)=["'][^"']+/);
    });
  }
});

describe("renderSvg — accessibility desc", () => {
  it("includes desc element when description is provided", () => {
    const { svg } = renderSvg(flow);
    expect(svg).toContain("<desc");
    expect(svg).toContain("A simple pipeline");
  });

  it("generates desc when no description is set", () => {
    const { svg } = renderSvg(mindmap);
    expect(svg).toContain("<desc");
    expect(svg).toContain("Mind map with 2 branches.");
  });
});

describe("renderSvg — XSS / escaping", () => {
  it("escapes HTML in node labels", () => {
    const xssFlow: FlowDiagram = {
      ...flow,
      nodes: [
        { id: "a", label: '<script>alert("xss")</script>' },
        { id: "b", label: "B" },
      ],
      edges: [],
    };
    const { svg } = renderSvg(xssFlow);
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
  });

  it("escapes HTML in diagram title", () => {
    const d: FlowDiagram = { ...flow, title: '<img src=x onerror="evil()">' };
    const { svg } = renderSvg(d);
    expect(svg).not.toContain("<img");
    expect(svg).toContain("&lt;img");
  });

  it("escapes ampersands in labels", () => {
    const d: FlowDiagram = {
      ...flow,
      nodes: [{ id: "a", label: "AT&T" }, { id: "b", label: "B" }],
      edges: [],
    };
    const { svg } = renderSvg(d);
    expect(svg).toContain("AT&amp;T");
    expect(svg).not.toMatch(/AT&T[^;]/);
  });

  it("escapes quotes in edge labels", () => {
    const d: FlowDiagram = {
      ...flow,
      edges: [{ from: "a", to: "b", label: 'say "hello"' }],
    };
    const { svg } = renderSvg(d);
    expect(svg).toContain("say &quot;hello&quot;");
  });

  it("escapes HTML in timeline event titles", () => {
    const d: TimelineDiagram = {
      ...timeline,
      events: [{ at: "Q1", title: "<b>bold</b>", status: "done" }],
    };
    const { svg } = renderSvg(d);
    expect(svg).not.toContain("<b>");
    expect(svg).toContain("&lt;b&gt;");
  });

  it("escapes HTML in comparison items", () => {
    const d: ComparisonDiagram = {
      ...comparison,
      columns: [{ id: "a", label: "A", items: ['<script>evil()</script>'] }],
    };
    const { svg } = renderSvg(d);
    expect(svg).not.toContain("<script>");
  });

  it("escapes HTML in sequence messages", () => {
    const d: SequenceDiagram = {
      ...sequence,
      messages: [{ from: "user", to: "server", label: '<img onerror="x">' }],
    };
    const { svg } = renderSvg(d);
    expect(svg).not.toContain("<img");
    expect(svg).toContain("&lt;img");
  });
});

describe("renderSvg — themes", () => {
  for (const themeName of ["paper", "neutral", "mono", "dark"]) {
    it(`renders with '${themeName}' theme`, () => {
      const { svg, theme } = renderSvg(flow, { theme: themeName });
      expect(svg).toBeTruthy();
      expect(theme.background).toBeTruthy();
    });
  }

  it("accepts custom theme tokens", () => {
    const { svg } = renderSvg(flow, { theme: { background: "#ff0000" } });
    expect(svg).toContain("#ff0000");
  });

  it("ignores unsafe custom theme URLs", () => {
    const { svg, theme } = renderSvg(flow, { theme: { background: "url(https://example.test/a.svg)" } });
    expect(theme.background).toBe("#faf9f7");
    expect(svg).not.toContain("https://example.test");
  });

  it("returns the resolved theme", () => {
    const { theme } = renderSvg(flow, { theme: "dark" });
    expect(theme.background).toBe("#0f0f11");
  });
});

describe("renderSvg — captions", () => {
  it("includes caption text in SVG when provided", () => {
    const d: FlowDiagram = { ...flow, caption: "Figure 1: Pipeline" };
    const { svg } = renderSvg(d);
    expect(svg).toContain("Figure 1: Pipeline");
  });

  it("escapes caption text", () => {
    const d: FlowDiagram = { ...flow, caption: "Fig <1>" };
    const { svg } = renderSvg(d);
    expect(svg).not.toContain("<1>");
    expect(svg).toContain("&lt;1&gt;");
  });
});

describe("renderSvg — flow specific", () => {
  it("renders all directions without throwing", () => {
    for (const direction of ["LR", "RL", "TB", "BT"] as const) {
      const d: FlowDiagram = { ...flow, direction };
      expect(() => renderSvg(d)).not.toThrow();
    }
  });

  it("renders decision nodes", () => {
    const d: FlowDiagram = {
      ...flow,
      nodes: [
        { id: "a", label: "Decision", kind: "decision" },
        { id: "b", label: "End" },
      ],
      edges: [{ from: "a", to: "b" }],
    };
    const { svg } = renderSvg(d);
    expect(svg).toContain("Decision");
  });

  it("produces warning diagnostic for >20 nodes", () => {
    const manyNodes = Array.from({ length: 21 }, (_, i) => ({ id: `n${i}`, label: `Node ${i}` }));
    const d: FlowDiagram = { ...flow, nodes: manyNodes, edges: [] };
    const { diagnostics } = renderSvg(d);
    expect(diagnostics.some((diag) => diag.severity === "warning")).toBe(true);
  });
});

describe("renderSvg — architecture specific", () => {
  it("renders all architecture directions", () => {
    for (const direction of ["LR", "RL", "TB", "BT"] as const) {
      const d: ArchitectureDiagram = { ...architecture, direction };
      expect(() => renderSvg(d)).not.toThrow();
    }
  });

  it("renders group labels", () => {
    const { svg } = renderSvg(architecture);
    expect(svg).toContain("Backend");
  });
});

describe("renderSvg — mindmap specific", () => {
  it("renders root label", () => {
    const { svg } = renderSvg(mindmap);
    expect(svg).toContain("MSVG");
  });

  it("renders branch labels and items", () => {
    const { svg } = renderSvg(mindmap);
    expect(svg).toContain("Rendering");
    expect(svg).toContain("SVG");
    expect(svg).toContain("Themes");
  });
});

describe("renderSvg — layers specific", () => {
  it("renders layer labels", () => {
    const { svg } = renderSvg(layers);
    expect(svg).toContain("Top");
    expect(svg).toContain("Middle");
    expect(svg).toContain("Bottom");
  });

  it("renders bottom-up direction", () => {
    const d: LayersDiagram = { ...layers, direction: "bottom-up" };
    expect(() => renderSvg(d)).not.toThrow();
  });
});

describe("renderSvg — sequence specific", () => {
  it("renders participant labels", () => {
    const { svg } = renderSvg(sequence);
    expect(svg).toContain("User");
    expect(svg).toContain("Server");
  });

  it("renders self-loop messages", () => {
    const { svg } = renderSvg(sequence);
    expect(svg).toContain("store");
  });
});

describe("renderSvg — timeline specific", () => {
  it("renders event at labels", () => {
    const { svg } = renderSvg(timeline);
    expect(svg).toContain("Q1");
    expect(svg).toContain("Q2");
    expect(svg).toContain("Q3");
  });

  it("renders event descriptions", () => {
    const { svg } = renderSvg(timeline);
    expect(svg).toContain("Initial release");
  });
});

describe("layoutDiagram", () => {
  it("returns svg and diagnostics like renderSvg", () => {
    const result = layoutDiagram(flow);
    expect(result.svg).toBeTruthy();
    expect(Array.isArray(result.diagnostics)).toBe(true);
  });
});

describe("public exports", () => {
  it("exports renderer, theme, escaping, and text helpers", async () => {
    const api = await import("../../src/index.js");
    expect(api.renderSvg).toBeTypeOf("function");
    expect(api.layoutDiagram).toBeTypeOf("function");
    expect(api.resolveTheme).toBeTypeOf("function");
    expect(api.escapeXml).toBeTypeOf("function");
    expect(api.wrapText).toBeTypeOf("function");
    expect(api.BUILT_IN_THEME_NAMES).toContain("paper");
  });
});
