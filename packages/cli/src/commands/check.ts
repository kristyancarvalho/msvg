import { readFile } from "node:fs/promises";
import type { MSVGDiagnostic } from "@markdown-utils/msvg-core";
import { parseAndValidate, hasErrors } from "@markdown-utils/msvg-core";
import { extractMsvgFences } from "../fence-extractor.js";
import { resolveInputFiles } from "../glob.js";

export interface CheckOptions {
  json?: boolean | undefined;
}

export interface CommandResult {
  exitCode: number;
  diagnostics: MSVGDiagnostic[];
  output: string;
}

function formatDiagnostics(diagnostics: MSVGDiagnostic[]): string {
  return diagnostics.map((d) => `${d.filePath ?? "<input>"}:${d.line ?? 1}: ${d.severity} ${d.code} ${d.message}`).join("\n");
}

export async function checkCommand(patterns: string[], options: CheckOptions = {}): Promise<CommandResult> {
  const files = await resolveInputFiles(patterns);
  const diagnostics: MSVGDiagnostic[] = [];
  if (files.length === 0) {
    diagnostics.push({ code: "MSVG_CLI_NO_INPUT", severity: "error", message: "No input files matched." });
  }
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const fences = extractMsvgFences(source);
    for (const fence of fences) {
      const result = parseAndValidate(fence.value, { filePath: file });
      diagnostics.push(...result.diagnostics.map((diag) => ({ ...diag, line: diag.line ?? fence.line })));
    }
  }
  const output = options.json ? JSON.stringify({ diagnostics }, null, 2) : formatDiagnostics(diagnostics);
  return { exitCode: hasErrors(diagnostics) ? 1 : 0, diagnostics, output };
}
