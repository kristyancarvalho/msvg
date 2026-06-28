import { readFile } from "node:fs/promises";
import type { MSVGDiagnostic } from "@markdown-utils/msvg-core";
import { parseAndValidate, hasErrors } from "@markdown-utils/msvg-core";
import { extractMsvgFences } from "../fence-extractor.js";
import { resolveInputs } from "../glob.js";

export interface CheckOptions {
  json?: boolean | undefined;
}

export interface CommandResult {
  exitCode: number;
  diagnostics: MSVGDiagnostic[];
  output: string;
}

const MARKDOWN_EXTENSIONS = [".md", ".markdown", ".mdx"];

function isMarkdownFile(file: string): boolean {
  const lower = file.toLowerCase();
  return MARKDOWN_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function formatDiagnostics(diagnostics: MSVGDiagnostic[]): string {
  return diagnostics.map((d) => `${d.filePath ?? "<input>"}:${d.line ?? 1}: ${d.severity} ${d.code} ${d.message}`).join("\n");
}

function checkSource(file: string, source: string): MSVGDiagnostic[] {
  if (isMarkdownFile(file)) {
    const diagnostics: MSVGDiagnostic[] = [];
    const fences = extractMsvgFences(source);
    for (const fence of fences) {
      const result = parseAndValidate(fence.value, { filePath: file });
      diagnostics.push(...result.diagnostics.map((diag) => ({ ...diag, line: diag.line ?? fence.line })));
    }
    return diagnostics;
  }
  const result = parseAndValidate(source, { filePath: file });
  return result.diagnostics.map((diag) => ({ ...diag, filePath: diag.filePath ?? file }));
}

export async function checkCommand(patterns: string[], options: CheckOptions = {}): Promise<CommandResult> {
  const { files, diagnostics: inputDiagnostics } = await resolveInputs(patterns);
  const diagnostics: MSVGDiagnostic[] = [...inputDiagnostics];
  if (files.length === 0 && inputDiagnostics.length === 0) {
    diagnostics.push({ code: "MSVG_CLI_NO_INPUT", severity: "error", message: "No input files matched." });
  }
  for (const file of files) {
    const source = await readFile(file, "utf8");
    diagnostics.push(...checkSource(file, source));
  }
  const output = options.json ? JSON.stringify({ diagnostics }, null, 2) : formatDiagnostics(diagnostics);
  return { exitCode: hasErrors(diagnostics) ? 1 : 0, diagnostics, output };
}
