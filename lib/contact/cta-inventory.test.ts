import { describe, expect, it } from "vitest";
import { legacyCtaInventory, ctaInventory, type LegacyDraft } from "./cta-inventory";
import type { LandingPageDraft } from "@/types/schema.draft";

const legacyFooter = { brandName: "B", copyrightYear: "2026", contactEmail: "a@b.com", privacyPolicy: "/p", termsOfService: "/t" };
const nextFooter = { brandName: "B", copyrightYear: "2026", privacyPolicy: "/p", termsOfService: "/t" };

describe("CTA 清单提取", () => {
  it("旧 draft：按 (text, href) 收集固定落点", () => {
    const legacy = {
      hero: { title: "T", cta: { text: "Chat", link: "https://wa.me/8613800138000" } },
      sections: [],
      footer: legacyFooter,
      floatingButton: { text: "Float", link: "https://wa.me/8613800138000" },
    } as unknown as LegacyDraft;
    expect(legacyCtaInventory(legacy)).toEqual([
      "Chat https://wa.me/8613800138000",
      "Float https://wa.me/8613800138000",
    ]);
  });

  it("新 draft：经 resolveCtaHref 算出同样的集合", () => {
    const next = {
      contact: { primary: "whatsapp", whatsapp: "+8613800138000" },
      hero: { title: "T", cta: { text: "Chat", target: { kind: "primary" } } },
      sections: [],
      footer: nextFooter,
      floatingButton: { text: "Float", target: { kind: "primary" } },
    } as unknown as LandingPageDraft;
    expect(ctaInventory(next)).toEqual([
      "Chat https://wa.me/8613800138000",
      "Float https://wa.me/8613800138000",
    ]);
  });

  it("深入 sections 抓嵌套 CTA", () => {
    const legacy = {
      hero: { title: "T" },
      sections: [{ type: "plans", data: { items: [{ cta: { text: "Buy", link: "tel:+15551234567" } }] } }],
      footer: legacyFooter,
    } as unknown as LegacyDraft;
    expect(legacyCtaInventory(legacy)).toEqual(["Buy tel:+15551234567"]);
  });

  it("空链接的 CTA 两侧都记为空 href，保持可比", () => {
    const legacy = {
      hero: { title: "T", cta: { text: "Chat", link: "" } },
      sections: [],
      footer: legacyFooter,
    } as unknown as LegacyDraft;
    expect(legacyCtaInventory(legacy)).toEqual(["Chat "]);

    const next = {
      contact: { primary: "whatsapp" }, // 值为空 → 解析为 null
      hero: { title: "T", cta: { text: "Chat", target: { kind: "primary" } } },
      sections: [],
      footer: nextFooter,
    } as unknown as LandingPageDraft;
    expect(ctaInventory(next)).toEqual(["Chat "]);
  });

  it("排序后比较，遍历顺序变化不算差异", () => {
    const a = {
      hero: { title: "T", cta: { text: "B", link: "tel:+1" }, secondaryCta: { text: "A", link: "tel:+2" } },
      sections: [],
      footer: legacyFooter,
    } as unknown as LegacyDraft;
    expect(legacyCtaInventory(a)).toEqual(["A tel:+2", "B tel:+1"]);
  });
});
