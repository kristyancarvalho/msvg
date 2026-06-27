import { parseAndValidate } from "@markdown-utils/msvg-core";
import { renderSvg } from "@markdown-utils/msvg-svg";

const source = `
type: flow
title: "Markdown to SVG pipeline"
description: "How author text becomes a static image."
direction: LR
nodes:
  markdown:
    label: "Markdown"
    kind: input
  parser:
    label: "Parser"
    kind: process
  renderer:
    label: "SVG renderer"
    kind: process
  svg:
    label: "SVG asset"
    kind: output
edges:
  - markdown -> parser: "read"
  - parser -> renderer: "layout"
  - renderer -> svg: "write"
`;

const result = parseAndValidate(source);

if (!result.valid || result.diagram === null) {
  for (const diagnostic of result.diagnostics) {
    console.error(`${diagnostic.severity}: ${diagnostic.message}`);
  }
  process.exitCode = 1;
} else {
  const rendered = renderSvg(result.diagram, { theme: "paper" });
  console.log(rendered.svg);
}
