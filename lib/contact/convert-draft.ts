// lib/contact/convert-draft.ts
// 旧 draft（link 裸字符串）→ 新 draft（contact 真源 + target 引用）。纯函数，迁移与测试共用。
//
// 硬规则：识别不了的落点一律转成 { kind: "url" } 原样保留。
// 同页出现第二个不同的 WhatsApp 号是合法状态（用户手改过其一），绝不归一 ——
// 那会静默改变客户正在投放的页面。宁可留一个没接入新模型的落点。
import type { CtaTarget, LandingPageDraft, LeadChannel, PageContact } from "@/types/schema.draft";
import { channelHref } from "./channel-href";
import type { LegacyCtaButton, LegacyDraft } from "./cta-inventory";

/**
 * 解码 URL 组件；解不开就原样返回。
 * 存量数据里的 ?text= 理论上都是合法编码，但迁移绝不能因为一个坏字符串就整批中止
 * —— 原样保留至少不会让链接变得更糟。
 */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * 从旧 link 反推渠道、规范化后的值，以及 WhatsApp 的预填消息；识别不了返回 null。
 *
 * 模板里全部 46 个 wa.me 链接都带 ?text= 预填（没有一个是纯号码），
 * 所以这个分支不是边界情况而是主路径——漏掉它等于对最重要的渠道白转一场。
 */
export function parseLegacyLink(link: string): { channel: LeadChannel; value: string; prefill?: string } | null {
  const v = link.trim();
  if (!v) return null;
  if (v === "#lead-form") return { channel: "form", value: "" };
  const wa = v.match(/^https:\/\/wa\.me\/(\d{7,15})(?:\?text=(.*))?$/i);
  if (wa) {
    // ?text= 是 URL 编码的；解码存进 schema，渲染时再编回去。
    // 存解码后的原文，是为了阶段 2 用户能在面板里直接读和改这句话。
    const prefill = wa[2] ? safeDecode(wa[2]) : undefined;
    return { channel: "whatsapp", value: `+${wa[1]}`, ...(prefill ? { prefill } : {}) };
  }
  const tel = v.match(/^tel:\+?([\d\s()-]{7,20})$/i);
  if (tel) return { channel: "phone", value: `+${tel[1].replace(/\D/g, "")}` };
  const mail = v.match(/^mailto:(.+@.+)$/i);
  if (mail) return { channel: "email", value: mail[1] };
  const tg = v.match(/^https:\/\/t\.me\/([A-Za-z][A-Za-z0-9_]{4,31})$/i);
  if (tg) return { channel: "telegram", value: tg[1] };
  return null;
}

/**
 * hero 链接被置空时，猜这张页面原本用的是哪个渠道。
 *
 * blankPrimaryCtaLinks 跳过锚点（isPageAnchor），所以空链接必然原本是深链、
 * 绝不可能是表单 —— 兜成 form 会解析出 #lead-form 而原值是空，等价性立刻破。
 * 故从 draft 里残留的其他深链推断，推不出则默认 whatsapp。
 *
 * 无论猜成哪个，值都留空，故解析结果恒为 null，等价性不受影响；
 * 真实值由用户在阶段 2 的联系方式面板里填。
 */
function inferBlankedChannel(legacy: LegacyDraft): LeadChannel {
  let found: LeadChannel | null = null;
  JSON.stringify(legacy, (k, v) => {
    if (k === "link" && typeof v === "string" && !found) {
      const parsed = parseLegacyLink(v);
      if (parsed && parsed.channel !== "form") found = parsed.channel;
    }
    return v;
  });
  return found ?? "whatsapp";
}

/** 已经转换过的 draft（有 contact、CTA 已是 target）。重复转换会读到 undefined 的 link 而崩。 */
export function isConverted(draft: unknown): boolean {
  return Boolean(draft && typeof draft === "object" && "contact" in draft);
}

