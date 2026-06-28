import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { checkCommand } from "../../src/commands/check.js";

const validMarkdown = `# Post
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

const validYaml = `type: flow
title: Pipeline
nodes:
  a: Start
  b: End
edges:
  - a -> b
`;

const validJson = JSON.stringify({
  type: "flow",
  title: "Pipeline",
  nodes: { a: "Start", b: "End" },
  edges: ["a -> b"],
});

async function tempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "msvg-check-"));
}

describe("checkCommand", () => {
  it("succeeds for valid Markdown diagrams", async () => {
    const dir = await tempDir();
    const file = join(dir, "post.md");
    await writeFile(file, validMarkdown, "utf8");
    const result = await checkCommand([file]);
    expect(result.exitCode).toBe(0);
    expect(result.diagnostics).toEqual([]);
  });

  it("fails for invalid Markdown diagrams", async () => {
    const dir = await tempDir();
    const file = join(dir, "post.md");
    await writeFile(file, "```msvg\ntitle: Missing type\n```", "utf8");
    const result = await checkCommand([file], { json: true });
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("MSVG_MISSING_TYPE");
  });

  it("succeeds for a valid standalone YAML diagram", async () => {
    const dir = await tempDir();
    const file = join(dir, "diagram.msvg.yml");
    await writeFile(file, validYaml, "utf8");
    const result = await checkCommand([file]);
    expect(result.exitCode).toBe(0);
    expect(result.diagnostics).toEqual([]);
  });

  it("fails for an invalid standalone YAML diagram", async () => {
    const dir = await tempDir();
    const file = join(dir, "diagram.msvg.yaml");
    await writeFile(file, "title: Missing type\n", "utf8");
    const result = await checkCommand([file], { json: true });
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("MSVG_MISSING_TYPE");
  });

  it("succeeds for a valid standalone JSON diagram", async () => {
    const dir = await tempDir();
    const file = join(dir, "diagram.msvg.json");
    await writeFile(file, validJson, "utf8");
    const result = await checkCommand([file]);
    expect(result.exitCode).toBe(0);
    expect(result.diagnostics).toEqual([]);
  });

  it("fails for an invalid standalone JSON diagram", async () => {
    const dir = await tempDir();
    const file = join(dir, "diagram.msvg.json");
    await writeFile(file, JSON.stringify({ title: "no type" }), "utf8");
    const result = await checkCommand([file]);
    expect(result.exitCode).toBe(1);
    expect(result.diagnostics.some((d) => d.code === "MSVG_MISSING_TYPE")).toBe(true);
  });

  it("fails for an empty standalone file", async () => {
    const dir = await tempDir();
    const file = join(dir, "diagram.msvg.yml");
    await writeFile(file, "", "utf8");
    const result = await checkCommand([file]);
    expect(result.exitCode).toBe(1);
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });

  it("fails when a named input file does not exist", async () => {
    const result = await checkCommand([join(tmpdir(), "msvg-missing-input.msvg.yml")]);
    expect(result.exitCode).toBe(1);
    expect(result.diagnostics.some((d) => d.code === "MSVG_CLI_FILE_NOT_FOUND")).toBe(true);
  });

  it("still fails the run when one of several inputs is missing", async () => {
    const dir = await tempDir();
    const good = join(dir, "diagram.msvg.yml");
    await writeFile(good, validYaml, "utf8");
    const result = await checkCommand([good, join(dir, "ghost.msvg.yml")]);
    expect(result.exitCode).toBe(1);
    expect(result.diagnostics.some((d) => d.code === "MSVG_CLI_FILE_NOT_FOUND")).toBe(true);
  });

  it("fails when an input path is a directory", async () => {
    const dir = await tempDir();
    const sub = join(dir, "nested");
    await mkdir(sub);
    const result = await checkCommand([sub]);
    expect(result.exitCode).toBe(1);
    expect(result.diagnostics.some((d) => d.code === "MSVG_CLI_NOT_A_FILE")).toBe(true);
  });

  it("fails when a glob matches no files", async () => {
    const dir = await tempDir();
    const result = await checkCommand([join(dir, "*.md")]);
    expect(result.exitCode).toBe(1);
    expect(result.diagnostics.some((d) => d.code === "MSVG_CLI_NO_MATCH")).toBe(true);
  });

  it("reports no input when called with no patterns", async () => {
    const result = await checkCommand([]);
    expect(result.exitCode).toBe(1);
    expect(result.diagnostics.some((d) => d.code === "MSVG_CLI_NO_INPUT")).toBe(true);
  });
});
