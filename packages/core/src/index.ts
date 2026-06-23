export type {
  DiagramType,
  Severity,
  MSVGDiagnostic,
  DiagramBase,
  NodeKind,
  FlowNode,
  FlowEdge,
  FlowDirection,
  FlowDiagram,
  FlowGroup,
  MindmapBranch,
  MindmapDiagram,
  LayerDirection,
  Layer,
  LayersDiagram,
  ColumnTone,
  ComparisonColumn,
  ComparisonDiagram,
  SequenceParticipant,
  SequenceMessage,
  SequenceDiagram,
  EventStatus,
  TimelineEvent,
  TimelineDiagram,
  ComponentKind,
  ArchitectureDirection,
  ArchitectureComponent,
  ArchitectureGroup,
  ArchitectureConnection,
  ArchitectureDiagram,
  DiagramDocument,
  ParseOptions,
  ParseResult,
  NormalizeOptions,
  NormalizeResult,
  ValidateOptions,
  ValidationResult,
  ParseAndValidateOptions,
  ParseAndValidateResult,
} from "./types.js";

export { parseMSVG } from "./parser.js";
export { normalizeDiagram } from "./normalizer.js";
export { validateDiagram } from "./validator.js";
export { DiagCodes, makeDiagnostic, errorDiag, warnDiag, infoDiag, hasErrors } from "./diagnostics.js";
export { parseEdgeShorthand, parseEdgeList, parseConnectionList } from "./edge-parser.js";

import type {
  ParseAndValidateOptions,
  ParseAndValidateResult,
} from "./types.js";
import { parseMSVG } from "./parser.js";
import { normalizeDiagram } from "./normalizer.js";
import { validateDiagram } from "./validator.js";
import { hasErrors } from "./diagnostics.js";

export function parseAndValidate(
  source: string,
  options: ParseAndValidateOptions = {}
): ParseAndValidateResult {
  const parseResult = parseMSVG(source, options);

  if (parseResult.raw === null || hasErrors(parseResult.diagnostics)) {
    return {
      diagram: null,
      valid: false,
      diagnostics: parseResult.diagnostics,
    };
  }

  const normalizeResult = normalizeDiagram(parseResult.raw, options);

  if (normalizeResult.diagram === null || hasErrors(normalizeResult.diagnostics)) {
    return {
      diagram: null,
      valid: false,
      diagnostics: [...parseResult.diagnostics, ...normalizeResult.diagnostics],
    };
  }

  const validateResult = validateDiagram(
    normalizeResult.diagram,
    options,
    parseResult.raw as Record<string, unknown>
  );

  return {
    diagram: hasErrors(validateResult.diagnostics) ? null : normalizeResult.diagram,
    valid: validateResult.valid,
    diagnostics: [
      ...parseResult.diagnostics,
      ...normalizeResult.diagnostics,
      ...validateResult.diagnostics,
    ],
  };
}
