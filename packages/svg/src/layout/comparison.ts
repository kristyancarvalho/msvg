import type { ComparisonDiagram, MSVGDiagnostic } from "@markdown-utils/msvg-core";
import type { ResolvedTheme } from "../theme.js";
import {
  wrapText,
  estimateTextWidth,
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
  toneFill,
  toneStroke,
} from "../primitives.js";
import { escapeAttr, escapeXml } from "../escaping.js";

const PAD = 32;
const COL_PAD_X = 16;
const COL_PAD_Y = 14;
const BOX_RADIUS = 10;
const ITEM_V_GAP = 10;
const COL_GAP = 20;
const ITEM_PAD_Y = 8;
const ITEM_RADIUS = 6;
const TONE_LINE_H = DESC_FONT_SIZE * LINE_HEIGHT;

const TONE_LABELS: Record<string, string> = {
  neutral: "Neutral",
  positive: "Pros",
  negative: "Cons",
  warning: "Caution",
};

function toneLabel(tone: string | undefined): string {
  if (tone === undefined) return "Neutral";
  return TONE_LABELS[tone] ?? tone;
}

export function renderComparison(
  diagram: ComparisonDiagram,
  theme: ResolvedTheme,
  diagramId: string
): { svg: string; diagnostics: MSVGDiagnostic[] } {
  const diagnostics: MSVGDiagnostic[] = [];

  const colCount = diagram.columns.length;
  const minSvgW = 400;
  const totalW = Math.max(minSvgW, colCount * 220 + (colCount - 1) * COL_GAP + PAD * 2);
  const colW = Math.floor((totalW - PAD * 2 - (colCount - 1) * COL_GAP) / colCount);

  const colMetrics = diagram.columns.map((col) => {
    const headerLines = wrapText(col.label, colW - COL_PAD_X * 2);
    const headerH = COL_PAD_Y * 2 + TONE_LINE_H + textBlockHeight(headerLines.length, FONT_SIZE);

    const itemMetrics = col.items.map((item) => {
      const lines = wrapText(item, colW - COL_PAD_X * 2 - 16, DESC_FONT_SIZE);
      const h = ITEM_PAD_Y * 2 + textBlockHeight(lines.length, DESC_FONT_SIZE);
      return { text: item, lines, h };
    });

    const itemsH = itemMetrics.reduce((sum, i) => sum + i.h + ITEM_V_GAP, 0);
    const totalH = headerH + COL_PAD_Y + itemsH;

    return { col, headerLines, headerH, itemMetrics, itemsH, totalH };
  });

  const maxColH = colMetrics.reduce((max, c) => Math.max(max, c.totalH), 0);

  const verdictH = diagram.verdict
    ? COL_PAD_Y + textBlockHeight(1, DESC_FONT_SIZE) + COL_PAD_Y
    : 0;
  const captionH = diagram.caption ? FONT_SIZE * LINE_HEIGHT + 12 : 0;
  const svgH = PAD + maxColH + verdictH + PAD + captionH;

  const colEls = colMetrics.map((cm, idx) => {
    const x = PAD + idx * (colW + COL_GAP);
    const y = PAD;
    const fill = toneFill(cm.col.tone, theme);
    const stroke = toneStroke(cm.col.tone, theme);

    const headerRect = roundedBox(x, y, colW, cm.headerH, BOX_RADIUS, fill, stroke, 2);
    const headerCx = x + colW / 2;
    const toneEl = `<text x="${headerCx}" y="${y + COL_PAD_Y + DESC_FONT_SIZE - 2}" text-anchor="middle" font-size="${DESC_FONT_SIZE}" font-family="${escapeAttr(theme.fontFamily)}" font-weight="600" letter-spacing="0.5" fill="${escapeAttr(theme.textMuted)}">${escapeXml(toneLabel(cm.col.tone))}</text>`;
    const headerText = multilineText(cm.headerLines, headerCx, y + COL_PAD_Y + TONE_LINE_H, FONT_SIZE, theme.text, theme.fontFamily, "700");

    let iy = y + cm.headerH + COL_PAD_Y;
    const itemEls = cm.itemMetrics.map((item) => {
      const itemRect = roundedBox(x, iy, colW, item.h, ITEM_RADIUS, theme.surface, theme.border, 1);
      const bulletX = x + COL_PAD_X;
      const bulletY = iy + item.h / 2;
      const bullet = `<circle cx="${bulletX + 3}" cy="${bulletY}" r="3" fill="${escapeAttr(stroke)}"/>`;
      const itemText = multilineText(
        item.lines,
        x + colW / 2 + 4,
        iy + ITEM_PAD_Y,
        DESC_FONT_SIZE,
        theme.text,
        theme.fontFamily
      );
      iy += item.h + ITEM_V_GAP;
      return itemRect + bullet + itemText;
    }).join("");

    return headerRect + toneEl + headerText + itemEls;
  }).join("");

  let verdictEl = "";
  if (diagram.verdict) {
    const vy = PAD + maxColH + COL_PAD_Y;
    const vLines = wrapText(diagram.verdict, totalW - PAD * 4, DESC_FONT_SIZE);
    const vH = textBlockHeight(vLines.length, DESC_FONT_SIZE) + COL_PAD_Y;
    verdictEl =
      roundedBox(PAD, vy, totalW - PAD * 2, vH, BOX_RADIUS, theme.surfaceMuted, theme.border, 1) +
      multilineText(vLines, totalW / 2, vy + COL_PAD_Y / 2, DESC_FONT_SIZE, theme.textMuted, theme.fontFamily, "normal");
  }

  let capEl = "";
  if (diagram.caption) {
    capEl = captionText(diagram.caption, totalW / 2, svgH - captionH + 4, theme);
  }

  const content = colEls + verdictEl + capEl;
  const svg = svgRoot(totalW, svgH, diagram.title, diagram.description, theme, diagramId, content);

  return { svg, diagnostics };
}
