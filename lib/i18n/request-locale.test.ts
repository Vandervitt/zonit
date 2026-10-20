// 匿名访客（如收到分享预览链接的人）的界面语言：显式选择优先，其次浏览器语言，默认英文。
import { describe, it, expect } from "vitest";
import { requestLocale } from "./request-locale";

describe("requestLocale", () => {
  it("语言 cookie 优先于浏览器语言", () => {
    expect(requestLocale("en", "zh-CN,zh;q=0.9")).toBe("en");
    expect(requestLocale("zh", "en-US,en;q=0.9")).toBe("zh");
  });

  it("无 cookie 时按浏览器首选语言：中文任一变体 → zh", () => {
    expect(requestLocale(null, "zh-CN,zh;q=0.9,en;q=0.8")).toBe("zh");
    expect(requestLocale(undefined, "zh-TW")).toBe("zh");
  });

  it("浏览器首选非中文 → en（即便后面列了中文）", () => {
    expect(requestLocale(null, "en-US,en;q=0.9,zh-CN;q=0.8")).toBe("en");
  });

  it("cookie 非法、无 Accept-Language → 默认英文", () => {
    expect(requestLocale("fr", null)).toBe("en");
    expect(requestLocale(null, "")).toBe("en");
  });
});
