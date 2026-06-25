import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { resolveInputFiles } from "../../src/glob.js";

describe("resolveInputFiles", () => {
  it("resolves explicit files and globs", async () => {
    const dir = await mkdtemp(join(tmpdir(), "msvg-glob-"));
    const a = join(dir, "a.md");
    const b = join(dir, "b.md");
    await writeFile(a, "a", "utf8");
    await writeFile(b, "b", "utf8");
    const files = await resolveInputFiles([join(dir, "*.md"), a]);
    expect(files).toEqual([a, b].sort());
  });

  it("returns an empty list for missing input", async () => {
    const files = await resolveInputFiles(["/tmp/does-not-exist-msvg.md"]);
    expect(files).toEqual([]);
  });
});
