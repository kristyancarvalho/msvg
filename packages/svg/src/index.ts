export { renderSvg, layoutDiagram } from "./render.js";
export type { RenderSvgOptions, RenderSvgResult, LayoutOptions, LayoutResult } from "./render.js";

export { resolveTheme, resolveThemeResult, isValidColor, BUILT_IN_THEME_NAMES } from "./theme.js";
export type {
  ResolvedTheme,
  ThemeInput,
  CustomThemeInput,
  ThemeResolution,
  ResolveThemeOptions,
  ThemeColorMode,
  ThemeResolveMode,
  ThemeOutputMode,
  ThemeBackground,
  SemanticTokens,
  SemanticStyle,
} from "./theme.js";

export { escapeXml, escapeAttr, safeSvgId, sanitizeText } from "./escaping.js";

export {
  wrapText,
  estimateTextWidth,
  textBlockHeight,
  maxLineWidth,
  FONT_SIZE,
  DESC_FONT_SIZE,
  LINE_HEIGHT,
  CHAR_WIDTH_APPROX,
} from "./text.js";
export type { WrappedLine } from "./text.js";
