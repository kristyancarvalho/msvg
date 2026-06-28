import { load, YAMLException } from "js-yaml";
import type { ParseOptions, ParseResult } from "./types.js";
import { errorDiag, DiagCodes } from "./diagnostics.js";

export function parseMSVG(source: string, options: ParseOptions = {}): ParseResult {
  const diagnostics: ParseResult["diagnostics"] = [];
  const filePath = options.filePath;

  let raw: unknown;
  try {
    raw = load(source);
  } catch (err) {
    if (err instanceof YAMLException) {
      const line = err.mark ? err.mark.line + 1 : undefined;
      const column = err.mark ? err.mark.column + 1 : undefined;
      if (err.reason === "duplicated mapping key") {
        diagnostics.push(
          errorDiag(DiagCodes.DUPLICATE_KEY, "Duplicate mapping key in diagram source.", {
            filePath,
            line,
            column,
            hint: "Each YAML key must be unique within its mapping. Remove or rename the repeated key.",
          })
        );
      } else {
        diagnostics.push(
          errorDiag(DiagCodes.PARSE_INVALID_YAML, err.message, { filePath, line, column })
        );
      }
      return { raw: null, diagnostics };
    }
    diagnostics.push(
      errorDiag(DiagCodes.PARSE_INVALID_YAML, "Invalid YAML: unknown parse error.", { filePath })
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
