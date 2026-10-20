import { describe, it, expect } from "vitest";
import { THEMES, THEME_META, resolveTheme, type RendererTheme } from "./theme";
import { getAdminDictionary } from "@/lib/i18n/admin";

const FIELDS: (keyof RendererTheme)[] = [
  "accentGradient", "accentGradientHover", "accentShadow", "accentTextGradient",
  "accentText", "accentSoftBg", "accentSoftBorder", "accentSoftText", "accentIconBg", "glassCard",
];

describe("THEMES", () => {
  it("含 6 套主题", () => {
    expect(Object.keys(THEMES).sort()).toEqual(["amber", "blue", "rose", "slate", "teal", "violet"]);
  });
  it("每套 10 个字段均非空字符串", () => {
    for (const [id, theme] of Object.entries(THEMES)) {
      for (const f of FIELDS) {
        expect(typeof theme[f], `${id}.${f}`).toBe("string");
        expect(theme[f].length, `${id}.${f}`).toBeGreaterThan(0);
      }
    }
  });
});

describe("THEME_META", () => {
  it("6 条，每条有 id/swatch，且后台中英字典都有对应色卡名（名字不再写死在渲染器里）", () => {
    expect(THEME_META).toHaveLength(6);
    for (const m of THEME_META) {
      expect(m.id in THEMES).toBe(true);
      expect(m.swatch.length).toBeGreaterThan(0);
      for (const locale of ["en", "zh"] as const) {
        expect(getAdminDictionary(locale).editor.forms.branding.themes[m.id]?.length, `${locale}:${m.id}`).toBeGreaterThan(0);
      }
      expect(getAdminDictionary("en").editor.forms.branding.themes[m.id]).not.toMatch(/[\u4e00-\u9fff]/);
    }
  });
});

describe("resolveTheme", () => {
  it("命中对应主题", () => {
    expect(resolveTheme("rose")).toBe(THEMES.rose);
  });
  it("undefined 回退 teal", () => {
    expect(resolveTheme(undefined)).toBe(THEMES.teal);
  });
  it("未知 id 回退 teal", () => {
    // @ts-expect-error 测试非法输入
    expect(resolveTheme("nope")).toBe(THEMES.teal);
  });
});
