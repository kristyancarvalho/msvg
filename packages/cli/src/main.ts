import { Command } from "commander";
import { buildCommand, checkCommand, inspectCommand, renderCommand } from "./index.js";

async function runAndExit(task: Promise<{ exitCode: number; output: string }>): Promise<void> {
  try {
    const result = await task;
    if (result.output.length > 0) {
      process.stdout.write(result.output + "\n");
    }
    process.exitCode = result.exitCode;
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = 1;
  }
}

const program = new Command();

program.name("msvg").description("Render and validate MSVG diagrams").version("0.0.0");

program
  .command("check")
  .argument("<patterns...>")
  .option("--json", "print JSON diagnostics")
  .action((patterns: string[], options: { json?: boolean }) => {
    void runAndExit(checkCommand(patterns, options));
  });

program
  .command("build")
  .argument("<patterns...>")
  .requiredOption("--out <dir>", "output directory")
  .option("--public-path <path>", "public path", "/msvg")
  .option("--json", "print JSON output")
  .action((patterns: string[], options: { out: string; publicPath?: string; json?: boolean }) => {
    void runAndExit(buildCommand(patterns, options));
  });

program
  .command("render")
  .argument("<file>")
  .option("--out <file>", "output SVG file")
  .option("--json", "print JSON output")
  .action((file: string, options: { out?: string; json?: boolean }) => {
    void runAndExit(renderCommand(file, options));
  });

program
  .command("inspect")
  .argument("<file>")
  .option("--json", "print JSON output", true)
  .action((file: string, options: { json?: boolean }) => {
    void runAndExit(inspectCommand(file, options));
  });

void program.parseAsync(process.argv);
