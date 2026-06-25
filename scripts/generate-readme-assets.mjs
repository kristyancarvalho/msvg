import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { parseAndValidate, hasErrors } from "@msvg/core";
import { renderSvg } from "@msvg/svg";

const root = fileURLToPath(new URL("..", import.meta.url));
const srcDir = join(root, ".github", "assets", "examples", "src");
const outDir = join(root, ".github", "assets", "examples");

const sources = (await readdir(srcDir)).filter((name) => name.endsWith(".msvg.yml")).sort();

await mkdir(outDir, { recursive: true });

let failed = false;
const generated = [];

for (const name of sources) {
  const source = await readFile(join(srcDir, name), "utf8");
  const parsed = parseAndValidate(source, { filePath: join("src", name) });
  if (!parsed.valid || parsed.diagram === null) {
    failed = true;
    for (const diag of parsed.diagnostics) {
      process.stderr.write(`${name}: ${diag.severity} ${diag.code} ${diag.message}\n`);
    }
    continue;
  }
  const rendered = renderSvg(parsed.diagram);
  if (hasErrors(rendered.diagnostics)) {
    failed = true;
    for (const diag of rendered.diagnostics) {
      process.stderr.write(`${name}: ${diag.severity} ${diag.code} ${diag.message}\n`);
    }
    continue;
  }
  const target = join(outDir, `${basename(name, ".msvg.yml")}.svg`);
  await writeFile(target, `${rendered.svg}\n`, "utf8");
  generated.push(basename(target));
}

process.stdout.write(`generated ${generated.length} diagram asset(s): ${generated.join(", ")}\n`);

if (failed) {
  process.exit(1);
}
