import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative } from "node:path";
import type { MSVGDiagnostic } from "@markdown-utils/msvg-core";
import { hasErrors, parseAndValidate } from "@markdown-utils/msvg-core";
import { renderSvg } from "@markdown-utils/msvg-svg";
import { extractMsvgFences } from "../fence-extractor.js";
import { resolveInputFiles } from "../glob.js";
import { safeOutputPath } from "../path-safety.js";

export interface BuildOptions {
  out: string;
  publicPath?: string | undefined;
  json?: boolean | undefined;
}

export interface BuildResult {
  exitCode: number;
  diagnostics: MSVGDiagnostic[];
  files: string[];
  output: string;
}

function slugify(value: string): string {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return slug.length > 0 ? slug : "diagram";
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 10);
}

function publicBase(value: string | undefined): string {
  return "/" + (value ?? "/msvg").replace(/^\/+|\/+$/g, "");
}

export async function buildCommand(patterns: string[], options: BuildOptions): Promise<BuildResult> {
  const files = await resolveInputFiles(patterns);
  const diagnostics: MSVGDiagnostic[] = [];
  const written: string[] = [];
  if (files.length === 0) {
    diagnostics.push({ code: "MSVG_CLI_NO_INPUT", severity: "error", message: "No input files matched." });
  }
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const fences = extractMsvgFences(source);
    for (const fence of fences) {
      const parsed = parseAndValidate(fence.value, { filePath: file });
      diagnostics.push(...parsed.diagnostics.map((diag) => ({ ...diag, line: diag.line ?? fence.line })));
      if (!parsed.valid || parsed.diagram === null) continue;
      const rendered = renderSvg(parsed.diagram);
      diagnostics.push(...rendered.diagnostics);
      const rel = `${slugify(relative(process.cwd(), file).replace(/\.[^.]+$/, ""))}/${slugify(parsed.diagram.title)}-${hash(rendered.svg)}.svg`;
      const outputPath = safeOutputPath(options.out, rel);
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, rendered.svg, "utf8");
      written.push(`${publicBase(options.publicPath)}/${rel}`);
    }
  }
  const output = options.json ? JSON.stringify({ diagnostics, files: written }, null, 2) : written.join("\n");
  return { exitCode: hasErrors(diagnostics) ? 1 : 0, diagnostics, files: written, output };
}
