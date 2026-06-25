import { describe, it, expect } from "vitest";
import { escapeXml, escapeAttr, safeSvgId, sanitizeText } from "../../src/escaping.js";

describe("escapeXml", () => {
  it("escapes ampersand", () => {
    expect(escapeXml("a & b")).toBe("a &amp; b");
  });

  it("escapes less-than", () => {
    expect(escapeXml("<tag>")).toBe("&lt;tag&gt;");
  });

  it("escapes quotes", () => {
    expect(escapeXml('"hello"')).toBe("&quot;hello&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeXml("it's")).toBe("it&#39;s");
  });

  it("does not alter safe text", () => {
    expect(escapeXml("Hello world 123")).toBe("Hello world 123");
  });

  it("escapes multiple special chars in one string", () => {
    expect(escapeXml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
    );
  });

  it("handles empty string", () => {
    expect(escapeXml("")).toBe("");
  });
});

describe("escapeAttr", () => {
  it("escapes quotes in attribute values", () => {
    expect(escapeAttr('val"ue')).toBe("val&quot;ue");
  });

  it("escapes ampersands in attribute values", () => {
    expect(escapeAttr("a&b")).toBe("a&amp;b");
  });

  it("does not alter safe attribute text", () => {
    expect(escapeAttr("my-id")).toBe("my-id");
  });
});

describe("safeSvgId", () => {
  it("converts spaces to hyphens and lowercases", () => {
    expect(safeSvgId("My Diagram")).toBe("my-diagram");
  });

  it("strips leading and trailing hyphens", () => {
    expect(safeSvgId("!!hello!!")).toBe("hello");
  });

  it("falls back to 'd' for empty/all-special input", () => {
    expect(safeSvgId("!!!")).toBe("d");
  });

  it("appends suffix when provided", () => {
    expect(safeSvgId("flow", "arrow")).toBe("flow-arrow");
  });

  it("truncates long IDs to 40 chars", () => {
    const long = "a".repeat(80);
    expect(safeSvgId(long).length).toBeLessThanOrEqual(40);
  });

  it("preserves hyphens and digits", () => {
    expect(safeSvgId("flow-123")).toBe("flow-123");
  });
});

describe("sanitizeText", () => {
  it("strips HTML tags", () => {
    expect(sanitizeText("<b>bold</b>")).toBe("bold");
  });

  it("removes javascript: protocol", () => {
    expect(sanitizeText("javascript:alert(1)")).not.toContain("javascript:");
  });

  it("trims whitespace", () => {
    expect(sanitizeText("  hello  ")).toBe("hello");
  });

  it("returns empty string for non-string", () => {
    expect(sanitizeText(42)).toBe("");
    expect(sanitizeText(null)).toBe("");
    expect(sanitizeText(undefined)).toBe("");
  });

  it("passes through safe text unchanged", () => {
    expect(sanitizeText("Hello, World!")).toBe("Hello, World!");
  });
});
