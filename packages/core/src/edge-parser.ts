import type { FlowEdge, ArchitectureConnection } from "./types.js";
import { errorDiag, DiagCodes } from "./diagnostics.js";
import type { MSVGDiagnostic } from "./types.js";

const SHORTHAND_PATTERN = /^\s*([A-Za-z0-9_-]+)\s*->\s*([A-Za-z0-9_-]+)\s*$/;
const SHORTHAND_WITH_LABEL_PATTERN =
  /^\s*([A-Za-z0-9_-]+)\s*->\s*([A-Za-z0-9_-]+)\s*:\s*"([^"]*)"\s*$/;
const SHORTHAND_UNQUOTED_PATTERN =
  /^\s*([A-Za-z0-9_-]+)\s*->\s*([A-Za-z0-9_-]+)\s*:\s*(.+)\s*$/;

export interface EdgeParseResult {
  from: string;
  to: string;
  label?: string | undefined;
}

export interface ParseEdgeOutcome {
  edge: EdgeParseResult | null;
  diagnostics: MSVGDiagnostic[];
}

export function parseEdgeShorthand(raw: unknown): ParseEdgeOutcome {
  const diagnostics: MSVGDiagnostic[] = [];

  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    const from = obj["from"];
    const to = obj["to"];
    const label = obj["label"];

    if (typeof from !== "string" || from.trim() === "") {
      diagnostics.push(
        errorDiag(DiagCodes.INVALID_EDGE, "Edge object is missing a valid 'from' field.")
      );
      return { edge: null, diagnostics };
    }
    if (typeof to !== "string" || to.trim() === "") {
      diagnostics.push(
        errorDiag(DiagCodes.INVALID_EDGE, "Edge object is missing a valid 'to' field.")
      );
      return { edge: null, diagnostics };
    }

    return {
      edge: {
        from: from.trim(),
        to: to.trim(),
        label: typeof label === "string" ? label.trim() : undefined,
      },
      diagnostics,
    };
  }

  if (typeof raw === "string") {
    const quoted = SHORTHAND_WITH_LABEL_PATTERN.exec(raw);
    if (quoted !== null) {
      const [, from, to, label] = quoted as unknown as [string, string, string, string];
      return { edge: { from, to, label }, diagnostics };
    }

    const plain = SHORTHAND_PATTERN.exec(raw);
    if (plain !== null) {
      const [, from, to] = plain as unknown as [string, string, string];
      return { edge: { from, to }, diagnostics };
    }

    const unquoted = SHORTHAND_UNQUOTED_PATTERN.exec(raw);
    if (unquoted !== null) {
      const [, from, to, label] = unquoted as unknown as [string, string, string, string];
      return { edge: { from, to, label: label.trim() }, diagnostics };
    }

    diagnostics.push(
      errorDiag(
        DiagCodes.INVALID_EDGE,
        `Cannot parse edge shorthand: "${raw}". Expected format: "a -> b" or "a -> b: \\"label\\""`,
        { hint: 'Use format: "nodeA -> nodeB: \\"label\\""' }
      )
    );
    return { edge: null, diagnostics };
  }

  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    const entries = Object.entries(raw as Record<string, unknown>);
    if (entries.length === 1) {
      const [key, value] = entries[0] as [string, unknown];
      const quoted = SHORTHAND_WITH_LABEL_PATTERN.exec(key);
      if (quoted !== null) {
        const [, from, to, label] = quoted as unknown as [string, string, string, string];
        return {
          edge: {
            from,
            to,
            label: typeof value === "string" ? value : label,
          },
          diagnostics,
        };
      }
    }
  }

  diagnostics.push(
    errorDiag(DiagCodes.INVALID_EDGE, "Edge entry must be a string shorthand or an object with 'from' and 'to'.")
  );
  return { edge: null, diagnostics };
}

export function parseEdgeList(rawEdges: unknown[]): {
  edges: FlowEdge[];
  diagnostics: MSVGDiagnostic[];
} {
  const diagnostics: MSVGDiagnostic[] = [];
  const edges: FlowEdge[] = [];

  for (const raw of rawEdges) {
    let resolved = raw;

    if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
      const obj = raw as Record<string, unknown>;
      const keys = Object.keys(obj);

      const shorthandKey = keys.find((k) =>
        SHORTHAND_PATTERN.test(k) ||
        SHORTHAND_WITH_LABEL_PATTERN.test(k) ||
        SHORTHAND_UNQUOTED_PATTERN.test(k)
      );

      if (shorthandKey !== undefined) {
        const label = obj[shorthandKey];
        const keyResult = parseEdgeShorthand(shorthandKey);
        if (keyResult.edge !== null) {
          edges.push({
            from: keyResult.edge.from,
            to: keyResult.edge.to,
            label: typeof label === "string" ? label : keyResult.edge.label,
          });
          continue;
        }
        diagnostics.push(...keyResult.diagnostics);
        continue;
      }

      resolved = raw;
    }

    const result = parseEdgeShorthand(resolved);
    diagnostics.push(...result.diagnostics);
    if (result.edge !== null) {
      edges.push(result.edge);
    }
  }

  return { edges, diagnostics };
}

export function parseConnectionList(rawConnections: unknown[]): {
  connections: ArchitectureConnection[];
  diagnostics: MSVGDiagnostic[];
} {
  const { edges, diagnostics } = parseEdgeList(rawConnections);
  return { connections: edges, diagnostics };
}
