import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { inspectCommand } from "../../src/commands/inspect.js";

describe("inspectCommand", () => {
  it("prints normalized diagrams as JSON", async () => {
    const dir = await mkdtemp(join(tmpdir(), "msvg-inspect-"));
    const file = join(dir, "diagram.msvg.yml");
    await writeFile(
      file,
      `type: flow
title: Pipeline
nodes:
  a: Start
edges: []
`,
      "utf8"
    );
    const result = await inspectCommand(file);
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain('"type": "flow"');
  });

  it("returns non-zero for invalid input", async () => {
    const dir = await mkdtemp(join(tmpdir(), "msvg-inspect-"));
    const file = join(dir, "bad.msvg.yml");
    await writeFile(file, "title: Missing type", "utf8");
    const result = await inspectCommand(file);
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("MSVG_MISSING_TYPE");
  });
});
