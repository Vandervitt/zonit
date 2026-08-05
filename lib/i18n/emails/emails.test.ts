// 邮件文案的双语守卫。
//
// 中英 key 对齐由 zh.ts 的 `satisfies EmailDictionary` 在编译期保证，
// 这里只测编译期查不到的：值本身写了没有、以及脏 locale 的回退行为。
// 后者尤其重要——locale 来自 users.locale，可能是 NULL 或被人工改库写脏，
// 而邮件发失败的表现只是「某个用户收到的邮件语言不对」，几乎不会被发现。
import { describe, it, expect } from "vitest";
import { locales, defaultLocale } from "../config";
import { getEmailDictionary } from ".";

describe("邮件字典", () => {
  it.each(locales)("%s：不存在空文案", (locale) => {
    const empty: string[] = [];
    const walk = (node: unknown, path: string) => {
      if (typeof node === "string") {
        if (node.trim() === "") empty.push(path);
        return;
      }
      // 函数式文案（插值）跳过：调用需要构造参数，覆盖交给各自的使用点。
      if (typeof node === "function") return;
      if (node && typeof node === "object") {
        for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
      }
    };
    walk(getEmailDictionary(locale), locale);
    expect(empty).toEqual([]);
  });

  it("null / undefined / 脏值一律回退默认语言，不抛错", () => {
    const fallback = getEmailDictionary(defaultLocale);
    for (const bad of [null, undefined, "", "ja", "zh-CN", "EN"]) {
      expect(getEmailDictionary(bad), String(bad)).toBe(fallback);
    }
  });

  it("合法 locale 各取各的字典", () => {
    expect(getEmailDictionary("zh")).not.toBe(getEmailDictionary("en"));
    expect(getEmailDictionary("zh").otp.heading).toBe("登录验证码");
    expect(getEmailDictionary("en").otp.heading).toBe("Your sign-in code");
  });

  it("主题行随语言变化（防止只译了正文）", () => {
    const zh = getEmailDictionary("zh");
    const en = getEmailDictionary("en");
    expect(zh.otp.subject("123456")).not.toBe(en.otp.subject("123456"));
    expect(zh.weeklyDigest.subject(3)).not.toBe(en.weeklyDigest.subject(3));
    expect(zh.leadNotification.subject("Page")).not.toBe(en.leadNotification.subject("Page"));
  });
});
