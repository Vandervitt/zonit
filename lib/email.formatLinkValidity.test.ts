import { describe, it, expect } from "vitest";
import { formatLinkValidity } from "./email";

const NOW = new Date("2026-07-28T00:00:00.000Z");
const inHours = (h: number) => new Date(NOW.getTime() + h * 3_600_000);

// 断言认的是中文表述，故显式钉中文——不依赖 defaultLocale（那是英文）。
// 邀请邮件本身也固定中文（收件人还没有账号，发起人是中文超管）。
const zh = (d: Date) => formatLinkValidity(d, NOW, "zh");

describe("formatLinkValidity", () => {
  it("整天数按天表述", () => {
    expect(zh(inHours(24))).toBe("1 天");
    expect(zh(inHours(72))).toBe("3 天");
    expect(zh(inHours(168))).toBe("7 天");
  });

  it("不足一天或非整天按小时表述", () => {
    expect(zh(inHours(1))).toBe("1 小时");
    expect(zh(inHours(12))).toBe("12 小时");
    expect(zh(inHours(36))).toBe("36 小时");
  });

  it("已过期/零时长兜底为 1 小时，不产生「0 小时」或负数", () => {
    expect(zh(NOW)).toBe("1 小时");
    expect(zh(inHours(-5))).toBe("1 小时");
  });
});
