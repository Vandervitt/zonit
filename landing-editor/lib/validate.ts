// landing-editor/lib/validate.ts
// 字段级格式校验。空值一律视为「未填」不报错；仅对已填内容校验格式。
// 单字段错误在表单行内展示；collectFieldIssues 聚合整页错误，供发布门槛（前端拦截 + 后端兜底）使用。
// 合规拦截呼应 CLAUDE.md 硬规则：落地页链接不得指向支付/结账/购物车/订单/订阅/退款等交易页。

import { SECTION_REGISTRY, type LandingPageDraft } from "@/types/schema.draft";

// 允许的非 http 链接协议（私域 / 通话 / 邮件）
const ALLOWED_SCHEMES = ["tel:", "mailto:", "whatsapp:", "sms:"];

// 交易语义关键词（用词边界匹配，降低 border/cartoon 等误报）
const TRANSACTION_PATTERN =
  /\b(checkout|cart|payments?|orders?|subscriptions?|subscribe|refunds?|cash-on-delivery|add-to-cart)\b/i;

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** 链接字段：允许 http(s) 绝对地址或 tel:/mailto:/whatsapp:/sms: 协议；拦截交易类链接。 */
export function validateLink(value: string): string | undefined {
  const v = value.trim();
  if (!v) return undefined;

  const isScheme = ALLOWED_SCHEMES.some((s) => v.toLowerCase().startsWith(s));
  if (!isScheme && !isHttpUrl(v)) {
    return "请输入合法链接（https://… 或 tel:/mailto:/whatsapp:）";
  }
  if (TRANSACTION_PATTERN.test(v)) {
    return "链接疑似交易页（结账/购物车/支付/订单/订阅/退款），落地页不允许";
  }
  return undefined;
}

/** 媒体 / 图片资源 URL：允许 http(s) 绝对地址或站内相对路径（/ 开头）。 */
export function validateMediaUrl(value: string): string | undefined {
  const v = value.trim();
  if (!v) return undefined;
  if (v.startsWith("/")) return undefined;
  if (!isHttpUrl(v)) return "请输入合法资源 URL（https://… 或 / 开头的站内路径）";
  return undefined;
}

/** 邮箱格式。 */
export function validateEmail(value: string): string | undefined {
  const v = value.trim();
  if (!v) return undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "请输入合法邮箱地址";
  return undefined;
}

// 字段键名 → 校验器映射，与各表单的行内校验保持一致：
// link（CtaButton / FloatingButton）、src（ImageRef / Media）、contactEmail（Footer）。
const FIELD_VALIDATORS: Record<string, (v: string) => string | undefined> = {
  link: validateLink,
  src: validateMediaUrl,
  contactEmail: validateEmail,
};

/** 递归收集 node 内所有字段格式错误，统一冠以区块标签前缀。 */
function walkFieldIssues(node: unknown, label: string, out: string[]): void {
  if (Array.isArray(node)) {
    for (const item of node) walkFieldIssues(item, label, out);
    return;
  }
  if (!node || typeof node !== "object") return;
  for (const [key, val] of Object.entries(node)) {
    if (typeof val === "string") {
      const msg = FIELD_VALIDATORS[key]?.(val);
      if (msg) out.push(`${label}：${msg}`);
    } else {
      walkFieldIssues(val, label, out);
    }
  }
}

/** 聚合整页字段级格式错误（去重）。空数组表示全部字段格式合法。 */
export function collectFieldIssues(draft: LandingPageDraft): string[] {
  const out: string[] = [];
  walkFieldIssues(draft.hero, "首屏", out);
  draft.sections.forEach((s) => walkFieldIssues(s.data, SECTION_REGISTRY[s.type]?.label ?? s.type, out));
  walkFieldIssues(draft.footer, "页脚", out);
  if (draft.floatingButton) walkFieldIssues(draft.floatingButton, "悬浮按钮", out);
  return [...new Set(out)];
}
