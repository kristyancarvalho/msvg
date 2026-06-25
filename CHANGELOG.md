# Changelog

All notable changes to MSVG are documented in this file. MSVG uses synchronized versions across all published packages.

## 0.1.0

The first release of MSVG. It turns small YAML descriptions written inside Markdown into static, accessible SVG diagrams, with no runtime JavaScript.

### Packages

- `@msvg/core`: parser, normalizer, and validator for the MSVG language, with structured diagnostics and stable TypeScript types.
- `@msvg/svg`: deterministic layout and accessible static SVG rendering, with built-in `paper`, `neutral`, `mono`, and `dark` themes.
- `@msvg/remark`: remark plugin that renders `msvg` fenced code blocks in unified/remark pipelines, in asset or inline mode.
- `@msvg/markdown-it`: markdown-it plugin that renders `msvg` fences, with RSS-safe asset output by default.
- `@msvg/astro`: Astro integration that wires the remark plugin into static builds and emits SVG assets.
- `@msvg/cli`: command-line tool with `check`, `build`, `render`, and `inspect` commands and JSON output for CI.

### Features

- Seven diagram types: `flow`, `mindmap`, `layers`, `comparison`, `sequence`, `timeline`, and `architecture`.
- YAML authoring inside Markdown `msvg` blocks, plus standalone `.msvg.yml`, `.msvg.yaml`, and `.msvg.json` files through the CLI.
- Shorthand and longhand edge syntax that normalize to the same model.
- Accessible output with `<title>`, `<desc>`, escaped text, and meaning that does not rely on color alone.
- Deterministic, self-contained SVG with no scripts, event handlers, remote URLs, remote fonts, or external images.
- Asset emission with deterministic content-hashed filenames and safe output paths.
- Structured diagnostics with severities, codes, messages, and source positions.
- Docker-only development workflow and a full verification gate.

### Documentation and examples

- Beginner-friendly English root README and a README for every package.
- Runnable examples: `basic-node`, `markdown-it-rss`, and `astro-blog`.
