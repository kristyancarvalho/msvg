import { describe, it, expect } from "vitest";
import { renderSvg } from "../../src/render.js";
import { BUILT_IN_THEME_NAMES } from "../../src/theme.js";
import type { ThemeOutputMode } from "../../src/theme.js";
import type { DiagramDocument } from "@markdown-utils/msvg-core";

const fixtures: Record<string, DiagramDocument> = {
  flow: {
    type: "flow",
    title: "Flow matrix",
    direction: "LR",
    nodes: [
      { id: "a", label: "Start", kind: "input" },
      { id: "b", label: "Work", kind: "process" },
      { id: "c", label: "Choice", kind: "decision" },
      { id: "d", label: "Done", kind: "output" },
    ],
    edges: [
      { from: "a", to: "b" },
      { from: "b", to: "c", label: "next" },
      { from: "c", to: "d", label: "ok" },
    ],
  },
  comparison: {
    type: "comparison",
    title: "Comparison matrix",
    columns: [
      { id: "x", label: "Option X", tone: "positive", items: ["fast", "cheap"] },
      { id: "y", label: "Option Y", tone: "negative", items: ["slow"] },
      { id: "z", label: "Option Z", tone: "warning", items: ["risky"] },
    ],
    verdict: "Option X wins overall.",
  },
  sequence: {
    type: "sequence",
    title: "Sequence matrix",
    participants: [
      { id: "u", label: "User" },
      { id: "s", label: "Service" },
    ],
    messages: [
      { from: "u", to: "s", label: "request" },
      { from: "s", to: "s", label: "validate" },
      { from: "s", to: "u", label: "response" },
    ],
  },
  architecture: {
    type: "architecture",
    title: "Architecture matrix",
    direction: "LR",
    components: [
      { id: "c1", label: "Client", kind: "client" },
      { id: "c2", label: "API", kind: "service" },
      { id: "c3", label: "DB", kind: "database" },
    ],
    groups: [{ id: "g1", label: "Backend", componentIds: ["c2", "c3"] }],
    connections: [
      { from: "c1", to: "c2", label: "calls" },
      { from: "c2", to: "c3", label: "reads" },
    ],
  },
  timeline: {
    type: "timeline",
    title: "Timeline matrix",
    events: [
      { at: "2024", title: "Plan", status: "done" },
      { at: "2025", title: "Build", status: "current" },
      { at: "2026", title: "Ship", status: "future" },
    ],
  },
  mindmap: {
    type: "mindmap",
    title: "Mindmap matrix",
    root: "Idea",
    branches: [
      { label: "Left", items: ["one", "two"] },
      { label: "Right", items: ["three"] },
    ],
  },
  layers: {
    type: "layers",
    title: "Layers matrix",
    layers: [
      { label: "UI", emphasis: true },
      { label: "Domain", note: "core" },
      { label: "Data" },
    ],
  },
};

const outputModes: ThemeOutputMode[] = ["static", "css-variables", "media-query"];
const legacyLightFills = ["#fff8e8", "#e8f5ee", "#fdecea", "#fff3e0"];

describe("diagram, theme and output matrix", () => {
  for (const [name, diagram] of Object.entries(fixtures)) {
    for (const theme of BUILT_IN_THEME_NAMES) {
      for (const outputMode of outputModes) {
        it(`renders ${name} with ${theme} theme in ${outputMode} mode`, () => {
          const { svg, diagnostics } = renderSvg(diagram, {
            theme,
            themeOutputMode: outputMode,
          });

          expect(diagnostics.some((d) => d.severity === "error")).toBe(false);
          expect(svg.startsWith("<svg")).toBe(true);
          expect(svg).toContain('role="img"');
          expect(svg).toContain("viewBox=\"0 0 ");

          const labelledBy = svg.match(/aria-labelledby="([^"]+)"/);
          expect(labelledBy).not.toBeNull();
          const ids = (labelledBy?.[1] ?? "").split(/\s+/).filter(Boolean);
          expect(ids.length).toBeGreaterThan(0);
          for (const id of ids) {
            expect(svg).toContain(`id="${id}"`);
          }

          if (theme === "dark") {
            for (const fill of legacyLightFills) {
              expect(svg.toLowerCase()).not.toContain(`fill="${fill}"`);
            }
          }

          if (outputMode === "css-variables" || outputMode === "media-query") {
            expect(svg).toContain("<style");
            expect(svg).toContain("var(--msvg-");
          }

          if (outputMode === "media-query") {
            expect(svg).toContain("@media (prefers-color-scheme: dark)");
          }
        });
      }
    }
  }
});
