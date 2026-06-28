import type {
  DiagramDocument,
  DiagramBase,
  DiagramType,
  FlowDiagram,
  FlowNode,
  FlowGroup,
  MindmapDiagram,
  MindmapBranch,
  LayersDiagram,
  Layer,
  ComparisonDiagram,
  ComparisonColumn,
  SequenceDiagram,
  SequenceParticipant,
  SequenceMessage,
  TimelineDiagram,
  TimelineEvent,
  ArchitectureDiagram,
  ArchitectureComponent,
  ArchitectureGroup,
  NormalizeOptions,
  NormalizeResult,
  MSVGDiagnostic,
} from "./types.js";
import { errorDiag, warnDiag, DiagCodes } from "./diagnostics.js";
import { parseEdgeList, parseConnectionList } from "./edge-parser.js";

const SUPPORTED_TYPES: DiagramType[] = [
  "flow",
  "mindmap",
  "layers",
  "comparison",
  "sequence",
  "timeline",
  "architecture",
];

function asString(val: unknown): string | undefined {
  return typeof val === "string" ? val : undefined;
}

function asRecord(val: unknown): Record<string, unknown> | undefined {
  if (typeof val === "object" && val !== null && !Array.isArray(val)) {
    return val as Record<string, unknown>;
  }
  return undefined;
}

function asArray(val: unknown): unknown[] | undefined {
  return Array.isArray(val) ? val : undefined;
}

const VALID_NODE_KINDS = ["default", "input", "process", "decision", "output", "warning", "success"];
const VALID_COMPONENT_KINDS = [
  "default",
  "client",
  "service",
  "storage",
  "database",
  "queue",
  "external",
  "build",
  "content",
  "output",
  "user",
];
const VALID_EVENT_STATUSES = ["past", "current", "future", "risk", "done", "blocked"];

function unknownNestedFields(
  obj: Record<string, unknown>,
  knownFields: string[],
  context: string,
  filePath?: string
): MSVGDiagnostic[] {
  const diagnostics: MSVGDiagnostic[] = [];
  for (const key of Object.keys(obj)) {
    if (!knownFields.includes(key)) {
      diagnostics.push(
        warnDiag(
          DiagCodes.UNKNOWN_FIELD,
          `Unknown field "${key}" in ${context}. It will be ignored.`,
          { filePath, hint: `Known fields: ${knownFields.join(", ")}.` }
        )
      );
    }
  }
  return diagnostics;
}

function extractBase(
  raw: Record<string, unknown>,
  filePath?: string
): {
  base: DiagramBase;
  diagnostics: MSVGDiagnostic[];
} {
  const diagnostics: MSVGDiagnostic[] = [];

  const type = asString(raw["type"]);
  const title = asString(raw["title"]);

  if (!type) {
    diagnostics.push(
      errorDiag(DiagCodes.MISSING_TYPE, "Diagram must have a 'type' field.", { filePath })
    );
  } else if (!SUPPORTED_TYPES.includes(type as DiagramType)) {
    diagnostics.push(
      errorDiag(
        DiagCodes.UNKNOWN_TYPE,
        `Unknown diagram type "${type}". Supported types: ${SUPPORTED_TYPES.join(", ")}.`,
        { filePath }
      )
    );
  }

  if (!title) {
    diagnostics.push(
      errorDiag(DiagCodes.MISSING_TITLE, "Diagram must have a non-empty 'title' field.", { filePath })
    );
  } else if (title.trim() === "") {
    diagnostics.push(
      errorDiag(DiagCodes.EMPTY_TITLE, "Diagram 'title' must not be empty.", { filePath })
    );
  }

  const theme = raw["theme"];
  const resolvedTheme =
    typeof theme === "string"
      ? theme
      : asRecord(theme) !== undefined
      ? (theme as Record<string, string>)
      : undefined;

  return {
    base: {
      type: (type ?? "flow") as DiagramType,
      title: (title ?? "").trim(),
      description: asString(raw["description"]),
      caption: asString(raw["caption"]),
      alt: asString(raw["alt"]),
      theme: resolvedTheme,
      id: asString(raw["id"]),
    },
    diagnostics,
  };
}

