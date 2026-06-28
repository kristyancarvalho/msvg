import type { MSVGDiagnostic } from "@markdown-utils/msvg-core";
import { warnDiag } from "@markdown-utils/msvg-core";

export type ThemeColorMode = "light" | "dark";
export type ThemeResolveMode = "light" | "dark" | "auto";
export type ThemeOutputMode = "static" | "css-variables" | "media-query";
export type ThemeBackground = "auto" | "solid" | "transparent";

export interface SemanticStyle {
  fill: string;
  stroke: string;
}

export interface SemanticTokens {
  flow: Record<string, SemanticStyle>;
  architecture: Record<string, SemanticStyle>;
  comparison: Record<string, SemanticStyle>;
  status: Record<string, string>;
}

export interface ResolvedTheme {
  name: string;
  mode: ThemeColorMode;
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  decisionSoft: string;
  shadow?: string | undefined;
  fontFamily: string;
  semantic: SemanticTokens;
  styleElement?: string | undefined;
}

export interface CustomThemeInput {
  name?: string;
  extends?: string;
  mode?: ThemeResolveMode;
  cssVariables?: boolean | { prefix?: string };
  background?: string;
  tokens?: { color?: Record<string, unknown>; [key: string]: unknown };
  [key: string]: unknown;
}

export type ThemeInput = string | CustomThemeInput;

export interface ResolveThemeOptions {
  mode?: ThemeResolveMode | undefined;
  outputMode?: ThemeOutputMode | undefined;
  background?: ThemeBackground | undefined;
  cssVariablePrefix?: string | undefined;
}

export interface ThemeResolution {
  theme: ResolvedTheme;
  diagnostics: MSVGDiagnostic[];
}

interface PaletteBase {
  name: string;
  mode: ThemeColorMode;
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  success: string;
  warning: string;
  danger: string;
  shadow?: string | undefined;
  fontFamily: string;
}

interface FullPalette extends PaletteBase {
  successSoft: string;
  warningSoft: string;
  dangerSoft: string;
  decisionSoft: string;
}

const SYSTEM_FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif";

const LIGHT_SOFT = {
  success: "#e8f5ee",
  warning: "#fff3e0",
  danger: "#fdecea",
  decision: "#fff8e8",
};

const DARK_SOFT = {
  success: "#16301f",
  warning: "#3a2e1a",
  danger: "#3a1f1f",
  decision: "#332a14",
};

const PAPER: PaletteBase = {
  name: "paper",
  mode: "light",
  background: "#faf9f7",
  surface: "#ffffff",
  surfaceMuted: "#f3f2ef",
  border: "#d4cfc8",
  borderStrong: "#9e9790",
  text: "#1a1917",
  textMuted: "#6b6660",
  accent: "#3d5a99",
  accentSoft: "#dce5f5",
  success: "#2d7a4f",
  warning: "#a05c00",
  danger: "#b52a2a",
  shadow: "rgba(0,0,0,0.08)",
  fontFamily: SYSTEM_FONT,
};

const NEUTRAL: PaletteBase = {
  name: "neutral",
  mode: "light",
  background: "#f5f5f5",
  surface: "#ffffff",
  surfaceMuted: "#ebebeb",
  border: "#cccccc",
  borderStrong: "#888888",
  text: "#111111",
  textMuted: "#555555",
  accent: "#2255bb",
  accentSoft: "#dce8ff",
  success: "#1a6b3a",
  warning: "#8a5000",
  danger: "#aa1111",
  fontFamily: SYSTEM_FONT,
};

const MONO: PaletteBase = {
  name: "mono",
  mode: "light",
  background: "#ffffff",
  surface: "#f8f8f8",
  surfaceMuted: "#efefef",
  border: "#cccccc",
  borderStrong: "#333333",
  text: "#000000",
  textMuted: "#444444",
  accent: "#000000",
  accentSoft: "#e8e8e8",
  success: "#000000",
  warning: "#444444",
  danger: "#000000",
  fontFamily: "'Courier New', Courier, monospace",
};

