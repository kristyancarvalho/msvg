import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { MSVGDiagnostic } from "@msvg/core";
import { hasErrors, parseAndValidate } from "@msvg/core";
import { renderSvg } from "@msvg/svg";

export interface RenderOptions {
  out?: string | undefined;
  json?: boolean | undefined;
}

export interface RenderResult {
  exitCode: number;
  diagnostics: MSVGDiagnostic[];
  svg: string;
  output: string;
}

function formatDiagnostics(diagnostics: MSVGDiagnostic[]): string {
  return diagnostics.map((d) => `${d.filePath ?? "<input>"}:${d.line ?? 1}: ${d.severity} ${d.code} ${d.message}`).join("\n");
}

export async function renderCommand(file: string, options: RenderOptions = {}): Promise<RenderResult> {
  const source = await readFile(file, "utf8");
  const parsed = parseAndValidate(source, { filePath: file });
  const diagnostics: MSVGDiagnostic[] = [...parsed.diagnostics];
  let svg = "";
  if (parsed.valid && parsed.diagram !== null) {
    const rendered = renderSvg(parsed.diagram);
    diagnostics.push(...rendered.diagnostics);
    svg = rendered.svg;
    if (options.out !== undefined) {
      await mkdir(dirname(options.out), { recursive: true });
      await writeFile(options.out, svg, "utf8");
    }
  }
  const output = options.json ? JSON.stringify({ diagnostics, svg }, null, 2) : hasErrors(diagnostics) ? formatDiagnostics(diagnostics) : svg;
  return { exitCode: hasErrors(diagnostics) ? 1 : 0, diagnostics, svg, output };
}
