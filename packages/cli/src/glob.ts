import { stat } from "node:fs/promises";
import { glob } from "glob";
import type { MSVGDiagnostic } from "@markdown-utils/msvg-core";

export interface ResolvedInputs {
  files: string[];
  diagnostics: MSVGDiagnostic[];
}

export async function resolveInputs(patterns: string[]): Promise<ResolvedInputs> {
  const found = new Set<string>();
  const diagnostics: MSVGDiagnostic[] = [];
  for (const pattern of patterns) {
    if (pattern.trim().length === 0) continue;
    if (pattern.includes("*") || pattern.includes("?") || pattern.includes("[")) {
      const matches = await glob(pattern, { nodir: true, posix: true }).catch(() => null);
      if (matches === null) {
        diagnostics.push({
          code: "MSVG_CLI_INVALID_GLOB",
          severity: "error",
          message: `Invalid glob pattern: ${pattern}`,
          filePath: pattern,
        });
        continue;
      }
      if (matches.length === 0) {
        diagnostics.push({
          code: "MSVG_CLI_NO_MATCH",
          severity: "error",
          message: `No files matched pattern: ${pattern}`,
          filePath: pattern,
        });
      }
      for (const match of matches) found.add(match);
      continue;
    }
    const info = await stat(pattern).catch(() => null);
    if (info?.isFile()) {
      found.add(pattern);
    } else if (info?.isDirectory()) {
      diagnostics.push({
        code: "MSVG_CLI_NOT_A_FILE",
        severity: "error",
        message: `Input path is a directory, not a file: ${pattern}`,
        filePath: pattern,
      });
    } else {
      diagnostics.push({
        code: "MSVG_CLI_FILE_NOT_FOUND",
        severity: "error",
        message: `Input file not found: ${pattern}`,
        filePath: pattern,
      });
    }
  }
  return { files: [...found].sort(), diagnostics };
}

export async function resolveInputFiles(patterns: string[]): Promise<string[]> {
  const resolved = await resolveInputs(patterns);
  return resolved.files;
}
