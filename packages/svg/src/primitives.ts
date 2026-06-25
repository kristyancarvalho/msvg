import { escapeXml, escapeAttr } from "./escaping.js";
import type { ResolvedTheme } from "./theme.js";
import { FONT_SIZE, DESC_FONT_SIZE, LINE_HEIGHT } from "./text.js";
import type { WrappedLine } from "./text.js";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export function svgRect(
  x: number,
  y: number,
  w: number,
  h: number,
  attrs: Record<string, string | number> = {}
): string {
  const base = `x="${x}" y="${y}" width="${w}" height="${h}"`;
  const extra = Object.entries(attrs)
    .map(([k, v]) => `${escapeAttr(k)}="${escapeAttr(String(v))}"`)
    .join(" ");
  return `<rect ${base}${extra.length > 0 ? " " + extra : ""}/>`;
}

export function svgText(
  x: number,
  y: number,
  content: string,
  attrs: Record<string, string | number> = {}
): string {
  const base = `x="${x}" y="${y}"`;
  const extra = Object.entries(attrs)
    .map(([k, v]) => `${escapeAttr(k)}="${escapeAttr(String(v))}"`)
    .join(" ");
  return `<text ${base}${extra.length > 0 ? " " + extra : ""}>${escapeXml(content)}</text>`;
}

export function svgLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  attrs: Record<string, string | number> = {}
): string {
  const base = `x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"`;
  const extra = Object.entries(attrs)
    .map(([k, v]) => `${escapeAttr(k)}="${escapeAttr(String(v))}"`)
    .join(" ");
  return `<line ${base}${extra.length > 0 ? " " + extra : ""}/>`;
}

export function svgPath(d: string, attrs: Record<string, string | number> = {}): string {
  const extra = Object.entries(attrs)
    .map(([k, v]) => `${escapeAttr(k)}="${escapeAttr(String(v))}"`)
    .join(" ");
  return `<path d="${escapeAttr(d)}"${extra.length > 0 ? " " + extra : ""}/>`;
}

export function svgCircle(
  cx: number,
  cy: number,
  r: number,
  attrs: Record<string, string | number> = {}
): string {
  const base = `cx="${cx}" cy="${cy}" r="${r}"`;
  const extra = Object.entries(attrs)
    .map(([k, v]) => `${escapeAttr(k)}="${escapeAttr(String(v))}"`)
    .join(" ");
  return `<circle ${base}${extra.length > 0 ? " " + extra : ""}/>`;
}

export function svgGroup(content: string, attrs: Record<string, string | number | undefined> = {}): string {
  const extra = Object.entries(attrs)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${escapeAttr(k)}="${escapeAttr(String(v))}"`)
    .join(" ");
  return `<g${extra.length > 0 ? " " + extra : ""}>${content}</g>`;
}

export function svgPolygon(points: Point[], attrs: Record<string, string | number> = {}): string {
  const pts = points.map((p) => `${p.x},${p.y}`).join(" ");
  const extra = Object.entries(attrs)
    .map(([k, v]) => `${escapeAttr(k)}="${escapeAttr(String(v))}"`)
    .join(" ");
  return `<polygon points="${pts}"${extra.length > 0 ? " " + extra : ""}/>`;
}

export function arrowMarker(id: string, color: string): string {
  return `<marker id="${escapeAttr(id)}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="${escapeAttr(color)}"/></marker>`;
}

export function dashedArrowMarker(id: string, color: string): string {
  return `<marker id="${escapeAttr(id)}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="${escapeAttr(color)}"/></marker>`;
}

export function svgArrowLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  markerId: string,
  attrs: Record<string, string | number> = {}
): string {
  const extra = Object.entries(attrs)
    .map(([k, v]) => `${escapeAttr(k)}="${escapeAttr(String(v))}"`)
    .join(" ");
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#${escapeAttr(markerId)})"${extra.length > 0 ? " " + extra : ""}/>`;
}

export function svgArrowPath(
  d: string,
  markerId: string,
  attrs: Record<string, string | number> = {}
): string {
  const extra = Object.entries(attrs)
    .map(([k, v]) => `${escapeAttr(k)}="${escapeAttr(String(v))}"`)
    .join(" ");
  return `<path d="${escapeAttr(d)}" marker-end="url(#${escapeAttr(markerId)})" fill="none"${extra.length > 0 ? " " + extra : ""}/>`;
}