function normalizeFlowDiagram(
  raw: Record<string, unknown>,
  filePath?: string
): { diagram: FlowDiagram | null; diagnostics: MSVGDiagnostic[] } {
  const { base, diagnostics } = extractBase(raw, filePath);
  const allDiag: MSVGDiagnostic[] = [...diagnostics];

  const rawNodes = raw["nodes"];
  const rawEdges = raw["edges"];
  const rawGroups = raw["groups"];
  const direction = asString(raw["direction"]);

  const validDirections = ["LR", "RL", "TB", "BT"];
  if (direction !== undefined && !validDirections.includes(direction)) {
    allDiag.push(
      errorDiag(
        DiagCodes.INVALID_DIRECTION,
        `Invalid flow direction "${direction}". Valid values: ${validDirections.join(", ")}.`,
        { filePath }
      )
    );
  }

  const nodesRecord = asRecord(rawNodes);
  if (!nodesRecord && !asArray(rawNodes)) {
    allDiag.push(
      errorDiag(DiagCodes.MISSING_NODES, "Flow diagram must have a 'nodes' mapping.", { filePath })
    );
  }

  if (!asArray(rawEdges)) {
    allDiag.push(
      errorDiag(DiagCodes.MISSING_EDGES, "Flow diagram must have an 'edges' array.", { filePath })
    );
  }

  const nodes: FlowNode[] = [];
  if (nodesRecord) {
    for (const [id, value] of Object.entries(nodesRecord)) {
      const nodeObj = asRecord(value);
      if (nodeObj) {
        allDiag.push(...unknownNestedFields(nodeObj, ["label", "description", "kind"], `flow node "${id}"`, filePath));
        const kind = asString(nodeObj["kind"]);
        if (kind !== undefined && !VALID_NODE_KINDS.includes(kind)) {
          allDiag.push(
            warnDiag(
              DiagCodes.INVALID_NODE_KIND,
              `Unknown node kind "${kind}" for node "${id}". Valid values: ${VALID_NODE_KINDS.join(", ")}.`,
              { filePath }
            )
          );
        }
        nodes.push({
          id,
          label: asString(nodeObj["label"]) ?? id,
          description: asString(nodeObj["description"]),
          kind: kind as FlowNode["kind"],
        });
      } else if (typeof value === "string") {
        nodes.push({ id, label: value });
      } else {
        nodes.push({ id, label: id });
      }
    }
  }

  if (nodes.length === 0 && !allDiag.some((d) => d.code === DiagCodes.MISSING_NODES)) {
    allDiag.push(
      errorDiag(DiagCodes.EMPTY_DIAGRAM, "Flow diagram has no nodes.", { filePath })
    );
  }

  const rawEdgesArr = asArray(rawEdges) ?? [];
  const { edges, diagnostics: edgeDiag } = parseEdgeList(rawEdgesArr);
  allDiag.push(...edgeDiag);

  const groups: FlowGroup[] = [];
  const groupsRecord = asRecord(rawGroups);
  if (groupsRecord) {
    for (const [id, value] of Object.entries(groupsRecord)) {
      const groupObj = asRecord(value);
      if (groupObj) {
        allDiag.push(...unknownNestedFields(groupObj, ["label", "nodes"], `flow group "${id}"`, filePath));
        const components = asArray(groupObj["nodes"]) ?? [];
        groups.push({
          id,
          label: asString(groupObj["label"]) ?? id,
          nodeIds: components.filter((c) => typeof c === "string") as string[],
        });
      }
    }
  }

  if (allDiag.some((d) => d.severity === "error" && d.code !== DiagCodes.LONG_LABEL)) {
    const hasBlockingErrors = allDiag.some(
      (d) =>
        d.severity === "error" &&
        new Set<string>([DiagCodes.MISSING_TYPE, DiagCodes.UNKNOWN_TYPE, DiagCodes.MISSING_TITLE]).has(d.code)
    );
    if (hasBlockingErrors) {
      return { diagram: null, diagnostics: allDiag };
    }
  }

  const diagram: FlowDiagram = {
    ...base,
    type: "flow",
    direction: direction as FlowDiagram["direction"],
    nodes,
    edges,
    ...(groups.length > 0 ? { groups } : {}),
  };

  return { diagram, diagnostics: allDiag };
}

