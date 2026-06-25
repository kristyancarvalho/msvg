import { defineConfig } from "tsup";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const shebang = "#" + "!/usr/bin/env node\n";

export default defineConfig({
  entry: ["src/index.ts", "src/main.ts"],
  format: "esm",
  dts: true,
  outDir: "dist",
  clean: true,
  onSuccess: async () => {
    const target = resolve("dist/main.js");
    const current = readFileSync(target, "utf8");
    if (!current.startsWith(shebang)) {
      writeFileSync(target, shebang + current);
    }
  },
});
