import type {
  DiagramDocument,
  FlowDiagram,
  MindmapDiagram,
  LayersDiagram,
  ComparisonDiagram,
  SequenceDiagram,
  TimelineDiagram,
  ArchitectureDiagram,
  MSVGDiagnostic,
  ValidateOptions,
  ValidationResult,
} from "./types.js";
import { errorDiag, warnDiag, DiagCodes } from "./diagnostics.js";

const LABEL_WARN_LENGTH = 60;
const VALID_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

function checkId(id: string, context: string, filePath?: string): MSVGDiagnostic[] {
  if (!VALID_ID_PATTERN.test(id)) {
    return [
      errorDiag(
        DiagCodes.INVALID_ID,
        `ID "${id}" in ${context} contains invalid characters. IDs must match [A-Za-z0-9_-].`,
        { filePath }
      ),
    ];
  }
  return [];
}

function checkDuplicateIds(ids: string[], context: string, filePath?: string): MSVGDiagnostic[] {
  const seen = new Set<string>();
  const diagnostics: MSVGDiagnostic[] = [];
  for (const id of ids) {
    if (seen.has(id)) {
      diagnostics.push(
        errorDiag(
          DiagCodes.DUPLICATE_ID,
          `ID "${id}" in ${context} is defined more than once.`,
          { filePath }
        )
      );
    }
    seen.add(id);
  }
  return diagnostics;
}

function checkLabelLength(label: string, context: string, filePath?: string): MSVGDiagnostic[] {
  if (label.length > LABEL_WARN_LENGTH) {
    return [
      warnDiag(
        DiagCodes.LONG_LABEL,
        `Label in ${context} is long (${label.length} chars) and may overflow rendered output.`,
        { filePath, hint: "Consider shortening or using the 'description' field for extra detail." }
      ),
    ];
  }
  return [];
}