function normalizeMindmapDiagram(
  raw: Record<string, unknown>,
  filePath?: string
): { diagram: MindmapDiagram | null; diagnostics: MSVGDiagnostic[] } {
  const { base, diagnostics } = extractBase(raw, filePath);
  const allDiag: MSVGDiagnostic[] = [...diagnostics];

  const root = asString(raw["root"]);
  const rawBranches = raw["branches"];
  const branchesRecord = asRecord(rawBranches);

  if (!root || root.trim() === "") {
    allDiag.push(
      errorDiag(DiagCodes.EMPTY_DIAGRAM, "Mindmap diagram must have a non-empty 'root' field.", { filePath })
    );
  }

  if (!branchesRecord) {
    allDiag.push(
      errorDiag(DiagCodes.MISSING_BRANCHES, "Mindmap diagram must have a 'branches' mapping.", { filePath })
    );
  }

  const branches: MindmapBranch[] = [];
  if (branchesRecord) {
    for (const [label, value] of Object.entries(branchesRecord)) {
      const items = asArray(value) ?? [];
      branches.push({
        label,
        items: items.filter((i) => typeof i === "string") as string[],
      });
    }
  }

  if (branches.length === 0 && branchesRecord) {
    allDiag.push(
      errorDiag(DiagCodes.EMPTY_DIAGRAM, "Mindmap diagram has no branches.", { filePath })
    );
  }

  const hasBlockingErrors = allDiag.some(
    (d) =>
      d.severity === "error" &&
      new Set<string>([
        DiagCodes.MISSING_TYPE,
        DiagCodes.UNKNOWN_TYPE,
        DiagCodes.MISSING_TITLE,
        DiagCodes.EMPTY_DIAGRAM,
      ]).has(d.code)
  );
  if (hasBlockingErrors && branches.length === 0) {
    return { diagram: null, diagnostics: allDiag };
  }

  const diagram: MindmapDiagram = {
    ...base,
    type: "mindmap",
    root: root ?? "",
    branches,
  };

  return { diagram, diagnostics: allDiag };
}

function normalizeLayersDiagram(
  raw: Record<string, unknown>,
  filePath?: string
): { diagram: LayersDiagram | null; diagnostics: MSVGDiagnostic[] } {
  const { base, diagnostics } = extractBase(raw, filePath);
  const allDiag: MSVGDiagnostic[] = [...diagnostics];

  const direction = asString(raw["direction"]);
  const validDirections = ["top-down", "bottom-up"];
  if (direction !== undefined && !validDirections.includes(direction)) {
    allDiag.push(
      errorDiag(
        DiagCodes.INVALID_DIRECTION,
        `Invalid layers direction "${direction}". Valid values: ${validDirections.join(", ")}.`,
        { filePath }
      )
    );
  }

  const rawLayers = asArray(raw["layers"]);
  if (!rawLayers) {
    allDiag.push(
      errorDiag(DiagCodes.MISSING_LAYERS, "Layers diagram must have a 'layers' array.", { filePath })
    );
  }

  const layers: Layer[] = [];
  for (const item of rawLayers ?? []) {
    const layerObj = asRecord(item);
    if (layerObj) {
      allDiag.push(...unknownNestedFields(layerObj, ["label", "note", "emphasis"], "layer", filePath));
      const label = asString(layerObj["label"]);
      if (label) {
        layers.push({
          label,
          note: asString(layerObj["note"]),
          emphasis: layerObj["emphasis"] === true,
        });
      }
    } else if (typeof item === "string") {
      layers.push({ label: item });
    }
  }

  if (layers.length === 0) {
    allDiag.push(
      errorDiag(DiagCodes.EMPTY_DIAGRAM, "Layers diagram has no layers.", { filePath })
    );
    return { diagram: null, diagnostics: allDiag };
  }

  const diagram: LayersDiagram = {
    ...base,
    type: "layers",
    direction: direction as LayersDiagram["direction"],
    layers,
  };

  return { diagram, diagnostics: allDiag };
}

