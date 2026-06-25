# @msvg/svg

The renderer for MSVG. This package takes a normalized diagram model from [`@msvg/core`](../core/README.md), computes a deterministic layout, and produces a static, accessible SVG string. It uses no browser, no runtime JavaScript, and no external fonts or images.

MSVG turns small text descriptions into static, accessible SVG diagrams for technical writing. See the [project README](../../README.md) for the full picture.

## Installation

```bash
npm install @msvg/svg @msvg/core
```

## Usage

```ts
import { parseAndValidate } from "@msvg/core";
import { renderSvg } from "@msvg/svg";

const parsed = parseAndValidate(`
type: layers
title: "Architecture"
direction: top-down
layers:
  - label: "Markdown"
  - label: "Layout"
  - label: "SVG"
`);

if (parsed.valid && parsed.diagram) {
  const { svg, diagnostics, theme } = renderSvg(parsed.diagram, { theme: "dark" });
  console.log(svg);
}
```

## API

| Export | Description |
|---|---|
| `renderSvg(diagram, options?)` | Renders a diagram to an SVG string with diagnostics and the resolved theme. |
| `layoutDiagram(diagram, options?)` | Returns the computed layout without producing SVG. |
| `resolveTheme(input?)` | Resolves a built-in theme name or custom tokens into a complete theme. |
| `BUILT_IN_THEME_NAMES` | The list of built-in theme names. |
| `escapeXml`, `escapeAttr`, `safeSvgId`, `sanitizeText` | Safety helpers for text and ids. |
| `wrapText`, `estimateTextWidth`, `textBlockHeight`, `maxLineWidth` | Text measurement and wrapping helpers. |
| `FONT_SIZE`, `DESC_FONT_SIZE`, `LINE_HEIGHT`, `CHAR_WIDTH_APPROX` | Layout constants. |

## Output guarantees

- Every SVG includes `xmlns`, a `viewBox`, and a `<title>`.
- A `<desc>` is included when a description is provided or generated.
- All user text is escaped, and ids are scoped per diagram.
- Output is deterministic for the same input.
- The SVG never contains `<script>`, event handlers, remote URLs, remote fonts, or external images.

## Themes

Built-in themes are `paper` (default), `neutral`, `mono`, and `dark`. Custom theme tokens are accepted, but only validated tokens are used so a theme can never inject unsafe content.

## License

See the [LICENSE](../../LICENSE) file.
