import type { Slot, GenerationBrief, RewriteRequest } from "./types";

export function buildSystemPrompt(): string {
  return [
    "你是为「海外获客落地页」撰写营销文案的专家。",
    "规则（必须严格遵守）：",
    "1) 只产出 lead-generation（留资/咨询/预约/WhatsApp/电话/邮件）导向的文案；",
    "   严禁任何交易/电商语义：支付、购物车、下单、价格、订阅、退款、货到付款等一律禁止。",
    "2) 不得虚构证据：统计数字、具名好评、前后对比案例、医疗/金融/美容等高风险声称",
    "   不得编造；此类字段请输出中性占位文案，提示用户补充真实材料，避免「保证见效」类绝对化表述。",
    "3) 语气、目标客户、卖点、语言严格依据用户提供的 brief，不要跑题。",
    "4) 只填给定槽位的文案，保持每段长度与原文案量级接近，适配落地页排版。",
  ].join("\n");
}

export function buildFillUserPrompt(brief: GenerationBrief, slots: Slot[]): string {
  const briefLines = (
    [
      `产品/公司：${brief.productName}`,
      `介绍：${brief.description}`,
      brief.targetAudience ? `目标客户：${brief.targetAudience}` : false,
      brief.tone ? `语气：${brief.tone}` : false,
      brief.keyBenefits?.length ? `核心卖点：${brief.keyBenefits.join("；")}` : false,
      brief.ctaGoal ? `转化目标：${brief.ctaGoal}` : false,
      brief.language ? `语言：${brief.language}` : false,
      brief.pastedIntro ? `补充资料：${brief.pastedIntro}` : false,
    ] as (string | false)[]
  )
    .filter((x): x is string => Boolean(x))
    .join("\n");

  const slotLines = slots
    .map((s) => `- id="${s.id}" 字段="${s.label}" 原文="${s.text}"`)
    .join("\n");

  return [
    "【Brief】",
    briefLines,
    "",
    "【待填槽位】（为每个 id 产出贴合 brief 的新文案，保持语言一致）",
    slotLines,
    "",
    "返回 JSON：{ slots: [{ id, text }, ...] }，必须覆盖全部 id。",
  ].join("\n");
}

export function buildRewriteUserPrompt(req: RewriteRequest, n: number): string {
  return (
    [
      `请改写以下落地页「${req.field}」字段文案，产出 ${n} 个不同候选。`,
      req.instruction ? `要求：${req.instruction}` : false,
      req.brief?.productName ? `产品：${req.brief.productName}` : false,
      req.brief?.tone ? `语气：${req.brief.tone}` : false,
      `原文："${req.currentText}"`,
      "保持 lead-gen 导向、长度量级相近、与原文语言一致。",
      "返回 JSON：{ candidates: [string, ...] }。",
    ] as (string | false)[]
  )
    .filter((x): x is string => Boolean(x))
    .join("\n");
}

/** OpenAI Structured Outputs：槽位回填 schema。 */
export function slotFillJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      slots: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: { id: { type: "string" }, text: { type: "string" } },
          required: ["id", "text"],
        },
      },
    },
    required: ["slots"],
  } as const;
}

/** OpenAI Structured Outputs：改写候选 schema。 */
export function rewriteJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      candidates: { type: "array", items: { type: "string" } },
    },
    required: ["candidates"],
  } as const;
}