function normalizeComparisonDiagram(
  raw: Record<string, unknown>,
  filePath?: string
): { diagram: ComparisonDiagram | null; diagnostics: MSVGDiagnostic[] } {
  const { base, diagnostics } = extractBase(raw, filePath);
  const allDiag: MSVGDiagnostic[] = [...diagnostics];

  const rawColumns = raw["columns"];
  const columnsRecord = asRecord(rawColumns);

  if (!columnsRecord) {
    allDiag.push(
      errorDiag(DiagCodes.MISSING_COLUMNS, "Comparison diagram must have a 'columns' mapping.", { filePath })
    );
    return { diagram: null, diagnostics: allDiag };
  }

  const validTones = ["neutral", "positive", "warning", "negative"];
  const columns: ComparisonColumn[] = [];

  for (const [id, value] of Object.entries(columnsRecord)) {
    const colObj = asRecord(value);
    if (!colObj) continue;

    allDiag.push(...unknownNestedFields(colObj, ["label", "tone", "items"], `comparison column "${id}"`, filePath));

    const tone = asString(colObj["tone"]);
    if (tone !== undefined && !validTones.includes(tone)) {
      allDiag.push(
        warnDiag(
          DiagCodes.INVALID_COLUMN_TONE,
          `Unknown column tone "${tone}" in column "${id}". Valid values: ${validTones.join(", ")}.`,
          { filePath }
        )
      );
    }

    const rawItems = asArray(colObj["items"]) ?? [];
    columns.push({
      id,
      label: asString(colObj["label"]) ?? id,
      tone: tone as ComparisonColumn["tone"],
      items: rawItems.filter((i) => typeof i === "string") as string[],
    });
  }

  if (columns.length === 0) {
    allDiag.push(
      errorDiag(DiagCodes.EMPTY_DIAGRAM, "Comparison diagram has no columns.", { filePath })
    );
    return { diagram: null, diagnostics: allDiag };
  }

  const diagram: ComparisonDiagram = {
    ...base,
    type: "comparison",
    columns,
    verdict: asString(raw["verdict"]),
  };

  return { diagram, diagnostics: allDiag };
}

function normalizeSequenceDiagram(
  raw: Record<string, unknown>,
  filePath?: string
): { diagram: SequenceDiagram | null; diagnostics: MSVGDiagnostic[] } {
  const { base, diagnostics } = extractBase(raw, filePath);
  const allDiag: MSVGDiagnostic[] = [...diagnostics];

  const rawParticipants = raw["participants"];
  const participantsRecord = asRecord(rawParticipants);

  if (!participantsRecord) {
    allDiag.push(
      errorDiag(DiagCodes.MISSING_PARTICIPANTS, "Sequence diagram must have a 'participants' mapping.", { filePath })
    );
  }

  const rawMessages = asArray(raw["messages"]);
  if (!rawMessages) {
    allDiag.push(
      errorDiag(DiagCodes.MISSING_MESSAGES, "Sequence diagram must have a 'messages' array.", { filePath })
    );
  }

  const participants: SequenceParticipant[] = [];
  if (participantsRecord) {
    for (const [id, value] of Object.entries(participantsRecord)) {
      participants.push({
        id,
        label: typeof value === "string" ? value : id,
      });
    }
  }

  const messages: SequenceMessage[] = [];
  for (const rawMsg of rawMessages ?? []) {
    const msgObj = asRecord(rawMsg);
    if (msgObj && typeof msgObj["from"] === "string" && typeof msgObj["to"] === "string") {
      allDiag.push(...unknownNestedFields(msgObj, ["from", "to", "label", "note"], "sequence message", filePath));
      messages.push({
        from: msgObj["from"] as string,
        to: msgObj["to"] as string,
        label: asString(msgObj["label"]) ?? "",
        note: asString(msgObj["note"]),
      });
      continue;
    }

    if (typeof rawMsg === "string" || (msgObj && Object.keys(msgObj).length === 1)) {
      const { edges, diagnostics: edgeDiag } = parseEdgeList([rawMsg]);
      allDiag.push(...edgeDiag);
      for (const e of edges) {
        messages.push({ from: e.from, to: e.to, label: e.label ?? "" });
      }
      continue;
    }

    if (msgObj) {
      const entries = Object.entries(msgObj);
      if (entries.length === 1) {
        const [key, val] = entries[0] as [string, unknown];
        const { edges, diagnostics: edgeDiag } = parseEdgeList([key]);
        allDiag.push(...edgeDiag);
        for (const e of edges) {
          messages.push({
            from: e.from,
            to: e.to,
            label: typeof val === "string" ? val : (e.label ?? ""),
          });
        }
      }
    }
  }

  if (participants.length === 0 && !allDiag.some((d) => d.code === DiagCodes.MISSING_PARTICIPANTS)) {
    allDiag.push(
      errorDiag(DiagCodes.EMPTY_DIAGRAM, "Sequence diagram has no participants.", { filePath })
    );
    return { diagram: null, diagnostics: allDiag };
  }

  const diagram: SequenceDiagram = {
    ...base,
    type: "sequence",
    participants,
    messages,
  };

  return { diagram, diagnostics: allDiag };
}

