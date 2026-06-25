import { describe, expect, it } from "vitest";
import msvgSvg from "../../src/integration.js";

describe("msvgSvg", () => {
  it("returns an Astro integration", () => {
    const integration = msvgSvg({ publicPath: "/images/generated" });
    expect(integration.name).toBe("@msvg/astro");
    expect(integration.hooks["astro:config:setup"]).toBeTypeOf("function");
  });

  it("registers the remark plugin with asset options", () => {
    const integration = msvgSvg({ outputDir: "public/generated", publicPath: "/generated" });
    let config: unknown;
    integration.hooks["astro:config:setup"]?.({
      updateConfig: (value: unknown) => {
        config = value;
      },
    } as never);
    expect(JSON.stringify(config)).toContain("public/generated");
    expect(JSON.stringify(config)).toContain("/generated");
  });
});