const DARK: PaletteBase = {
  name: "dark",
  mode: "dark",
  background: "#0f0f11",
  surface: "#1a1a1f",
  surfaceMuted: "#24242b",
  border: "#383845",
  borderStrong: "#5a5a6e",
  text: "#e8e8f0",
  textMuted: "#9090a8",
  accent: "#7a9ef5",
  accentSoft: "#1e2d54",
  success: "#4caf7a",
  warning: "#e8a040",
  danger: "#e05555",
  shadow: "rgba(0,0,0,0.4)",
  fontFamily: SYSTEM_FONT,
};

const BUILT_IN: Record<string, PaletteBase> = {
  paper: PAPER,
  neutral: NEUTRAL,
  mono: MONO,
  dark: DARK,
};

function toFullPalette(base: PaletteBase): FullPalette {
  const soft = base.mode === "dark" ? DARK_SOFT : LIGHT_SOFT;
  return {
    ...base,
    successSoft: soft.success,
    warningSoft: soft.warning,
    dangerSoft: soft.danger,
    decisionSoft: soft.decision,
  };
}

function buildSemantic(p: FullPalette): SemanticTokens {
  return {
    flow: {
      default: { fill: p.surface, stroke: p.border },
      input: { fill: p.accentSoft, stroke: p.accent },
      process: { fill: p.surface, stroke: p.border },
      decision: { fill: p.decisionSoft, stroke: p.warning },
      output: { fill: p.accentSoft, stroke: p.accent },
      warning: { fill: p.warningSoft, stroke: p.warning },
      success: { fill: p.successSoft, stroke: p.success },
    },
    architecture: {
      default: { fill: p.surface, stroke: p.border },
      client: { fill: p.accentSoft, stroke: p.border },
      service: { fill: p.surface, stroke: p.border },
      storage: { fill: p.surfaceMuted, stroke: p.border },
      database: { fill: p.surfaceMuted, stroke: p.border },
      queue: { fill: p.warningSoft, stroke: p.border },
      external: { fill: p.surfaceMuted, stroke: p.border },
      build: { fill: p.decisionSoft, stroke: p.border },
      content: { fill: p.successSoft, stroke: p.border },
      output: { fill: p.accentSoft, stroke: p.border },
      user: { fill: p.accentSoft, stroke: p.border },
    },
    comparison: {
      neutral: { fill: p.surface, stroke: p.border },
      positive: { fill: p.successSoft, stroke: p.success },
      warning: { fill: p.warningSoft, stroke: p.warning },
      negative: { fill: p.dangerSoft, stroke: p.danger },
    },
    status: {
      done: p.success,
      current: p.accent,
      future: p.textMuted,
      risk: p.danger,
      past: p.textMuted,
      blocked: p.danger,
      default: p.border,
    },
  };
}

function buildTheme(p: FullPalette): ResolvedTheme {
  return {
    name: p.name,
    mode: p.mode,
    background: p.background,
    surface: p.surface,
    surfaceMuted: p.surfaceMuted,
    border: p.border,
    borderStrong: p.borderStrong,
    text: p.text,
    textMuted: p.textMuted,
    accent: p.accent,
    accentSoft: p.accentSoft,
    success: p.success,
    successSoft: p.successSoft,
    warning: p.warning,
    warningSoft: p.warningSoft,
    danger: p.danger,
    dangerSoft: p.dangerSoft,
    decisionSoft: p.decisionSoft,
    shadow: p.shadow,
    fontFamily: p.fontFamily,
    semantic: buildSemantic(p),
  };
}

const COLOR_PALETTE_KEYS: Array<keyof FullPalette> = [
  "background",
  "surface",
  "surfaceMuted",
  "border",
  "borderStrong",
  "text",
  "textMuted",
  "accent",
  "accentSoft",
  "success",
  "successSoft",
  "warning",
  "warningSoft",
  "danger",
  "dangerSoft",
  "decisionSoft",
  "shadow",
];

const HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB_PATTERN = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/;
const NAMED_COLORS = new Set(["transparent", "currentcolor", "white", "black", "none"]);
const SAFE_FONT_PATTERN = /^[a-zA-Z0-9\s,.'"-]+$/;

export function isValidColor(value: string): boolean {
  const v = value.trim();
  if (HEX_PATTERN.test(v)) return true;
  if (RGB_PATTERN.test(v)) return true;
  return NAMED_COLORS.has(v.toLowerCase());
}

function isUnsafeValue(value: string): boolean {
  return /url\s*\(|https?:|javascript:|data:|expression\s*\(|[;{}]/i.test(value);
}

function kebab(key: string): string {
  return key.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
}

function pickBase(name: string | undefined, mode: ThemeResolveMode | undefined, diagnostics: MSVGDiagnostic[], context: string): PaletteBase {
  if (name !== undefined) {
    const found = BUILT_IN[name];
    if (found !== undefined) {
      return found;
    }
    diagnostics.push(
      warnDiag("MSVG_THEME_UNKNOWN", `Unknown theme '${name}'${context}. Falling back to a built-in theme.`)
    );
  }
  if (mode === "dark") {
    return DARK;
  }
  return PAPER;
}

function applyMode(base: PaletteBase, mode: ThemeResolveMode | undefined): PaletteBase {
  if (mode === "dark" && base.mode !== "dark") {
    return DARK;
  }
  if (mode === "light" && base.mode === "dark") {
    return PAPER;
  }
  return base;
}

function collectOverrides(input: CustomThemeInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const reserved = new Set(["name", "extends", "mode", "cssVariables", "tokens", "background"]);
  for (const [key, value] of Object.entries(input)) {
    if (reserved.has(key)) continue;
    out[key] = value;
  }
  if (input.background !== undefined) {
    out.background = input.background;
  }
  const color = input.tokens?.color;
  if (color !== undefined && typeof color === "object") {
    for (const [key, value] of Object.entries(color)) {
      out[key] = value;
    }
  }
  return out;
}

function applyOverrides(palette: FullPalette, overrides: Record<string, unknown>, diagnostics: MSVGDiagnostic[]): FullPalette {
  const next: FullPalette = { ...palette };
  for (const [rawKey, rawValue] of Object.entries(overrides)) {
    const key = rawKey as keyof FullPalette;
    if (key === "fontFamily") {
      if (typeof rawValue === "string" && SAFE_FONT_PATTERN.test(rawValue) && !isUnsafeValue(rawValue)) {
        next.fontFamily = rawValue;
      } else {
        diagnostics.push(warnDiag("MSVG_THEME_INVALID_VALUE", `Ignoring unsafe font value for '${rawKey}'.`));
      }
      continue;
    }
    if (!COLOR_PALETTE_KEYS.includes(key)) {
      diagnostics.push(warnDiag("MSVG_THEME_UNKNOWN_TOKEN", `Ignoring unknown theme token '${rawKey}'.`));
      continue;
    }
    if (typeof rawValue !== "string" || isUnsafeValue(rawValue) || !isValidColor(rawValue)) {
      diagnostics.push(
        warnDiag("MSVG_THEME_INVALID_COLOR", `Ignoring invalid color for theme token '${rawKey}'.`)
      );
      continue;
    }
    (next[key] as string) = rawValue;
  }
  return next;
}

function variableDeclarations(theme: ResolvedTheme, prefix: string): string {
  const parts: string[] = [];
  for (const key of COLOR_PALETTE_KEYS) {
    const value = theme[key as keyof ResolvedTheme];
    if (typeof value === "string") {
      parts.push(`${prefix}${kebab(String(key))}: ${value};`);
    }
  }
  for (const [kind, style] of Object.entries(theme.semantic.flow)) {
    parts.push(`${prefix}flow-${kind}-fill: ${style.fill};`);
    parts.push(`${prefix}flow-${kind}-stroke: ${style.stroke};`);
  }
  for (const [kind, style] of Object.entries(theme.semantic.architecture)) {
    parts.push(`${prefix}arch-${kind}-fill: ${style.fill};`);
    parts.push(`${prefix}arch-${kind}-stroke: ${style.stroke};`);
  }
  for (const [tone, style] of Object.entries(theme.semantic.comparison)) {
    parts.push(`${prefix}cmp-${tone}-fill: ${style.fill};`);
    parts.push(`${prefix}cmp-${tone}-stroke: ${style.stroke};`);
  }
  return parts.join("");
}

function wrapVar(prefix: string, name: string, fallback: string): string {
  if (fallback === "transparent" || fallback === "none") {
    return fallback;
  }
  return `var(${prefix}${name}, ${fallback})`;
}

function toCssVariableTheme(theme: ResolvedTheme, prefix: string, darkTheme: ResolvedTheme | undefined): ResolvedTheme {
  const wrapped: ResolvedTheme = { ...theme, semantic: { flow: {}, architecture: {}, comparison: {}, status: { ...theme.semantic.status } } };
  for (const key of COLOR_PALETTE_KEYS) {
    const value = theme[key as keyof ResolvedTheme];
    if (typeof value === "string") {
      (wrapped[key as keyof ResolvedTheme] as unknown as string) = wrapVar(prefix, kebab(String(key)), value);
    }
  }
  for (const [kind, style] of Object.entries(theme.semantic.flow)) {
    wrapped.semantic.flow[kind] = {
      fill: wrapVar(prefix, `flow-${kind}-fill`, style.fill),
      stroke: wrapVar(prefix, `flow-${kind}-stroke`, style.stroke),
    };
  }
  for (const [kind, style] of Object.entries(theme.semantic.architecture)) {
    wrapped.semantic.architecture[kind] = {
      fill: wrapVar(prefix, `arch-${kind}-fill`, style.fill),
      stroke: wrapVar(prefix, `arch-${kind}-stroke`, style.stroke),
    };
  }
  for (const [tone, style] of Object.entries(theme.semantic.comparison)) {
    wrapped.semantic.comparison[tone] = {
      fill: wrapVar(prefix, `cmp-${tone}-fill`, style.fill),
      stroke: wrapVar(prefix, `cmp-${tone}-stroke`, style.stroke),
    };
  }
  const lightDecls = variableDeclarations(theme, prefix);
  let style = `<style>:root{${lightDecls}}</style>`;
  if (darkTheme !== undefined) {
    const darkDecls = variableDeclarations(darkTheme, prefix);
    style = `<style>:root{${lightDecls}}@media (prefers-color-scheme: dark){:root{${darkDecls}}}</style>`;
  }
  wrapped.styleElement = style;
  return wrapped;
}

export function resolveThemeResult(input?: ThemeInput, options: ResolveThemeOptions = {}): ThemeResolution {
  const diagnostics: MSVGDiagnostic[] = [];

  let base: PaletteBase;
  let overrides: Record<string, unknown> = {};
  let inputMode: ThemeResolveMode | undefined = options.mode;
  let cssVariablesPrefix: string | undefined = options.cssVariablePrefix;
  let outputMode: ThemeOutputMode = options.outputMode ?? "static";

  if (input === undefined || input === null) {
    base = pickBase(undefined, inputMode, diagnostics, "");
  } else if (typeof input === "string") {
    base = pickBase(input, inputMode, diagnostics, "");
  } else {
    if (typeof input.mode === "string") {
      inputMode = options.mode ?? input.mode;
    }
    base = pickBase(input.extends, inputMode, diagnostics, " in theme.extends");
    overrides = collectOverrides(input);
    if (input.cssVariables === true && options.outputMode === undefined) {
      outputMode = "css-variables";
    } else if (typeof input.cssVariables === "object" && input.cssVariables !== null) {
      if (options.outputMode === undefined) {
        outputMode = "css-variables";
      }
      if (typeof input.cssVariables.prefix === "string") {
        cssVariablesPrefix = input.cssVariables.prefix;
      }
    }
  }

  base = applyMode(base, inputMode);

  let palette = toFullPalette(base);
  palette = applyOverrides(palette, overrides, diagnostics);

  const background = options.background;
  if (background === "transparent") {
    palette = { ...palette, background: "transparent" };
  }

  let theme = buildTheme(palette);

  if (outputMode === "css-variables" || outputMode === "media-query") {
    const prefix = cssVariablesPrefix ?? "--msvg-";
    const darkTheme = outputMode === "media-query" ? buildTheme(toFullPalette(DARK)) : undefined;
    theme = toCssVariableTheme(theme, prefix, darkTheme);
  }

  return { theme, diagnostics };
}

export function resolveTheme(input?: ThemeInput): ResolvedTheme {
  return resolveThemeResult(input).theme;
}

export const BUILT_IN_THEME_NAMES = Object.keys(BUILT_IN) as ReadonlyArray<string>;
