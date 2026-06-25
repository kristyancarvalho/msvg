# @msvg/core

The core of MSVG. This package reads the MSVG language (YAML written inside Markdown `msvg` blocks or standalone files), turns it into a normalized, fully typed diagram model, and validates it. It has no rendering code and no dependency on SVG, Astro, remark, markdown-it, or the CLI.

MSVG turns small text descriptions into static, accessible SVG diagrams for technical writing. See the [project README](../../README.md) for the full picture.

## Installation

```bash
npm install @msvg/core
```

## Usage

The simplest entry point is `parseAndValidate`. It parses the source, normalizes it, validates it, and returns the diagram plus diagnostics.

```ts
import { parseAndValidate } from "@msvg/core";

const result = parseAndValidate(`
type: flow
title: "Pipeline"
direction: LR
nodes:
  a:
    label: "Source"
  b:
    label: "Output"
edges:
  - a -> b: "build"
`);

if (result.valid && result.diagram) {
  console.log(result.diagram.type);
} else {
  console.error(result.diagnostics);
}
```

## API

| Export | Description |
|---|---|
| `parseMSVG(source, options?)` | Parses raw YAML or JSON source into a raw object with diagnostics. |
| `normalizeDiagram(input, options?)` | Normalizes a raw object into the canonical diagram model. |
| `validateDiagram(diagram, options?)` | Validates a normalized diagram and reports diagnostics. |
| `parseAndValidate(source, options?)` | Runs parsing, normalization, and validation in one step. |
| `parseEdgeShorthand`, `parseEdgeList`, `parseConnectionList` | Helpers for the `a -> b` edge shorthand. |
| `DiagCodes`, `makeDiagnostic`, `errorDiag`, `warnDiag`, `infoDiag`, `hasErrors` | Diagnostic helpers. |

The package also exports TypeScript types for every diagram type and for the parse, normalize, and validate options and results.

## What it validates

- `type` is a supported diagram type and `title` is present.
- Ids are stable, URL-safe, and unique within a diagram.
- Edges, connections, and messages reference existing nodes, components, or participants.
- Duplicate ids and empty diagrams are reported as errors.
- Unknown fields are reported as warnings.
- All user text is treated as plain text, never as raw HTML.

## License

See the [LICENSE](../../LICENSE) file.
