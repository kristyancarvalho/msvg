import type { FlowDiagram, FlowNode, FlowEdge, MSVGDiagnostic } from "@markdown-utils/msvg-core";
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
  svgGroup,
  captionText,
  svgRoot,
  kindFill,
  kindStroke,
} from "../primitives.js";
import { escapeXml, escapeAttr, safeSvgId } from "../escaping.js";
import { warnDiag } from "@markdown-utils/msvg-core";

const PAD = 32;
const BOX_PAD_X = 18;
const BOX_PAD_Y = 14;
const BOX_RADIUS = 14;
const H_GAP = 48;
const V_GAP = 32;
const MIN_BOX_W = 150;
const MAX_BOX_W = 260;

interface NodeBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  labelLines: ReturnType<typeof wrapText>;
  descLines: ReturnType<typeof wrapText>;
  node: FlowNode;
}

function layoutLR(
  nodes: FlowNode[],
  edges: FlowEdge[],
  boxW: number
): Map<string, NodeBox> {
  const adjIn = new Map<string, string[]>();
  const adjOut = new Map<string, string[]>();
  for (const n of nodes) {
    adjIn.set(n.id, []);
    adjOut.set(n.id, []);
  }
  for (const e of edges) {
    adjOut.get(e.from)?.push(e.to);
    adjIn.get(e.to)?.push(e.from);
  }

  const visited = new Set<string>();
  const columns: string[][] = [];

  const roots = nodes.filter((n) => (adjIn.get(n.id)?.length ?? 0) === 0).map((n) => n.id);
  if (roots.length === 0 && nodes.length > 0) {
    roots.push(nodes[0]!.id);
  }

  const queue: Array<{ id: string; col: number }> = roots.map((id) => ({ id, col: 0 }));
  while (queue.length > 0) {
    const item = queue.shift()!;
    if (visited.has(item.id)) continue;
    visited.add(item.id);
    if (columns[item.col] === undefined) columns[item.col] = [];
    columns[item.col]!.push(item.id);
    const out = adjOut.get(item.id) ?? [];
    for (const next of out) {
      queue.push({ id: next, col: item.col + 1 });
    }
  }

  for (const n of nodes) {
    if (!visited.has(n.id)) {
      if (columns[0] === undefined) columns[0] = [];
      columns[0]!.push(n.id);
    }
  }

  const boxMap = new Map<string, NodeBox>();
  for (const n of nodes) {
    const labelLines = wrapText(n.label, boxW - BOX_PAD_X * 2);
    const descLines = n.description ? wrapText(n.description, boxW - BOX_PAD_X * 2, DESC_FONT_SIZE) : [];
    const h =
      BOX_PAD_Y * 2 +
      textBlockHeight(labelLines.length) +
      (descLines.length > 0 ? 4 + textBlockHeight(descLines.length, DESC_FONT_SIZE) : 0);
    boxMap.set(n.id, { id: n.id, x: 0, y: 0, w: boxW, h, labelLines, descLines, node: n });
  }

  for (let col = 0; col < columns.length; col++) {
    const colNodes = columns[col] ?? [];
    let y = PAD;
    for (const id of colNodes) {
      const box = boxMap.get(id)!;
      box.x = PAD + col * (boxW + H_GAP);
      box.y = y;
      y += box.h + V_GAP;
    }
  }

  return boxMap;
}

