# @markdown-utils/msvg-markdown-it

A markdown-it plugin that renders ` ```msvg ` fenced code blocks as MSVG diagrams. It uses the same parsing, validation, and rendering as the remark plugin, but runs synchronously, which makes it a good fit for RSS generation and sanitized HTML pipelines.

MSVG turns small text descriptions into static, accessible SVG diagrams for technical writing. See the [project README](../../README.md) for the full picture.

## Installation

```bash
npm install @markdown-utils/msvg-markdown-it markdown-it
```

`markdown-it` is a peer dependency.

## Usage

```ts
import MarkdownIt from "markdown-it";
import { msvgMarkdownIt } from "@markdown-utils/msvg-markdown-it";

const md = new MarkdownIt();

msvgMarkdownIt(md, {
  output: "asset",
  outputDir: "public/msvg",
  publicPath: "/msvg",
});

const html = md.render(markdownSource);
```

## Options

| Option | Description |
|---|---|
| `output` | `"asset"` emits an RSS-safe image reference. `"inline"` embeds the SVG directly. |
| `outputDir` | Directory where asset files are written. |
| `publicPath` | Public URL prefix used in generated image references. |
| `sourcePath` | Source file path used for naming and diagnostics. |
| `diagnostics` | An array that collects diagnostics produced during rendering. |
| `emitFile` | An optional callback that receives `(filePath, contents)` instead of writing to disk. |

## Behavior

- Only `msvg` fences are transformed; other fenced blocks render normally.
- Asset mode is the safe default and produces image references suitable for feeds.
- Output requires no runtime JavaScript and is friendly to HTML sanitizers.

## License

See the [LICENSE](../../LICENSE) file.
