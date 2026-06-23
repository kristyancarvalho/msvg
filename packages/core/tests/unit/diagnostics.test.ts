import { describe, it, expect } from "vitest";
import {
  makeDiagnostic,
  errorDiag,
  warnDiag,
  infoDiag,
  hasErrors,
  DiagCodes,
} from "../../src/diagnostics.js";
import type { MSVGDiagnostic } from "../../src/types.js";

describe("makeDiagnostic", () => {
  it("creates a diagnostic with all required fields", () => {
    const diag = makeDiagnostic("CODE", "error", "Some error");
    expect(diag.code).toBe("CODE");
    expect(diag.severity).toBe("error");
    expect(diag.message).toBe("Some error");
  });

  it("merges extras into the diagnostic", () => {
    const diag = makeDiagnostic("CODE", "warning", "Msg", {
      filePath: "file.ts",
      line: 5,
      column: 10,
      hint: "Try this",
    });
    expect(diag.filePath).toBe("file.ts");
    expect(diag.line).toBe(5);
    expect(diag.column).toBe(10);
    expect(diag.hint).toBe("Try this");
  });
});

describe("errorDiag", () => {
  it("creates an error-severity diagnostic", () => {
    const diag = errorDiag("ERR", "something went wrong");
    expect(diag.severity).toBe("error");
  });
});

describe("warnDiag", () => {
  it("creates a warning-severity diagnostic", () => {
    const diag = warnDiag("WARN", "heads up");
    expect(diag.severity).toBe("warning");
  });
});

describe("infoDiag", () => {
  it("creates an info-severity diagnostic", () => {
    const diag = infoDiag("INFO", "just so you know");
    expect(diag.severity).toBe("info");
  });
});

describe("hasErrors", () => {
  it("returns true when any diagnostic is an error", () => {
    const diagnostics: MSVGDiagnostic[] = [
      warnDiag("W", "warn"),
      errorDiag("E", "error"),
    ];
    expect(hasErrors(diagnostics)).toBe(true);
  });

  it("returns false when all diagnostics are non-error", () => {
    const diagnostics: MSVGDiagnostic[] = [
      warnDiag("W", "warn"),
      infoDiag("I", "info"),
    ];
    expect(hasErrors(diagnostics)).toBe(false);
  });

  it("returns false for empty array", () => {
    expect(hasErrors([])).toBe(false);
  });
});

describe("DiagCodes", () => {
  it("exports all expected diagnostic codes", () => {
    expect(DiagCodes.PARSE_INVALID_YAML).toBeDefined();
    expect(DiagCodes.MISSING_TYPE).toBeDefined();
    expect(DiagCodes.UNKNOWN_TYPE).toBeDefined();
    expect(DiagCodes.MISSING_TITLE).toBeDefined();
    expect(DiagCodes.DUPLICATE_ID).toBeDefined();
    expect(DiagCodes.UNKNOWN_REFERENCE).toBeDefined();
    expect(DiagCodes.UNKNOWN_FIELD).toBeDefined();
    expect(DiagCodes.LONG_LABEL).toBeDefined();
    expect(DiagCodes.EMPTY_DIAGRAM).toBeDefined();
  });
});
