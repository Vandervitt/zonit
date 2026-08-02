import { describe, expect, it } from "vitest";
import { channelHref } from "./channel-href";

describe("channelHref", () => {
  it("wa.me 去掉 E.164 的 +", () => {
    expect(channelHref("whatsapp", "+8613800138000")).toEqual({
      href: "https://wa.me/8613800138000",
      external: true,
    });
  });

  it("tel / mailto 不开新窗", () => {
    expect(channelHref("phone", "+8613800138000")).toEqual({ href: "tel:+8613800138000", external: false });
    expect(channelHref("email", "a@b.com")).toEqual({ href: "mailto:a@b.com", external: false });
  });

  it("telegram 归一为裸用户名", () => {
    expect(channelHref("telegram", "@zapbridge")).toEqual({ href: "https://t.me/zapbridge", external: true });
    expect(channelHref("telegram", "https://t.me/zapbridge")).toEqual({ href: "https://t.me/zapbridge", external: true });
  });

  it("form 返回页内锚点", () => {
    expect(channelHref("form", "")).toEqual({ href: "#lead-form", external: false });
  });

  it("值缺失或格式非法一律返回 null，不产出死链", () => {
    expect(channelHref("whatsapp", "")).toBeNull();
    expect(channelHref("whatsapp", "13800138000")).toBeNull(); // 缺 +，不是 E.164
    expect(channelHref("phone", "not-a-number")).toBeNull();
    expect(channelHref("email", "no-at-sign")).toBeNull();
    expect(channelHref("telegram", "12345")).toBeNull(); // 纯数字是手机号不是用户名
  });
});
