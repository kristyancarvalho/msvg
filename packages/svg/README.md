# @markdown-utils/msvg-svg

The renderer for MSVG. This package takes a normalized diagram model from [`@markdown-utils/msvg-core`](../core/README.md), computes a deterministic layout, and produces a static, accessible SVG string. It uses no browser, no runtime JavaScript, and no external fonts or images.

MSVG turns small text descriptions into static, accessible SVG diagrams for technical writing. See the [project README](../../README.md) for the full picture.

## Installation

```bash
npm install @markdown-utils/msvg-svg @markdown-utils/msvg-core
```

## Usage

```ts
import { parseAndValidate } from "@markdown-utils/msvg-core";
import { renderSvg } from "@markdown-utils/msvg-svg";

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
| `renderSvg(diagram, options?)` | Renders a diagram to an SVG string with diagnostics, the resolved theme, and the resolved `altText`. |
| `layoutDiagram(diagram, options?)` | Returns the computed layout without producing SVG. |
| `resolveTheme(input?)` | Resolves a built-in theme name or custom tokens into a complete theme. |
| `resolveThemeResult(input?, options?)` | Like `resolveTheme` but also returns theme diagnostics. |
| `altTextFor(diagram)` | Computes the asset alt text (explicit `alt`, then `description`, then generated, then `title`). |
| `isValidColor(value)` | Returns whether a string is a safe color token. |
| `BUILT_IN_THEME_NAMES` | The list of built-in theme names. |
| `escapeXml`, `escapeAttr`, `safeSvgId`, `sanitizeText` | Safety helpers for text and ids. |
| `wrapText`, `breakLongWord`, `estimateTextWidth`, `textBlockHeight`, `maxLineWidth` | Text measurement and wrapping helpers. |
| `FONT_SIZE`, `DESC_FONT_SIZE`, `LINE_HEIGHT`, `CHAR_WIDTH_APPROX` | Layout constants. |

`renderSvg` options include `theme`, `themeMode` (`light`/`dark`/`auto`), `themeOutputMode` (`static`/`css-variables`/`media-query`), `background` (`auto`/`solid`/`transparent`), `diagramId`, and `idSalt` for unique ids when the same diagram appears more than once on a page.

## Output guarantees

- Every SVG includes `xmlns`, a `viewBox`, and a `<title>`.
- A `<desc>` is included when a description is provided or generated.
- All user text is escaped, and ids are scoped per diagram.
- Output is deterministic for the same input.
- The SVG never contains `<script>`, event handlers, remote URLs, remote fonts, or external images.

## Themes

Built-in themes are `paper` (default), `neutral`, `mono`, and `dark`. Custom themes can extend a built-in, pick a light or dark `mode`, and override individual color tokens; only validated tokens are used so a theme can never inject unsafe content. The `css-variables` and `media-query` output modes emit a scoped `<style>` block of `--msvg-*` variables with concrete fallbacks, and `media-query` follows the reader's `prefers-color-scheme`. See the [project README](../../README.md#themes) for the full theming model.

## License

See the [LICENSE](../../LICENSE) file.
