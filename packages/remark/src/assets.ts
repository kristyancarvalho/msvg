import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";

export type OutputMode = "asset" | "inline";
export type FileNameMode = "hash" | "slug" | "slug-hash";

export interface AssetOptions {
  outputDir?: string | undefined;
  publicPath?: string | undefined;
  fileName?: FileNameMode | undefined;
  sourcePath?: string | undefined;
  emitFile?: ((filePath: string, contents: string) => void | Promise<void>) | undefined;
  urlOnly?: boolean | undefined;
}

export interface AssetReference {
  filePath: string;
  publicUrl: string;
  written: boolean;
}

export function willEmitAsset(options: AssetOptions): boolean {
  return options.emitFile !== undefined || options.outputDir !== undefined;
}

export function hashContent(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 10);
}

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug.length > 0 ? slug : "diagram";
}

export function escapeHtml(value: string): string {
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

export function normalizePublicPath(value: string | undefined): string {
  const base = value ?? "/msvg";
  const trimmed = base.trim();
  if (trimmed.length === 0) return "/msvg";
  return "/" + trimmed.replace(/^\/+|\/+$/g, "");
}

export function assertSafeRelativePath(value: string): string {
  const normalized = value.split(/[\\/]+/).filter(Boolean).join("/");
  if (normalized.startsWith("..") || normalized.includes("../") || normalized.includes("..\\")) {
    throw new Error(`Unsafe output path: ${value}`);
  }
  return normalized;
}

export function assetName(title: string, svg: string, mode: FileNameMode = "slug-hash"): string {
  const slug = slugify(title);
  const hash = hashContent(svg);
  if (mode === "hash") return `${hash}.svg`;
  if (mode === "slug") return `${slug}.svg`;
  return `${slug}-${hash}.svg`;
}

export function sourceSlug(sourcePath: string | undefined): string {
  if (sourcePath === undefined || sourcePath.trim().length === 0) {
    return "inline";
  }
  return slugify(sourcePath.replace(/\.[^.]+$/, ""));
}

export async function emitAsset(title: string, svg: string, options: AssetOptions = {}): Promise<AssetReference> {
  const source = sourceSlug(options.sourcePath);
  const name = assetName(title, svg, options.fileName);
  const relativePath = assertSafeRelativePath(`${source}/${name}`);
  const publicUrl = `${normalizePublicPath(options.publicPath)}/${relativePath}`;
  const filePath = join(options.outputDir ?? "public/msvg", ...relativePath.split("/"));
  let written = false;
  if (options.emitFile !== undefined) {
    await options.emitFile(filePath, svg);
    written = true;
  } else if (options.outputDir !== undefined) {
    const rel = relative(options.outputDir, filePath);
    if (rel.startsWith("..") || rel.split(sep).includes("..")) {
      throw new Error(`Unsafe output path: ${filePath}`);
    }
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, svg, "utf8");
    written = true;
  }
  return { filePath, publicUrl, written };
}

export function imageHtml(src: string, title: string, caption?: string | undefined, diagramType?: string | undefined): string {
  const img = `<img src="${escapeHtml(src)}" alt="${escapeHtml(title)}" loading="lazy" decoding="async">`;
  if (caption !== undefined && caption.trim().length > 0) {
    return `<figure class="msvg msvg-${escapeHtml(diagramType ?? "diagram")}">${img}<figcaption>${escapeHtml(caption)}</figcaption></figure>`;
  }
  return img;
}
