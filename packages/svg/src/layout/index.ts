import type { DiagramDocument, MSVGDiagnostic } from "@markdown-utils/msvg-core";
import type { ResolvedTheme } from "../theme.js";
import { renderFlow } from "./flow.js";
import { renderMindmap } from "./mindmap.js";
import { renderLayers } from "./layers.js";
import { renderComparison } from "./comparison.js";
import { renderSequence } from "./sequence.js";
import { renderTimeline } from "./timeline.js";
import { renderArchitecture } from "./architecture.js";

export interface LayoutResult {
  svg: string;
  diagnostics: MSVGDiagnostic[];
}

export function layoutAndRender(
  diagram: DiagramDocument,
  theme: ResolvedTheme,
  diagramId: string
): LayoutResult {
  switch (diagram.type) {
    case "flow":
      return renderFlow(diagram, theme, diagramId);
    case "mindmap":
      return renderMindmap(diagram, theme, diagramId);
    case "layers":
      return renderLayers(diagram, theme, diagramId);
    case "comparison":
      return renderComparison(diagram, theme, diagramId);
    case "sequence":
      return renderSequence(diagram, theme, diagramId);
    case "timeline":
      return renderTimeline(diagram, theme, diagramId);
    case "architecture":
      return renderArchitecture(diagram, theme, diagramId);
  }
}
