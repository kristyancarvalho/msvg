import type { MSVGDiagnostic, Severity } from "./types.js";

export function makeDiagnostic(
  code: string,
  severity: Severity,
  message: string,
  extras?: Partial<Omit<MSVGDiagnostic, "code" | "severity" | "message">>
): MSVGDiagnostic {
  return { code, severity, message, ...extras };
}

export function errorDiag(
  code: string,
  message: string,
  extras?: Partial<Omit<MSVGDiagnostic, "code" | "severity" | "message">>
): MSVGDiagnostic {
  return makeDiagnostic(code, "error", message, extras);
}

export function warnDiag(
  code: string,
  message: string,
  extras?: Partial<Omit<MSVGDiagnostic, "code" | "severity" | "message">>
): MSVGDiagnostic {
  return makeDiagnostic(code, "warning", message, extras);
}

export function infoDiag(
  code: string,
  message: string,
  extras?: Partial<Omit<MSVGDiagnostic, "code" | "severity" | "message">>
): MSVGDiagnostic {
  return makeDiagnostic(code, "info", message, extras);
}

export function hasErrors(diagnostics: MSVGDiagnostic[]): boolean {
  return diagnostics.some((d) => d.severity === "error");
}

export const DiagCodes = {
  PARSE_INVALID_YAML: "MSVG_PARSE_INVALID_YAML",
  PARSE_NOT_OBJECT: "MSVG_PARSE_NOT_OBJECT",
  MISSING_TYPE: "MSVG_MISSING_TYPE",
  UNKNOWN_TYPE: "MSVG_UNKNOWN_TYPE",
  MISSING_TITLE: "MSVG_MISSING_TITLE",
  EMPTY_TITLE: "MSVG_EMPTY_TITLE",
  EMPTY_DIAGRAM: "MSVG_EMPTY_DIAGRAM",
  DUPLICATE_ID: "MSVG_DUPLICATE_ID",
  UNKNOWN_REFERENCE: "MSVG_UNKNOWN_REFERENCE",
  UNKNOWN_FIELD: "MSVG_UNKNOWN_FIELD",
  INVALID_EDGE: "MSVG_INVALID_EDGE",
  INVALID_DIRECTION: "MSVG_INVALID_DIRECTION",
  INVALID_NODE_KIND: "MSVG_INVALID_NODE_KIND",
  INVALID_COLUMN_TONE: "MSVG_INVALID_COLUMN_TONE",
  INVALID_EVENT_STATUS: "MSVG_INVALID_EVENT_STATUS",
  INVALID_COMPONENT_KIND: "MSVG_INVALID_COMPONENT_KIND",
  LONG_LABEL: "MSVG_LONG_LABEL",
  MISSING_NODES: "MSVG_MISSING_NODES",
  MISSING_EDGES: "MSVG_MISSING_EDGES",
  MISSING_BRANCHES: "MSVG_MISSING_BRANCHES",
  MISSING_LAYERS: "MSVG_MISSING_LAYERS",
  MISSING_COLUMNS: "MSVG_MISSING_COLUMNS",
  MISSING_PARTICIPANTS: "MSVG_MISSING_PARTICIPANTS",
  MISSING_MESSAGES: "MSVG_MISSING_MESSAGES",
  MISSING_EVENTS: "MSVG_MISSING_EVENTS",
  MISSING_COMPONENTS: "MSVG_MISSING_COMPONENTS",
  INVALID_ID: "MSVG_INVALID_ID",
} as const;
