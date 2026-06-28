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
  filePath?: string | undefined;
  line?: number | undefined;
  column?: number | undefined;
  diagramId?: string | undefined;
  hint?: string | undefined;
}

export interface DiagramBase {
  type: DiagramType;
  title: string;
  description?: string | undefined;
  caption?: string | undefined;
  theme?: string | Record<string, string> | undefined;
  id?: string | undefined;
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
  description?: string | undefined;
  kind?: NodeKind | undefined;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string | undefined;
}

export type FlowDirection = "LR" | "RL" | "TB" | "BT";

export interface FlowDiagram extends DiagramBase {
  type: "flow";
  direction?: FlowDirection | undefined;
  nodes: FlowNode[];
  edges: FlowEdge[];
  groups?: FlowGroup[] | undefined;
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
  note?: string | undefined;
  emphasis?: boolean | undefined;
}

export interface LayersDiagram extends DiagramBase {
  type: "layers";
  direction?: LayerDirection | undefined;
  layers: Layer[];
}

export type ColumnTone = "neutral" | "positive" | "warning" | "negative";

export interface ComparisonColumn {
  id: string;
  label: string;
  tone?: ColumnTone | undefined;
  items: string[];
}

export interface ComparisonDiagram extends DiagramBase {
  type: "comparison";
  columns: ComparisonColumn[];
  verdict?: string | undefined;
}

export interface SequenceParticipant {
  id: string;
  label: string;
}

export interface SequenceMessage {
  from: string;
  to: string;
  label: string;
  note?: string | undefined;
}

export interface SequenceDiagram extends DiagramBase {
  type: "sequence";
  participants: SequenceParticipant[];
  messages: SequenceMessage[];
}

export type EventStatus =
  | "past"
  | "current"
  | "future"
  | "risk"
  | "done"
  | "blocked";

export interface TimelineEvent {
  at: string;
  title: string;
  description?: string | undefined;
  status?: EventStatus | undefined;
}

export interface TimelineDiagram extends DiagramBase {
  type: "timeline";
  events: TimelineEvent[];
}

export type ComponentKind =
  | "default"
  | "client"
  | "service"
  | "storage"
  | "database"
  | "queue"
  | "external"
  | "build"
  | "content"
  | "output"
  | "user";

export type ArchitectureDirection = "LR" | "RL" | "TB" | "BT";

export interface ArchitectureComponent {
  id: string;
  label: string;
  kind?: ComponentKind | undefined;
}

export interface ArchitectureGroup {
  id: string;
  label: string;
  componentIds: string[];
}

export interface ArchitectureConnection {
  from: string;
  to: string;
  label?: string | undefined;
}

export interface ArchitectureDiagram extends DiagramBase {
  type: "architecture";
  direction?: ArchitectureDirection | undefined;
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
  filePath?: string | undefined;
}

export interface ParseResult {
  raw: unknown;
  diagnostics: MSVGDiagnostic[];
}

export interface NormalizeOptions {
  filePath?: string | undefined;
}

export interface NormalizeResult {
  diagram: DiagramDocument | null;
  diagnostics: MSVGDiagnostic[];
}

export interface ValidateOptions {
  filePath?: string | undefined;
  warnUnknownFields?: boolean | undefined;
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
