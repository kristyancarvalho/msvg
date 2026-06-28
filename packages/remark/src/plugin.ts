import type { Root } from "mdast";
import type { Plugin } from "unified";
import type { MSVGDiagnostic } from "@markdown-utils/msvg-core";
import { parseAndValidate } from "@markdown-utils/msvg-core";
import { renderSvg } from "@markdown-utils/msvg-svg";
import { emitAsset, escapeHtml, imageHtml, willEmitAsset, type AssetOptions, type OutputMode } from "./assets.js";

export interface RemarkMSVGOptions extends AssetOptions {
  output?: OutputMode | undefined;
  diagnostics?: MSVGDiagnostic[] | undefined;
}

interface ParentNode {
  children?: Array<Record<string, unknown>>;
}

function visitCodeNodes(node: ParentNode, visitor: (child: Record<string, unknown>, index: number, parent: ParentNode) => void | Promise<void>): Array<Promise<void>> {
  const tasks: Array<Promise<void>> = [];
  const children = node.children ?? [];
  for (let index = 0; index < children.length; index++) {
    const child = children[index]!;
    if (child["type"] === "code") {
      const result = visitor(child, index, node);
      if (result instanceof Promise) tasks.push(result);
    }
    tasks.push(...visitCodeNodes(child as ParentNode, visitor));
  }
  return tasks;
}

function lineFromNode(node: Record<string, unknown>): number | undefined {
  const position = node["position"] as { start?: { line?: number } } | undefined;
  return position?.start?.line;
}

export const remarkMSVG: Plugin<[RemarkMSVGOptions?], Root> = (options = {}) => {
  return async (tree, file): Promise<void> => {
    const diagnostics = options.diagnostics ?? [];
    const sourcePath = options.sourcePath ?? file.path;
    const tasks = visitCodeNodes(tree as unknown as ParentNode, async (node, index, parent) => {
      const lang = typeof node["lang"] === "string" ? node["lang"] : "";
      if (lang.trim().toLowerCase() !== "msvg") return;
      const value = typeof node["value"] === "string" ? node["value"] : "";
      const parsed = parseAndValidate(value, { filePath: sourcePath });
      const line = lineFromNode(node);
      diagnostics.push(...parsed.diagnostics.map((diag) => ({ ...diag, line: diag.line ?? line })));
      if (!parsed.valid || parsed.diagram === null) {
        const message = escapeHtml(parsed.diagnostics.map((diag) => `${diag.severity}: ${diag.message}`).join("\n"));
        parent.children![index] = {
          type: "html",
          value: `<pre class="msvg-error">${message}</pre>`,
        };
        return;
      }
      const rendered = renderSvg(parsed.diagram);
      diagnostics.push(...rendered.diagnostics);
      if (options.output === "inline") {
        parent.children![index] = { type: "html", value: rendered.svg };
        return;
      }
      if (!willEmitAsset(options) && options.urlOnly !== true) {
        diagnostics.push({
          code: "MSVG_ASSET_NO_OUTPUT",
          severity: "error",
          message: "asset output requires outputDir, emitFile, or urlOnly; rendered inline to avoid a broken image reference",
          filePath: sourcePath,
          line,
        });
        parent.children![index] = { type: "html", value: rendered.svg };
        return;
      }
      const asset = await emitAsset(parsed.diagram.title, rendered.svg, { ...options, sourcePath });
      parent.children![index] = {
        type: "html",
        value: imageHtml(asset.publicUrl, parsed.diagram.title, parsed.diagram.caption, parsed.diagram.type),
      };
    });
    await Promise.all(tasks);
  };
};
