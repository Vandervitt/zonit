import { describe, it, expect } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("窗口内超过上限即拒", () => {
    const now = 1000;
    const rl = createRateLimiter({ windowMs: 60_000, max: 3, now: () => now });
    expect(rl.allow("ip1")).toBe(true);
    expect(rl.allow("ip1")).toBe(true);
    expect(rl.allow("ip1")).toBe(true);
    expect(rl.allow("ip1")).toBe(false); // 第 4 次
  });
  it("不同 key 独立计数", () => {
    const now = 1000;
    const rl = createRateLimiter({ windowMs: 60_000, max: 1, now: () => now });
    expect(rl.allow("a")).toBe(true);
    expect(rl.allow("b")).toBe(true);
  });
  it("窗口滑过后重新允许", () => {
    let now = 1000;
    const rl = createRateLimiter({ windowMs: 60_000, max: 1, now: () => now });
    expect(rl.allow("a")).toBe(true);
    expect(rl.allow("a")).toBe(false);
    now += 61_000;
    expect(rl.allow("a")).toBe(true);
  });
});
