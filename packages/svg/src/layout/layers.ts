import type { LayersDiagram, MSVGDiagnostic } from "@msvg/core";
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
  svgText,
} from "../primitives.js";

const PAD = 32;
const BOX_PAD_X = 18;
const BOX_PAD_Y = 14;
const BOX_RADIUS = 10;
const V_GAP = 12;
const MIN_W = 400;

export function renderLayers(
  diagram: LayersDiagram,
  theme: ResolvedTheme,
  diagramId: string
): { svg: string; diagnostics: MSVGDiagnostic[] } {
  const diagnostics: MSVGDiagnostic[] = [];

  const direction = diagram.direction ?? "top-down";
  const orderedLayers = direction === "bottom-up" ? [...diagram.layers].reverse() : diagram.layers;

  const svgW = Math.max(MIN_W, 560);
  const innerW = svgW - PAD * 2;

  const layerHeights = orderedLayers.map((layer) => {
    const labelLines = wrapText(layer.label, innerW - BOX_PAD_X * 2);
    const noteLines = layer.note ? wrapText(layer.note, innerW - BOX_PAD_X * 2, DESC_FONT_SIZE) : [];
    const h =
      BOX_PAD_Y * 2 +
      textBlockHeight(labelLines.length) +
      (noteLines.length > 0 ? 4 + textBlockHeight(noteLines.length, DESC_FONT_SIZE) : 0);
    return { layer, labelLines, noteLines, h };
  });

  const totalContentH = layerHeights.reduce((sum, l) => sum + l.h + V_GAP, 0) - V_GAP;
  const captionH = diagram.caption ? FONT_SIZE * LINE_HEIGHT + 12 : 0;
  const svgH = PAD * 2 + totalContentH + captionH;

  let y = PAD;
  const layerEls = layerHeights.map(({ layer, labelLines, noteLines, h }) => {
    const fill = layer.emphasis ? theme.accentSoft : theme.surface;
    const stroke = layer.emphasis ? theme.accent : theme.border;
    const strokeW = layer.emphasis ? 2 : 1.5;

    const rect = roundedBox(PAD, y, innerW, h, BOX_RADIUS, fill, stroke, strokeW);
    const cx = PAD + innerW / 2;
    const labelEl = multilineText(
      labelLines,
      cx,
      y + BOX_PAD_Y,
      FONT_SIZE,
      layer.emphasis ? theme.accent : theme.text,
      theme.fontFamily,
      layer.emphasis ? "700" : "600"
    );

    let noteEl = "";
    if (noteLines.length > 0) {
      const noteTop = y + BOX_PAD_Y + textBlockHeight(labelLines.length) + 4;
      noteEl = multilineText(noteLines, cx, noteTop, DESC_FONT_SIZE, theme.textMuted, theme.fontFamily);
    }

    const numberLabel = svgText(
      PAD + BOX_PAD_X,
      y + h / 2 + DESC_FONT_SIZE / 2,
      direction === "bottom-up"
        ? String(orderedLayers.indexOf(layer) + 1)
        : String(orderedLayers.indexOf(layer) + 1),
      {
        "font-size": DESC_FONT_SIZE,
        "font-family": theme.fontFamily,
        fill: theme.textMuted,
        "text-anchor": "start",
      }
    );

    y += h + V_GAP;
    return rect + numberLabel + labelEl + noteEl;
  }).join("");

  let capEl = "";
  if (diagram.caption) {
    capEl = captionText(diagram.caption, svgW / 2, PAD + totalContentH + captionH - 8, theme);
  }

  const content = layerEls + capEl;
  const svg = svgRoot(svgW, svgH, diagram.title, diagram.description, theme, diagramId, content);

  return { svg, diagnostics };
}