export function multilineText(
  lines: WrappedLine[],
  cx: number,
  topY: number,
  fontSize: number,
  fill: string,
  fontFamily: string,
  fontWeight: string = "normal"
): string {
  const lh = fontSize * LINE_HEIGHT;
  return lines
    .map((l, i) => {
      const y = topY + i * lh + fontSize;
      return `<text x="${cx}" y="${y}" text-anchor="middle" font-size="${fontSize}" font-family="${escapeAttr(fontFamily)}" font-weight="${fontWeight}" fill="${escapeAttr(fill)}">${escapeXml(l.text)}</text>`;
    })
    .join("");
}

export function roundedBox(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  stroke: string,
  strokeWidth: number = 1.5
): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${escapeAttr(fill)}" stroke="${escapeAttr(stroke)}" stroke-width="${strokeWidth}"/>`;
}

export function shadowRect(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  shadowColor: string
): string {
  return `<rect x="${x + 2}" y="${y + 3}" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${escapeAttr(shadowColor)}" opacity="0.4"/>`;
}

export function svgRoot(
  width: number,
  height: number,
  title: string,
  desc: string | undefined,
  theme: ResolvedTheme,
  diagramId: string,
  content: string
): string {
  const viewBox = `0 0 ${width} ${height}`;
  const titleId = `${escapeAttr(diagramId)}-title`;
  const descId = `${escapeAttr(diagramId)}-desc`;
  const descEl = desc !== undefined && desc.length > 0
    ? `<desc id="${descId}">${escapeXml(desc)}</desc>`
    : "";
  const ariaLabelledBy = desc !== undefined && desc.length > 0
    ? `aria-labelledby="${titleId} ${descId}"`
    : `aria-labelledby="${titleId}"`;
  const bgRect = `<rect width="${width}" height="${height}" fill="${escapeAttr(theme.background)}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}" role="img" ${ariaLabelledBy}><title id="${titleId}">${escapeXml(title)}</title>${descEl}${bgRect}${content}</svg>`;
}

export function captionText(
  caption: string,
  cx: number,
  y: number,
  theme: ResolvedTheme
): string {
  return `<text x="${cx}" y="${y}" text-anchor="middle" font-size="${DESC_FONT_SIZE}" font-family="${escapeAttr(theme.fontFamily)}" fill="${escapeAttr(theme.textMuted)}" font-style="italic">${escapeXml(caption)}</text>`;
}

export function kindFill(kind: string | undefined, theme: ResolvedTheme): string {
  switch (kind) {
    case "input": return theme.accentSoft;
    case "output": return theme.accentSoft;
    case "decision": return "#fff8e8";
    case "warning": return "#fff3e0";
    case "success": return "#e8f5ee";
    case "process": return theme.surface;
    default: return theme.surface;
  }
}

export function kindStroke(kind: string | undefined, theme: ResolvedTheme): string {
  switch (kind) {
    case "input": return theme.accent;
    case "output": return theme.accent;
    case "decision": return theme.warning;
    case "warning": return theme.warning;
    case "success": return theme.success;
    default: return theme.border;
  }
}

export function componentKindFill(kind: string | undefined, theme: ResolvedTheme): string {
  switch (kind) {
    case "client": return theme.accentSoft;
    case "service": return theme.surface;
    case "storage": return theme.surfaceMuted;
    case "external": return theme.surfaceMuted;
    case "build": return "#fff8e8";
    case "content": return "#e8f5ee";
    case "output": return theme.accentSoft;
    default: return theme.surface;
  }
}

export function toneFill(tone: string | undefined, theme: ResolvedTheme): string {
  switch (tone) {
    case "positive": return "#e8f5ee";
    case "warning": return "#fff3e0";
    case "negative": return "#fdecea";
    default: return theme.surface;
  }
}

export function toneStroke(tone: string | undefined, theme: ResolvedTheme): string {
  switch (tone) {
    case "positive": return theme.success;
    case "warning": return theme.warning;
    case "negative": return theme.danger;
    default: return theme.border;
  }
}

export function statusIndicatorColor(status: string | undefined, theme: ResolvedTheme): string {
  switch (status) {
    case "done": return theme.success;
    case "current": return theme.accent;
    case "future": return theme.textMuted;
    case "risk": return theme.danger;
    case "past": return theme.textMuted;
    default: return theme.border;
  }
}
