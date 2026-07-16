import { describe, it, expect } from "vitest";
import { hasAntiBan } from "./plans";

describe("hasAntiBan", () => {
  it("free / starter / pro 关闭", () => {
    expect(hasAntiBan("free")).toBe(false);
    expect(hasAntiBan("starter")).toBe(false);
    expect(hasAntiBan("pro")).toBe(false);
  });
  it("仅 agency 开启", () => {
    expect(hasAntiBan("agency")).toBe(true);
  });
});
