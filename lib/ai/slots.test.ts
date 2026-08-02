import { describe, it, expect, beforeAll } from "vitest";
import { deriveSlots, mergeSlots } from "@/lib/ai/slots";
import type { FilledSlot } from "@/lib/ai/types";
import type { LandingPageDraft } from "@/types/schema.draft";
import { TEMPLATES } from "@/landing-editor/samples/registry";
import { loadTemplateDraft } from "@/landing-editor/samples/registry.drafts";

describe("deriveSlots / mergeSlots", () => {
  // 草稿体现按需异步加载，测试前一次性把全部模板草稿载入。
  let drafts: LandingPageDraft[];
  let draft0: LandingPageDraft;
  beforeAll(async () => {
    drafts = await Promise.all(TEMPLATES.map((t) => loadTemplateDraft(t.id)));
    draft0 = drafts[0];
  });

  it("round-trip：抽取再合并等于原 draft（所有模板）", () => {
    for (const draft of drafts) {
      const slots = deriveSlots(draft);
      const rebuilt = mergeSlots(draft, slots);
      expect(rebuilt).toEqual(draft);
    }
  });

  it("只抽文案，不抽图片/链接/类型等字段", () => {
    const slots = deriveSlots(draft0);
    const ids = slots.map((s) => s.id);
    expect(ids).toContain("hero.title");
    expect(ids.some((id) => id.endsWith(".src"))).toBe(false);
    expect(ids.some((id) => id.endsWith(".link"))).toBe(false);
    expect(ids.some((id) => id.endsWith(".type"))).toBe(false);
  });

  it("mergeSlots 写回新文案且不改原对象", () => {
    const draft = draft0;
    const slots = deriveSlots(draft);
    const merged = mergeSlots(draft, [{ id: slots[0].id, path: slots[0].path, label: slots[0].label, text: "新标题XYZ" }]);
    const titleSlot = deriveSlots(merged).find((s) => s.id === slots[0].id);
    expect(titleSlot?.text).toBe("新标题XYZ");
    expect(draft).toEqual(mergeSlots(draft, deriveSlots(draft)));
  });

  it("FilledSlot（仅 id+text，无 path）经 byId 映射回填——AI 返回的生产路径", () => {
    const draft = draft0;
    const slots = deriveSlots(draft);
    const filled: FilledSlot[] = [{ id: slots[0].id, text: "AI 写的标题" }];
    const merged = mergeSlots(draft, filled);
    const found = deriveSlots(merged).find((s) => s.id === slots[0].id);
    expect(found?.text).toBe("AI 写的标题");
  });

  // 回归：json_object 模式下模型偶发把值放在「字段 label」键（如 title）而非 schema 的 text 键，
  // 导致 f.text 为 undefined。此前 mergeSlots 直接写 undefined，JSON 序列化时该键被丢弃，
  // 段级必填 title 丢失 → 渲染 SectionHeading 崩溃白屏。修复后不得丢字段。
  it("模型把值错放到字段 label 键（title 而非 text）时，回收该值而非丢弃标题", () => {
    const draft = draft0;
    const heroTitle = deriveSlots(draft).find((s) => s.id === "hero.title")!;
    // 模型错误产物：{ id, title: "..." }（无 text）
    const malformed = [{ id: "hero.title", title: "错键但有值的标题" }] as unknown as FilledSlot[];
    const merged = mergeSlots(draft, malformed);
    const found = deriveSlots(merged).find((s) => s.id === "hero.title");
    expect(typeof found?.text).toBe("string");
    // 回收错键值；即便不回收，也绝不能变成 undefined/丢键
    expect(found?.text).toBe("错键但有值的标题");
    expect(found?.text).not.toBe(heroTitle.text); // 确实被改写
  });

  it("FilledSlot 的 text 缺失/非字符串时，保留原文而非写入 undefined 丢键", () => {
    const draft = draft0;
    const base = deriveSlots(draft).find((s) => s.id === "hero.title")!;
    const bad = [{ id: "hero.title" }] as unknown as FilledSlot[]; // 既无 text 也无可回收值
    const merged = mergeSlots(draft, bad);
    const found = deriveSlots(merged).find((s) => s.id === "hero.title");
    expect(found?.text).toBe(base.text); // 原文保留，键仍在
  });

  // 这类「按键名工作的黑名单」在渠道改造中已被 schema 改名静默击穿过三次
  // （validate.ts 的红线校验、LEAD_FORM_ANCHOR_ID 的 RSC 边界、本处）。
  // 守住它：AI 只能改营销文案，绝不能碰落点、枚举与结构。
  describe("渠道模型字段不得进入 AI 改写范围", () => {
    const draft = {
      contact: { primary: "whatsapp", whatsapp: "+8613800138000", email: "a@b.com" },
      hero: {
        title: "T",
        cta: { text: "Chat", target: { kind: "primary", prefill: "Hi, I'd like a quote" } },
        secondaryCta: { text: "IG", target: { kind: "url", url: "https://instagram.com/brand" } },
      },
      sections: [],
      footer: { brandName: "B", copyrightYear: "2026", privacyPolicy: "p", termsOfService: "t" },
    } as unknown as LandingPageDraft;

    it("主渠道枚举不可被改写——LLM 返回任意句子会让全页 CTA 解析失败", () => {
      expect(deriveSlots(draft).find((s) => s.id === "contact.primary")).toBeUndefined();
    });

    it("二级外链 URL 不可被改写", () => {
      expect(deriveSlots(draft).find((s) => s.id.endsWith("target.url"))).toBeUndefined();
    });

    it("号码与邮箱不可被改写", () => {
      const ids = deriveSlots(draft).map((s) => s.id);
      expect(ids).not.toContain("contact.whatsapp");
      expect(ids).not.toContain("contact.email");
    });

    it("prefill 反而应该被改写——它是给访客看的话术，本就该跟着 brief 走", () => {
      expect(deriveSlots(draft).find((s) => s.id === "hero.cta.target.prefill")?.text).toBe(
        "Hi, I'd like a quote",
      );
    });

    it("CTA 文案照常可被改写", () => {
      expect(deriveSlots(draft).find((s) => s.id === "hero.cta.text")?.text).toBe("Chat");
    });
  });
});
