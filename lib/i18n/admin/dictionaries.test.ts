import { describe, it, expect } from "vitest";
import { locales } from "../config";
import { getAdminDictionary } from ".";
import { ADMIN_NAV } from "@/app/admin/(workspace)/_shell/nav";

// 中英 key 对齐由 zh/index.ts 的 `satisfies AdminDictionary` 在编译期保证，
// 这里只测编译期查不到的东西：值本身是否真的写了、以及跨模块的引用是否对得上。
describe("后台字典", () => {
  it.each(locales)("%s：不存在空文案", (locale) => {
    const empty: string[] = [];
    const walk = (node: unknown, path: string) => {
      if (typeof node === "string") {
        if (node.trim() === "") empty.push(path);
        return;
      }
      // 函数式文案（插值）跳过：调用它需要构造参数，覆盖交给各自的使用点。
      if (typeof node === "function") return;
      if (node && typeof node === "object") {
        for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
      }
    };
    walk(getAdminDictionary(locale), locale);
    expect(empty).toEqual([]);
  });

  // nav.ts 只留结构，文案在字典里。两边靠 AdminNavKey 类型约束，
  // 但类型只管 key 存在、不管顺序与遗漏项，这条测试补上机械核对。
  it("ADMIN_NAV 的每一项在两种语言里都有对应文案", () => {
    for (const locale of locales) {
      const nav = getAdminDictionary(locale).shell.nav;
      for (const item of ADMIN_NAV) {
        expect(nav[item.key], `${locale} 缺少导航文案：${item.key}`).toBeTruthy();
      }
    }
  });

  it("字典里没有多余的导航文案（删了导航项要同步删文案）", () => {
    const navKeys = new Set(ADMIN_NAV.map((i) => i.key));
    for (const locale of locales) {
      for (const key of Object.keys(getAdminDictionary(locale).shell.nav)) {
        expect(navKeys.has(key as never), `${locale} 存在无对应导航项的文案：${key}`).toBe(true);
      }
    }
  });

  // 语言选项恒为该语言的自称：看不懂当前界面的用户正是最需要这个控件的人，
  // 把「English」翻成「英语」会让英文用户在满屏中文里找不到出口。
  it("语言选项在两种语言下都用自称", () => {
    for (const locale of locales) {
      const options = getAdminDictionary(locale).settings.language.options;
      expect(options.en).toBe("English");
      expect(options.zh).toBe("简体中文");
    }
  });
});
