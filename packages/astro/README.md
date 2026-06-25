# @msvg/astro

An Astro integration for MSVG. It wires the [`@msvg/remark`](../remark/README.md) plugin into your Astro build so that any Markdown post can contain `msvg` diagram blocks. During the build, diagrams become static SVG assets in your public directory, with no client-side JavaScript.

MSVG turns small text descriptions into static, accessible SVG diagrams for technical writing. See the [project README](../../README.md) for the full picture.

## Installation

```bash
npm install @msvg/astro
```

`astro` is a peer dependency.

## Usage

```js
import { defineConfig } from "astro/config";
import msvgSvg from "@msvg/astro";

export default defineConfig({
  integrations: [
    msvgSvg({
      outputDir: "public/msvg",
      publicPath: "/msvg",
    }),
  ],
});
```

Now write a Markdown post with a diagram:

````md
---
title: My post
---

# Pipeline

```msvg
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
```
````

## Options

The integration accepts every option of the remark plugin plus an Astro-specific one.

| Option | Description |
|---|---|
| `outputDir` | Directory for generated SVG assets. Defaults to `public/msvg`. |
| `publicDir` | An alternative way to set the output directory. |
| `publicPath` | Public URL prefix for generated images. Defaults to `/msvg`. |
| `output` | `"asset"` (default) or `"inline"`. |

The integration works with static builds and produces root-relative image paths.

## License

See the [LICENSE](../../LICENSE) file.