function layoutTB(
  nodes: FlowNode[],
  edges: FlowEdge[],
  boxW: number
): Map<string, NodeBox> {
  const adjIn = new Map<string, string[]>();
  const adjOut = new Map<string, string[]>();
  for (const n of nodes) {
    adjIn.set(n.id, []);
    adjOut.set(n.id, []);
  }
  for (const e of edges) {
    adjOut.get(e.from)?.push(e.to);
    adjIn.get(e.to)?.push(e.from);
  }

  const visited = new Set<string>();
  const rows: string[][] = [];

  const roots = nodes.filter((n) => (adjIn.get(n.id)?.length ?? 0) === 0).map((n) => n.id);
  if (roots.length === 0 && nodes.length > 0) {
    roots.push(nodes[0]!.id);
  }

  const queue: Array<{ id: string; row: number }> = roots.map((id) => ({ id, row: 0 }));
  while (queue.length > 0) {
    const item = queue.shift()!;
    if (visited.has(item.id)) continue;
    visited.add(item.id);
    if (rows[item.row] === undefined) rows[item.row] = [];
    rows[item.row]!.push(item.id);
    const out = adjOut.get(item.id) ?? [];
    for (const next of out) {
      queue.push({ id: next, row: item.row + 1 });
    }
  }

  for (const n of nodes) {
    if (!visited.has(n.id)) {
      if (rows[0] === undefined) rows[0] = [];
      rows[0]!.push(n.id);
    }
  }

  const boxMap = new Map<string, NodeBox>();
  for (const n of nodes) {
    const labelLines = wrapText(n.label, boxW - BOX_PAD_X * 2);
    const descLines = n.description ? wrapText(n.description, boxW - BOX_PAD_X * 2, DESC_FONT_SIZE) : [];
    const h =
      BOX_PAD_Y * 2 +
      textBlockHeight(labelLines.length) +
      (descLines.length > 0 ? 4 + textBlockHeight(descLines.length, DESC_FONT_SIZE) : 0);
    boxMap.set(n.id, { id: n.id, x: 0, y: 0, w: boxW, h, labelLines, descLines, node: n });
  }

  for (let row = 0; row < rows.length; row++) {
    const rowNodes = rows[row] ?? [];
    let x = PAD;
    for (const id of rowNodes) {
      const box = boxMap.get(id)!;
      box.x = x;
      x += boxW + H_GAP;
      let totalY = PAD;
      for (let r = 0; r < row; r++) {
        const rNodes = rows[r] ?? [];
        const rH = rNodes.reduce((max, rid) => {
          const b = boxMap.get(rid);
          return b !== undefined ? Math.max(max, b.h) : max;
        }, 0);
        totalY += rH + V_GAP;
      }
      box.y = totalY;
    }
  }

  return boxMap;
}

