import { describe, it, expect, afterEach } from "vitest";
import { generateDraftFromBrief, rewriteText } from "@/lib/ai/generate";
import { setAiClient, resetAiClient } from "@/lib/ai/client";
import { loadTemplateDraft } from "@/landing-editor/samples/registry.drafts";

afterEach(() => resetAiClient());

describe("generateDraftFromBrief", () => {
  it("回填后产出合法 draft", async () => {
    setAiClient({
      async completeJson<T>(): Promise<T> {
        return { slots: [] } as unknown as T; // 空回填即沿用原文，结构仍合法
      },
    });
    const r = await generateDraftFromBrief(await loadTemplateDraft(), { productName: "A", description: "B" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.draft.hero.title).toBeTruthy();
  });

  it("模型把值错放到字段 label 键（title 而非 text）时，段级标题不丢失", async () => {
    const template = await loadTemplateDraft("solar");
    // 复刻线上 Qwen(json_object) 偶发产物：整份回填都用「字段 label」当键，text 缺失。
    setAiClient({
      async completeJson<T>(_args: unknown): Promise<T> {
        const { deriveSlots } = await import("@/lib/ai/slots");
        const slots = deriveSlots(template).map((s) => {
          const key = String(s.path[s.path.length - 1]); // 末段字段名，如 title/subtitle/text
          return { id: s.id, [key]: `新·${s.text}` };
        });
        return { slots } as unknown as T;
      },
    });
    const r = await generateDraftFromBrief(template, { productName: "A", description: "B" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      // 段级必填 title 必须存在且已被改写，而非因错键写入 undefined 被丢弃
      for (const sec of r.draft.sections) {
        const data = sec.data as { title?: unknown };
        if ("title" in data) expect(typeof data.title === "string" || typeof data.title === "object").toBe(true);
      }
      const stats = r.draft.sections.find((s) => s.type === "stats");
      expect((stats?.data as { title?: string }).title).toMatch(/^新·/);
    }
  });

  it("模型产出禁词 → 重试一次仍失败则返回错误", async () => {
    let calls = 0;
    setAiClient({
      async completeJson<T>(): Promise<T> {
        calls++;
        return { slots: [{ id: "hero.title", text: "立即购买 buy now" }] } as unknown as T;
      },
    });
    const r = await generateDraftFromBrief(await loadTemplateDraft(), { productName: "A", description: "B" });
    expect(r.ok).toBe(false);
    expect(calls).toBe(2); // 首次 + 重试 1 次
  });
});

describe("rewriteText", () => {
  it("返回剔除禁词后的候选", async () => {
    setAiClient({
      async completeJson<T>(): Promise<T> {
        return { candidates: ["免费咨询", "buy now $9"] } as unknown as T;
      },
    });
    const out = await rewriteText({ sectionType: "hero", field: "title", currentText: "x" });
    expect(out.candidates).toEqual(["免费咨询"]);
  });
});
