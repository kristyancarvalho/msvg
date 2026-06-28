import { describe, it, expect } from "vitest";
import { resolveTheme, resolveThemeResult, isValidColor } from "../../src/theme.js";
import { renderSvg } from "../../src/render.js";
import type { FlowDiagram, ComparisonDiagram } from "@markdown-utils/msvg-core";

const flow: FlowDiagram = {
  type: "flow",
  title: "Pipeline",
  direction: "LR",
  nodes: [
    { id: "a", label: "Input", kind: "input" },
    { id: "b", label: "Decision", kind: "decision" },
    { id: "c", label: "Success", kind: "success" },
  ],
  edges: [
    { from: "a", to: "b" },
    { from: "b", to: "c" },
  ],
};

const comparison: ComparisonDiagram = {
  type: "comparison",
  title: "A vs B",
  columns: [
    { id: "a", label: "A", tone: "positive", items: ["x"] },
    { id: "b", label: "B", tone: "negative", items: ["y"] },
  ],
};

describe("isValidColor", () => {
  it("accepts hex of length 3/4/6/8", () => {
    expect(isValidColor("#fff")).toBe(true);
    expect(isValidColor("#ffff")).toBe(true);
    expect(isValidColor("#ffffff")).toBe(true);
    expect(isValidColor("#ffffffff")).toBe(true);
  });

  it("accepts rgb, rgba, and a small named set", () => {
    expect(isValidColor("rgb(10, 20, 30)")).toBe(true);
    expect(isValidColor("rgba(10, 20, 30, 0.5)")).toBe(true);
    expect(isValidColor("transparent")).toBe(true);
  });

  it("rejects arbitrary alphabetic strings and malformed hex", () => {
    expect(isValidColor("notacolor")).toBe(false);
    expect(isValidColor("zzzzzz")).toBe(false);
    expect(isValidColor("#abcde")).toBe(false);
  });

  it("rejects unsafe values", () => {
    expect(isValidColor("url(evil)")).toBe(false);
    expect(isValidColor("javascript:alert(1)")).toBe(false);
    expect(isValidColor("data:image/svg")).toBe(false);
  });
});

describe("resolveThemeResult modes", () => {
  it("resolves dark mode to the dark palette", () => {
    const { theme, diagnostics } = resolveThemeResult({ mode: "dark" });
    expect(theme.mode).toBe("dark");
    expect(theme.background).toBe("#0f0f11");
    expect(diagnostics).toHaveLength(0);
  });

  it("resolves light mode for a dark base", () => {
    const { theme } = resolveThemeResult({ extends: "dark", mode: "light" });
    expect(theme.mode).toBe("light");
  });

  it("uses dark soft tokens in dark mode (no light semantic fills)", () => {
    const { theme } = resolveThemeResult("dark");
    expect(theme.semantic.flow.decision.fill).toBe("#332a14");
    expect(theme.semantic.comparison.negative.fill).toBe("#3a1f1f");
    expect(theme.semantic.flow.success.fill).toBe("#16301f");
  });

  it("keeps light soft tokens identical to legacy hardcoded values", () => {
    const { theme } = resolveThemeResult("paper");
    expect(theme.semantic.flow.decision.fill).toBe("#fff8e8");
    expect(theme.semantic.flow.success.fill).toBe("#e8f5ee");
    expect(theme.semantic.comparison.negative.fill).toBe("#fdecea");
  });
});

describe("custom themes", () => {
  it("extends a built-in and applies token overrides", () => {
    const { theme, diagnostics } = resolveThemeResult({
      extends: "paper",
      tokens: { color: { accent: "#00ff00" } },
    });
    expect(theme.accent).toBe("#00ff00");
    expect(theme.text).toBe("#1a1917");
    expect(diagnostics).toHaveLength(0);
  });

  it("warns and ignores invalid color overrides", () => {
    const { theme, diagnostics } = resolveThemeResult({
      extends: "paper",
      tokens: { color: { accent: "notacolor" } },
    });
    expect(theme.accent).toBe("#3d5a99");
    expect(diagnostics.some((d) => d.code === "MSVG_THEME_INVALID_COLOR")).toBe(true);
  });

  it("warns on unknown extends and unknown token keys", () => {
    const unknown = resolveThemeResult({ extends: "nope" });
    expect(unknown.diagnostics.some((d) => d.code === "MSVG_THEME_UNKNOWN")).toBe(true);
    const badKey = resolveThemeResult({ extends: "paper", tokens: { color: { nope: "#fff" } } });
    expect(badKey.diagnostics.some((d) => d.code === "MSVG_THEME_UNKNOWN_TOKEN")).toBe(true);
  });

  it("warns on unknown built-in theme name", () => {
    const { diagnostics } = resolveThemeResult("zzzzzz");
    expect(diagnostics.some((d) => d.code === "MSVG_THEME_UNKNOWN")).toBe(true);
  });
});

describe("background policy", () => {
  it("supports transparent background", () => {
    const { theme } = resolveThemeResult("paper", { background: "transparent" });
    expect(theme.background).toBe("transparent");
  });
});

describe("css-variables output", () => {
  it("wraps tokens in var() and emits a style element", () => {
    const { theme } = resolveThemeResult("paper", { outputMode: "css-variables" });
    expect(theme.styleElement).toContain("<style>");
    expect(theme.styleElement).toContain(":root{");
    expect(theme.surface).toContain("var(--msvg-surface,");
    expect(theme.semantic.flow.decision.fill).toContain("var(--msvg-flow-decision-fill,");
  });

  it("media-query mode embeds a prefers-color-scheme block", () => {
    const { theme } = resolveThemeResult("paper", { outputMode: "media-query" });
    expect(theme.styleElement).toContain("@media (prefers-color-scheme: dark)");
  });

  it("auto-selects css-variables when cssVariables:true on the theme input", () => {
    const { theme } = resolveThemeResult({ extends: "paper", cssVariables: true });
    expect(theme.styleElement).toContain("<style>");
  });
});

describe("renderSvg theming integration", () => {
  it("dark render contains no legacy light semantic fills", () => {
    const { svg } = renderSvg(flow, { theme: "dark" });
    expect(svg).not.toContain("#fff8e8");
    expect(svg).not.toContain("#e8f5ee");
    expect(svg).not.toContain("#fdecea");
  });

  it("transparent background omits the background rect", () => {
    const { svg } = renderSvg(flow, { theme: "paper", background: "transparent" });
    expect(svg).not.toContain('fill="#faf9f7"');
  });

  it("css-variables render injects a style element and var references", () => {
    const { svg } = renderSvg(comparison, { theme: "paper", themeOutputMode: "css-variables" });
    expect(svg).toContain("<style>");
    expect(svg).toContain("var(--msvg-");
  });

  it("propagates theme diagnostics through the render result", () => {
    const { diagnostics } = renderSvg(flow, { theme: "zzzzzz" });
    expect(diagnostics.some((d) => d.code === "MSVG_THEME_UNKNOWN")).toBe(true);
  });
});
