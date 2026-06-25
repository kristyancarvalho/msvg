import { describe, it, expect } from "vitest";
import {
  svgRect,
  svgText,
  svgLine,
  svgGroup,
  roundedBox,
  svgRoot,
  arrowMarker,
  multilineText,
  captionText,
} from "../../src/primitives.js";
import { resolveTheme } from "../../src/theme.js";

const theme = resolveTheme("paper");

describe("svgRect", () => {
  it("produces a valid rect element", () => {
    const r = svgRect(10, 20, 100, 50);
    expect(r).toContain('x="10"');
    expect(r).toContain('y="20"');
    expect(r).toContain('width="100"');
    expect(r).toContain('height="50"');
    expect(r).toMatch(/^<rect /);
    expect(r).toMatch(/\/>$/);
  });

  it("includes extra attributes", () => {
    const r = svgRect(0, 0, 10, 10, { fill: "#fff", rx: "5" });
    expect(r).toContain('fill="#fff"');
    expect(r).toContain('rx="5"');
  });
});

describe("svgText", () => {
  it("escapes XML special chars in content", () => {
    const t = svgText(0, 0, '<script>alert("xss")</script>');
    expect(t).not.toContain("<script>");
    expect(t).toContain("&lt;script&gt;");
    expect(t).toContain("&quot;");
  });

  it("produces a text element with x and y", () => {
    const t = svgText(50, 80, "hello");
    expect(t).toContain('x="50"');
    expect(t).toContain('y="80"');
    expect(t).toContain("hello");
  });
});

describe("svgLine", () => {
  it("produces a line element", () => {
    const l = svgLine(0, 0, 100, 100);
    expect(l).toContain('x1="0"');
    expect(l).toContain('y1="0"');
    expect(l).toContain('x2="100"');
    expect(l).toContain('y2="100"');
  });
});

describe("svgGroup", () => {
  it("wraps content in a g element", () => {
    const g = svgGroup("<rect/>", { id: "grp" });
    expect(g).toMatch(/^<g /);
    expect(g).toContain("<rect/>");
    expect(g).toContain("</g>");
  });

  it("works with no attributes", () => {
    const g = svgGroup("<rect/>");
    expect(g).toBe("<g><rect/></g>");
  });
});

describe("roundedBox", () => {
  it("produces a rect with rx and ry", () => {
    const b = roundedBox(10, 10, 100, 50, 8, "#fff", "#ccc");
    expect(b).toContain('rx="8"');
    expect(b).toContain('ry="8"');
    expect(b).toContain('fill="#fff"');
    expect(b).toContain('stroke="#ccc"');
  });
});

describe("arrowMarker", () => {
  it("produces a marker element with the given id", () => {
    const m = arrowMarker("my-arrow", "#333");
    expect(m).toContain('id="my-arrow"');
    expect(m).toContain("<marker");
    expect(m).toContain("</marker>");
    expect(m).toContain('fill="#333"');
  });

  it("escapes special chars in marker id", () => {
    const m = arrowMarker('arrow"id', "#000");
    expect(m).not.toContain('"id"');
    expect(m).toContain("&quot;");
  });
});

describe("multilineText", () => {
  it("produces one text element per line", () => {
    const lines = [{ text: "Line 1", width: 50 }, { text: "Line 2", width: 60 }];
    const result = multilineText(lines, 100, 20, 15, "#000", "sans-serif");
    const matches = result.match(/<text/g);
    expect(matches?.length).toBe(2);
  });

  it("escapes XML in line text", () => {
    const lines = [{ text: "<b>bold</b>", width: 60 }];
    const result = multilineText(lines, 100, 20, 15, "#000", "sans-serif");
    expect(result).not.toContain("<b>");
    expect(result).toContain("&lt;b&gt;");
  });
});

describe("svgRoot", () => {
  it("produces an SVG with required attributes", () => {
    const svg = svgRoot(400, 300, "Test Title", undefined, theme, "test-id", "<g/>");
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="0 0 400 300"');
    expect(svg).toContain("<title");
    expect(svg).toContain("Test Title");
    expect(svg).toContain('role="img"');
  });

  it("includes desc element when description is provided", () => {
    const svg = svgRoot(400, 300, "Title", "A description", theme, "d", "<g/>");
    expect(svg).toContain("<desc");
    expect(svg).toContain("A description");
  });

  it("omits desc element when description is undefined", () => {
    const svg = svgRoot(400, 300, "Title", undefined, theme, "d", "<g/>");
    expect(svg).not.toContain("<desc");
  });

  it("does not include script tags", () => {
    const svg = svgRoot(400, 300, "<script>", undefined, theme, "d", "");
    expect(svg).not.toContain("<script>");
  });

  it("escapes user title in title element", () => {
    const svg = svgRoot(400, 300, 'Title & "stuff"', undefined, theme, "d", "");
    expect(svg).toContain("&amp;");
    expect(svg).toContain("&quot;");
  });

  it("includes background rect", () => {
    const svg = svgRoot(400, 300, "T", undefined, theme, "d", "");
    expect(svg).toContain(`fill="${theme.background}"`);
  });
});

describe("captionText", () => {
  it("produces a text element with italic style", () => {
    const c = captionText("A caption", 200, 300, theme);
    expect(c).toContain("A caption");
    expect(c).toContain('font-style="italic"');
    expect(c).toContain('text-anchor="middle"');
  });
});
