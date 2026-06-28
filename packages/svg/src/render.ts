import type { DiagramDocument, MSVGDiagnostic } from "@markdown-utils/msvg-core";
import type {
  ResolvedTheme,
  ThemeInput,
  ThemeResolveMode,
  ThemeOutputMode,
  ThemeBackground,
} from "./theme.js";
import { resolveThemeResult } from "./theme.js";
import { layoutAndRender } from "./layout/index.js";
import { safeSvgId } from "./escaping.js";

export interface RenderSvgOptions {
  theme?: ThemeInput;
  diagramId?: string;
  themeMode?: ThemeResolveMode;
  themeOutputMode?: ThemeOutputMode;
  background?: ThemeBackground;
  idSalt?: string;
}

export interface RenderSvgResult {
  svg: string;
  diagnostics: MSVGDiagnostic[];
  theme: ResolvedTheme;
}

export interface LayoutOptions {
  theme?: ThemeInput;
  diagramId?: string;
  themeMode?: ThemeResolveMode;
  themeOutputMode?: ThemeOutputMode;
  background?: ThemeBackground;
  idSalt?: string;
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
  const base = safeSvgId(options.diagramId ?? diagram.id ?? diagram.title, "d");
  if (options.idSalt !== undefined && options.idSalt.length > 0) {
    return `${base}-${safeSvgId(options.idSalt, "s")}`;
  }
  return base;
}

export function renderSvg(
  diagram: DiagramDocument,
  options: RenderSvgOptions = {}
): RenderSvgResult {
  const resolution = resolveThemeResult(options.theme ?? (diagram.theme as ThemeInput | undefined), {
    mode: options.themeMode,
    outputMode: options.themeOutputMode,
    background: options.background,
  });
  const diagramId = resolveDiagramId(diagram, options);
  const rendered = layoutAndRender(withDescription(diagram), resolution.theme, diagramId);
  return {
    svg: rendered.svg,
    diagnostics: [...resolution.diagnostics, ...rendered.diagnostics],
    theme: resolution.theme,
  };
}

export function layoutDiagram(
  diagram: DiagramDocument,
  options: LayoutOptions = {}
): LayoutResult {
  const resolution = resolveThemeResult(options.theme ?? (diagram.theme as ThemeInput | undefined), {
    mode: options.themeMode,
    outputMode: options.themeOutputMode,
    background: options.background,
  });
  const diagramId = resolveDiagramId(diagram, options);
  const rendered = layoutAndRender(withDescription(diagram), resolution.theme, diagramId);
  return {
    svg: rendered.svg,
    diagnostics: [...resolution.diagnostics, ...rendered.diagnostics],
  };
}
