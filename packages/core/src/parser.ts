import { load, YAMLException } from "js-yaml";
import type { ParseOptions, ParseResult } from "./types.js";
import { errorDiag, DiagCodes } from "./diagnostics.js";

export function parseMSVG(source: string, options: ParseOptions = {}): ParseResult {
  const diagnostics: ParseResult["diagnostics"] = [];
  const filePath = options.filePath;

  let raw: unknown;
  try {
    raw = load(source, { json: true });
  } catch (err) {
    const message =
      err instanceof YAMLException
        ? err.message
        : "Invalid YAML: unknown parse error.";
    diagnostics.push(
      errorDiag(DiagCodes.PARSE_INVALID_YAML, message, { filePath })
    );
    return { raw: null, diagnostics };
  }

  if (raw === null || raw === undefined) {
    diagnostics.push(
      errorDiag(DiagCodes.PARSE_NOT_OBJECT, "Diagram source must not be empty.", { filePath })
    );
    return { raw: null, diagnostics };
  }

  if (typeof raw !== "object" || Array.isArray(raw)) {
    diagnostics.push(
      errorDiag(
        DiagCodes.PARSE_NOT_OBJECT,
        "Diagram source must be a YAML mapping (object), not a scalar or array.",
        { filePath }
      )
    );
    return { raw: null, diagnostics };
  }

  return { raw, diagnostics };
}
