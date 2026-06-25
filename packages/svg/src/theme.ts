export interface ResolvedTheme {
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
  shadow?: string;
  fontFamily: string;
}

export type ThemeInput = string | Partial<ResolvedTheme>;

type ThemeToken = keyof ResolvedTheme;

const PAPER: ResolvedTheme = {
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
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

const NEUTRAL: ResolvedTheme = {
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
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

const MONO: ResolvedTheme = {
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

const DARK: ResolvedTheme = {
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
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

const BUILT_IN: Record<string, ResolvedTheme> = {
  paper: PAPER,
  neutral: NEUTRAL,
  mono: MONO,
  dark: DARK,
};

const COLOR_TOKENS = new Set<ThemeToken>([
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
  "warning",
  "danger",
  "shadow",
]);

const SAFE_COLOR_PATTERN = /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)|[a-zA-Z]+)$/;
const SAFE_FONT_PATTERN = /^[a-zA-Z0-9\s,.'"-]+$/;

function isSafeThemeValue(key: ThemeToken, value: string): boolean {
  if (/url\s*\(|https?:|javascript:|data:/i.test(value)) {
    return false;
  }
  if (key === "fontFamily") {
    return SAFE_FONT_PATTERN.test(value);
  }
  if (COLOR_TOKENS.has(key)) {
    return SAFE_COLOR_PATTERN.test(value);
  }
  return false;
}

function resolveCustomTheme(input: Partial<ResolvedTheme>): ResolvedTheme {
  const next: ResolvedTheme = { ...PAPER };
  for (const [rawKey, rawValue] of Object.entries(input)) {
    const key = rawKey as ThemeToken;
    if (!(key in PAPER) || typeof rawValue !== "string") {
      continue;
    }
    if (isSafeThemeValue(key, rawValue)) {
      next[key] = rawValue;
    }
  }
  return next;
}

export function resolveTheme(input?: ThemeInput): ResolvedTheme {
  if (input === undefined || input === null) {
    return PAPER;
  }
  if (typeof input === "string") {
    const found = BUILT_IN[input];
    return found ?? PAPER;
  }
  return resolveCustomTheme(input);
}

export const BUILT_IN_THEME_NAMES = Object.keys(BUILT_IN) as ReadonlyArray<string>;
