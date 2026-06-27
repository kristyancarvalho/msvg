import type {
  ArchitectureDiagram,
  ArchitectureComponent,
  MSVGDiagnostic,
} from "@markdown-utils/msvg-core";
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
  shadowRect,
  multilineText,
  svgArrowPath,
  arrowMarker,
  captionText,
  svgRoot,
  componentKindFill,
} from "../primitives.js";
import { escapeAttr, escapeXml, safeSvgId } from "../escaping.js";
import { warnDiag } from "@markdown-utils/msvg-core";

const PAD = 40;
const BOX_PAD_X = 16;
const BOX_PAD_Y = 12;
const BOX_RADIUS = 10;
const H_GAP = 50;
const V_GAP = 36;
const GROUP_PAD = 20;
const MIN_COMP_W = 130;
const MAX_COMP_W = 220;

interface CompBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  labelLines: ReturnType<typeof wrapText>;
  comp: ArchitectureComponent;
  groupId: string | undefined;
}

export function renderArchitecture(
  diagram: ArchitectureDiagram,
  theme: ResolvedTheme,
  diagramId: string
): { svg: string; diagnostics: MSVGDiagnostic[] } {
  const diagnostics: MSVGDiagnostic[] = [];

  if (diagram.components.length > 20) {
    diagnostics.push(
      warnDiag("MSVG_LAYOUT_DENSE", "Architecture diagram has many components. Consider splitting.")
    );
  }

  const direction = diagram.direction ?? "LR";
  const compW = Math.min(MAX_COMP_W, Math.max(MIN_COMP_W, 160));

  const compToGroup = new Map<string, string>();
  for (const g of diagram.groups) {
    for (const cId of g.componentIds) {
      compToGroup.set(cId, g.id);
    }
  }

  const boxMap = new Map<string, CompBox>();
  for (const comp of diagram.components) {
    const labelLines = wrapText(comp.label, compW - BOX_PAD_X * 2);
    const kindLines = comp.kind ? wrapText(comp.kind, compW - BOX_PAD_X * 2, DESC_FONT_SIZE) : [];
    const h =
      BOX_PAD_Y * 2 +
      textBlockHeight(labelLines.length) +
      (kindLines.length > 0 ? 4 + textBlockHeight(kindLines.length, DESC_FONT_SIZE) : 0);
    boxMap.set(comp.id, {
      id: comp.id,
      x: 0,
      y: 0,
      w: compW,
      h,
      labelLines,
      comp,
      groupId: compToGroup.get(comp.id),
    });
  }

  const adjOut = new Map<string, string[]>();
  const adjIn = new Map<string, string[]>();
  for (const comp of diagram.components) {
    adjOut.set(comp.id, []);
    adjIn.set(comp.id, []);
  }
  for (const conn of diagram.connections) {
    adjOut.get(conn.from)?.push(conn.to);
    adjIn.get(conn.to)?.push(conn.from);
  }

  const visited = new Set<string>();
  const columns: string[][] = [];

  const roots = diagram.components
    .filter((c) => (adjIn.get(c.id)?.length ?? 0) === 0)
    .map((c) => c.id);
  if (roots.length === 0 && diagram.components.length > 0) {
    roots.push(diagram.components[0]!.id);
  }

  const queue: Array<{ id: string; level: number }> = roots.map((id) => ({ id, level: 0 }));
  while (queue.length > 0) {
    const item = queue.shift()!;
    if (visited.has(item.id)) continue;
    visited.add(item.id);
    if (columns[item.level] === undefined) columns[item.level] = [];
    columns[item.level]!.push(item.id);
    const out = adjOut.get(item.id) ?? [];
    for (const next of out) {
      queue.push({ id: next, level: item.level + 1 });
    }
  }

  for (const comp of diagram.components) {
    if (!visited.has(comp.id)) {
      if (columns[0] === undefined) columns[0] = [];
      columns[0]!.push(comp.id);
    }
  }

  if (direction === "LR" || direction === "RL") {
    const ordered = direction === "RL" ? [...columns].reverse() : columns;
    for (let col = 0; col < ordered.length; col++) {
      const colNodes = ordered[col] ?? [];
      let y = PAD;
      for (const id of colNodes) {
        const box = boxMap.get(id)!;
        box.x = PAD + col * (compW + H_GAP);
        box.y = y;
        y += box.h + V_GAP;
      }
    }
  } else {
    const ordered = direction === "BT" ? [...columns].reverse() : columns;
    for (let row = 0; row < ordered.length; row++) {
      const rowNodes = ordered[row] ?? [];
      let x = PAD;
      let totalY = PAD;
      for (let r = 0; r < row; r++) {
        const rNodes = ordered[r] ?? [];
        const rH = rNodes.reduce((max, rid) => {
          const b = boxMap.get(rid);
          return b !== undefined ? Math.max(max, b.h) : max;
        }, 0);
        totalY += rH + V_GAP;
      }
      for (const id of rowNodes) {
        const box = boxMap.get(id)!;
        box.x = x;
        box.y = totalY;
        x += compW + H_GAP;
      }
    }
  }

  const markerId = safeSvgId(diagramId, "arrow");
  const allBoxes = [...boxMap.values()];
  const totalW = allBoxes.reduce((max, b) => Math.max(max, b.x + b.w + PAD), 0);
  const totalH = allBoxes.reduce((max, b) => Math.max(max, b.y + b.h + PAD), 0);

  const groupEls = diagram.groups.map((g) => {
    const members = g.componentIds.map((id) => boxMap.get(id)).filter((b) => b !== undefined) as CompBox[];
    if (members.length === 0) return "";
    const gx = Math.min(...members.map((b) => b.x)) - GROUP_PAD;
    const gy = Math.min(...members.map((b) => b.y)) - GROUP_PAD;
    const gw = Math.max(...members.map((b) => b.x + b.w)) + GROUP_PAD - gx;
    const gh = Math.max(...members.map((b) => b.y + b.h)) + GROUP_PAD - gy;
    const rect = `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="14" ry="14" fill="${escapeAttr(theme.surfaceMuted)}" stroke="${escapeAttr(theme.border)}" stroke-width="1.5" stroke-dasharray="6,4"/>`;
    const label = `<text x="${gx + 12}" y="${gy + 16}" font-size="${DESC_FONT_SIZE}" font-family="${escapeAttr(theme.fontFamily)}" fill="${escapeAttr(theme.textMuted)}" font-weight="600">${escapeXml(g.label)}</text>`;
    return rect + label;
  }).join("");

  const connEls = diagram.connections.map((conn) => {
    const fromBox = boxMap.get(conn.from);
    const toBox = boxMap.get(conn.to);
    if (fromBox === undefined || toBox === undefined) return "";

    let d = "";
    if (direction === "LR") {
      const x1 = fromBox.x + fromBox.w;
      const y1 = fromBox.y + fromBox.h / 2;
      const x2 = toBox.x;
      const y2 = toBox.y + toBox.h / 2;
      const cx = (x1 + x2) / 2;
      d = `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
    } else if (direction === "RL") {
      const x1 = fromBox.x;
      const y1 = fromBox.y + fromBox.h / 2;
      const x2 = toBox.x + toBox.w;
      const y2 = toBox.y + toBox.h / 2;
      const cx = (x1 + x2) / 2;
      d = `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
    } else if (direction === "BT") {
      const x1 = fromBox.x + fromBox.w / 2;
      const y1 = fromBox.y;
      const x2 = toBox.x + toBox.w / 2;
      const y2 = toBox.y + toBox.h;
      const cy = (y1 + y2) / 2;
      d = `M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`;
    } else {
      const x1 = fromBox.x + fromBox.w / 2;
      const y1 = fromBox.y + fromBox.h;
      const x2 = toBox.x + toBox.w / 2;
      const y2 = toBox.y;
      const cy = (y1 + y2) / 2;
      d = `M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`;
    }

    const path = svgArrowPath(d, markerId, { stroke: escapeAttr(theme.borderStrong), "stroke-width": "1.5" });

    let labelEl = "";
    if (conn.label) {
      const fromCx = fromBox.x + fromBox.w / 2;
      const toCx = toBox.x + toBox.w / 2;
      const fromCy = fromBox.y + fromBox.h / 2;
      const toCy = toBox.y + toBox.h / 2;
      const midX = (fromCx + toCx) / 2;
      const midY = (fromCy + toCy) / 2;
      const tw = estimateTextWidth(conn.label, DESC_FONT_SIZE) + 8;
      const th = DESC_FONT_SIZE + 4;
      labelEl =
        `<rect x="${midX - tw / 2}" y="${midY - th / 2}" width="${tw}" height="${th}" rx="3" fill="${escapeAttr(theme.background)}" opacity="0.85"/>` +
        `<text x="${midX}" y="${midY + DESC_FONT_SIZE / 2 - 1}" text-anchor="middle" font-size="${DESC_FONT_SIZE}" font-family="${escapeAttr(theme.fontFamily)}" fill="${escapeAttr(theme.textMuted)}">${escapeXml(conn.label)}</text>`;
    }

    return path + labelEl;
  }).join("");

  const compEls = diagram.components.map((comp) => {
    const box = boxMap.get(comp.id);
    if (box === undefined) return "";
    const fill = componentKindFill(comp.kind, theme);
    const shadow = theme.shadow ? shadowRect(box.x, box.y, box.w, box.h, BOX_RADIUS, theme.shadow) : "";
    const rect = roundedBox(box.x, box.y, box.w, box.h, BOX_RADIUS, fill, theme.border, 1.5);
    const cx = box.x + box.w / 2;
    const labelEl = multilineText(box.labelLines, cx, box.y + BOX_PAD_Y, FONT_SIZE, theme.text, theme.fontFamily, "600");
    let kindEl = "";
    if (comp.kind) {
      const kindY = box.y + BOX_PAD_Y + textBlockHeight(box.labelLines.length) + 4;
      const kindLines = wrapText(comp.kind, box.w - BOX_PAD_X * 2, DESC_FONT_SIZE);
      kindEl = multilineText(kindLines, cx, kindY, DESC_FONT_SIZE, theme.textMuted, theme.fontFamily);
    }
    return shadow + rect + labelEl + kindEl;
  }).join("");

  const captionH = diagram.caption ? FONT_SIZE * LINE_HEIGHT + 12 : 0;
  const svgW = Math.max(totalW, 400);
  const svgH = totalH + captionH;

  const defs = `<defs>${arrowMarker(markerId, theme.borderStrong)}</defs>`;

  let capEl = "";
  if (diagram.caption) {
    capEl = captionText(diagram.caption, svgW / 2, totalH + captionH - 8, theme);
  }

  const content = defs + groupEls + connEls + compEls + capEl;
  const svg = svgRoot(svgW, svgH, diagram.title, diagram.description, theme, diagramId, content);

  return { svg, diagnostics };
}
