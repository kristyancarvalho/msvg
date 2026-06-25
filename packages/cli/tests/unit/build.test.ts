import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { buildCommand } from "../../src/commands/build.js";

const markdown = `# Post
\`\`\`msvg
type: flow
title: Pipeline
nodes:
  a: Start
  b: End
edges:
  - a -> b
\`\`\`
`;

describe("buildCommand", () => {
  it("writes SVG assets for Markdown files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "msvg-build-"));
    const sourceDir = join(dir, "content");
    const out = join(dir, "public");
    await mkdir(sourceDir);
    const file = join(sourceDir, "post.md");
    await writeFile(file, markdown, "utf8");
    const result = await buildCommand([file], { out, publicPath: "/images" });
    expect(result.exitCode).toBe(0);
    expect(result.files[0]).toContain("/images/");
    const rel = result.files[0]!.replace("/images/", "");
    const svg = await readFile(join(out, rel), "utf8");
    expect(svg).toContain("<svg");
  });

  it("fails for empty globs", async () => {
    const result = await buildCommand(["/tmp/no-msvg-files/*.md"], { out: "/tmp/out", json: true });
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("MSVG_CLI_NO_INPUT");
  });
});