function validateUnknownFields(
  raw: Record<string, unknown>,
  knownFields: string[],
  context: string,
  filePath?: string
): MSVGDiagnostic[] {
  const diagnostics: MSVGDiagnostic[] = [];
  for (const key of Object.keys(raw)) {
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

const FLOW_KNOWN_FIELDS = ["type", "title", "description", "caption", "theme", "id", "direction", "nodes", "edges", "groups"];
const MINDMAP_KNOWN_FIELDS = ["type", "title", "description", "caption", "theme", "id", "root", "branches"];
const LAYERS_KNOWN_FIELDS = ["type", "title", "description", "caption", "theme", "id", "direction", "layers"];
const COMPARISON_KNOWN_FIELDS = ["type", "title", "description", "caption", "theme", "id", "columns", "verdict"];
const SEQUENCE_KNOWN_FIELDS = ["type", "title", "description", "caption", "theme", "id", "participants", "messages"];
const TIMELINE_KNOWN_FIELDS = ["type", "title", "description", "caption", "theme", "id", "events"];
const ARCHITECTURE_KNOWN_FIELDS = ["type", "title", "description", "caption", "theme", "id", "direction", "components", "groups", "connections"];

function validateFlowDiagram(
  diagram: FlowDiagram,
  rawInput: Record<string, unknown> | undefined,
  options: ValidateOptions
): MSVGDiagnostic[] {
  const diagnostics: MSVGDiagnostic[] = [];
  const { filePath, warnUnknownFields = true } = options;

  if (rawInput && warnUnknownFields) {
    diagnostics.push(...validateUnknownFields(rawInput, FLOW_KNOWN_FIELDS, "flow diagram", filePath));
  }

  const nodeIds = diagram.nodes.map((n) => n.id);
  diagnostics.push(...checkDuplicateIds(nodeIds, "flow nodes", filePath));

  for (const node of diagram.nodes) {
    diagnostics.push(...checkId(node.id, `flow node "${node.id}"`, filePath));
    diagnostics.push(...checkLabelLength(node.label, `node "${node.id}"`, filePath));
  }

  const nodeIdSet = new Set(nodeIds);
  for (const edge of diagram.edges) {
    if (!nodeIdSet.has(edge.from)) {
      diagnostics.push(
        errorDiag(
          DiagCodes.UNKNOWN_REFERENCE,
          `Edge references unknown node "${edge.from}".`,
          { filePath }
        )
      );
    }
    if (!nodeIdSet.has(edge.to)) {
      diagnostics.push(
        errorDiag(
          DiagCodes.UNKNOWN_REFERENCE,
          `Edge references unknown node "${edge.to}".`,
          { filePath }
        )
      );
    }
    if (edge.label) {
      diagnostics.push(...checkLabelLength(edge.label, `edge "${edge.from} -> ${edge.to}"`, filePath));
    }
  }

  if (diagram.groups) {
    for (const group of diagram.groups) {
      diagnostics.push(...checkId(group.id, `flow group "${group.id}"`, filePath));
      for (const nodeId of group.nodeIds) {
        if (!nodeIdSet.has(nodeId)) {
          diagnostics.push(
            errorDiag(
              DiagCodes.UNKNOWN_REFERENCE,
              `Group "${group.id}" references unknown node "${nodeId}".`,
              { filePath }
            )
          );
        }
      }
    }
  }

  return diagnostics;
}

function validateMindmapDiagram(
  diagram: MindmapDiagram,
  rawInput: Record<string, unknown> | undefined,
  options: ValidateOptions
): MSVGDiagnostic[] {
  const diagnostics: MSVGDiagnostic[] = [];
  const { filePath, warnUnknownFields = true } = options;

  if (rawInput && warnUnknownFields) {
    diagnostics.push(...validateUnknownFields(rawInput, MINDMAP_KNOWN_FIELDS, "mindmap diagram", filePath));
  }

  diagnostics.push(...checkLabelLength(diagram.root, "mindmap root", filePath));

  for (const branch of diagram.branches) {
    diagnostics.push(...checkLabelLength(branch.label, `mindmap branch "${branch.label}"`, filePath));
    for (const item of branch.items) {
      diagnostics.push(...checkLabelLength(item, `mindmap branch item in "${branch.label}"`, filePath));
    }
  }

  return diagnostics;
}

function validateLayersDiagram(
  diagram: LayersDiagram,
  rawInput: Record<string, unknown> | undefined,
  options: ValidateOptions
): MSVGDiagnostic[] {
  const diagnostics: MSVGDiagnostic[] = [];
  const { filePath, warnUnknownFields = true } = options;

  if (rawInput && warnUnknownFields) {
    diagnostics.push(...validateUnknownFields(rawInput, LAYERS_KNOWN_FIELDS, "layers diagram", filePath));
  }

  for (const layer of diagram.layers) {
    diagnostics.push(...checkLabelLength(layer.label, `layer "${layer.label}"`, filePath));
    if (layer.note) {
      diagnostics.push(...checkLabelLength(layer.note, `layer note "${layer.label}"`, filePath));
    }
  }

  return diagnostics;
}

function validateComparisonDiagram(
  diagram: ComparisonDiagram,
  rawInput: Record<string, unknown> | undefined,
  options: ValidateOptions
): MSVGDiagnostic[] {
  const diagnostics: MSVGDiagnostic[] = [];
  const { filePath, warnUnknownFields = true } = options;

  if (rawInput && warnUnknownFields) {
    diagnostics.push(...validateUnknownFields(rawInput, COMPARISON_KNOWN_FIELDS, "comparison diagram", filePath));
  }

  const colIds = diagram.columns.map((c) => c.id);
  diagnostics.push(...checkDuplicateIds(colIds, "comparison columns", filePath));

  for (const col of diagram.columns) {
    diagnostics.push(...checkLabelLength(col.label, `comparison column "${col.id}"`, filePath));
    for (const item of col.items) {
      diagnostics.push(...checkLabelLength(item, `item in column "${col.id}"`, filePath));
    }
  }

  if (diagram.verdict) {
    diagnostics.push(...checkLabelLength(diagram.verdict, "comparison verdict", filePath));
  }

  return diagnostics;
}

function validateSequenceDiagram(
  diagram: SequenceDiagram,
  rawInput: Record<string, unknown> | undefined,
  options: ValidateOptions
): MSVGDiagnostic[] {
  const diagnostics: MSVGDiagnostic[] = [];
  const { filePath, warnUnknownFields = true } = options;

  if (rawInput && warnUnknownFields) {
    diagnostics.push(...validateUnknownFields(rawInput, SEQUENCE_KNOWN_FIELDS, "sequence diagram", filePath));
  }

  const participantIds = diagram.participants.map((p) => p.id);
  diagnostics.push(...checkDuplicateIds(participantIds, "sequence participants", filePath));

  for (const p of diagram.participants) {
    diagnostics.push(...checkId(p.id, `sequence participant "${p.id}"`, filePath));
    diagnostics.push(...checkLabelLength(p.label, `participant "${p.id}"`, filePath));
  }

  const participantSet = new Set(participantIds);
  for (const msg of diagram.messages) {
    if (!participantSet.has(msg.from)) {
      diagnostics.push(
        errorDiag(
          DiagCodes.UNKNOWN_REFERENCE,
          `Message references unknown participant "${msg.from}".`,
          { filePath }
        )
      );
    }
    if (!participantSet.has(msg.to)) {
      diagnostics.push(
        errorDiag(
          DiagCodes.UNKNOWN_REFERENCE,
          `Message references unknown participant "${msg.to}".`,
          { filePath }
        )
      );
    }
    if (msg.label) {
      diagnostics.push(...checkLabelLength(msg.label, `message "${msg.from} -> ${msg.to}"`, filePath));
    }
  }

  return diagnostics;
}

function validateTimelineDiagram(
  diagram: TimelineDiagram,
  rawInput: Record<string, unknown> | undefined,
  options: ValidateOptions
): MSVGDiagnostic[] {
  const diagnostics: MSVGDiagnostic[] = [];
  const { filePath, warnUnknownFields = true } = options;

  if (rawInput && warnUnknownFields) {
    diagnostics.push(...validateUnknownFields(rawInput, TIMELINE_KNOWN_FIELDS, "timeline diagram", filePath));
  }

  for (const event of diagram.events) {
    diagnostics.push(...checkLabelLength(event.title, `timeline event "${event.at}"`, filePath));
    if (event.description) {
      diagnostics.push(...checkLabelLength(event.description, `timeline event description "${event.at}"`, filePath));
    }
  }

  return diagnostics;
}

function validateArchitectureDiagram(
  diagram: ArchitectureDiagram,
  rawInput: Record<string, unknown> | undefined,
  options: ValidateOptions
): MSVGDiagnostic[] {
  const diagnostics: MSVGDiagnostic[] = [];
  const { filePath, warnUnknownFields = true } = options;

  if (rawInput && warnUnknownFields) {
    diagnostics.push(...validateUnknownFields(rawInput, ARCHITECTURE_KNOWN_FIELDS, "architecture diagram", filePath));
  }

  const componentIds = diagram.components.map((c) => c.id);
  diagnostics.push(...checkDuplicateIds(componentIds, "architecture components", filePath));

  for (const comp of diagram.components) {
    diagnostics.push(...checkId(comp.id, `architecture component "${comp.id}"`, filePath));
    diagnostics.push(...checkLabelLength(comp.label, `component "${comp.id}"`, filePath));
  }

  const componentSet = new Set(componentIds);

  const groupIds = diagram.groups.map((g) => g.id);
  diagnostics.push(...checkDuplicateIds(groupIds, "architecture groups", filePath));

  for (const group of diagram.groups) {
    diagnostics.push(...checkId(group.id, `architecture group "${group.id}"`, filePath));
    for (const cId of group.componentIds) {
      if (!componentSet.has(cId)) {
        diagnostics.push(
          errorDiag(
            DiagCodes.UNKNOWN_REFERENCE,
            `Group "${group.id}" references unknown component "${cId}".`,
            { filePath }
          )
        );
      }
    }
  }

  for (const conn of diagram.connections) {
    if (!componentSet.has(conn.from)) {
      diagnostics.push(
        errorDiag(
          DiagCodes.UNKNOWN_REFERENCE,
          `Connection references unknown component "${conn.from}".`,
          { filePath }
        )
      );
    }
    if (!componentSet.has(conn.to)) {
      diagnostics.push(
        errorDiag(
          DiagCodes.UNKNOWN_REFERENCE,
          `Connection references unknown component "${conn.to}".`,
          { filePath }
        )
      );
    }
    if (conn.label) {
      diagnostics.push(...checkLabelLength(conn.label, `connection "${conn.from} -> ${conn.to}"`, filePath));
    }
  }

  return diagnostics;
}

export function validateDiagram(
  diagram: DiagramDocument,
  options: ValidateOptions = {},
  rawInput?: Record<string, unknown>
): ValidationResult {
  let diagnostics: MSVGDiagnostic[] = [];

  switch (diagram.type) {
    case "flow":
      diagnostics = validateFlowDiagram(diagram, rawInput, options);
      break;
    case "mindmap":
      diagnostics = validateMindmapDiagram(diagram, rawInput, options);
      break;
    case "layers":
      diagnostics = validateLayersDiagram(diagram, rawInput, options);
      break;
    case "comparison":
      diagnostics = validateComparisonDiagram(diagram, rawInput, options);
      break;
    case "sequence":
      diagnostics = validateSequenceDiagram(diagram, rawInput, options);
      break;
    case "timeline":
      diagnostics = validateTimelineDiagram(diagram, rawInput, options);
      break;
    case "architecture":
      diagnostics = validateArchitectureDiagram(diagram, rawInput, options);
      break;
  }

  const valid = !diagnostics.some((d) => d.severity === "error");
  return { valid, diagnostics };
}
