import MarkdownIt from "markdown-it";
import { msvgMarkdownIt } from "@markdown-utils/msvg-markdown-it";

const markdown = `
# Release notes

A short post with a diagram for the feed.

\`\`\`msvg
type: timeline
title: "Release path"
events:
  - at: "Phase 1"
    title: "Core parser"
    status: done
  - at: "Phase 2"
    title: "Renderers"
    status: current
  - at: "Phase 3"
    title: "Integrations"
    status: future
\`\`\`
`;

const md = new MarkdownIt();

msvgMarkdownIt(md, {
  output: "asset",
  publicPath: "/msvg",
});

const html = md.render(markdown);

console.log(html);
