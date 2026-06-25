import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { renderCommand } from "../../src/commands/render.js";

const diagram = `type: flow
title: Pipeline
nodes:
  a: Start
  b: End
edges:
  - a -> b
`;

describe("renderCommand", () => {
  it("renders standalone diagram files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "msvg-render-"));
    const file = join(dir, "diagram.msvg.yml");
    const out = join(dir, "diagram.svg");
    await writeFile(file, diagram, "utf8");
    const result = await renderCommand(file, { out });
    expect(result.exitCode).toBe(0);
    expect(result.svg).toContain("<svg");
    expect(await readFile(out, "utf8")).toContain("<svg");
  });

  it("returns JSON diagnostics", async () => {
    const dir = await mkdtemp(join(tmpdir(), "msvg-render-"));
    const file = join(dir, "bad.msvg.yml");
    await writeFile(file, "title: Missing type", "utf8");
    const result = await renderCommand(file, { json: true });
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("MSVG_MISSING_TYPE");
  });
});