function edgePath(from: NodeBox, to: NodeBox, direction: string): string {
  if (direction === "LR") {
    const x1 = from.x + from.w;
    const y1 = from.y + from.h / 2;
    const x2 = to.x;
    const y2 = to.y + to.h / 2;
    const cx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
  }
  if (direction === "RL") {
    const x1 = from.x;
    const y1 = from.y + from.h / 2;
    const x2 = to.x + to.w;
    const y2 = to.y + to.h / 2;
    const cx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
  }
  if (direction === "BT") {
    const x1 = from.x + from.w / 2;
    const y1 = from.y;
    const x2 = to.x + to.w / 2;
    const y2 = to.y + to.h;
    const cy = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`;
  }
  const x1 = from.x + from.w / 2;
  const y1 = from.y + from.h;
  const x2 = to.x + to.w / 2;
  const y2 = to.y;
  const cy = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`;
}

export function renderFlow(
  diagram: FlowDiagram,
  theme: ResolvedTheme,
  diagramId: string
): { svg: string; diagnostics: MSVGDiagnostic[] } {
  const diagnostics: MSVGDiagnostic[] = [];
  const direction = diagram.direction ?? "LR";
  const boxW = Math.min(MAX_BOX_W, Math.max(MIN_BOX_W, 200));

  if (diagram.nodes.length > 20) {
    diagnostics.push(
      warnDiag("MSVG_LAYOUT_DENSE", "Flow diagram has many nodes and may be hard to read. Consider splitting it.")
    );
  }

  const boxMap =
    direction === "TB" || direction === "BT"
      ? layoutTB(diagram.nodes, diagram.edges, boxW)
      : layoutLR(diagram.nodes, diagram.edges, boxW);

  const markerId = safeSvgId(diagramId, "arrow");

  const allBoxes = [...boxMap.values()];
  let labelMaxX = 0;
  let labelMaxY = 0;

  const defs = `<defs>${arrowMarker(markerId, theme.borderStrong)}</defs>`;

  const edgeEls = diagram.edges.map((e) => {
    const fromBox = boxMap.get(e.from);
    const toBox = boxMap.get(e.to);
    if (fromBox === undefined || toBox === undefined) return "";
    const d = edgePath(fromBox, toBox, direction);
    const path = svgArrowPath(d, markerId, { stroke: theme.borderStrong, "stroke-width": "1.5" });

    let labelEl = "";
    if (e.label) {
      const mx = (fromBox.x + fromBox.w / 2 + toBox.x + toBox.w / 2) / 2;
      const my = (fromBox.y + fromBox.h / 2 + toBox.y + toBox.h / 2) / 2;
      const tw = estimateTextWidth(e.label, DESC_FONT_SIZE) + 8;
      const th = DESC_FONT_SIZE * LINE_HEIGHT + 4;
      const rx = Math.max(2, mx - tw / 2);
      const ry = Math.max(2, my - th / 2);
      labelMaxX = Math.max(labelMaxX, rx + tw);
      labelMaxY = Math.max(labelMaxY, ry + th);
      labelEl =
        `<rect x="${rx}" y="${ry}" width="${tw}" height="${th}" rx="4" fill="${escapeAttr(theme.background)}" opacity="0.85"/>` +
        `<text x="${mx}" y="${my + DESC_FONT_SIZE / 2}" text-anchor="middle" font-size="${DESC_FONT_SIZE}" font-family="${escapeAttr(theme.fontFamily)}" fill="${escapeAttr(theme.textMuted)}">${escapeXml(e.label)}</text>`;
    }

    return path + labelEl;
  }).join("");

  const totalW = Math.max(
    allBoxes.reduce((max, b) => Math.max(max, b.x + b.w + PAD), 0),
    labelMaxX + PAD
  );
  const totalH = Math.max(
    allBoxes.reduce((max, b) => Math.max(max, b.y + b.h + PAD), 0),
    labelMaxY + PAD
  );
  const captionH = diagram.caption ? FONT_SIZE * LINE_HEIGHT + 12 : 0;
  const svgW = Math.max(totalW, 400);
  const svgH = totalH + captionH;

  const nodeEls = diagram.nodes.map((n) => {
    const box = boxMap.get(n.id);
    if (box === undefined) return "";
    const fill = kindFill(n.kind, theme);
    const stroke = kindStroke(n.kind, theme);
    const shadow = theme.shadow ? shadowRect(box.x, box.y, box.w, box.h, BOX_RADIUS, theme.shadow) : "";
    const rect = roundedBox(box.x, box.y, box.w, box.h, BOX_RADIUS, fill, stroke);
    const cx = box.x + box.w / 2;

    const labelTop = box.y + BOX_PAD_Y;
    const labelEl = multilineText(box.labelLines, cx, labelTop, FONT_SIZE, theme.text, theme.fontFamily, "600");

    let descEl = "";
    if (box.descLines.length > 0) {
      const descTop = labelTop + textBlockHeight(box.labelLines.length) + 4;
      descEl = multilineText(box.descLines, cx, descTop, DESC_FONT_SIZE, theme.textMuted, theme.fontFamily);
    }

    let kindBadge = "";
    if (n.kind === "decision") {
      const bx = box.x + box.w - 22;
      const by = box.y + 8;
      kindBadge = `<text x="${bx}" y="${by + 10}" font-size="10" font-family="${escapeAttr(theme.fontFamily)}" fill="${escapeAttr(theme.warning)}">?</text>`;
    }

    return shadow + rect + labelEl + descEl + kindBadge;
  }).join("");

  let capEl = "";
  if (diagram.caption) {
    capEl = captionText(diagram.caption, svgW / 2, totalH + captionH - 8, theme);
  }

  const content = defs + svgGroup(edgeEls) + svgGroup(nodeEls) + capEl;
  const desc = diagram.description;
  const svg = svgRoot(svgW, svgH, diagram.title, desc, theme, diagramId, content);

  return { svg, diagnostics };
}
