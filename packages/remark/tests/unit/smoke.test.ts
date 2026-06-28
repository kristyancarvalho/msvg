import { describe, it, expect } from "vitest";
import * as remark from "../../src/index.js";

describe("remark entry point", () => {
  it("loads and exposes the public api", () => {
    expect(typeof remark.remarkMSVG).toBe("function");
  });
});
