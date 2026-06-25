import { describe, expect, it } from "vitest";
import MarkdownIt from "markdown-it";
import { msvgMarkdownIt } from "../../src/plugin.js";

const diagram = `type: flow
title: Pipeline
nodes:
  a: Start
  b: End
edges:
  - a -> b`;

describe("msvgMarkdownIt", () => {
  it("renders asset image HTML by default", () => {
    const md = new MarkdownIt();
    msvgMarkdownIt(md, { publicPath: "/images", sourcePath: "post.md" });
    const html = md.render("```msvg\n" + diagram + "\n```");
    expect(html).toContain("<img");
    expect(html).toContain("/images/post/pipeline-");
  });

  it("renders inline SVG when configured", () => {
    const md = new MarkdownIt();
    msvgMarkdownIt(md, { output: "inline" });
    const html = md.render("```msvg\n" + diagram + "\n```");
    expect(html).toContain("<svg");
    expect(html).toContain("<title");
  });

  it("keeps non-msvg fences on the default path", () => {
    const md = new MarkdownIt();
    msvgMarkdownIt(md);
    const html = md.render("```js\nconst x = 1;\n```");
    expect(html).toContain("<code");
    expect(html).toContain("const x = 1");
  });

  it("records diagnostics in env", () => {
    const md = new MarkdownIt();
    msvgMarkdownIt(md);
    const env: { msvgDiagnostics?: unknown[] } = {};
    const html = md.render("```msvg\ntitle: Missing type\n```", env);
    expect(html).toContain("msvg-error");
    expect(env.msvgDiagnostics?.length).toBeGreaterThan(0);
  });
});
