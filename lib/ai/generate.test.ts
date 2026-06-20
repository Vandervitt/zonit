import { describe, it, expect, afterEach } from "vitest";
import { generateDraftFromBrief, rewriteText } from "@/lib/ai/generate";
import { setAiClient, resetAiClient } from "@/lib/ai/client";
import { TEMPLATES } from "@/landing-editor/samples/registry";

afterEach(() => resetAiClient());

describe("generateDraftFromBrief", () => {
  it("回填后产出合法 draft", async () => {
    setAiClient({
      async completeJson<T>(): Promise<T> {
        return { slots: [] } as unknown as T; // 空回填即沿用原文，结构仍合法
      },
    });
    const r = await generateDraftFromBrief(TEMPLATES[0].draft, { productName: "A", description: "B" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.draft.hero.title).toBeTruthy();
  });

  it("模型产出禁词 → 重试一次仍失败则返回错误", async () => {
    let calls = 0;
    setAiClient({
      async completeJson<T>(): Promise<T> {
        calls++;
        return { slots: [{ id: "hero.title", text: "立即购买 buy now" }] } as unknown as T;
      },
    });
    const r = await generateDraftFromBrief(TEMPLATES[0].draft, { productName: "A", description: "B" });
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
