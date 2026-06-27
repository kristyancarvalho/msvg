import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import type { MSVGDiagnostic } from "@markdown-utils/msvg-core";
import { parseAndValidate } from "@markdown-utils/msvg-core";
import { renderSvg } from "@markdown-utils/msvg-svg";

export interface MarkdownItMSVGOptions {
  output?: "asset" | "inline" | undefined;
  outputDir?: string | undefined;
  publicPath?: string | undefined;
  sourcePath?: string | undefined;
  diagnostics?: MSVGDiagnostic[] | undefined;
  emitFile?: ((filePath: string, contents: string) => void) | undefined;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug.length > 0 ? slug : "diagram";
}

function hashContent(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 10);
}

function normalizePublicPath(value: string | undefined): string {
  const base = value ?? "/msvg";
  const trimmed = base.trim();
  if (trimmed.length === 0) return "/msvg";
  return "/" + trimmed.replace(/^\/+|\/+$/g, "");
}

function emitAsset(title: string, svg: string, options: MarkdownItMSVGOptions): string {
  const source = slugify((options.sourcePath ?? "inline").replace(/\.[^.]+$/, ""));
  const name = `${slugify(title)}-${hashContent(svg)}.svg`;
  const publicUrl = `${normalizePublicPath(options.publicPath)}/${source}/${name}`;
  const filePath = join(options.outputDir ?? "public/msvg", source, name);
  if (options.emitFile !== undefined) {
    options.emitFile(filePath, svg);
  } else if (options.outputDir !== undefined) {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, svg, "utf8");
  }
  return publicUrl;
}

function imageHtml(src: string, title: string, caption: string | undefined, type: string): string {
  const img = `<img src="${escapeHtml(src)}" alt="${escapeHtml(title)}" loading="lazy" decoding="async">`;
  if (caption !== undefined && caption.trim().length > 0) {
    return `<figure class="msvg msvg-${escapeHtml(type)}">${img}<figcaption>${escapeHtml(caption)}</figcaption></figure>`;
  }
  return img;
}

export function msvgMarkdownIt(md: MarkdownIt, options: MarkdownItMSVGOptions = {}): void {
  const fallback = md.renderer.rules["fence"];
  md.renderer.rules["fence"] = (tokens: Token[], idx: number, opts, env, self) => {
    const token = tokens[idx]!;
    const info = token.info.trim().split(/\s+/)[0]?.toLowerCase();
    if (info !== "msvg") {
      return fallback !== undefined ? fallback(tokens, idx, opts, env, self) : self.renderToken(tokens, idx, opts);
    }
    const diagnostics = options.diagnostics ?? ((env as { msvgDiagnostics?: MSVGDiagnostic[] }).msvgDiagnostics ??= []);
    const parsed = parseAndValidate(token.content, { filePath: options.sourcePath });
    diagnostics.push(...parsed.diagnostics);
    if (!parsed.valid || parsed.diagram === null) {
      const message = parsed.diagnostics.map((diag) => `${diag.severity}: ${diag.message}`).join("\n");
      return `<pre class="msvg-error">${escapeHtml(message)}</pre>`;
    }
    const rendered = renderSvg(parsed.diagram);
    diagnostics.push(...rendered.diagnostics);
    if (options.output === "inline") {
      return rendered.svg;
    }
    const source = slugify((options.sourcePath ?? "inline").replace(/\.[^.]+$/, ""));
    const name = `${slugify(parsed.diagram.title)}-${hashContent(rendered.svg)}.svg`;
    const publicUrl = `${normalizePublicPath(options.publicPath)}/${source}/${name}`;
    if (options.emitFile !== undefined || options.outputDir !== undefined) {
      emitAsset(parsed.diagram.title, rendered.svg, options);
    }
    return imageHtml(publicUrl, parsed.diagram.title, parsed.diagram.caption, parsed.diagram.type);
  };
}
