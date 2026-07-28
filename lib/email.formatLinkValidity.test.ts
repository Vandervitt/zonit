import { describe, it, expect } from "vitest";
import { formatLinkValidity } from "./email";

const NOW = new Date("2026-07-28T00:00:00.000Z");
const inHours = (h: number) => new Date(NOW.getTime() + h * 3_600_000);

describe("formatLinkValidity", () => {
  it("整天数按天表述", () => {
    expect(formatLinkValidity(inHours(24), NOW)).toBe("1 天");
    expect(formatLinkValidity(inHours(72), NOW)).toBe("3 天");
    expect(formatLinkValidity(inHours(168), NOW)).toBe("7 天");
  });

  it("不足一天或非整天按小时表述", () => {
    expect(formatLinkValidity(inHours(1), NOW)).toBe("1 小时");
    expect(formatLinkValidity(inHours(12), NOW)).toBe("12 小时");
    expect(formatLinkValidity(inHours(36), NOW)).toBe("36 小时");
  });

  it("已过期/零时长兜底为 1 小时，不产生「0 小时」或负数", () => {
    expect(formatLinkValidity(NOW, NOW)).toBe("1 小时");
    expect(formatLinkValidity(inHours(-5), NOW)).toBe("1 小时");
  });
});
