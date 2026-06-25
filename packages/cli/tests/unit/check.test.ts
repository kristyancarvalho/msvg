import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { checkCommand } from "../../src/commands/check.js";

const valid = `# Post
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

describe("checkCommand", () => {
  it("succeeds for valid Markdown diagrams", async () => {
    const dir = await mkdtemp(join(tmpdir(), "msvg-check-"));
    const file = join(dir, "post.md");
    await writeFile(file, valid, "utf8");
    const result = await checkCommand([file]);
    expect(result.exitCode).toBe(0);
    expect(result.diagnostics).toEqual([]);
  });

  it("fails for invalid diagrams", async () => {
    const dir = await mkdtemp(join(tmpdir(), "msvg-check-"));
    const file = join(dir, "post.md");
    await writeFile(file, "```msvg\ntitle: Missing type\n```", "utf8");
    const result = await checkCommand([file], { json: true });
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("MSVG_MISSING_TYPE");
  });
});
