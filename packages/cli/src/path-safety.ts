import { resolve, relative, sep } from "node:path";

export function assertInside(baseDir: string, targetPath: string): string {
  const base = resolve(baseDir);
  const target = resolve(targetPath);
  const rel = relative(base, target);
  if (rel === "" || (!rel.startsWith("..") && !rel.split(sep).includes(".."))) {
    return target;
  }
  throw new Error(`Output path escapes output directory: ${targetPath}`);
}

export function safeOutputPath(outputDir: string, relativePath: string): string {
  if (relativePath.startsWith("/") || /^[a-zA-Z]:/.test(relativePath)) {
    throw new Error(`Output path must be relative: ${relativePath}`);
  }
  return assertInside(outputDir, resolve(outputDir, relativePath));
}
