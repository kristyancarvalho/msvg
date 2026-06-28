---
title: "MSVG Astro example"
---

This post shows an MSVG diagram that is rendered to a static SVG asset during the Astro build. There is no client-side JavaScript involved.

```msvg
type: flow
title: "Astro build pipeline"
description: "How an msvg block becomes an image during the build."
direction: LR
nodes:
  post:
    label: "Markdown post"
    kind: input
  remark:
    label: "remark plugin"
    kind: process
  asset:
    label: "SVG asset"
    kind: output
edges:
  - post -> remark: "detect block"
  - remark -> asset: "write image"
```

The diagram above is a normal image once the site is built.
