import { describe, expect, it } from "vitest";
import type { Root } from "mdast";
import { remark } from "remark";
import { remarkMSVG } from "../../src/plugin.js";

const diagram = `type: flow
title: Pipeline
nodes:
  a: Start
  b: End
edges:
  - a -> b`;

async function run(tree: Root, options = {}) {
  const transform = remarkMSVG(options) as unknown as (tree: Root, file: { path?: string }) => Promise<void>;
  await transform(tree, { path: "post.md" });
  return tree;
}

describe("remarkMSVG", () => {
  it("replaces msvg code blocks with asset images by default", async () => {
    const emitted: string[] = [];
    const tree: Root = {
      type: "root",
      children: [{ type: "code", lang: "msvg", value: diagram }],
    };
    await run(tree, { publicPath: "/images", emitFile: (filePath: string) => emitted.push(filePath) });
    const node = tree.children[0] as { type: string; value: string };
    expect(node.type).toBe("html");
    expect(node.value).toContain("<img");
    expect(node.value).toContain("/images/post/pipeline-");
    expect(emitted[0]).toContain("pipeline-");
  });

  it("renders an asset image without writing in explicit urlOnly mode", async () => {
    const diagnostics: Array<{ code: string }> = [];
    const tree: Root = {
      type: "root",
      children: [{ type: "code", lang: "msvg", value: diagram }],
    };
    await run(tree, { output: "asset", publicPath: "/images", urlOnly: true, diagnostics });
    const node = tree.children[0] as { value: string };
    expect(node.value).toContain("<img");
    expect(node.value).toContain("/images/post/pipeline-");
    expect(diagnostics.some((d) => d.code === "MSVG_ASSET_NO_OUTPUT")).toBe(false);
  });

  it("never emits a broken image when asset mode has no output target", async () => {
    const diagnostics: Array<{ code: string; severity: string }> = [];
    const tree: Root = {
      type: "root",
      children: [{ type: "code", lang: "msvg", value: diagram }],
    };
    await run(tree, { output: "asset", publicPath: "/images", diagnostics });
    const node = tree.children[0] as { value: string };
    expect(node.value).not.toContain("<img");
    expect(node.value).toContain("<svg");
    const diag = diagnostics.find((d) => d.code === "MSVG_ASSET_NO_OUTPUT");
    expect(diag?.severity).toBe("error");
  });

  it("renders inline SVG when explicitly configured", async () => {
    const tree: Root = {
      type: "root",
      children: [{ type: "code", lang: "msvg", value: diagram }],
    };
    await run(tree, { output: "inline" });
    const node = tree.children[0] as { value: string };
    expect(node.value).toContain("<svg");
    expect(node.value).toContain("<title");
  });

  it("threads theme output mode into inline rendering", async () => {
    const tree: Root = {
      type: "root",
      children: [{ type: "code", lang: "msvg", value: diagram }],
    };
    await run(tree, { output: "inline", themeOutputMode: "css-variables" });
    const node = tree.children[0] as { value: string };
    expect(node.value).toContain("<style");
    expect(node.value).toContain("var(--msvg-");
  });

  it("threads a dark theme into inline rendering", async () => {
    const tree: Root = {
      type: "root",
      children: [{ type: "code", lang: "msvg", value: diagram }],
    };
    await run(tree, { output: "inline", theme: "dark" });
    const node = tree.children[0] as { value: string };
    expect(node.value).not.toContain("#faf9f7");
  });

  it("ignores non-msvg code blocks", async () => {
    const tree: Root = {
      type: "root",
      children: [{ type: "code", lang: "ts", value: "const x = 1;" }],
    };
    await run(tree);
    expect(tree.children[0]?.type).toBe("code");
  });

  it("transforms msvg fences through a real unified pipeline", async () => {
    const source = "```msvg\n" + diagram + "\n```\n";
    const file = await remark().use(remarkMSVG, { output: "inline" }).process(source);
    const output = String(file);
    expect(output).toContain("<svg");
    expect(output).toContain("<title");
    expect(output).not.toContain("```msvg");
  });

  it("collects diagnostics for invalid diagrams", async () => {
    const diagnostics: unknown[] = [];
    const tree: Root = {
      type: "root",
      children: [{ type: "code", lang: "msvg", value: "title: Missing type" }],
    };
    await run(tree, { diagnostics });
    const node = tree.children[0] as { value: string };
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(node.value).toContain("msvg-error");
  });

  it("uses the diagram description as image alt text", async () => {
    const described = "type: flow\ntitle: Pipeline\ndescription: A described pipeline\nnodes:\n  a: Start\n  b: End\nedges:\n  - a -> b";
    const tree: Root = {
      type: "root",
      children: [{ type: "code", lang: "msvg", value: described }],
    };
    await run(tree, { publicPath: "/images", emitFile: () => {} });
    const node = tree.children[0] as { value: string };
    expect(node.value).toContain('alt="A described pipeline"');
  });

  it("uses an explicit alt field as image alt text", async () => {
    const withAlt = "type: flow\ntitle: Pipeline\nalt: Custom alt text\ndescription: A described pipeline\nnodes:\n  a: Start\n  b: End\nedges:\n  - a -> b";
    const tree: Root = {
      type: "root",
      children: [{ type: "code", lang: "msvg", value: withAlt }],
    };
    await run(tree, { publicPath: "/images", emitFile: () => {} });
    const node = tree.children[0] as { value: string };
    expect(node.value).toContain('alt="Custom alt text"');
  });

  it("gives same-title inline diagrams unique element ids", async () => {
    const tree: Root = {
      type: "root",
      children: [
        { type: "code", lang: "msvg", value: diagram },
        { type: "code", lang: "msvg", value: diagram },
      ],
    };
    await run(tree, { output: "inline" });
    const first = (tree.children[0] as { value: string }).value;
    const second = (tree.children[1] as { value: string }).value;
    const firstId = first.match(/id="([^"]*-title)"/)?.[1];
    const secondId = second.match(/id="([^"]*-title)"/)?.[1];
    expect(firstId).toBeTruthy();
    expect(secondId).toBeTruthy();
    expect(firstId).not.toBe(secondId);
  });
});
