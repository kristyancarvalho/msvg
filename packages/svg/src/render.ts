import type { DiagramDocument, MSVGDiagnostic } from "@msvg/core";
import type { ResolvedTheme, ThemeInput } from "./theme.js";
import { resolveTheme } from "./theme.js";
import { layoutAndRender } from "./layout/index.js";
import { safeSvgId } from "./escaping.js";

export interface RenderSvgOptions {
  theme?: ThemeInput;
  diagramId?: string;
}

export interface RenderSvgResult {
  svg: string;
  diagnostics: MSVGDiagnostic[];
  theme: ResolvedTheme;
}

export interface LayoutOptions {
  theme?: ThemeInput;
  diagramId?: string;
}

export interface LayoutResult {
  svg: string;
  diagnostics: MSVGDiagnostic[];
}

function describeDiagram(diagram: DiagramDocument): string {
  switch (diagram.type) {
    case "flow":
      return `Flow diagram with ${diagram.nodes.length} nodes and ${diagram.edges.length} edges.`;
    case "mindmap":
      return `Mind map with ${diagram.branches.length} branches.`;
    case "layers":
      return `Layer diagram with ${diagram.layers.length} layers.`;
    case "comparison":
      return `Comparison diagram with ${diagram.columns.length} columns.`;
    case "sequence":
      return `Sequence diagram with ${diagram.participants.length} participants and ${diagram.messages.length} messages.`;
    case "timeline":
      return `Timeline diagram with ${diagram.events.length} events.`;
    case "architecture":
      return `Architecture diagram with ${diagram.components.length} components and ${diagram.connections.length} connections.`;
  }
  return "MSVG diagram.";
}

function withDescription(diagram: DiagramDocument): DiagramDocument {
  if (diagram.description !== undefined && diagram.description.trim().length > 0) {
    return diagram;
  }
  return { ...diagram, description: describeDiagram(diagram) } as DiagramDocument;
}

function resolveDiagramId(diagram: DiagramDocument, options: RenderSvgOptions | LayoutOptions): string {
  return safeSvgId(options.diagramId ?? diagram.id ?? diagram.title, "d");
}

export function renderSvg(
  diagram: DiagramDocument,
  options: RenderSvgOptions = {}
): RenderSvgResult {
  const theme = resolveTheme(options.theme ?? (diagram.theme as ThemeInput | undefined));
  const diagramId = resolveDiagramId(diagram, options);
  const { svg, diagnostics } = layoutAndRender(withDescription(diagram), theme, diagramId);
  return { svg, diagnostics, theme };
}

export function layoutDiagram(
  diagram: DiagramDocument,
  options: LayoutOptions = {}
): LayoutResult {
  const theme = resolveTheme(options.theme ?? (diagram.theme as ThemeInput | undefined));
  const diagramId = resolveDiagramId(diagram, options);
  return layoutAndRender(withDescription(diagram), theme, diagramId);
}
