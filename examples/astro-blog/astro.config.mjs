import { defineConfig } from "astro/config";
import msvgSvg from "@msvg/astro";

export default defineConfig({
  integrations: [
    msvgSvg({
      outputDir: "public/msvg",
      publicPath: "/msvg",
    }),
  ],
});
