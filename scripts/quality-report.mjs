import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const badgeDir = join(root, ".github", "assets", "badges");
const packages = ["core", "svg", "remark", "markdown-it", "astro", "cli"];

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function measure(text) {
  let width = 0;
  for (const ch of text) {
    if ("iIl.,:;'|!".includes(ch)) width += 3.3;
    else if ("mwMW".includes(ch)) width += 9.6;
    else if (ch >= "0" && ch <= "9") width += 6.6;
    else if (ch === " ") width += 3.6;
    else width += 6.7;
  }
  return width;
}

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function badge(label, message, color) {
  const labelWidth = Math.round(measure(label) + 12);
  const messageWidth = Math.round(measure(message) + 12);
  const total = labelWidth + messageWidth;
  const labelMid = labelWidth / 2;
  const messageMid = labelWidth + messageWidth / 2;
  const id = slug(`${label}-${message}`);
  const safeLabel = escapeXml(label);
  const safeMessage = escapeXml(message);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="20" role="img" aria-label="${safeLabel}: ${safeMessage}">`,
    `<title>${safeLabel}: ${safeMessage}</title>`,
    `<linearGradient id="${id}-g" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>`,
    `<clipPath id="${id}-r"><rect width="${total}" height="20" rx="3" fill="#fff"/></clipPath>`,
    `<g clip-path="url(#${id}-r)">`,
    `<rect width="${labelWidth}" height="20" fill="#555"/>`,
    `<rect x="${labelWidth}" width="${messageWidth}" height="20" fill="${color}"/>`,
    `<rect width="${total}" height="20" fill="url(#${id}-g)"/>`,
    `</g>`,
    `<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">`,
    `<text x="${labelMid}" y="15" fill="#010101" fill-opacity=".3">${safeLabel}</text>`,
    `<text x="${labelMid}" y="14">${safeLabel}</text>`,
    `<text x="${messageMid}" y="15" fill="#010101" fill-opacity=".3">${safeMessage}</text>`,
    `<text x="${messageMid}" y="14">${safeMessage}</text>`,
    `</g>`,
    `</svg>`,
    ``,
  ].join("\n");
}

function pctColor(pct) {
  if (pct >= 90) return "#4c1";
  if (pct >= 80) return "#97ca00";
  if (pct >= 70) return "#a4a61d";
  if (pct >= 60) return "#dfb317";
  if (pct >= 40) return "#fe7d37";
  return "#e05d44";
}

const totals = {
  lines: { total: 0, covered: 0 },
  statements: { total: 0, covered: 0 },
  functions: { total: 0, covered: 0 },
  branches: { total: 0, covered: 0 },
  tests: { total: 0, passed: 0, failed: 0 },
};
const perPackage = [];

for (const name of packages) {
  const coverage = await readJson(join(root, "packages", name, "coverage", "coverage-summary.json"));
  const report = await readJson(join(root, "packages", name, "vitest-report.json"));
  const entry = { package: `@msvg/${name}` };
  if (coverage && coverage.total) {
    for (const key of ["lines", "statements", "functions", "branches"]) {
      const metric = coverage.total[key];
      if (metric) {
        totals[key].total += metric.total;
        totals[key].covered += metric.covered;
      }
    }
    entry.lines = coverage.total.lines ? coverage.total.lines.pct : null;
  }
  if (report) {
    totals.tests.total += report.numTotalTests ?? 0;
    totals.tests.passed += report.numPassedTests ?? 0;
    totals.tests.failed += report.numFailedTests ?? 0;
    entry.tests = report.numTotalTests ?? 0;
    entry.testsPassed = report.numPassedTests ?? 0;
  }
  perPackage.push(entry);
}

function ratio(part, whole) {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

const coveragePct = ratio(totals.lines.covered, totals.lines.total);
const passPct = ratio(totals.tests.passed, totals.tests.total);
const testsPassing = totals.tests.failed === 0 && totals.tests.total > 0;

await mkdir(badgeDir, { recursive: true });

await writeFile(
  join(badgeDir, "tests.svg"),
  badge("tests", testsPassing ? "passing" : "failing", testsPassing ? "#4c1" : "#e05d44"),
  "utf8",
);
await writeFile(join(badgeDir, "coverage.svg"), badge("coverage", `${coveragePct}%`, pctColor(coveragePct)), "utf8");
await writeFile(join(badgeDir, "tests-passed.svg"), badge("tests passed", `${passPct}%`, pctColor(passPct)), "utf8");

const summary = {
  coverage: {
    lines: coveragePct,
    statements: ratio(totals.statements.covered, totals.statements.total),
    functions: ratio(totals.functions.covered, totals.functions.total),
    branches: ratio(totals.branches.covered, totals.branches.total),
  },
  tests: {
    total: totals.tests.total,
    passed: totals.tests.passed,
    failed: totals.tests.failed,
    passPercentage: passPct,
    status: testsPassing ? "passing" : "failing",
  },
  packages: perPackage,
};

await writeFile(join(badgeDir, "quality.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");

process.stdout.write(
  `coverage ${coveragePct}% | tests ${totals.tests.passed}/${totals.tests.total} passing (${passPct}%) | status ${summary.tests.status}\n`,
);

if (!testsPassing) {
  process.exit(1);
}