export function convertDraft(legacy: LegacyDraft): LandingPageDraft {
  // 幂等：已转换的原样返回。迁移正常只跑一次（pgmigrations 表保证），
  // 但回滚记录后重跑、或对同一份数据跑两遍脚本时不该炸。
  if (isConverted(legacy)) return legacy as unknown as LandingPageDraft;

  const out = JSON.parse(JSON.stringify(legacy)) as Record<string, unknown> & {
    hero: Record<string, unknown>;
    footer: Record<string, unknown>;
    sections?: unknown;
  };

  // ① 主渠道：以 hero.cta.link 为准，空链接走上面的兜底
  const heroParsed = parseLegacyLink(legacy.hero.cta?.link ?? "");
  // 被置空的落点该挂到哪个深链渠道上（恒非 form）。主渠道推断与空落点回填共用它。
  const blankedChannel = inferBlankedChannel(legacy);
  const contact: PageContact = { primary: heroParsed?.channel ?? blankedChannel };
  if (heroParsed && heroParsed.channel !== "form") {
    contact[heroParsed.channel] = heroParsed.value;
  }

  // ② 页脚邮箱并入 contact（该字段随后删除）
  const footerEmail = (legacy.footer.contactEmail ?? "").trim();
  if (footerEmail && !contact.email) contact.email = footerEmail;

  // ③ 逐个落点转引用：只有与已收录渠道的值完全一致才转成引用，
  //    否则原样保留为 url —— 这就是「不强行归一」那条硬规则的落点
  const toTarget = (link: string): CtaTarget => {
    // 空链接是 blankPrimaryCtaLinks 置空的结果。不能转成空 url —— 那是永久死链，
    // 用户以后在联系方式面板里填了号码它也不会活过来。转成渠道引用后当前同样
    // 解析为 null（值还没填），但一填就自动生效。
    //
    // 注意必须挂到**非表单**渠道上：主渠道是表单时，{kind:"primary"} 会解析成
    // #lead-form，而原值是空 —— 那就把一个空按钮变成了能点的按钮，行为变了。
    // 置空只作用于非锚点链接，所以被置空的位置原本一定是深链，挂深链渠道才是对的。
    if (!link.trim()) {
      return contact.primary === "form"
        ? { kind: "channel", channel: blankedChannel }
        : { kind: "primary" };
    }
    const parsed = parseLegacyLink(link);
    if (!parsed) return { kind: "url", url: link };
    if (parsed.channel !== "form" && contact[parsed.channel] !== parsed.value) {
      return { kind: "url", url: link };
    }
    // 往返兜底：转成引用后再解析回来，若与原链接不是逐字节一致，就原样保留为 url。
    // 编码差异（%27 vs '）这类情况已由 channelHref 的严格编码处理，但生产数据里
    // 可能有手写的、编码方式不同的链接——那时宁可留一个未接入新模型的落点，
    // 也不要让一条奇怪的链接把整次部署卡死在等价性校验上。
    const roundTrip = channelHref(parsed.channel, parsed.value, parsed.prefill);
    if (roundTrip?.href !== link) return { kind: "url", url: link };
    // 预填消息跟着 CTA 走：同页每个按钮问的事不一样，这是 wa.me 深链最有价值的部分
    const prefill = parsed.prefill ? { prefill: parsed.prefill } : {};
    return parsed.channel === contact.primary
      ? { kind: "primary", ...prefill }
      : { kind: "channel", channel: parsed.channel, ...prefill };
  };

  const convertCta = (cta: LegacyCtaButton) => ({ text: cta.text, target: toTarget(cta.link ?? "") });

  // sections 里的 CTA 就地改写：加 target、删 link
  const visit = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== "object") return;
    const obj = node as Record<string, unknown>;
    if (typeof obj.text === "string" && typeof obj.link === "string") {
      obj.target = toTarget(obj.link);
      delete obj.link;
      return;
    }
    Object.values(obj).forEach(visit);
  };

  if (legacy.hero.cta) out.hero.cta = convertCta(legacy.hero.cta);
  if (legacy.hero.secondaryCta) out.hero.secondaryCta = convertCta(legacy.hero.secondaryCta);
  if (legacy.floatingButton) out.floatingButton = convertCta(legacy.floatingButton);
  visit(out.sections);
  delete out.footer.contactEmail;
  out.contact = contact;

  return out as unknown as LandingPageDraft;
}
