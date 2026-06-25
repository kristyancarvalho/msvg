# @msvg/remark

A remark plugin that turns ` ```msvg ` fenced code blocks into MSVG diagrams inside a unified/remark Markdown pipeline. It parses and validates each block with [`@msvg/core`](../core/README.md) and renders it with [`@msvg/svg`](../svg/README.md).

MSVG turns small text descriptions into static, accessible SVG diagrams for technical writing. See the [project README](../../README.md) for the full picture.

## Installation

```bash
npm install @msvg/remark
```

`unified` is a peer dependency.

## Usage

```ts
import { remark } from "remark";
import remarkHtml from "remark-html";
import { remarkMSVG } from "@msvg/remark";

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
| `publicPath` | Public URL prefix used in generated image references. |
| `sourcePath` | Source file path used for naming and diagnostics. |
| `diagnostics` | An array that collects diagnostics produced during processing. |

Asset mode is the safe default for blogs and feeds. Filenames are deterministic and content-hashed, so the same diagram always produces the same file.

## Behavior

- Only fenced blocks with the language `msvg` are processed; other code blocks are left unchanged.
- Invalid diagrams are reported through diagnostics and replaced with an escaped error block, never silently dropped.
- Source line information is preserved in diagnostics when available.

## License

See the [LICENSE](../../LICENSE) file.
