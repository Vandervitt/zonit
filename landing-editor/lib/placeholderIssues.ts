// landing-editor/lib/placeholderIssues.ts
// 发布前拦截：草稿里若仍含模板自带的占位联系号码（假 WhatsApp 号），用户不替换成
// 真实号码就发布会「访客点了没人收、线索静默流失」。故把它纳入发布门槛。
import type { LandingPageDraft } from "@/types/schema.draft";

// 模板样例中反复出现的占位假号（US 格式 1555…，故意不可拨打）。新模板若引入新占位号，追加于此。
const PLACEHOLDER_CONTACTS = ["15551234567", "15553219876", "15557654321"];

/**
 * 草稿是否仍含模板占位联系号码。序列化整草稿匹配，覆盖 CTA / 悬浮按钮 / 各区块按钮等
 * 一切可能内嵌 wa.me 链接的位置，无需逐字段枚举。返回可读问题（为空即通过）。
 */
export function collectPlaceholderIssues(draft: LandingPageDraft): string[] {
  const serialized = JSON.stringify(draft);
  return PLACEHOLDER_CONTACTS.some((n) => serialized.includes(n))
    ? ["联系方式仍是模板占位号码（如 WhatsApp wa.me/1555…），请改成你的真实号码，否则收不到线索"]
    : [];
}
