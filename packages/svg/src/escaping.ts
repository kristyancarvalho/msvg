const XML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => XML_ESCAPE_MAP[ch] ?? ch);
}

export function escapeAttr(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => XML_ESCAPE_MAP[ch] ?? ch);
}

const SAFE_URL_PATTERN = /^[a-zA-Z0-9_\-./]+$/;

export function safeSvgId(base: string, suffix?: string): string {
  const cleaned = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const id = cleaned.length > 0 ? cleaned : "d";
  return suffix !== undefined ? `${id}-${suffix}` : id;
}

export function isSafeUrl(value: string): boolean {
  return SAFE_URL_PATTERN.test(value);
}

export function sanitizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .trim();
}
