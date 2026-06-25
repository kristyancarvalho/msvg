import type { SequenceDiagram, MSVGDiagnostic } from "@msvg/core";
import type { ResolvedTheme } from "../theme.js";
import {
  wrapText,
  estimateTextWidth,
  FONT_SIZE,
  DESC_FONT_SIZE,
  LINE_HEIGHT,
} from "../text.js";
import {
  roundedBox,
  multilineText,
  svgArrowPath,
  arrowMarker,
  captionText,
  svgRoot,
} from "../primitives.js";
import { escapeAttr, escapeXml, safeSvgId } from "../escaping.js";

const PAD = 40;
const PARTICIPANT_W = 160;
const PARTICIPANT_H = 44;
const PARTICIPANT_GAP = 80;
const MESSAGE_V_GAP = 50;
const LIFELINE_EXTRA = 30;
const BOX_RADIUS = 8;
const MSG_FONT = DESC_FONT_SIZE;

export function renderSequence(
  diagram: SequenceDiagram,
  theme: ResolvedTheme,
  diagramId: string
): { svg: string; diagnostics: MSVGDiagnostic[] } {
  const diagnostics: MSVGDiagnostic[] = [];

  const pCount = diagram.participants.length;
  const colW = PARTICIPANT_W + PARTICIPANT_GAP;
  const svgW = PAD * 2 + pCount * colW - PARTICIPANT_GAP + PARTICIPANT_W;
  const lifelineTop = PAD + PARTICIPANT_H;
  const messagesH = diagram.messages.length * MESSAGE_V_GAP + LIFELINE_EXTRA;
  const captionH = diagram.caption ? FONT_SIZE * LINE_HEIGHT + 12 : 0;
  const svgH = lifelineTop + messagesH + PAD + captionH;

  const markerId = safeSvgId(diagramId, "arrow");

  const participantCenters = diagram.participants.map((p, i) => ({
    p,
    cx: PAD + i * colW + PARTICIPANT_W / 2,
    x: PAD + i * colW,
  }));

  const centerMap = new Map(participantCenters.map((pc) => [pc.p.id, pc.cx]));

  const participantEls = participantCenters.map(({ p, x }) => {
    const lines = wrapText(p.label, PARTICIPANT_W - 16);
    const h = PARTICIPANT_H;
    const rect = roundedBox(x, PAD, PARTICIPANT_W, h, BOX_RADIUS, theme.accent, theme.accent, 2);
    const cx = x + PARTICIPANT_W / 2;
    const textEl = multilineText(lines, cx, PAD + 12, FONT_SIZE, theme.background, theme.fontFamily, "600");
    return rect + textEl;
  }).join("");

  const lifelineEls = participantCenters.map(({ cx }) => {
    return `<line x1="${cx}" y1="${lifelineTop}" x2="${cx}" y2="${lifelineTop + messagesH}" stroke="${escapeAttr(theme.border)}" stroke-width="1.5" stroke-dasharray="6,4"/>`;
  }).join("");

  const messageEls = diagram.messages.map((msg, i) => {
    const y = lifelineTop + (i + 1) * MESSAGE_V_GAP;
    const fromCx = centerMap.get(msg.from) ?? PAD;
    const toCx = centerMap.get(msg.to) ?? PAD;

    const isSelf = fromCx === toCx;
    let arrowEl = "";

    if (isSelf) {
      const loopX = fromCx + 30;
      const d = `M ${fromCx} ${y - 10} C ${loopX + 20} ${y - 10}, ${loopX + 20} ${y + 10}, ${fromCx} ${y + 10}`;
      arrowEl = svgArrowPath(d, markerId, { stroke: escapeAttr(theme.borderStrong), "stroke-width": "1.5" });
    } else {
      const dir = toCx > fromCx ? 1 : -1;
      const endX = toCx - dir * 8;
      const d = `M ${fromCx} ${y} L ${endX} ${y}`;
      arrowEl = svgArrowPath(d, markerId, { stroke: escapeAttr(theme.borderStrong), "stroke-width": "1.5" });
    }

    let labelEl = "";
    if (msg.label) {
      const midX = isSelf ? fromCx + 40 : (fromCx + toCx) / 2;
      const midY = isSelf ? y : y - 8;
      const tw = estimateTextWidth(msg.label, MSG_FONT) + 8;
      const th = MSG_FONT + 4;
      labelEl =
        `<rect x="${midX - tw / 2}" y="${midY - th}" width="${tw}" height="${th}" rx="3" fill="${escapeAttr(theme.background)}" opacity="0.9"/>` +
        `<text x="${midX}" y="${midY - 2}" text-anchor="middle" font-size="${MSG_FONT}" font-family="${escapeAttr(theme.fontFamily)}" fill="${escapeAttr(theme.textMuted)}">${escapeXml(msg.label)}</text>`;
    }

    let noteEl = "";
    if (msg.note) {
      const noteX = Math.max(fromCx, toCx) + 16;
      noteEl = `<text x="${noteX}" y="${y + 4}" font-size="${DESC_FONT_SIZE - 1}" font-family="${escapeAttr(theme.fontFamily)}" fill="${escapeAttr(theme.textMuted)}" font-style="italic">${escapeXml(msg.note)}</text>`;
    }

    return arrowEl + labelEl + noteEl;
  }).join("");

  const bottomParticipants = participantCenters.map(({ p, x }) => {
    const lines = wrapText(p.label, PARTICIPANT_W - 16);
    const ty = lifelineTop + messagesH;
    const rect = roundedBox(x, ty, PARTICIPANT_W, PARTICIPANT_H, BOX_RADIUS, theme.accent, theme.accent, 2);
    const cx = x + PARTICIPANT_W / 2;
    const textEl = multilineText(lines, cx, ty + 12, FONT_SIZE, theme.background, theme.fontFamily, "600");
    return rect + textEl;
  }).join("");

  const defs = `<defs>${arrowMarker(markerId, theme.borderStrong)}</defs>`;

  let capEl = "";
  if (diagram.caption) {
    capEl = captionText(diagram.caption, svgW / 2, svgH - captionH + 4, theme);
  }

  const content = defs + participantEls + lifelineEls + messageEls + bottomParticipants + capEl;
  const svg = svgRoot(svgW, svgH, diagram.title, diagram.description, theme, diagramId, content);

  return { svg, diagnostics };
}
