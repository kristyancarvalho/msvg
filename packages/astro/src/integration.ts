import type { AstroIntegration } from "astro";
import { remarkMSVG, type RemarkMSVGOptions } from "@msvg/remark";

export interface AstroMSVGOptions extends RemarkMSVGOptions {
  publicDir?: string | undefined;
}

export default function msvgSvg(options: AstroMSVGOptions = {}): AstroIntegration {
  const outputDir = options.outputDir ?? options.publicDir ?? "public/msvg";
  const publicPath = options.publicPath ?? "/msvg";
  return {
    name: "@msvg/astro",
    hooks: {
      "astro:config:setup": ({ updateConfig }) => {
        updateConfig({
          markdown: {
            remarkPlugins: [[remarkMSVG, { ...options, outputDir, publicPath }]],
          },
        });
      },
    },
  };
}
