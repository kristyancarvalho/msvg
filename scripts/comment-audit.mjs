import { readdir, readFile, stat } from "node:fs/promises";
import { join, extname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

const EXCLUDED_DIRS = new Set([
  "node_modules",
  "dist",
  "coverage",
  "reports",
  "specs",
  ".astro",
  ".git",
  "badges",
]);

const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".astro",
]);

const REGEX_PREV = new Set([
  "(",
  ",",
  "=",
  ":",
  "[",
  "!",
  "&",
  "|",
  "?",
  "{",
  ";",
  "+",
  "-",
  "*",
  "%",
  "^",
  "~",
]);

const REGEX_KEYWORDS = new Set([
  "return",
  "typeof",
  "instanceof",
  "in",
  "of",
  "new",
  "do",
  "else",
  "yield",
  "await",
  "case",
  "void",
  "delete",
]);

function isIdentifierChar(ch) {
  return /[A-Za-z0-9_$]/.test(ch);
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      files.push(...(await walk(join(dir, entry.name))));
    } else if (entry.isFile()) {
      if (entry.name.endsWith(".d.ts")) continue;
      if (SOURCE_EXTENSIONS.has(extname(entry.name))) {
        files.push(join(dir, entry.name));
      }
    }
  }
  return files;
}

function findComments(source) {
  const findings = [];
  let line = 1;
  let prev = "";
  let lastWord = "";
  let i = 0;
  const length = source.length;

  while (i < length) {
    const ch = source[i];
    const next = i + 1 < length ? source[i + 1] : "";

    if (ch === "\n") {
      line += 1;
      lastWord = "";
      i += 1;
      continue;
    }

    if (ch === " " || ch === "\t" || ch === "\r") {
      lastWord = "";
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'") {
      i += 1;
      while (i < length) {
        const c = source[i];
        if (c === "\\") {
          i += 2;
          continue;
        }
        if (c === "\n") line += 1;
        if (c === ch) {
          i += 1;
          break;
        }
        i += 1;
      }
      prev = ch;
      lastWord = "";
      continue;
    }

    if (ch === "`") {
      i += 1;
      while (i < length) {
        const c = source[i];
        if (c === "\\") {
          i += 2;
          continue;
        }
        if (c === "\n") line += 1;
        if (c === "`") {
          i += 1;
          break;
        }
        i += 1;
      }
      prev = "`";
      lastWord = "";
      continue;
    }

    if (ch === "/" && next === "/") {
      findings.push({ line, kind: "line" });
      while (i < length && source[i] !== "\n") i += 1;
      continue;
    }

    if (ch === "/" && next === "*") {
      findings.push({ line, kind: "block" });
      i += 2;
      while (i < length && !(source[i] === "*" && source[i + 1] === "/")) {
        if (source[i] === "\n") line += 1;
        i += 1;
      }
      i += 2;
      continue;
    }

    if (ch === "/") {
      const regexStart = REGEX_PREV.has(prev) || REGEX_KEYWORDS.has(lastWord);
      if (regexStart) {
        i += 1;
        let inClass = false;
        while (i < length) {
          const c = source[i];
          if (c === "\\") {
            i += 2;
            continue;
          }
          if (c === "\n") {
            line += 1;
            i += 1;
            break;
          }
          if (c === "[") inClass = true;
          else if (c === "]") inClass = false;
          else if (c === "/" && !inClass) {
            i += 1;
            break;
          }
          i += 1;
        }
        prev = "/";
        lastWord = "";
        continue;
      }
      prev = "/";
      lastWord = "";
      i += 1;
      continue;
    }

    if (ch === "<" && source.startsWith("<!--", i)) {
      findings.push({ line, kind: "html" });
      i += 4;
      while (i < length && !source.startsWith("-->", i)) {
        if (source[i] === "\n") line += 1;
        i += 1;
      }
      i += 3;
      continue;
    }

    prev = ch;
    lastWord = isIdentifierChar(ch) ? lastWord + ch : "";
    i += 1;
  }

  return findings;
}

const files = await walk(root);
files.sort();

const problems = [];
for (const file of files) {
  const info = await stat(file);
  if (!info.isFile()) continue;
  const source = await readFile(file, "utf8");
  const findings = findComments(source);
  for (const finding of findings) {
    problems.push(`${relative(root, file)}:${finding.line}: ${finding.kind} comment`);
  }
}

if (problems.length > 0) {
  process.stderr.write(`comment audit failed: ${problems.length} comment(s) found\n`);
  for (const problem of problems) {
    process.stderr.write(`  ${problem}\n`);
  }
  process.exit(1);
}

process.stdout.write(`comment audit passed: scanned ${files.length} source files, no comments found\n`);