function normalizeTimelineDiagram(
  raw: Record<string, unknown>,
  filePath?: string
): { diagram: TimelineDiagram | null; diagnostics: MSVGDiagnostic[] } {
  const { base, diagnostics } = extractBase(raw, filePath);
  const allDiag: MSVGDiagnostic[] = [...diagnostics];

  const rawEvents = asArray(raw["events"]);
  if (!rawEvents) {
    allDiag.push(
      errorDiag(DiagCodes.MISSING_EVENTS, "Timeline diagram must have an 'events' array.", { filePath })
    );
    return { diagram: null, diagnostics: allDiag };
  }

  const events: TimelineEvent[] = [];

  for (const rawEvent of rawEvents) {
    const eventObj = asRecord(rawEvent);
    if (!eventObj) continue;

    allDiag.push(...unknownNestedFields(eventObj, ["at", "title", "description", "status"], "timeline event", filePath));

    const at = asString(eventObj["at"]);
    const title = asString(eventObj["title"]);
    const status = asString(eventObj["status"]);

    if (!at || !title) continue;

    if (status !== undefined && !VALID_EVENT_STATUSES.includes(status)) {
      allDiag.push(
        warnDiag(
          DiagCodes.INVALID_EVENT_STATUS,
          `Unknown event status "${status}". Valid values: ${VALID_EVENT_STATUSES.join(", ")}.`,
          { filePath }
        )
      );
    }

    events.push({
      at,
      title,
      description: asString(eventObj["description"]),
      status: status as TimelineEvent["status"],
    });
  }

  if (events.length === 0) {
    allDiag.push(
      errorDiag(DiagCodes.EMPTY_DIAGRAM, "Timeline diagram has no events.", { filePath })
    );
    return { diagram: null, diagnostics: allDiag };
  }

  const diagram: TimelineDiagram = {
    ...base,
    type: "timeline",
    events,
  };

  return { diagram, diagnostics: allDiag };
}

