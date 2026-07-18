// landing-editor/lib/contactIssues.ts
// 联系方式可达性：模板占位假号会让访客点了没人收、线索静默流失。两道防线：
//  1) 新建/AI 生成模板时 blankPlaceholderContacts 把占位联系链接置空 → 用户开局即被迫填真实联系方式；
//  2) 发布门槛 collectContactIssues 校验首屏主 CTA 非空（格式由 validate.ts 的 validateLink 负责），
//     并对遗留 / AI 生成页兜底扫占位号。
import type { LandingPageDraft } from "@/types/schema.draft";

// 模板样例反复出现的占位假号（US 格式 1555…，故意不可拨打）。新模板引入新占位号追加于此。
export const PLACEHOLDER_CONTACTS = ["15551234567", "15553219876", "15557654321"];

const hasPlaceholder = (s: string) => PLACEHOLDER_CONTACTS.some((n) => s.includes(n));

/** 递归把值含占位号的 link 字段置空（深拷贝，不改原对象）。用于模板实例化时清掉假联系链接。 */
export function blankPlaceholderContacts(draft: LandingPageDraft): LandingPageDraft {
  const clone = JSON.parse(JSON.stringify(draft)) as LandingPageDraft;
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (!node || typeof node !== "object") return;
    for (const [key, val] of Object.entries(node)) {
      if (key === "link" && typeof val === "string" && hasPlaceholder(val)) {
        (node as Record<string, unknown>).link = "";
      } else {
        walk(val);
      }
    }
  };
  walk(clone);
  return clone;
}

/** 发布门槛：首屏主 CTA 不得为空；并兜底扫占位号（遗留 / AI 生成页）。为空即通过。 */
export function collectContactIssues(draft: LandingPageDraft): string[] {
  const issues: string[] = [];

  const heroCtaLink = draft.hero?.cta?.link?.trim() ?? "";
  if (!heroCtaLink) {
    issues.push("首屏 CTA 按钮链接为空，访客点击无法联系你，请填入 WhatsApp / Telegram / tel: / 邮箱 等联系方式");
  }

  if (hasPlaceholder(JSON.stringify(draft))) {
    issues.push("联系方式仍是模板占位号码（如 WhatsApp wa.me/1555…），请改成你的真实号码，否则收不到线索");
  }

  return issues;
}
