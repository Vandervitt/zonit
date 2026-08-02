// lib/ai/brief-contact.ts
// 把 AI 成页 brief 里的「咨询渠道」多选落成结构化的 contact，而不只是喂 prompt。
//
// 改造前这个多选只 join 成 brief.ctaGoal 影响遣词：用户在向导里勾了「电话」，
// 生成出来的页面主渠道还是模板默认的 WhatsApp——问了却不算数。
//
// 只定主渠道，不填值：AI 编不出用户的真实号码，值由用户在联系方式面板里填，
// 发布门槛负责拦住没填的情况。
import type { LandingPageDraft, LeadChannel } from "@/types/schema.draft";

/**
 * 界面标签 → 渠道键。本表是标签的**唯一真源**：GenerateBriefDialog 的多选项
 * 由 CHANNEL_LABELS 派生，改标签只改这里，不会出现「勾了却不生效」的静默失配。
 */
const LABEL_TO_CHANNEL: Record<string, LeadChannel> = {
  WhatsApp: "whatsapp",
  Telegram: "telegram",
  电话: "phone",
  邮件: "email",
  在线留资表单: "form",
};

/** 多选项的展示顺序：表单排最后，与它在向导里的既有位置一致。 */
export const CHANNEL_LABELS = Object.keys(LABEL_TO_CHANNEL);

/**
 * 解析 brief.ctaGoal（顿号分隔的界面标签）为渠道键，保持勾选顺序。
 * 认不出的词直接丢弃——宁可少配一个渠道，也不要猜错用户的意思。
 */
export function parseBriefChannels(ctaGoal: string | undefined): LeadChannel[] {
  if (!ctaGoal?.trim()) return [];
  return ctaGoal
    .split("、")
    .map((label) => LABEL_TO_CHANNEL[label.trim()])
    .filter((c): c is LeadChannel => Boolean(c));
}

/**
 * 按 brief 的渠道勾选设定主渠道。深拷贝，不改原对象。
 *
 * 第一个勾选的成为主渠道——与联系方式面板「主渠道单选 + 其余就位」的语义一致。
 * 没勾或全认不出时保持模板默认：模板对「这个行业通常怎么接客户」的建议
 * 比一个空值有用。
 */
export function applyBriefChannels(
  draft: LandingPageDraft,
  ctaGoal: string | undefined,
): LandingPageDraft {
  const channels = parseBriefChannels(ctaGoal);
  if (channels.length === 0) return draft;

  const out = structuredClone(draft);
  out.contact.primary = channels[0];

  // 主渠道是表单却没启用表单，访客点了原地不动——发布门槛会拦，但那太晚了，
  // 用户在向导里明确选了表单，这里就该把它打开。
  if (channels.includes("form") && out.leadForm) {
    out.leadForm.enabled = true;
  }

  return out;
}
