export type DiagramType =
  | "flow"
  | "mindmap"
  | "layers"
  | "comparison"
  | "sequence"
  | "timeline"
  | "architecture";

export type Severity = "error" | "warning" | "info";

export interface MSVGDiagnostic {
  code: string;
  severity: Severity;
  message: string;
  filePath?: string;
  line?: number;
  column?: number;
  diagramId?: string;
  hint?: string;
}

export interface DiagramBase {
  type: DiagramType;
  title: string;
  description?: string;
  caption?: string;
  theme?: string | Record<string, string>;
  id?: string;
}

export type NodeKind =
  | "default"
  | "input"
  | "process"
  | "decision"
  | "output"
  | "warning"
  | "success";

export interface FlowNode {
  id: string;
  label: string;
  description?: string;
  kind?: NodeKind;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

export type FlowDirection = "LR" | "RL" | "TB" | "BT";

export interface FlowDiagram extends DiagramBase {
  type: "flow";
  direction?: FlowDirection;
  nodes: FlowNode[];
  edges: FlowEdge[];
  groups?: FlowGroup[];
}

export interface FlowGroup {
  id: string;
  label: string;
  nodeIds: string[];
}

export interface MindmapBranch {
  label: string;
  items: string[];
}

export interface MindmapDiagram extends DiagramBase {
  type: "mindmap";
  root: string;
  branches: MindmapBranch[];
}

export type LayerDirection = "top-down" | "bottom-up";

export interface Layer {
  label: string;
  note?: string;
  emphasis?: boolean;
}

export interface LayersDiagram extends DiagramBase {
  type: "layers";
  direction?: LayerDirection;
  layers: Layer[];
}

export type ColumnTone = "neutral" | "positive" | "warning" | "negative";

export interface ComparisonColumn {
  id: string;
  label: string;
  tone?: ColumnTone;
  items: string[];
}

export interface ComparisonDiagram extends DiagramBase {
  type: "comparison";
  columns: ComparisonColumn[];
  verdict?: string;
}

export interface SequenceParticipant {
  id: string;
  label: string;
}

export interface SequenceMessage {
  from: string;
  to: string;
  label: string;
  note?: string;
}

export interface SequenceDiagram extends DiagramBase {
  type: "sequence";
  participants: SequenceParticipant[];
  messages: SequenceMessage[];
}

export type EventStatus = "past" | "current" | "future" | "risk" | "done";

export interface TimelineEvent {
  at: string;
  title: string;
  description?: string;
  status?: EventStatus;
}

export interface TimelineDiagram extends DiagramBase {
  type: "timeline";
  events: TimelineEvent[];
}

export type ComponentKind =
  | "client"
  | "service"
  | "storage"
  | "external"
  | "build"
  | "content"
  | "output";

export type ArchitectureDirection = "LR" | "RL" | "TB" | "BT";

export interface ArchitectureComponent {
  id: string;
  label: string;
  kind?: ComponentKind;
}

export interface ArchitectureGroup {
  id: string;
  label: string;
  componentIds: string[];
}

export interface ArchitectureConnection {
  from: string;
  to: string;
  label?: string;
}

export interface ArchitectureDiagram extends DiagramBase {
  type: "architecture";
  direction?: ArchitectureDirection;
  components: ArchitectureComponent[];
  groups: ArchitectureGroup[];
  connections: ArchitectureConnection[];
}

export type DiagramDocument =
  | FlowDiagram
  | MindmapDiagram
  | LayersDiagram
  | ComparisonDiagram
  | SequenceDiagram
  | TimelineDiagram
  | ArchitectureDiagram;

export interface ParseOptions {
  filePath?: string;
  allowAnchors?: boolean;
}

export interface ParseResult {
  raw: unknown;
  diagnostics: MSVGDiagnostic[];
}

export interface NormalizeOptions {
  filePath?: string;
}

export interface NormalizeResult {
  diagram: DiagramDocument | null;
  diagnostics: MSVGDiagnostic[];
}

export interface ValidateOptions {
  filePath?: string;
  warnUnknownFields?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  diagnostics: MSVGDiagnostic[];
}

export interface ParseAndValidateOptions extends ParseOptions, ValidateOptions {}

export interface ParseAndValidateResult {
  diagram: DiagramDocument | null;
  valid: boolean;
  diagnostics: MSVGDiagnostic[];
}
