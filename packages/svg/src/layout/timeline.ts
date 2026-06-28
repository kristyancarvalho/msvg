import type { TimelineDiagram, MSVGDiagnostic } from "@markdown-utils/msvg-core";
import type { ResolvedTheme } from "../theme.js";
import {
  wrapText,
  textBlockHeight,
  FONT_SIZE,
  DESC_FONT_SIZE,
  LINE_HEIGHT,
} from "../text.js";
import {
  roundedBox,
  multilineText,
  captionText,
  svgRoot,
  statusIndicatorColor,
} from "../primitives.js";
import { escapeAttr, escapeXml } from "../escaping.js";

const PAD = 32;
const DOT_R = 8;
const AXIS_X = 100;
const CONTENT_X = AXIS_X + DOT_R + 20;
const BOX_PAD_X = 14;
const BOX_PAD_Y = 10;
const BOX_RADIUS = 8;
const EVENT_V_GAP = 20;
const AT_COL_W = 90;

const STATUS_LABELS: Record<string, string> = {
  past: "Past",
  current: "Now",
  future: "Planned",
  risk: "At risk",
  done: "Done",
  blocked: "Blocked",
};

function statusLabel(status: string | undefined): string {
  if (status === undefined) return "";
  return STATUS_LABELS[status] ?? status;
}

export function renderTimeline(
  diagram: TimelineDiagram,
  theme: ResolvedTheme,
  diagramId: string
): { svg: string; diagnostics: MSVGDiagnostic[] } {
  const diagnostics: MSVGDiagnostic[] = [];

  const svgW = 600;
  const contentW = svgW - CONTENT_X - PAD;

  const eventMetrics = diagram.events.map((ev) => {
    const titleLines = wrapText(ev.title, contentW - BOX_PAD_X * 2);
    const descLines = ev.description ? wrapText(ev.description, contentW - BOX_PAD_X * 2, DESC_FONT_SIZE) : [];
    const boxH =
      BOX_PAD_Y * 2 +
      textBlockHeight(titleLines.length) +
      (descLines.length > 0 ? 4 + textBlockHeight(descLines.length, DESC_FONT_SIZE) : 0);
    const atLines = wrapText(ev.at, AT_COL_W - 8);
    const label = statusLabel(ev.status);
    const atColH =
      textBlockHeight(atLines.length, DESC_FONT_SIZE) +
      (label.length > 0 ? DESC_FONT_SIZE * LINE_HEIGHT + 4 : 0);
    const h = Math.max(boxH, atColH);
    return { ev, titleLines, descLines, atLines, label, h };
  });

  const captionH = diagram.caption ? FONT_SIZE * LINE_HEIGHT + 12 : 0;
  const totalContentH = eventMetrics.reduce((sum, em) => sum + em.h + EVENT_V_GAP, 0) - EVENT_V_GAP;
  const svgH = PAD * 2 + totalContentH + captionH;

  const axisTop = PAD;
  const axisBot = PAD + totalContentH;
  const axisEl = `<line x1="${AXIS_X}" y1="${axisTop}" x2="${AXIS_X}" y2="${axisBot}" stroke="${escapeAttr(theme.border)}" stroke-width="2"/>`;

  let y = PAD;
  const eventEls = eventMetrics.map(({ ev, titleLines, descLines, atLines, label, h }) => {
    const dotY = y + h / 2;
    const color = statusIndicatorColor(ev.status, theme);

    const dot =
      `<circle cx="${AXIS_X}" cy="${dotY}" r="${DOT_R}" fill="${escapeAttr(theme.background)}" stroke="${escapeAttr(color)}" stroke-width="2.5"/>` +
      (ev.status === "done" || ev.status === "past"
        ? `<circle cx="${AXIS_X}" cy="${dotY}" r="${DOT_R - 3}" fill="${escapeAttr(color)}"/>`
        : ev.status === "current"
        ? `<circle cx="${AXIS_X}" cy="${dotY}" r="${DOT_R - 4}" fill="${escapeAttr(color)}"/>`
        : "");

    const labelH = label.length > 0 ? DESC_FONT_SIZE * LINE_HEIGHT + 4 : 0;
    const atBlockTop = dotY - (textBlockHeight(atLines.length, DESC_FONT_SIZE) + labelH) / 2;
    const atEl = multilineText(
      atLines,
      AXIS_X - DOT_R - 10,
      atBlockTop,
      DESC_FONT_SIZE,
      theme.textMuted,
      theme.fontFamily
    );
    const statusEl =
      label.length > 0
        ? `<text x="${AXIS_X - DOT_R - 10}" y="${atBlockTop + textBlockHeight(atLines.length, DESC_FONT_SIZE) + DESC_FONT_SIZE}" text-anchor="middle" font-size="${DESC_FONT_SIZE}" font-family="${escapeAttr(theme.fontFamily)}" font-weight="600" fill="${escapeAttr(color)}">${escapeXml(label)}</text>`
        : "";

    const connector = `<line x1="${AXIS_X + DOT_R}" y1="${dotY}" x2="${CONTENT_X}" y2="${dotY}" stroke="${escapeAttr(theme.border)}" stroke-width="1"/>`;

    const boxFill =
      ev.status === "current" ? theme.accentSoft : theme.surface;
    const boxStroke =
      ev.status === "current" ? theme.accent : theme.border;
    const strokeW = ev.status === "current" ? 2 : 1.5;

    const box = roundedBox(CONTENT_X, y, contentW, h, BOX_RADIUS, boxFill, boxStroke, strokeW);
    const titleEl = multilineText(titleLines, CONTENT_X + contentW / 2, y + BOX_PAD_Y, FONT_SIZE, theme.text, theme.fontFamily, "600");

    let descEl = "";
    if (descLines.length > 0) {
      const descTop = y + BOX_PAD_Y + textBlockHeight(titleLines.length) + 4;
      descEl = multilineText(descLines, CONTENT_X + contentW / 2, descTop, DESC_FONT_SIZE, theme.textMuted, theme.fontFamily);
    }

    y += h + EVENT_V_GAP;
    return atEl + statusEl + dot + connector + box + titleEl + descEl;
  }).join("");

  let capEl = "";
  if (diagram.caption) {
    capEl = captionText(diagram.caption, svgW / 2, svgH - captionH + 4, theme);
  }

  const content = axisEl + eventEls + capEl;
  const svg = svgRoot(svgW, svgH, diagram.title, diagram.description, theme, diagramId, content);

  return { svg, diagnostics };
}
