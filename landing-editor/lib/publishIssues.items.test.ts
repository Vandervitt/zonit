import { describe, it, expect } from "vitest";
import { collectPublishIssueItems } from "./publishIssues";
import type { LandingPageDraft } from "@/types/schema.draft";

/** 结构合法的最小草稿（含一个 core-value 组区块），按需覆盖字段制造问题。 */
const base = (over: Partial<LandingPageDraft> = {}): LandingPageDraft =>
  ({
    hero: { title: "T", cta: { text: "Go", link: "https://wa.me/8613800138000" } },
    sections: [{ type: "features", data: { title: "F", items: [] } }],
    footer: {
      brandName: "B",
      copyrightYear: "2026",
      contactEmail: "hi@a.com",
      privacyPolicy: "p",
      termsOfService: "t",
    },
    ...over,
  }) as unknown as LandingPageDraft;

describe("collectPublishIssueItems 结构化校验项", () => {
  it("无问题时为空数组", () => {
    expect(collectPublishIssueItems(base())).toEqual([]);
  });

  it("首屏字段格式错误 → target 指向 hero 固定面板", () => {
    const items = collectPublishIssueItems(
      base({ hero: { title: "T", cta: { text: "Go", link: "not-a-url" } } } as never),
    );
    const hit = items.find((i) => i.message.startsWith("首屏"));
    expect(hit?.target).toEqual({ kind: "fixed", id: "hero" });
  });

  it("区块字段格式错误 → target 带该区块在 sections 中的序号", () => {
    const items = collectPublishIssueItems(
      base({
        sections: [
          { type: "features", data: { title: "F", items: [] } },
          { type: "gallery", data: { images: [{ src: "not a url", alt: "" }] } },
        ],
      } as never),
    );
    const hit = items.find((i) => i.target?.kind === "section");
    expect(hit?.target).toEqual({ kind: "section", index: 1 });
  });

  it("页脚邮箱错误 → target 指向 footer；悬浮按钮错误 → 指向 floatingButton", () => {
    const items = collectPublishIssueItems(
      base({
        footer: { brandName: "B", copyrightYear: "2026", contactEmail: "bad", privacyPolicy: "p", termsOfService: "t" },
        floatingButton: { link: "also-bad" },
      } as never),
    );
    expect(items.find((i) => i.message.startsWith("页脚"))?.target).toEqual({ kind: "fixed", id: "footer" });
    expect(items.find((i) => i.message.startsWith("悬浮按钮"))?.target).toEqual({ kind: "fixed", id: "floatingButton" });
  });

  it("首屏 CTA 为空（联系方式校验）→ target 指向 hero", () => {
    const items = collectPublishIssueItems(
      base({ hero: { title: "T", cta: { text: "Go", link: "" } } } as never),
    );
    const hit = items.find((i) => i.message.includes("CTA 按钮链接为空"));
    expect(hit?.target).toEqual({ kind: "fixed", id: "hero" });
  });

  it("结构类问题（缺必须模块）无 target", () => {
    const items = collectPublishIssueItems(base({ sections: [] }));
    const structural = items.find((i) => i.message.includes("需至少一个"));
    expect(structural).toBeDefined();
    expect(structural?.target).toBeUndefined();
  });

  it("与 collectPublishIssues 文案一一对应（同源保证）", async () => {
    const { collectPublishIssues } = await import("./publishIssues");
    const draft = base({ hero: { title: "T", cta: { text: "Go", link: "not-a-url" } }, sections: [] } as never);
    expect(collectPublishIssueItems(draft).map((i) => i.message)).toEqual(collectPublishIssues(draft));
  });
});
