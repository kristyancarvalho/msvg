import { defineConfig } from "astro/config";
import msvgSvg from "@markdown-utils/msvg-astro";

export default defineConfig({
  integrations: [
    msvgSvg({
      outputDir: "public/msvg",
      publicPath: "/msvg",
    }),
  ],
});
