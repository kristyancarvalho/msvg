# @markdown-utils/msvg-remark

A remark plugin that turns ` ```msvg ` fenced code blocks into MSVG diagrams inside a unified/remark Markdown pipeline. It parses and validates each block with [`@markdown-utils/msvg-core`](../core/README.md) and renders it with [`@markdown-utils/msvg-svg`](../svg/README.md).

MSVG turns small text descriptions into static, accessible SVG diagrams for technical writing. See the [project README](../../README.md) for the full picture.

## Installation

```bash
npm install @markdown-utils/msvg-remark
```

`unified` is a peer dependency.

## Usage

```ts
import { remark } from "remark";
import remarkHtml from "remark-html";
import { remarkMSVG } from "@markdown-utils/msvg-remark";

const file = await remark()
  .use(remarkMSVG, {
    output: "asset",
    outputDir: "public/msvg",
    publicPath: "/msvg",
  })
  .use(remarkHtml, { sanitize: false })
  .process(markdownSource);

console.log(String(file));
```

## Options

| Option | Description |
|---|---|
| `output` | `"asset"` writes an SVG file and inserts an image reference. `"inline"` embeds the SVG in the HTML. |
| `outputDir` | Directory where asset files are written. |
| `emitFile` | Callback `(fileName, svg)` that writes the asset, as an alternative to `outputDir`. |
| `urlOnly` | In asset mode, emit a URL-only image reference even without a write target (you are responsible for placing the file). |
| `publicPath` | Public URL prefix used in generated image references. |
| `sourcePath` | Source file path used for naming and diagnostics. |
| `theme`, `themeMode`, `themeOutputMode`, `background` | Theming options passed through to the renderer. |
| `diagnostics` | An array that collects diagnostics produced during processing. |

Asset mode is the safe default for blogs and feeds. Filenames are deterministic and content-hashed, so the same diagram always produces the same file.

In asset mode you must provide a write target (`outputDir` or `emitFile`). If neither is set and `urlOnly` is not enabled, the plugin reports an `MSVG_ASSET_NO_OUTPUT` error and falls back to inline SVG instead of emitting a broken image reference.

## Behavior

- Only fenced blocks with the language `msvg` are processed; other code blocks are left unchanged.
- Invalid diagrams are reported through diagnostics and replaced with an escaped error block, never silently dropped.
- Source line information is preserved in diagnostics when available.

## License

See the [LICENSE](../../LICENSE) file.
