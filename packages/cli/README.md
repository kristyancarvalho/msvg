# @msvg/cli

The MSVG command-line tool. Use it to validate, build, render, and inspect diagrams outside any framework. It finds `msvg` blocks in your Markdown files, validates every diagram, and can generate static SVG assets.

MSVG turns small text descriptions into static, accessible SVG diagrams for technical writing. See the [project README](../../README.md) for the full picture.

## Installation

```bash
npm install @msvg/cli
```

## Commands

Check that every diagram in your Markdown is valid:

```bash
msvg check "content/**/*.md"
```

Build SVG assets from your Markdown:

```bash
msvg build "content/**/*.md" --out public/images/generated --public-path /images/generated
```

Render a standalone diagram file to a single SVG:

```bash
msvg render diagram.msvg.yml --out diagram.svg
```

Inspect the normalized diagram model and diagnostics:

```bash
msvg inspect diagram.msvg.yml
```

## Options

| Option | Applies to | Description |
|---|---|---|
| `--out <path>` | `build`, `render` | Output directory or file. Required for `build`. |
| `--public-path <path>` | `build` | Public URL prefix for generated images. |
| `--json` | all | Print machine-readable JSON output. |

Every command exits with a non-zero status when there are errors, so it works well in CI. Output paths are validated and cannot escape the configured output directory.

## Programmatic API

The command functions are also exported for direct use.

```ts
import { checkCommand, buildCommand, renderCommand, inspectCommand } from "@msvg/cli";

const result = await checkCommand(["content/**/*.md"]);
process.exitCode = result.exitCode;
```

## License

See the [LICENSE](../../LICENSE) file.
