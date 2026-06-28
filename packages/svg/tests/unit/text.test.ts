import { describe, it, expect } from "vitest";
import { wrapText, breakLongWord, estimateTextWidth, textBlockHeight, maxLineWidth, FONT_SIZE } from "../../src/text.js";

describe("estimateTextWidth", () => {
  it("returns 0 for empty string", () => {
    expect(estimateTextWidth("")).toBe(0);
  });

  it("scales with character count and font size", () => {
    const w1 = estimateTextWidth("abc", 10);
    const w2 = estimateTextWidth("abc", 20);
    expect(w2).toBeCloseTo(w1 * 2);
  });

  it("uses FONT_SIZE default", () => {
    const w = estimateTextWidth("a");
    expect(w).toBeGreaterThan(0);
    expect(w).toBeLessThan(20);
  });
});

describe("wrapText", () => {
  it("returns single line for short text", () => {
    const lines = wrapText("Hi", 200);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.text).toBe("Hi");
  });

  it("wraps long text into multiple lines", () => {
    const long = "This is a fairly long sentence that should be wrapped at some point";
    const lines = wrapText(long, 100);
    expect(lines.length).toBeGreaterThan(1);
    const rejoined = lines.map((l) => l.text).join(" ");
    expect(rejoined).toBe(long);
  });

  it("breaks a single unbreakable word longer than maxWidth into multiple lines", () => {
    const word = "superlongwordthatexceedsmaxwidth";
    const lines = wrapText(word, 40);
    expect(lines.length).toBeGreaterThan(1);
    const rejoined = lines.map((l) => l.text).join("");
    expect(rejoined).toBe(word);
    for (const line of lines) {
      expect(line.width).toBeLessThanOrEqual(40);
    }
  });

  it("breaks a long url so it stays within the available width", () => {
    const url = "https://example.com/very/long/path/segment/that/never/breaks";
    const lines = wrapText(url, 120, 12);
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect(line.width).toBeLessThanOrEqual(120);
    }
    expect(lines.map((l) => l.text).join("")).toBe(url);
  });

  it("returns empty for empty string", () => {
    const lines = wrapText("", 200);
    expect(lines).toHaveLength(0);
  });

  it("returns empty for whitespace-only", () => {
    const lines = wrapText("   ", 200);
    expect(lines).toHaveLength(0);
  });

  it("each line has a width property", () => {
    const lines = wrapText("Hello world", 200);
    for (const line of lines) {
      expect(typeof line.width).toBe("number");
      expect(line.width).toBeGreaterThan(0);
    }
  });
});

describe("breakLongWord", () => {
  it("returns the word unchanged when it already fits", () => {
    expect(breakLongWord("short", 500)).toEqual(["short"]);
  });

  it("splits an over-long word into chunks that each fit", () => {
    const chunks = breakLongWord("abcdefghijklmnop", 40, 12);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join("")).toBe("abcdefghijklmnop");
    for (const chunk of chunks) {
      expect(estimateTextWidth(chunk, 12)).toBeLessThanOrEqual(40);
    }
  });

  it("always makes progress even for tiny widths", () => {
    const chunks = breakLongWord("abcdef", 1);
    expect(chunks.join("")).toBe("abcdef");
    expect(chunks.length).toBe(6);
  });
});

describe("textBlockHeight", () => {
  it("returns 0 for 0 lines", () => {
    expect(textBlockHeight(0)).toBe(0);
  });

  it("grows linearly with line count", () => {
    const h1 = textBlockHeight(1);
    const h3 = textBlockHeight(3);
    expect(h3).toBeCloseTo(h1 * 3);
  });

  it("uses custom font size", () => {
    const h = textBlockHeight(1, 20);
    expect(h).toBeGreaterThan(textBlockHeight(1, 10));
  });
});

describe("maxLineWidth", () => {
  it("returns 0 for empty lines", () => {
    expect(maxLineWidth([])).toBe(0);
  });

  it("returns the maximum line width", () => {
    const lines = [
      { text: "short", width: 50 },
      { text: "much longer line", width: 200 },
      { text: "medium", width: 100 },
    ];
    expect(maxLineWidth(lines)).toBe(200);
  });
});
