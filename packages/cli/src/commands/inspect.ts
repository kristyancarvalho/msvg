import { readFile } from "node:fs/promises";
import type { MSVGDiagnostic } from "@markdown-utils/msvg-core";
import { hasErrors, parseAndValidate } from "@markdown-utils/msvg-core";
import type { DiagramDocument } from "@markdown-utils/msvg-core";

export interface InspectOptions {
  json?: boolean | undefined;
}

export interface InspectResult {
  exitCode: number;
  diagnostics: MSVGDiagnostic[];
  diagram: DiagramDocument | null;
  output: string;
}

export async function inspectCommand(file: string, options: InspectOptions = {}): Promise<InspectResult> {
  const source = await readFile(file, "utf8");
  const parsed = parseAndValidate(source, { filePath: file });
  const output = options.json === false
    ? parsed.diagnostics.map((d) => `${d.severity} ${d.code} ${d.message}`).join("\n")
    : JSON.stringify({ diagram: parsed.diagram, diagnostics: parsed.diagnostics }, null, 2);
  return {
    exitCode: hasErrors(parsed.diagnostics) ? 1 : 0,
    diagnostics: parsed.diagnostics,
    diagram: parsed.diagram,
    output,
  };
}
