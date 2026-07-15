import { describe, it, expect } from "vitest";
import { hasAntiBan } from "./plans";

describe("hasAntiBan", () => {
  it("free / starter 关闭", () => {
    expect(hasAntiBan("free")).toBe(false);
    expect(hasAntiBan("starter")).toBe(false);
  });
  it("pro / agency 开启", () => {
    expect(hasAntiBan("pro")).toBe(true);
    expect(hasAntiBan("agency")).toBe(true);
  });
});
