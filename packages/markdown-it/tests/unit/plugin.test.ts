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
  it("renders asset image HTML when files are written", () => {
    const md = new MarkdownIt();
    const emitted: string[] = [];
    msvgMarkdownIt(md, { publicPath: "/images", sourcePath: "post.md", emitFile: (filePath) => emitted.push(filePath) });
    const html = md.render("```msvg\n" + diagram + "\n```");
    expect(html).toContain("<img");
    expect(html).toContain("/images/post/pipeline-");
    expect(emitted[0]).toContain("pipeline-");
  });

  it("renders asset image HTML in explicit urlOnly mode without writing files", () => {
    const md = new MarkdownIt();
    msvgMarkdownIt(md, { output: "asset", publicPath: "/images", sourcePath: "post.md", urlOnly: true });
    const env: { msvgDiagnostics?: Array<{ code: string }> } = {};
    const html = md.render("```msvg\n" + diagram + "\n```", env);
    expect(html).toContain("<img");
    expect(html).toContain("/images/post/pipeline-");
    expect((env.msvgDiagnostics ?? []).some((d) => d.code === "MSVG_ASSET_NO_OUTPUT")).toBe(false);
  });

  it("never emits a broken image when asset mode has no output target", () => {
    const md = new MarkdownIt();
    msvgMarkdownIt(md, { output: "asset", publicPath: "/images", sourcePath: "post.md" });
    const env: { msvgDiagnostics?: Array<{ code: string; severity: string }> } = {};
    const html = md.render("```msvg\n" + diagram + "\n```", env);
    expect(html).not.toContain("<img");
    expect(html).toContain("<svg");
    const diag = (env.msvgDiagnostics ?? []).find((d) => d.code === "MSVG_ASSET_NO_OUTPUT");
    expect(diag?.severity).toBe("error");
  });

  it("renders inline SVG when configured", () => {
    const md = new MarkdownIt();
    msvgMarkdownIt(md, { output: "inline" });
    const html = md.render("```msvg\n" + diagram + "\n```");
    expect(html).toContain("<svg");
    expect(html).toContain("<title");
  });

  it("threads theme output mode into inline rendering", () => {
    const md = new MarkdownIt();
    msvgMarkdownIt(md, { output: "inline", themeOutputMode: "css-variables" });
    const html = md.render("```msvg\n" + diagram + "\n```");
    expect(html).toContain("<style");
    expect(html).toContain("var(--msvg-");
  });

  it("threads a dark theme into inline rendering", () => {
    const md = new MarkdownIt();
    msvgMarkdownIt(md, { output: "inline", theme: "dark" });
    const html = md.render("```msvg\n" + diagram + "\n```");
    expect(html).not.toContain("#faf9f7");
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
