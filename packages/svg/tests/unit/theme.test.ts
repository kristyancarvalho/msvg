import { describe, it, expect } from "vitest";
import { resolveTheme, BUILT_IN_THEME_NAMES } from "../../src/theme.js";

describe("resolveTheme", () => {
  it("returns paper theme by default (undefined)", () => {
    const t = resolveTheme(undefined);
    expect(t.background).toBe("#faf9f7");
    expect(t.fontFamily).toContain("system-ui");
  });

  it("returns paper theme for null", () => {
    const t = resolveTheme(null as unknown as undefined);
    expect(t.background).toBe("#faf9f7");
  });

  it("resolves 'paper' theme by name", () => {
    const t = resolveTheme("paper");
    expect(t.background).toBe("#faf9f7");
  });

  it("resolves 'neutral' theme by name", () => {
    const t = resolveTheme("neutral");
    expect(t.background).toBe("#f5f5f5");
  });

  it("resolves 'mono' theme by name", () => {
    const t = resolveTheme("mono");
    expect(t.fontFamily).toContain("Courier");
  });

  it("resolves 'dark' theme by name", () => {
    const t = resolveTheme("dark");
    expect(t.background).toBe("#0f0f11");
    expect(t.text).toBe("#e8e8f0");
  });

  it("falls back to paper for unknown theme name", () => {
    const t = resolveTheme("unknown-theme");
    expect(t.background).toBe("#faf9f7");
  });

  it("merges partial custom tokens over paper defaults", () => {
    const t = resolveTheme({ background: "#ff0000", accent: "#00ff00" });
    expect(t.background).toBe("#ff0000");
    expect(t.accent).toBe("#00ff00");
    expect(t.text).toBe("#1a1917");
  });

  it("ignores unsafe custom token values", () => {
    const t = resolveTheme({
      background: "url(https://example.test/bg.svg)",
      fontFamily: "safe, sans-serif",
    });
    expect(t.background).toBe("#faf9f7");
    expect(t.fontFamily).toBe("safe, sans-serif");
  });

  it("ignores unknown custom token keys", () => {
    const t = resolveTheme({ href: "https://example.test" } as Partial<ReturnType<typeof resolveTheme>>);
    expect(t.background).toBe("#faf9f7");
  });

  it("all built-in themes have required fields", () => {
    for (const name of BUILT_IN_THEME_NAMES) {
      const t = resolveTheme(name);
      expect(t.background).toBeTruthy();
      expect(t.surface).toBeTruthy();
      expect(t.border).toBeTruthy();
      expect(t.text).toBeTruthy();
      expect(t.accent).toBeTruthy();
      expect(t.fontFamily).toBeTruthy();
    }
  });

  it("returns all four built-in theme names", () => {
    expect(BUILT_IN_THEME_NAMES).toContain("paper");
    expect(BUILT_IN_THEME_NAMES).toContain("neutral");
    expect(BUILT_IN_THEME_NAMES).toContain("mono");
    expect(BUILT_IN_THEME_NAMES).toContain("dark");
  });
});