function normalizeArchitectureDiagram(
  raw: Record<string, unknown>,
  filePath?: string
): { diagram: ArchitectureDiagram | null; diagnostics: MSVGDiagnostic[] } {
  const { base, diagnostics } = extractBase(raw, filePath);
  const allDiag: MSVGDiagnostic[] = [...diagnostics];

  const direction = asString(raw["direction"]);
  const validDirections = ["LR", "RL", "TB", "BT"];
  if (direction !== undefined && !validDirections.includes(direction)) {
    allDiag.push(
      errorDiag(
        DiagCodes.INVALID_DIRECTION,
        `Invalid architecture direction "${direction}". Valid values: ${validDirections.join(", ")}.`,
        { filePath }
      )
    );
  }

  const rawComponents = raw["components"];
  const componentsRecord = asRecord(rawComponents);

  if (!componentsRecord) {
    allDiag.push(
      errorDiag(DiagCodes.MISSING_COMPONENTS, "Architecture diagram must have a 'components' mapping.", { filePath })
    );
  }

  const components: ArchitectureComponent[] = [];

  if (componentsRecord) {
    for (const [id, value] of Object.entries(componentsRecord)) {
      const compObj = asRecord(value);
      if (!compObj) continue;

      allDiag.push(...unknownNestedFields(compObj, ["label", "kind"], `architecture component "${id}"`, filePath));

      const kind = asString(compObj["kind"]);
      if (kind !== undefined && !VALID_COMPONENT_KINDS.includes(kind)) {
        allDiag.push(
          warnDiag(
            DiagCodes.INVALID_COMPONENT_KIND,
            `Unknown component kind "${kind}" for component "${id}". Valid values: ${VALID_COMPONENT_KINDS.join(", ")}.`,
            { filePath }
          )
        );
      }

      components.push({
        id,
        label: asString(compObj["label"]) ?? id,
        kind: kind as ArchitectureComponent["kind"],
      });
    }
  }

  const rawGroups = raw["groups"];
  const groupsRecord = asRecord(rawGroups);
  const groups: ArchitectureGroup[] = [];

  if (groupsRecord) {
    for (const [id, value] of Object.entries(groupsRecord)) {
      const groupObj = asRecord(value);
      if (!groupObj) continue;
      allDiag.push(...unknownNestedFields(groupObj, ["label", "components"], `architecture group "${id}"`, filePath));
      const rawComponentIds = asArray(groupObj["components"]) ?? [];
      groups.push({
        id,
        label: asString(groupObj["label"]) ?? id,
        componentIds: rawComponentIds.filter((c) => typeof c === "string") as string[],
      });
    }
  }

  const rawConnections = asArray(raw["connections"]) ?? [];
  const { connections, diagnostics: connDiag } = parseConnectionList(rawConnections);
  allDiag.push(...connDiag);

  if (components.length === 0 && !allDiag.some((d) => d.code === DiagCodes.MISSING_COMPONENTS)) {
    allDiag.push(
      errorDiag(DiagCodes.EMPTY_DIAGRAM, "Architecture diagram has no components.", { filePath })
    );
    return { diagram: null, diagnostics: allDiag };
  }

  const diagram: ArchitectureDiagram = {
    ...base,
    type: "architecture",
    direction: direction as ArchitectureDiagram["direction"],
    components,
    groups,
    connections,
  };

  return { diagram, diagnostics: allDiag };
}

export function normalizeDiagram(
  input: unknown,
  options: NormalizeOptions = {}
): NormalizeResult {
  const diagnostics: MSVGDiagnostic[] = [];
  const filePath = options.filePath;

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    diagnostics.push(
      errorDiag(DiagCodes.PARSE_NOT_OBJECT, "Diagram input must be a plain object.", { filePath })
    );
    return { diagram: null, diagnostics };
  }

  const raw = input as Record<string, unknown>;
  const type = asString(raw["type"]);

  switch (type) {
    case "flow": {
      const result = normalizeFlowDiagram(raw, filePath);
      return { diagram: result.diagram, diagnostics: result.diagnostics };
    }
    case "mindmap": {
      const result = normalizeMindmapDiagram(raw, filePath);
      return { diagram: result.diagram, diagnostics: result.diagnostics };
    }
    case "layers": {
      const result = normalizeLayersDiagram(raw, filePath);
      return { diagram: result.diagram, diagnostics: result.diagnostics };
    }
    case "comparison": {
      const result = normalizeComparisonDiagram(raw, filePath);
      return { diagram: result.diagram, diagnostics: result.diagnostics };
    }
    case "sequence": {
      const result = normalizeSequenceDiagram(raw, filePath);
      return { diagram: result.diagram, diagnostics: result.diagnostics };
    }
    case "timeline": {
      const result = normalizeTimelineDiagram(raw, filePath);
      return { diagram: result.diagram, diagnostics: result.diagnostics };
    }
    case "architecture": {
      const result = normalizeArchitectureDiagram(raw, filePath);
      return { diagram: result.diagram, diagnostics: result.diagnostics };
    }
    default: {
      const { base, diagnostics: baseDiag } = extractBase(raw, filePath);
      diagnostics.push(...baseDiag);
      void base;
      return { diagram: null, diagnostics };
    }
  }
}
