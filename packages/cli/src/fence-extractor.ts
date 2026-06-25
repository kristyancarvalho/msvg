export interface MsvgFence {
  value: string;
  line: number;
  index: number;
}

const FENCE_PATTERN = /(^|\n)(```|~~~)[ \t]*msvg[^\n]*\n([\s\S]*?)\n\2[ \t]*(?=\n|$)/gi;

export function extractMsvgFences(markdown: string): MsvgFence[] {
  const fences: MsvgFence[] = [];
  for (const match of markdown.matchAll(FENCE_PATTERN)) {
    const prefix = match[1] ?? "";
    const fullIndex = match.index ?? 0;
    const fenceIndex = fullIndex + prefix.length;
    const before = markdown.slice(0, fenceIndex);
    const line = before.length === 0 ? 1 : before.split("\n").length;
    fences.push({
      value: match[3] ?? "",
      line,
      index: fenceIndex,
    });
  }
  return fences;
}
