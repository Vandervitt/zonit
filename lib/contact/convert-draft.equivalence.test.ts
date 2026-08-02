// 阶段 1 的核心验收：52 套模板转换前后，CTA 的 (文案, href) 清单必须逐项相等。
//
// 输入是冻结 fixture（死数据，不随代码演进失效）。之所以必须冻结，是因为改造完成后
// 旧模型的读取代码就删了，测试再也没法「用旧代码算一遍」。
//
// 本文件失败时不要改测试 —— 失败说明 convertDraft 对某个落点转错了，去修转换器。
import { describe, expect, it } from "vitest";
import fixture from "@/test/fixtures/drafts-pre-contact.json";
import { convertDraft } from "./convert-draft";
import { ctaInventory, legacyCtaInventory, type LegacyDraft } from "./cta-inventory";

const entries = Object.entries(fixture as unknown as Record<string, LegacyDraft>);

describe("模板转换等价性", () => {
  it("fixture 覆盖全部 52 套模板", () => {
    expect(entries).toHaveLength(52);
  });

  it.each(entries)("%s 转换前后 CTA 清单一致", (_id, legacy) => {
    expect(ctaInventory(convertDraft(legacy))).toEqual(legacyCtaInventory(legacy));
  });
});
