import { stat } from "node:fs/promises";
import { glob } from "glob";

export async function resolveInputFiles(patterns: string[]): Promise<string[]> {
  const found = new Set<string>();
  for (const pattern of patterns) {
    if (pattern.trim().length === 0) continue;
    if (pattern.includes("*")) {
      const matches = await glob(pattern, { nodir: true, posix: true });
      for (const match of matches) found.add(match);
      continue;
    }
    const info = await stat(pattern).catch(() => null);
    if (info?.isFile()) {
      found.add(pattern);
    }
  }
  return [...found].sort();
}
