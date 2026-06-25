import type { MindmapDiagram, MSVGDiagnostic } from "@msvg/core";
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
} from "../primitives.js";
import { escapeAttr } from "../escaping.js";
import { warnDiag } from "@msvg/core";

const PAD = 40;
const BOX_PAD_X = 14;
const BOX_PAD_Y = 10;
const BOX_RADIUS = 10;
const H_GAP = 60;
const V_GAP = 18;
const ITEM_V_GAP = 12;
const MIN_BOX_W = 120;
const MAX_BOX_W = 200;

interface BranchBox {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  labelLines: ReturnType<typeof wrapText>;
  items: ItemBox[];
  side: "left" | "right";
}

interface ItemBox {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function renderMindmap(
  diagram: MindmapDiagram,
  theme: ResolvedTheme,
  diagramId: string
): { svg: string; diagnostics: MSVGDiagnostic[] } {
  const diagnostics: MSVGDiagnostic[] = [];

  if (diagram.branches.length > 12) {
    diagnostics.push(
      warnDiag("MSVG_LAYOUT_DENSE", "Mindmap has many branches. Consider splitting.")
    );
  }

  const rootLabelLines = wrapText(diagram.root, 160);
  const rootW = Math.min(MAX_BOX_W, Math.max(MIN_BOX_W, estimateTextWidth(diagram.root) + BOX_PAD_X * 2));
  const rootH = BOX_PAD_Y * 2 + textBlockHeight(rootLabelLines.length);

  const branchCount = diagram.branches.length;
  const leftCount = Math.ceil(branchCount / 2);

  const branchBoxes: BranchBox[] = diagram.branches.map((b, idx) => {
    const side: "left" | "right" = idx < leftCount ? "left" : "right";
    const bLabelLines = wrapText(b.label, MAX_BOX_W - BOX_PAD_X * 2);
    const bW = Math.min(MAX_BOX_W, Math.max(MIN_BOX_W, estimateTextWidth(b.label) + BOX_PAD_X * 2));
    const bH = BOX_PAD_Y * 2 + textBlockHeight(bLabelLines.length);

    const items: ItemBox[] = b.items.map((item) => {
      const itemLines = wrapText(item, MAX_BOX_W - BOX_PAD_X * 2);
      const iW = Math.min(MAX_BOX_W, Math.max(100, estimateTextWidth(item) + BOX_PAD_X * 2));
      const iH = BOX_PAD_Y * 1.5 + textBlockHeight(itemLines.length, DESC_FONT_SIZE);
      return { text: item, x: 0, y: 0, w: iW, h: iH };
    });

    return { label: b.label, x: 0, y: 0, w: bW, h: bH, labelLines: bLabelLines, items, side };
  });

  const leftBranches = branchBoxes.filter((b) => b.side === "left");
  const rightBranches = branchBoxes.filter((b) => b.side === "right");

  function groupHeight(branches: BranchBox[]): number {
    return branches.reduce((sum, b) => {
      const itemsH =
        b.items.length > 0
          ? b.items.reduce((s, item) => s + item.h + ITEM_V_GAP, 0) - ITEM_V_GAP
          : 0;
      return sum + Math.max(b.h, itemsH) + V_GAP;
    }, 0);
  }

  const leftH = groupHeight(leftBranches);
  const rightH = groupHeight(rightBranches);
  const totalH = Math.max(leftH, rightH, rootH) + PAD * 2;
  const captionH = diagram.caption ? FONT_SIZE * LINE_HEIGHT + 12 : 0;

  const rootX = PAD + H_GAP + MAX_BOX_W;
  const rootY = totalH / 2 - rootH / 2;

  let leftY = (totalH - leftH) / 2;
  for (const b of leftBranches) {
    const itemsH =
      b.items.length > 0
        ? b.items.reduce((s, i) => s + i.h + ITEM_V_GAP, 0) - ITEM_V_GAP
        : 0;
    const groupH = Math.max(b.h, itemsH);
    b.x = PAD;
    b.y = leftY + groupH / 2 - b.h / 2;

    let iy = leftY;
    for (const item of b.items) {
      item.x = PAD;
      item.y = iy;
      iy += item.h + ITEM_V_GAP;
    }

    leftY += groupH + V_GAP;
  }

  let rightY = (totalH - rightH) / 2;
  const rightX = rootX + rootW + H_GAP;
  for (const b of rightBranches) {
    const itemsH =
      b.items.length > 0
        ? b.items.reduce((s, i) => s + i.h + ITEM_V_GAP, 0) - ITEM_V_GAP
        : 0;
    const groupH = Math.max(b.h, itemsH);
    b.x = rightX;
    b.y = rightY + groupH / 2 - b.h / 2;

    let iy = rightY;
    for (const item of b.items) {
      item.x = rightX;
      item.y = iy;
      iy += item.h + ITEM_V_GAP;
    }

    rightY += groupH + V_GAP;
  }

  const svgW = rightX + MAX_BOX_W + PAD;
  const svgH = totalH + captionH;

  const rootCx = rootX + rootW / 2;
  const rootCy = rootY + rootH / 2;

  const connEls = branchBoxes.map((b) => {
    const bcx = b.x + b.w / 2;
    const bcy = b.y + b.h / 2;
    let connector = "";
    if (b.side === "left") {
      const ex = b.x + b.w;
      connector = `<path d="M ${ex} ${bcy} Q ${(ex + rootX) / 2} ${bcy}, ${rootX} ${rootCy}" fill="none" stroke="${escapeAttr(theme.border)}" stroke-width="1.5"/>`;
    } else {
      const ex = b.x;
      connector = `<path d="M ${ex} ${bcy} Q ${(ex + rootX + rootW) / 2} ${bcy}, ${rootX + rootW} ${rootCy}" fill="none" stroke="${escapeAttr(theme.border)}" stroke-width="1.5"/>`;
    }

    const itemConnectors = b.items.map((item) => {
      const icx = b.side === "left" ? item.x + item.w : item.x;
      const icy = item.y + item.h / 2;
      const bcEdge = b.side === "left" ? b.x + b.w : b.x;
      return `<line x1="${icx}" y1="${icy}" x2="${bcEdge}" y2="${bcy}" stroke="${escapeAttr(theme.border)}" stroke-width="1" opacity="0.6"/>`;
    }).join("");

    return connector + itemConnectors;
  }).join("");

  const rootEl =
    roundedBox(rootX, rootY, rootW, rootH, BOX_RADIUS, theme.accent, theme.accent) +
    multilineText(rootLabelLines, rootCx, rootY + BOX_PAD_Y, FONT_SIZE, theme.background, theme.fontFamily, "700");

  const branchEls = branchBoxes.map((b) => {
    const fill = theme.accentSoft;
    const stroke = theme.accent;
    const rect = roundedBox(b.x, b.y, b.w, b.h, BOX_RADIUS, fill, stroke, 1.5);
    const cx = b.x + b.w / 2;
    const label = multilineText(b.labelLines, cx, b.y + BOX_PAD_Y, FONT_SIZE, theme.text, theme.fontFamily, "600");

    const itemEls = b.items.map((item) => {
      const iLines = wrapText(item.text, item.w - BOX_PAD_X * 2, DESC_FONT_SIZE);
      const iRect = roundedBox(item.x, item.y, item.w, item.h, 6, theme.surfaceMuted, theme.border, 1);
      const icx = item.x + item.w / 2;
      const iText = multilineText(iLines, icx, item.y + BOX_PAD_Y / 1.5, DESC_FONT_SIZE, theme.text, theme.fontFamily);
      return iRect + iText;
    }).join("");

    return rect + label + itemEls;
  }).join("");

  let capEl = "";
  if (diagram.caption) {
    capEl = captionText(diagram.caption, svgW / 2, totalH + captionH - 8, theme);
  }

  const content = connEls + rootEl + branchEls + capEl;
  const svg = svgRoot(svgW, svgH, diagram.title, diagram.description, theme, diagramId, content);

  return { svg, diagnostics };
}
