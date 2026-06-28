# Changelog

All notable changes to MSVG are documented in this file. MSVG uses synchronized versions across all published packages.

## 0.2.0

Dynamic theming and release hardening. This release makes themes a first-class, safe feature and fixes the trust gaps found in the 0.1.0 audit so the verification gate reflects what actually ships.

### Dynamic theming

- A resolved theme token model routes every visual color through validated tokens. Hardcoded light fills no longer leak into the `dark` theme.
- Custom themes can `extend` a built-in, choose a light or dark `mode`, and override individual color tokens. Token values are strictly validated; unsafe values are rejected with diagnostics and the safe base value is kept.
- Three theme output modes: `static` (default, concrete colors), `css-variables` (a scoped `<style>` block with `--msvg-*` variables and concrete fallbacks), and `media-query` (adds a `prefers-color-scheme: dark` block).
- `themeMode` (`light`/`dark`/`auto`) and `background` (`auto`/`solid`/`transparent`) options, threaded through the remark, markdown-it, and Astro integrations.

### Accessibility

- Asset images choose `alt` text from an explicit `alt` field, then `description`, then a generated description, then the title.
- Timeline statuses and comparison tones render as text labels, not color alone.
- Diagram `<title>`, `<desc>`, and marker ids are salted per diagram, so repeated titles on one page produce unique, valid `aria-labelledby` references.

### Correctness and release hardening

- `msvg check` now validates standalone `.msvg.yml`, `.msvg.yaml`, and `.msvg.json` files, and reports missing files, empty globs, and directories as errors.
- Asset mode no longer emits a broken image reference when no write target is configured; it reports `MSVG_ASSET_NO_OUTPUT` and falls back to inline, or accepts an explicit `urlOnly` opt-in.
- Layout fixes: edge labels, self-loops, group boxes, and wrapped comparison verdicts are included in the SVG `viewBox`, and long unbreakable words and URLs are wrapped. A bounds regression suite guards against clipping.
- Schema diagnostics report duplicate YAML keys, unknown nested fields, and invalid kinds, tones, and statuses, with source positions. Component kinds gained `database`, `queue`, `user`, and `default`; event statuses gained `blocked`.
- The example commands all run, and `examples:check` is part of `verify`.
- A comment-free comment-audit script gates the source tree, and CI checks README asset drift.

### Documentation and tooling

- Documented ESM-only packages and the Node.js requirement, the theming model, accessibility guarantees, CLI standalone validation, and asset output requirements.
- Issue templates use MSVG areas, changesets target `dev`, and the npm publish workflow is documented as the single host-only exception to the Docker workflow.

## 0.1.0

The first release of MSVG. It turns small YAML descriptions written inside Markdown into static, accessible SVG diagrams, with no runtime JavaScript.

### Packages

- `@markdown-utils/msvg-core`: parser, normalizer, and validator for the MSVG language, with structured diagnostics and stable TypeScript types.
- `@markdown-utils/msvg-svg`: deterministic layout and accessible static SVG rendering, with built-in `paper`, `neutral`, `mono`, and `dark` themes.
- `@markdown-utils/msvg-remark`: remark plugin that renders `msvg` fenced code blocks in unified/remark pipelines, in asset or inline mode.
- `@markdown-utils/msvg-markdown-it`: markdown-it plugin that renders `msvg` fences, with RSS-safe asset output by default.
- `@markdown-utils/msvg-astro`: Astro integration that wires the remark plugin into static builds and emits SVG assets.
- `@markdown-utils/msvg-cli`: command-line tool with `check`, `build`, `render`, and `inspect` commands and JSON output for CI.

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
