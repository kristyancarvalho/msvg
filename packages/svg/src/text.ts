export const FONT_SIZE = 15;
export const DESC_FONT_SIZE = 12;
export const LINE_HEIGHT = 1.35;
export const CHAR_WIDTH_APPROX = 0.6;

export function estimateTextWidth(text: string, fontSize: number = FONT_SIZE): number {
  return text.length * fontSize * CHAR_WIDTH_APPROX;
}

export interface WrappedLine {
  text: string;
  width: number;
}

export function breakLongWord(
  word: string,
  maxWidth: number,
  fontSize: number = FONT_SIZE
): string[] {
  const charWidth = fontSize * CHAR_WIDTH_APPROX;
  const maxChars = Math.max(1, Math.floor(maxWidth / charWidth));
  if (word.length <= maxChars) return [word];
  const chunks: string[] = [];
  for (let i = 0; i < word.length; i += maxChars) {
    chunks.push(word.slice(i, i + maxChars));
  }
  return chunks;
}

export function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number = FONT_SIZE
): WrappedLine[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return [];

  const lines: WrappedLine[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current.length === 0 ? word : `${current} ${word}`;
    if (estimateTextWidth(candidate, fontSize) <= maxWidth) {
      current = candidate;
    } else {
      if (current.length > 0) {
        lines.push({ text: current, width: estimateTextWidth(current, fontSize) });
        current = "";
      }
      if (estimateTextWidth(word, fontSize) > maxWidth) {
        const chunks = breakLongWord(word, maxWidth, fontSize);
        for (let c = 0; c < chunks.length - 1; c++) {
          const chunk = chunks[c]!;
          lines.push({ text: chunk, width: estimateTextWidth(chunk, fontSize) });
        }
        current = chunks[chunks.length - 1] ?? "";
      } else {
        current = word;
      }
    }
  }

  if (current.length > 0) {
    lines.push({ text: current, width: estimateTextWidth(current, fontSize) });
  }

  return lines;
}

export function textBlockHeight(lineCount: number, fontSize: number = FONT_SIZE): number {
  return lineCount * fontSize * LINE_HEIGHT;
}

export function maxLineWidth(lines: WrappedLine[]): number {
  return lines.reduce((max, l) => Math.max(max, l.width), 0);
}
