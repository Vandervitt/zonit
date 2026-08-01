# 留资渠道通用化 · 阶段 1（地基）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 CTA 从「裸 URL 字符串」改成「页面级 `contact` 真源 + 引用」，且线上已发布页的渲染产物逐张不变。

**Architecture:** 新增 `PageContact` 到 draft 顶层；`CtaButton.link: string` 换成 `CtaButton.target: CtaTarget`；渲染时经 `resolveCtaHref(target, contact)` 算回 href。迁移在事务内转换存量数据并逐张自校验 `(text, href)` 集合等价，不等则抛错回滚。本阶段**不上线任何用户可见能力** —— `ContactForm` 面板属阶段 2。

**Tech Stack:** TypeScript / Next.js App Router / node-pg-migrate / vitest / Playwright

**设计文档:** `docs/refactor_20260801_留资渠道通用化/design.md`

---

## 关键约束（动手前必读）

1. **`migrations/` 由 `vercel-build` 自动执行** —— 迁移文件合并即在生产运行，没有人工 dry-run 窗口。安全性必须由迁移**自身的事务内校验**保证：任何一张页面转换后 `(text, href)` 集合与转换前不等，立刻 `throw`，事务回滚，部署失败，生产保持旧代码旧数据。
2. **生产 DB 连接串拿不到**（Vercel sensitive env，`vercel env pull` 不回值），所以无法用真实数据预演。这正是上一条设计的原因。
3. **迁移不得强行归一号码**：同页出现两个不同 WhatsApp 号是合法状态（用户手改过其一）。识别不了的落点一律转成 `{kind:"url"}` 原样保留。
4. **本阶段完成定义 = 什么都没变。** 任何「顺手改进」都属于越界，留到阶段 2。

## 任务顺序（有两处硬依赖，不可随意调整）

```
Task 0   构建管线（tsx）
Task 5   ← 必须最先跑数据导出：冻结 fixture 依赖「尚未改造」的代码状态，
            一旦 Task 2 改了类型就再也拿不到旧形状的 draft
Task 2   schema 类型      ← Task 1 依赖 LeadChannel，故类型先于实现
Task 1   共享拼装底座
Task 3 → 4 → 6 → 7 → 8 → 9 → 10 → 10b → 11 → 11b → 12
```

**Task 5 必须在 Task 2 之前执行。** 计划正文按主题排序便于阅读，执行请按上面的顺序。

## 文件结构

| 文件 | 职责 |
|---|---|
| `lib/contact/channel-href.ts` | 渠道 + 值 → `{href, external}`。落地页与后台一键联系共用的唯一拼装点 |
| `lib/contact/convert-draft.ts` | 旧 draft → 新 draft 的纯函数转换器。迁移与测试共用 |
| `lib/contact/cta-inventory.ts` | 从旧 / 新 draft 提取 `(text, href)` 集合。等价性判据的唯一实现 |
| `landing-renderer/lib/resolveCta.ts` | `CtaTarget` + `PageContact` → href。渲染期唯一解析点 |
| `types/schema.draft.ts` | 类型定义（修改） |
| `migrations/039_contact_channels.js` | 备份表 + 数据转换 + 事务内自校验 |
| `test/fixtures/drafts-pre-contact.json` | 冻结的转换前 draft 快照，等价性回归的输入 |

---

## Task 0: 让迁移能复用应用代码（前置阻塞项）

迁移目前用裸 `node` 执行（`package.json:13`），`.js` 迁移文件**无法 `require` TypeScript 转换器**。若不解决，只能把转换逻辑在迁移里抄一份 —— 两份实现迟早分叉，等价性保证随之作废。故先让迁移支持 TS。

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 装 tsx**

```bash
pnpm add -D tsx
```

- [ ] **Step 2: 三条 migrate 脚本改用 tsx 执行**

`package.json` 中把 `node -r dotenv/config` 替换为 `tsx -r dotenv/config`（三条 `migrate` / `migrate:up` / `migrate:down` 都改），并给 node-pg-migrate 加 `--tsconfig tsconfig.json`：

```json
"migrate:up": "DOTENV_CONFIG_PATH=.env.local tsx -r dotenv/config node_modules/node-pg-migrate/bin/node-pg-migrate.js up -m migrations -d DATABASE_URL_UNPOOLED --tsconfig tsconfig.json",
```

- [ ] **Step 3: 用现有迁移验证管线没坏**

```bash
npm run migrate:down 2>&1 | tail -3 && npm run migrate:up 2>&1 | tail -3
```

Expected: 038 往返成功。**这一步是关键** —— `vercel-build` 跑的就是 `migrate:up`，本地这条命令通过即证明生产构建路径可用。

- [ ] **Step 4: 提交**

```bash
git add package.json pnpm-lock.yaml
git commit -m "build: 迁移改用 tsx 执行，以便复用应用侧 TypeScript 代码"
```

> 这是本阶段唯一触碰构建管线的改动。它是必要的：没有它，迁移的正确性就只能靠一份抄写的副本来保证。

---

## Task 1: 共享链接拼装底座

**Files:**
- Create: `lib/contact/channel-href.ts`
- Create: `lib/contact/channel-href.test.ts`

> **依赖 Task 2**：本模块 import 的 `LeadChannel` 在 Task 2 定义。先做 Task 2 再回来做本任务。

- [ ] **Step 1: 写失败测试**

```ts
// lib/contact/channel-href.test.ts
import { describe, expect, it } from "vitest";
import { channelHref } from "./channel-href";

describe("channelHref", () => {
  it("wa.me 去掉 E.164 的 +", () => {
    expect(channelHref("whatsapp", "+8613800138000")).toEqual({
      href: "https://wa.me/8613800138000",
      external: true,
    });
  });

  it("tel / mailto 不开新窗", () => {
    expect(channelHref("phone", "+8613800138000")).toEqual({ href: "tel:+8613800138000", external: false });
    expect(channelHref("email", "a@b.com")).toEqual({ href: "mailto:a@b.com", external: false });
  });

  it("telegram 归一为裸用户名", () => {
    expect(channelHref("telegram", "@zapbridge")).toEqual({ href: "https://t.me/zapbridge", external: true });
    expect(channelHref("telegram", "https://t.me/zapbridge")).toEqual({ href: "https://t.me/zapbridge", external: true });
  });

  it("form 返回页内锚点", () => {
    expect(channelHref("form", "")).toEqual({ href: "#lead-form", external: false });
  });

  it("值缺失或格式非法一律返回 null，不产出死链", () => {
    expect(channelHref("whatsapp", "")).toBeNull();
    expect(channelHref("whatsapp", "13800138000")).toBeNull(); // 缺 +，不是 E.164
    expect(channelHref("phone", "not-a-number")).toBeNull();
    expect(channelHref("email", "no-at-sign")).toBeNull();
    expect(channelHref("telegram", "12345")).toBeNull(); // 纯数字是手机号不是用户名
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run lib/contact/channel-href.test.ts`
Expected: FAIL — `Failed to resolve import "./channel-href"`

- [ ] **Step 3: 实现**

```ts
// lib/contact/channel-href.ts
// 渠道 + 值 → 可点击链接（纯函数）。落地页 CTA 与后台「一键联系」共用的唯一拼装点。
//
// 之所以能这么简单，是因为写入侧已保证格式：号码一律 E.164、telegram 一律裸用户名
// （见 lib/leads/contact-format.ts）。这里只做拼接与拒绝，不做解析、不做猜测。
//
// 拼不出可靠链接一律返回 null —— 宁可不渲染这个按钮，也不要给访客一个拨错的号。
import { isE164, normalizeTelegram } from "@/lib/leads/contact-format";
import { LEAD_FORM_ANCHOR_ID } from "@/landing-renderer/sections/LeadForm";
import type { LeadChannel } from "@/types/schema.draft";

export interface ChannelHref {
  href: string;
  /** 外链需新开标签页；mailto / tel / 页内锚点交给浏览器处理，不开新窗。 */
  external: boolean;
}

export function channelHref(channel: LeadChannel, value: string): ChannelHref | null {
  switch (channel) {
    case "form":
      // 表单是页内锚点，与 value 无关；表单是否启用由校验层负责，不在这里判断
      return { href: `#${LEAD_FORM_ANCHOR_ID}`, external: false };
    case "whatsapp":
      // wa.me 只吃纯数字，须去掉 E.164 的 `+`
      return isE164(value) ? { href: `https://wa.me/${value.slice(1)}`, external: true } : null;
    case "phone":
      return isE164(value) ? { href: `tel:${value}`, external: false } : null;
    case "email":
      return value.includes("@") ? { href: `mailto:${value}`, external: false } : null;
    case "telegram": {
      const username = normalizeTelegram(value);
      return username ? { href: `https://t.me/${username}`, external: true } : null;
    }
  }
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run lib/contact/channel-href.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: 提交**

```bash
git add lib/contact/channel-href.ts lib/contact/channel-href.test.ts
git commit -m "feat: 新增渠道链接拼装底座，落地页与后台共用"
```

- [ ] **Step 6: 后台一键联系改用同一底座**

`lib/leads/contact-links.ts` 现在自己拼 `wa.me` / `tel:` / `mailto:` / `t.me`，与新底座重复。改为调用 `channelHref`，只保留「排序 + 中文 label + 降级为纯文本」这些后台专属职责：

```ts
import { channelHref } from "@/lib/contact/channel-href";

/** 渠道顺序按跟进成功率排：WhatsApp（海外主力、即时）→ 电话 → 邮件 → Telegram。 */
const ORDER = [
  { kind: "whatsapp", label: "WhatsApp" },
  { kind: "phone", label: "拨号" },
  { kind: "email", label: "邮件" },
  { kind: "telegram", label: "Telegram" },
] as const;

export function contactLinks(payload: LeadPayload): ContactLinks {
  const links: ContactLink[] = [];
  const plain: string[] = [];
  for (const { kind, label } of ORDER) {
    const value = payload[kind];
    if (!value) continue;
    const resolved = channelHref(kind, value);
    // 拼不出可靠链接的降级为纯文本 —— 宁可让客户自己复制，也不要给一个拨错的号
    if (resolved) links.push({ kind, label, href: resolved.href, external: resolved.external });
    else plain.push(`${kind}: ${value}`);
  }
  return { links, plain };
}
```

- [ ] **Step 7: 跑后台联系测试确认行为不变**

Run: `npx vitest run lib/leads/`
Expected: PASS，**断言一行不改** —— 这是纯重构，输出必须完全相同

- [ ] **Step 8: 提交**

```bash
git add lib/leads/contact-links.ts
git commit -m "refactor: 后台一键联系改用共享拼装底座，消除重复实现"
```

---

## Task 2: schema 类型

**Files:**
- Modify: `types/schema.draft.ts`

本任务只改类型，全仓会因此爆出大量类型错误 —— 这是预期的，后续任务逐个修好。**本任务不跑 `tsc`，也不提交前置校验**。

- [ ] **Step 1: 新增类型定义**

在 `types/schema.draft.ts` 的 `LeadContactField` 定义之后追加：

```ts
/** 留资渠道。form = 页内表单，其余 = 外部深链。 */
export type LeadChannel = "form" | "whatsapp" | "phone" | "email" | "telegram";

/** 即时通讯类渠道：悬浮按钮默认值的候选集（顺序即优先级）。 */
export const INSTANT_CHANNELS: LeadChannel[] = ["whatsapp", "phone", "telegram"];

/**
 * 页面联系方式：全页 CTA 的单一真源。
 *
 * 刻意扁平不嵌套 —— 形状与 lib/leads/validate.ts 的 LeadPayload 一致。
 * 表单的启用状态不在此重复表达，仍由 leadForm.enabled 负责：
 * 同一件事只能有一个地方能声明，否则两者迟早不一致。
 */
export interface PageContact {
  /** 主转化渠道。hero 主 CTA 与所有 target:"primary" 的 CTA 都指向它。 */
  primary: LeadChannel;
  /** 外部渠道的值。格式与线索侧同一套：号码 E.164、telegram 裸用户名。 */
  whatsapp?: string;
  phone?: string;
  email?: string;
  telegram?: string;
}

/** CTA 落点。渠道类落点不再存 URL，只存引用，渲染期由 resolveCtaHref 解析。 */
export type CtaTarget =
  | { kind: "primary" }
  | { kind: "channel"; channel: LeadChannel }
  | { kind: "url"; url: string };
```

- [ ] **Step 2: 改 `CtaButton`**

把原定义替换为：

```ts
/** 行动按钮（CTA）：文案 + 落点引用。 */
export interface CtaButton {
  text: string;
  /**
   * 按渠道的文案。切主渠道时由编辑器写进 text，渲染器不参与解析
   * —— 所见即所得，快照存的就是最终显示的字符串。
   * 阶段 1 一律留空，阶段 3 才为 52 套模板补齐。
   */
  textByChannel?: Partial<Record<LeadChannel, string>>;
  /** 用户手改过文案则为 true，之后切渠道不再覆盖。 */
  textEdited?: boolean;
  target: CtaTarget;
}
```

- [ ] **Step 3: 改 `FooterSection`，删掉 `contactEmail`**

```ts
export interface FooterSection {
  brandName: string;           // 品牌名称
  copyrightYear: string;       // 版权年份
  // contactEmail 已删除：它是 contact.email 的重复表达，正属本次要消灭的分散真源。
  // 页脚改为渲染 contact 中所有已填、且未在主 CTA / 悬浮按钮出现过的渠道。
  privacyPolicy: string;       // 隐私政策
  termsOfService: string;      // 服务条款
}
```

- [ ] **Step 4: 改 `FloatingButton` 与 draft 根**

```ts
export interface FloatingButton {
  text: string;
  target: CtaTarget;
}
```

`LandingPageDraft` 追加必填字段（放在 `hero` 之前，位置即表达「它是全页 CTA 的上游」）：

```ts
export interface LandingPageDraft {
  contact: PageContact;            // 必填，全页 CTA 的单一真源
  hero: HeroSection;
  // …其余不变
}
```

- [ ] **Step 5: 提交（类型先行，允许全仓类型错误）**

```bash
git add types/schema.draft.ts
git commit -m "refactor: draft schema 引入 PageContact 与 CtaTarget"
```

---

## Task 3: 渲染期解析器

**Files:**
- Create: `landing-renderer/lib/resolveCta.ts`
- Create: `landing-renderer/lib/resolveCta.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// landing-renderer/lib/resolveCta.test.ts
import { describe, expect, it } from "vitest";
import { resolveCtaHref } from "./resolveCta";
import type { PageContact } from "@/types/schema.draft";

const contact: PageContact = {
  primary: "whatsapp",
  whatsapp: "+8613800138000",
  email: "hi@brand.com",
};

describe("resolveCtaHref", () => {
  it("primary 跟随主渠道", () => {
    expect(resolveCtaHref({ kind: "primary" }, contact)?.href).toBe("https://wa.me/8613800138000");
  });

  it("channel 钉死指定渠道", () => {
    expect(resolveCtaHref({ kind: "channel", channel: "email" }, contact)?.href).toBe("mailto:hi@brand.com");
  });

  it("url 原样返回，不做任何加工", () => {
    const url = "https://instagram.com/brand?utm_source=lp";
    expect(resolveCtaHref({ kind: "url", url }, contact)).toEqual({ href: url, external: true });
  });

  it("primary 是 form 时解析为页内锚点", () => {
    expect(resolveCtaHref({ kind: "primary" }, { primary: "form" })?.href).toBe("#lead-form");
  });

  it("引用的渠道没填值时返回 null（该 CTA 不渲染，而非死链）", () => {
    expect(resolveCtaHref({ kind: "channel", channel: "telegram" }, contact)).toBeNull();
    expect(resolveCtaHref({ kind: "primary" }, { primary: "phone" })).toBeNull();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run landing-renderer/lib/resolveCta.test.ts`
Expected: FAIL — 模块不存在

- [ ] **Step 3: 实现**

```ts
// landing-renderer/lib/resolveCta.ts
// CTA 落点解析：CtaTarget + PageContact → 可点击链接。渲染期唯一解析点。
//
// 返回 null 表示「这个按钮渲染不出来」（引用的渠道没填值），调用方应当不渲染它，
// 而不是渲染 href="" 的死按钮 —— 访客点了原地不动比没有按钮更糟。
import { channelHref, type ChannelHref } from "@/lib/contact/channel-href";
import type { CtaTarget, LeadChannel, PageContact } from "@/types/schema.draft";

/** 取某渠道在该页面上配置的值。form 没有值，交给 channelHref 处理。 */
function channelValue(contact: PageContact, channel: LeadChannel): string {
  return channel === "form" ? "" : (contact[channel] ?? "");
}

export function resolveCtaHref(target: CtaTarget, contact: PageContact): ChannelHref | null {
  switch (target.kind) {
    case "url":
      // 二级外链（Instagram / 官网等）原样返回，不做归一也不做校验
      // —— 格式合法性由编辑期的 validateLink 负责，渲染期不重复判断
      return target.url.trim() ? { href: target.url, external: true } : null;
    case "primary":
      return channelHref(contact.primary, channelValue(contact, contact.primary));
    case "channel":
      return channelHref(target.channel, channelValue(contact, target.channel));
  }
}

/** 该 CTA 最终指向哪个渠道（埋点用）。url 类落点归为 external。 */
export function resolveCtaChannel(target: CtaTarget, contact: PageContact): LeadChannel | "external" {
  if (target.kind === "url") return "external";
  return target.kind === "primary" ? contact.primary : target.channel;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run landing-renderer/lib/resolveCta.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: 提交**

```bash
git add landing-renderer/lib/resolveCta.ts landing-renderer/lib/resolveCta.test.ts
git commit -m "feat: 新增 CTA 落点解析器"
```

---

## Task 4: CTA 清单提取（等价性判据）

这是整个阶段最重要的一个模块：迁移的正确性、回归测试、回滚对照全部依赖它。

**Files:**
- Create: `lib/contact/cta-inventory.ts`
- Create: `lib/contact/cta-inventory.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// lib/contact/cta-inventory.test.ts
import { describe, expect, it } from "vitest";
import { legacyCtaInventory, ctaInventory } from "./cta-inventory";

describe("CTA 清单提取", () => {
  it("旧 draft：按 (text, href) 收集，顺序无关", () => {
    const legacy = {
      hero: { title: "T", cta: { text: "Chat", link: "https://wa.me/8613800138000" } },
      sections: [],
      footer: { brandName: "B", copyrightYear: "2026", contactEmail: "a@b.com", privacyPolicy: "/p", termsOfService: "/t" },
      floatingButton: { text: "Chat", link: "https://wa.me/8613800138000" },
    };
    expect(legacyCtaInventory(legacy as never)).toEqual([
      "Chat https://wa.me/8613800138000",
      "Chat https://wa.me/8613800138000",
    ]);
  });

  it("新 draft：经 resolveCtaHref 算出同样的集合", () => {
    const next = {
      contact: { primary: "whatsapp" as const, whatsapp: "+8613800138000" },
      hero: { title: "T", cta: { text: "Chat", target: { kind: "primary" as const } } },
      sections: [],
      footer: { brandName: "B", copyrightYear: "2026", privacyPolicy: "/p", termsOfService: "/t" },
      floatingButton: { text: "Chat", target: { kind: "primary" as const } },
    };
    expect(ctaInventory(next as never)).toEqual([
      "Chat https://wa.me/8613800138000",
      "Chat https://wa.me/8613800138000",
    ]);
  });

  it("空链接的 CTA 两侧都记为 null href，保持可比", () => {
    const legacy = { hero: { title: "T", cta: { text: "Chat", link: "" } }, sections: [], footer: { brandName: "B", copyrightYear: "2026", contactEmail: "", privacyPolicy: "/p", termsOfService: "/t" } };
    expect(legacyCtaInventory(legacy as never)).toEqual(["Chat "]);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run lib/contact/cta-inventory.test.ts`
Expected: FAIL — 模块不存在

- [ ] **Step 3: 实现**

```ts
// lib/contact/cta-inventory.ts
// 从 draft 里提取全部 CTA 的 (文案, 最终 href) 清单 —— 迁移正确性的唯一判据。
//
// 迁移做的事只有「换一种方式表达同一个链接」，所以只要转换前后这张清单逐项相等，
// 页面对访客而言就是完全没变。这个判据可以对全部数据自动跑，不依赖人眼看页面。
//
// 排序后比较：转换不改变 CTA 的数量与内容，但不保证遍历顺序稳定，
// 排序可以把「顺序变了」这种无害差异排除在外。
import { resolveCtaHref } from "@/landing-renderer/lib/resolveCta";
import type { CtaButton, LandingPageDraft } from "@/types/schema.draft";

/** 转换前的 draft 形状（link 为裸字符串）。仅迁移与 fixture 测试使用。 */
export interface LegacyCtaButton {
  text: string;
  link: string;
}
export interface LegacyDraft {
  hero: { cta?: LegacyCtaButton; secondaryCta?: LegacyCtaButton; [k: string]: unknown };
  sections: { type: string; data: Record<string, unknown> }[];
  footer: { contactEmail?: string; [k: string]: unknown };
  floatingButton?: LegacyCtaButton;
  [k: string]: unknown;
}

/** 文案与 href 用 NUL 拼接：任何一侧变化都会让整项不等，且不可能与内容冲突。 */
const key = (text: string, href: string | null) => `${text} ${href ?? ""}`;

/** 遍历 sections，取出所有形如 { text, link } 或 { text, target } 的 CTA。 */
function walkSectionCtas<T>(sections: { data: Record<string, unknown> }[], pick: (cta: T) => string): string[] {
  const out: string[] = [];
  const visit = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== "object") return;
    const obj = node as Record<string, unknown>;
    if (typeof obj.text === "string" && ("link" in obj || "target" in obj)) out.push(pick(obj as T));
    Object.values(obj).forEach(visit);
  };
  sections.forEach((s) => visit(s.data));
  return out;
}

/** 转换前：href 就是 link 字段本身。 */
export function legacyCtaInventory(draft: LegacyDraft): string[] {
  const out: string[] = [];
  const add = (cta?: LegacyCtaButton) => { if (cta) out.push(key(cta.text, cta.link)); };
  add(draft.hero.cta);
  add(draft.hero.secondaryCta);
  add(draft.floatingButton);
  out.push(...walkSectionCtas<LegacyCtaButton>(draft.sections, (c) => key(c.text, c.link)));
  return out.sort();
}

/** 转换后：href 由 resolveCtaHref 从 contact 算出。 */
export function ctaInventory(draft: LandingPageDraft): string[] {
  const out: string[] = [];
  const add = (cta?: CtaButton) => {
    if (cta) out.push(key(cta.text, resolveCtaHref(cta.target, draft.contact)?.href ?? null));
  };
  add(draft.hero.cta);
  add(draft.hero.secondaryCta);
  add(draft.floatingButton);
  out.push(...walkSectionCtas<CtaButton>(
    draft.sections as unknown as { data: Record<string, unknown> }[],
    (c) => key(c.text, resolveCtaHref(c.target, draft.contact)?.href ?? null),
  ));
  return out.sort();
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run lib/contact/cta-inventory.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: 提交**

```bash
git add lib/contact/cta-inventory.ts lib/contact/cta-inventory.test.ts
git commit -m "feat: 新增 CTA 清单提取，作为迁移等价性判据"
```

---

## Task 5: 冻结 fixture

阶段 1 结束后旧模型的读取代码即删除，等价性测试无法再「用旧代码算一遍」。必须先把转换前的 draft 冻结成死数据。

**Files:**
- Create: `scripts/freeze-draft-fixture.ts`
- Create: `test/fixtures/drafts-pre-contact.json`

- [ ] **Step 1: 写导出脚本**

```ts
// scripts/freeze-draft-fixture.ts
// 把改造前的 52 套模板 draft 冻结成 JSON，供等价性回归与回滚对照使用。
// 只跑一次（在 Task 2 改类型之前的代码状态下），产物进 git 后不再重新生成。
//
// 用法：npx tsx scripts/freeze-draft-fixture.ts
import { writeFileSync, mkdirSync } from "node:fs";
import { TEMPLATES } from "../landing-editor/samples/registry";
import { loadTemplateDraft } from "../landing-editor/samples/registry.drafts";

async function main() {
  const out: Record<string, unknown> = {};
  for (const t of TEMPLATES) out[t.id] = await loadTemplateDraft(t.id);
  mkdirSync("test/fixtures", { recursive: true });
  writeFileSync("test/fixtures/drafts-pre-contact.json", JSON.stringify(out, null, 2));
  console.log(`冻结 ${Object.keys(out).length} 套模板 draft`);
}
main();
```

- [ ] **Step 2: 直接执行（此时代码尚未改造，无需任何 git 体操）**

```bash
npx tsx scripts/freeze-draft-fixture.ts
```

Expected: 输出 `冻结 52 套模板 draft`，生成 `test/fixtures/drafts-pre-contact.json`

> 这就是 Task 5 必须排在 Task 2 之前的原因：一旦 schema 改了，就再也拿不到旧形状的 draft 了。若不慎已经改了类型才想起来跑，不要用 `git stash` 硬凑 —— 回退到 Task 0 的提交重新开始，代价比调试一份形状可疑的 fixture 小得多。

> `loadTemplateDraft` 会经 `blankPrimaryCtaLinks` 置空 hero / floating 的 link。这是对的 —— fixture 要反映用户实际拿到的 draft，不是模板文件里的原始值。

- [ ] **Step 3: 核对产物**

Run: `node -e "const d=require('./test/fixtures/drafts-pre-contact.json');console.log(Object.keys(d).length, typeof d.dental.hero.cta.link)"`
Expected: `52 string`

- [ ] **Step 4: 提交**

```bash
git add scripts/freeze-draft-fixture.ts test/fixtures/drafts-pre-contact.json
git commit -m "chore: 冻结改造前的模板 draft 快照供等价性回归"
```

---

## Task 6: draft 转换器

**Files:**
- Create: `lib/contact/convert-draft.ts`
- Create: `lib/contact/convert-draft.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// lib/contact/convert-draft.test.ts
import { describe, expect, it } from "vitest";
import { convertDraft } from "./convert-draft";
import type { LegacyDraft } from "./cta-inventory";

const base = {
  sections: [],
  footer: { brandName: "B", copyrightYear: "2026", contactEmail: "hi@b.com", privacyPolicy: "/p", termsOfService: "/t" },
};

describe("convertDraft", () => {
  it("从 hero.cta.link 推断主渠道并收录号码", () => {
    const out = convertDraft({ ...base, hero: { cta: { text: "Chat", link: "https://wa.me/8613800138000" } } } as LegacyDraft);
    expect(out.contact.primary).toBe("whatsapp");
    expect(out.contact.whatsapp).toBe("+8613800138000");
    expect(out.hero.cta.target).toEqual({ kind: "primary" });
  });

  it("footer.contactEmail 收进 contact.email", () => {
    const out = convertDraft({ ...base, hero: { cta: { text: "C", link: "#lead-form" } } } as LegacyDraft);
    expect(out.contact.primary).toBe("form");
    expect(out.contact.email).toBe("hi@b.com");
    expect("contactEmail" in out.footer).toBe(false);
  });

  it("二级外链转成 url 落点", () => {
    const out = convertDraft({
      ...base,
      hero: { cta: { text: "C", link: "#lead-form" }, secondaryCta: { text: "IG", link: "https://instagram.com/b" } },
    } as LegacyDraft);
    expect(out.hero.secondaryCta?.target).toEqual({ kind: "url", url: "https://instagram.com/b" });
  });

  it("同页第二个不同的 WhatsApp 号不归一，原样保留为 url", () => {
    const out = convertDraft({
      ...base,
      hero: { cta: { text: "C", link: "https://wa.me/8613800138000" } },
      floatingButton: { text: "F", link: "https://wa.me/8618900000000" },
    } as LegacyDraft);
    expect(out.contact.whatsapp).toBe("+8613800138000");
    expect(out.floatingButton?.target).toEqual({ kind: "url", url: "https://wa.me/8618900000000" });
  });

  // blankPrimaryCtaLinks 跳过锚点，故空链接必然原本是深链，绝不可能是表单。
  // 若兜底成 form 会解析出 #lead-form（原本是空），等价性立刻破。
  it("hero.cta.link 为空时兜底为值为空的渠道，绝不兜成 form", () => {
    const out = convertDraft({ ...base, hero: { cta: { text: "C", link: "" } }, leadForm: { enabled: true } } as LegacyDraft);
    expect(out.contact.primary).toBe("whatsapp");
    expect(out.contact.whatsapp).toBeUndefined();
  });

  it("空链接时从残留链接推断渠道类型", () => {
    const out = convertDraft({
      ...base,
      hero: { cta: { text: "C", link: "" } },
      sections: [{ type: "plans", data: { items: [{ cta: { text: "Call", link: "tel:+15551234567" } }] } }],
    } as unknown as LegacyDraft);
    expect(out.contact.primary).toBe("phone");
    expect(out.contact.phone).toBeUndefined();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run lib/contact/convert-draft.test.ts`
Expected: FAIL — 模块不存在

- [ ] **Step 3: 实现**

```ts
// lib/contact/convert-draft.ts
// 旧 draft（link 裸字符串）→ 新 draft（contact 真源 + target 引用）。纯函数，迁移与测试共用。
//
// 硬规则：识别不了的落点一律转成 { kind: "url" } 原样保留。
// 同页出现第二个不同的 WhatsApp 号是合法状态（用户手改过其一），绝不归一
// —— 那会静默改变客户正在投放的页面。宁可留一个没接入新模型的落点。
import type { CtaTarget, LandingPageDraft, LeadChannel, PageContact } from "@/types/schema.draft";
import type { LegacyCtaButton, LegacyDraft } from "./cta-inventory";

/** 从旧 link 反推渠道与规范化后的值；识别不了返回 null。 */
export function parseLegacyLink(link: string): { channel: LeadChannel; value: string } | null {
  const v = link.trim();
  if (!v) return null;
  if (v === "#lead-form") return { channel: "form", value: "" };
  const wa = v.match(/^https:\/\/wa\.me\/(\d{7,15})$/i);
  if (wa) return { channel: "whatsapp", value: `+${wa[1]}` };
  const tel = v.match(/^tel:(\+?[\d\s()-]{7,20})$/i);
  if (tel) return { channel: "phone", value: `+${tel[1].replace(/\D/g, "")}` };
  const mail = v.match(/^mailto:(.+@.+)$/i);
  if (mail) return { channel: "email", value: mail[1] };
  const tg = v.match(/^https:\/\/t\.me\/([A-Za-z][A-Za-z0-9_]{4,31})$/i);
  if (tg) return { channel: "telegram", value: tg[1] };
  return null;
}

/**
 * hero 链接被置空时，猜这张页面原本用的是哪个渠道。
 * 从 draft 里残留的其他深链推断（置空只清 hero 与 floating 两处）；推不出则默认
 * whatsapp —— 52 套模板里 39 套被置空的原本都是它。
 * 注意：无论猜成哪个，值都留空，故解析结果恒为 null，等价性不受影响。
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

export function convertDraft(legacy: LegacyDraft): LandingPageDraft {
  const clone = JSON.parse(JSON.stringify(legacy)) as Record<string, never>;

  // ① 主渠道：以 hero.cta.link 为准。
  //    空链接是 blankPrimaryCtaLinks 置空的结果，而它跳过锚点，所以空链接必然
  //    原本是深链、绝不可能是表单 —— 兜成 form 会解析出 #lead-form 而原值是空，
  //    等价性立刻破。故兜底为「值为空的渠道」，解析结果同样是 null。
  const heroLink = (legacy.hero.cta?.link ?? "").trim();
  const heroParsed = parseLegacyLink(heroLink);
  const contact: PageContact = {
    primary: heroParsed?.channel ?? inferBlankedChannel(legacy),
  };
  if (heroParsed && heroParsed.channel !== "form") {
    contact[heroParsed.channel] = heroParsed.value;
  }
  // ② 页脚邮箱并入 contact（该字段随后删除）
  const footerEmail = (legacy.footer.contactEmail ?? "").trim();
  if (footerEmail && !contact.email) contact.email = footerEmail;

  // ③ 逐个落点转引用：与已收录渠道的值完全一致才转成引用，否则原样保留为 url
  const toTarget = (link: string): CtaTarget => {
    const parsed = parseLegacyLink(link);
    if (!parsed) return { kind: "url", url: link };
    const known = parsed.channel === "form" ? "" : contact[parsed.channel];
    if (parsed.channel !== "form" && known !== parsed.value) return { kind: "url", url: link };
    return parsed.channel === contact.primary ? { kind: "primary" } : { kind: "channel", channel: parsed.channel };
  };

  const convertCta = (cta: LegacyCtaButton) => {
    const next = { text: cta.text, target: toTarget(cta.link) };
    return next;
  };

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

  const out = clone as unknown as Record<string, unknown> & { hero: Record<string, unknown>; footer: Record<string, unknown> };
  if (legacy.hero.cta) out.hero.cta = convertCta(legacy.hero.cta);
  if (legacy.hero.secondaryCta) out.hero.secondaryCta = convertCta(legacy.hero.secondaryCta);
  if (legacy.floatingButton) out.floatingButton = convertCta(legacy.floatingButton);
  visit(out.sections);
  delete out.footer.contactEmail;
  out.contact = contact;

  return out as unknown as LandingPageDraft;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run lib/contact/convert-draft.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: 提交**

```bash
git add lib/contact/convert-draft.ts lib/contact/convert-draft.test.ts
git commit -m "feat: 新增 draft 渠道模型转换器"
```

---

## Task 7: 全库等价性回归

**Files:**
- Create: `lib/contact/convert-draft.equivalence.test.ts`

- [ ] **Step 1: 写测试（此时应当直接通过 —— 前面的实现若正确）**

```ts
// lib/contact/convert-draft.equivalence.test.ts
// 阶段 1 的核心验收：52 套模板转换前后，CTA 的 (文案, href) 清单必须逐项相等。
// 输入是冻结 fixture（死数据），不随代码演进失效。
import { describe, expect, it } from "vitest";
import fixture from "@/test/fixtures/drafts-pre-contact.json";
import { convertDraft } from "./convert-draft";
import { ctaInventory, legacyCtaInventory, type LegacyDraft } from "./cta-inventory";

const entries = Object.entries(fixture as Record<string, LegacyDraft>);

describe("模板转换等价性", () => {
  it("fixture 覆盖全部 52 套模板", () => {
    expect(entries).toHaveLength(52);
  });

  it.each(entries)("%s 转换前后 CTA 清单一致", (_id, legacy) => {
    expect(ctaInventory(convertDraft(legacy))).toEqual(legacyCtaInventory(legacy));
  });
});
```

- [ ] **Step 2: 跑测试**

Run: `npx vitest run lib/contact/convert-draft.equivalence.test.ts`
Expected: PASS (53 tests)

若有模板失败，**不要修改测试** —— 失败说明 `convertDraft` 对该模板的某个落点转错了，回 Task 6 修实现。把失败模板的 id 与差异记进 `docs/refactor_20260801_留资渠道通用化/test-results.md`。

- [ ] **Step 3: 提交**

```bash
git add lib/contact/convert-draft.equivalence.test.ts
git commit -m "test: 全库模板转换等价性回归"
```

---

## Task 8: 模板批量转换

**Files:**
- Create: `scripts/convert-template-drafts.ts`
- Modify: `landing-editor/samples/*Draft.ts`（52 个文件）

- [ ] **Step 1: 写转换脚本**

```ts
// scripts/convert-template-drafts.ts
// 把 52 套模板样稿从 { text, link } 改写成 { text, target }。
// 只跑一次；产物提交后脚本保留作为改造记录。
//
// 用法：npx tsx scripts/convert-template-drafts.ts
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const DIR = "landing-editor/samples";
for (const file of readdirSync(DIR).filter((f) => f.endsWith("Draft.ts"))) {
  const path = `${DIR}/${file}`;
  let src = readFileSync(path, "utf8");
  // 常量引用：link: WHATSAPP → target: { kind: "primary" }
  src = src.replace(/link:\s*(WHATSAPP|FORM|FORM_ANCHOR|PHONE|MAILTO)\b/g, 'target: { kind: "primary" }');
  // 字面量 URL（二级外链）→ url 落点
  src = src.replace(/link:\s*"([^"]*)"/g, (_m, url) => `target: { kind: "url", url: "${url}" }`);
  writeFileSync(path, src);
}
console.log("转换完成，请人工核对 hero.cta 与 floatingButton 的 target");
```

- [ ] **Step 2: 执行并人工核对**

Run: `npx tsx scripts/convert-template-drafts.ts && npx tsc --noEmit 2>&1 | head -30`

脚本无法自动判断的两件事必须人工处理：

1. **每套模板补 `contact` 字段**。取原本 `WHATSAPP` / `FORM` 常量的值填进去，`primary` 取 hero.cta 原本指向的渠道。
2. **`floatingButton.target`**：原本指向 WhatsApp 的转成 `{ kind: "channel", channel: "whatsapp" }`（不是 `primary` —— 阶段 2 用户可能把主渠道改成表单，届时悬浮按钮应当仍是 WhatsApp）。

- [ ] **Step 3: 跑结构回归**

Run: `npx vitest run landing-editor/samples/templates.structure.test.ts`
Expected: PASS —— 若报「标了 form 却没有 leadForm」之类，说明某套模板的 `contact.primary` 填错了

- [ ] **Step 4: 提交**

```bash
git add scripts/convert-template-drafts.ts landing-editor/samples/
git commit -m "refactor: 52 套模板样稿改用渠道引用"
```

---

## Task 9: 渲染器改造

**Files:**
- Modify: `landing-renderer/primitives/Cta.tsx`
- Modify: `landing-renderer/sections/Hero.tsx`
- Modify: `landing-renderer/sections/Plans.tsx`
- Modify: `landing-renderer/sections/FloatingButton.tsx`
- Modify: `landing-renderer/sections/Footer.tsx`
- Modify: `landing-renderer/LandingPage.tsx`

渲染器是服务端组件树，用不了 React context，故 `contact` 走 props 透传。所幸 `<Cta>` 只有 `Hero` 与 `Plans` 两个使用者（共 7 处），改造面很小。

- [ ] **Step 1: 改 `Cta.tsx`**

```tsx
// landing-renderer/primitives/Cta.tsx
import type { CtaButton, PageContact } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { resolveCtaHref, resolveCtaChannel } from "../lib/resolveCta";

/** 不完整按钮缺失项的提示文案（预览占位用）。 */
export function missingCtaLabel(cta: CtaButton, contact: PageContact): string {
  const parts = [
    !resolveCtaHref(cta.target, contact) && "联系方式未填",
    !cta.text?.trim() && "文案未填",
  ].filter(Boolean);
  return `${parts.join("、")} · 线上不显示`;
}

export function Cta({ cta, contact, theme, variant = "primary", preview = false }: { cta: CtaButton; contact: PageContact; theme: RendererTheme; variant?: "primary" | "secondary"; preview?: boolean }) {
  const resolved = resolveCtaHref(cta.target, contact);
  // 落点解析不出或文案为空：线上不渲染（避免 href="" 死按钮）；预览渲染不可点击的虚线占位，
  // 让用户在编辑时看得到按钮位置，同时明确知道「未填完整、发布后不会出现」。
  if (!resolved || !cta.text?.trim()) {
    if (!preview) return null;
    return (
      <span className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-700">
        {cta.text?.trim() || "CTA 按钮"}
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium">{missingCtaLabel(cta, contact)}</span>
      </span>
    );
  }
  // 埋点渠道不再从 URL 反推 —— 现在是显式的，inferChannel 那套字符串前缀匹配可以退休了
  const dataCta = resolveCtaChannel(cta.target, contact);
  if (variant === "secondary") {
    return (
      <a href={resolved.href} data-cta={dataCta} className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
        {cta.text}
      </a>
    );
  }
  return (
    <a href={resolved.href} data-cta={dataCta} className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-white transition ${theme.accentGradient} ${theme.accentGradientHover} ${theme.accentShadow}`}>
      {cta.text}
    </a>
  );
}
```

- [ ] **Step 2: 透传 `contact`**

`LandingPage.tsx` 把 `page.contact` 传给 `Hero` / `Plans`（经 `renderSection`）/ `FloatingButton` / `Footer`；`Hero.tsx` 与 `Plans.tsx` 的每个 `<Cta …>` 加上 `contact={contact}`。

`FloatingButton.tsx` 的 `href={data.link}` 改为：

```tsx
const resolved = resolveCtaHref(data.target, contact);
if (!resolved) return null;
// …href={resolved.href}
```

`Footer.tsx` 的 `contactEmail` 改为渲染 `contact` 中已填、且不是主渠道的渠道链接（用 `channelHref` 拼装）。

- [ ] **Step 3: 跑渲染器测试**

Run: `npx vitest run landing-renderer/`
Expected: PASS —— `Cta.test.ts` / `FloatingButton.test.ts` / `hero.test.ts` 需按新签名调整（补 `contact` 参数），**断言内容不改**

- [ ] **Step 4: 提交**

```bash
git add landing-renderer/
git commit -m "refactor: 渲染器改用渠道引用解析 CTA"
```

---

## Task 10: 编辑期校验等价改写

**Files:**
- Modify: `landing-editor/lib/contactIssues.ts`
- Modify: `landing-editor/samples/registry.drafts.ts`

**本任务只做等价改写，不删任何函数** —— 删除属阶段 2（见设计文档第 7 节）。

- [ ] **Step 1: `blankPrimaryCtaLinks` 改为清空 contact 的主渠道值**

```ts
/**
 * 模板实例化时清空主渠道的联系方式值，逼用户填自己的。
 * 与改造前「置空 hero.cta.link / floatingButton.link」语义等价 —— 只是现在
 * 号码只存在 contact 一处，清一次就够，不必逐个落点清。
 * 阶段 2 本函数整体删除，改由「默认选中联系方式面板 + 发布门槛」承接。
 */
export function blankPrimaryCtaLinks(draft: LandingPageDraft): LandingPageDraft {
  const clone = JSON.parse(JSON.stringify(draft)) as LandingPageDraft;
  const primary = clone.contact.primary;
  if (primary !== "form") delete clone.contact[primary];
  return clone;
}
```

- [ ] **Step 2: `collectContactIssueItems` 改为校验 contact**

把原先针对 `hero.cta.link` 空值与锚点落点的三处校验，替换成：

```ts
export function collectContactIssueItems(draft: LandingPageDraft): PublishIssue[] {
  const issues: PublishIssue[] = [];
  const { primary } = draft.contact;

  if (primary === "form") {
    if (!draft.leadForm?.enabled) {
      issues.push({
        message: "主要联系方式设为留资表单，但该页的留资表单未启用，访客点击不会有任何反应——请启用留资表单，或改用其他联系方式",
        target: { kind: "fixed", id: "leadForm" },
      });
    }
  } else if (!draft.contact[primary]?.trim()) {
    issues.push({
      message: "主要联系方式未填写，访客点击 CTA 无法联系你",
      target: { kind: "fixed", id: "contact" },
    });
  }
  if (!draft.hero?.cta?.text?.trim()) {
    issues.push({
      message: "首屏 CTA 按钮文案为空，请填写行动引导语（如 Chat on WhatsApp）",
      target: { kind: "fixed", id: "hero" },
    });
  }
  // 占位号扫描保留至阶段 2：此时模板占位号已收敛进 contact，扫描仍能命中
  return issues;
}
```

- [ ] **Step 3: 跑编辑器测试**

Run: `npx vitest run landing-editor/`
Expected: PASS（相关测试按新形状调整入参，断言语义不变）

- [ ] **Step 4: 提交**

```bash
git add landing-editor/
git commit -m "refactor: 编辑期校验改为作用于 contact（等价改写）"
```

---

## Task 10b: 编辑器表单适配

Task 2 删掉 `CtaButton.link` 后，编辑器里所有编辑该字段的输入框都会类型报错。本阶段只做**最小适配保持可用**，真正的渠道面板属阶段 2。

**Files:**
- Modify: `landing-editor/forms/HeroForm.tsx`
- Modify: `landing-editor/forms/FloatingButtonForm.tsx`
- Modify: `landing-editor/forms/PlansForm.tsx`
- Modify: `landing-editor/forms/FooterForm.tsx`

- [ ] **Step 1: 找出所有报错点**

Run: `npx tsc --noEmit 2>&1 | grep -E "forms/|\.link" | head -30`

- [ ] **Step 2: CTA 链接输入框改为只读说明**

凡是编辑 `cta.link` 的输入框，本阶段替换为一行静态说明（阶段 2 由渠道面板取代）：

```tsx
{/* 阶段 1：链接已改由页面级 contact 统一决定，此处不再逐个编辑。
    阶段 2 上线「联系方式」面板后，这行提示替换为指向该面板的入口。 */}
<p className="text-xs text-slate-500">
  按钮链接由页面的「联系方式」统一决定，不在此单独设置。
</p>
```

- [ ] **Step 3: `FooterForm` 删掉 contactEmail 输入框**

该字段已从 schema 移除，对应的表单项一并删除。

- [ ] **Step 4: 验证**

Run: `npx tsc --noEmit && npx vitest run landing-editor/`
Expected: 均无错误

- [ ] **Step 5: 提交**

```bash
git add landing-editor/forms/
git commit -m "refactor: 编辑器表单适配渠道引用模型"
```

---

## Task 11: 数据库迁移

**Files:**
- Create: `migrations/039_contact_channels.ts`

- [ ] **Step 1: 写迁移**

```ts
// migrations/039_contact_channels.ts
// 留资渠道通用化：把 landing_pages 的 data / published_data 从「CTA 裸 URL」
// 转成「contact 真源 + target 引用」。
//
// ⚠️ 本迁移由 vercel-build 自动执行，没有人工 dry-run 窗口，故安全性由事务内自校验保证：
// 逐张比对转换前后 CTA 的 (文案, href) 清单，任何一张不等即 throw —— 事务回滚、
// 部署失败、生产保持旧代码旧数据。失败的默认结果是「什么都没发生」。
//
// 不强行归一号码：同页出现第二个不同的 WhatsApp 号是合法状态（用户手改过其一），
// 那类落点原样转成 { kind: "url" }。宁可留一个未接入新模型的落点，
// 也不能改掉客户正在投放的页面。
// 文件名是 .ts —— Task 0 已把 migrate 脚本改用 tsx 执行，故可直接复用应用侧代码。
// 这一点很重要：转换逻辑只有一份实现，迁移与测试跑的是同一段代码。
import { convertDraft } from "../lib/contact/convert-draft";
import { ctaInventory, legacyCtaInventory } from "../lib/contact/cta-inventory";

/** 转换一份 draft 并当场验证等价；不等则抛错让整个迁移回滚。 */
function convertVerified(legacy, label) {
  if (!legacy) return null;
  const next = convertDraft(legacy);
  const before = legacyCtaInventory(legacy);
  const after = ctaInventory(next);
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    throw new Error(
      `[039] ${label} CTA 清单在转换后发生变化，迁移中止。\n  转换前: ${JSON.stringify(before)}\n  转换后: ${JSON.stringify(after)}`,
    );
  }
  return next;
}

import type { MigrationBuilder } from "node-pg-migrate";

export const up = async (pgm: MigrationBuilder) => {
  // 备份整表，回滚脚本从它恢复。CTAS 不带索引与约束，纯数据留存即可。
  pgm.sql(`CREATE TABLE IF NOT EXISTS landing_pages_backup_pre_contact AS SELECT * FROM landing_pages;`);

  const { rows } = await pgm.db.query(`SELECT id, data, published_data FROM landing_pages;`);
  for (const row of rows) {
    const data = convertVerified(row.data, `page ${row.id} data`);
    const published = convertVerified(row.published_data, `page ${row.id} published_data`);
    await pgm.db.query(`UPDATE landing_pages SET data = $2, published_data = $3 WHERE id = $1;`, [
      row.id,
      data ? JSON.stringify(data) : null,
      published ? JSON.stringify(published) : null,
    ]);
  }
};

export const down = (pgm: MigrationBuilder) => {
  // 从备份恢复。备份表刻意不删 —— 留作事故对照，容量成本可忽略。
  pgm.sql(`
    UPDATE landing_pages lp
       SET data = b.data, published_data = b.published_data
      FROM landing_pages_backup_pre_contact b
     WHERE lp.id = b.id;
  `);
};
```

- [ ] **Step 2: 对本地 dev 库验证**

```bash
npm run migrate:up 2>&1 | tail -20
```

Expected: 无 `[039]` 错误；若抛错，读错误里打印的 before/after 差异，回 Task 6 修 `convertDraft`，**不要放宽校验**。

- [ ] **Step 3: 验证回滚可用**

```bash
npm run migrate:down 2>&1 | tail -5 && npm run migrate:up 2>&1 | tail -5
```

Expected: 两次均成功，数据往返一致。

- [ ] **Step 4: 提交**

```bash
git add migrations/039_contact_channels.js
git commit -m "feat: 迁移存量页面至渠道引用模型，含事务内等价性自校验"
```

---

## Task 11b: 扩展全库结构回归

**Files:**
- Modify: `landing-editor/samples/templates.structure.test.ts`

- [ ] **Step 1: 追加断言**

```ts
describe("渠道模型", () => {
  it.each(TEMPLATES.map((t) => t.id))("%s 有 contact，且主渠道有值", async (id) => {
    const draft = await loadTemplateDraft(id);
    expect(draft.contact).toBeDefined();
    const { primary } = draft.contact;
    if (primary === "form") expect(draft.leadForm?.enabled).toBe(true);
    // 注：模板实例化经 blankPrimaryCtaLinks 清空主渠道值，故此处只断言 primary 合法，
    // 不断言有值 —— 「必须填」是发布门槛的职责，不是模板的
    else expect(["whatsapp", "phone", "email", "telegram"]).toContain(primary);
  });

  it.each(TEMPLATES.map((t) => t.id))("%s 的 CTA 不再出现渠道类裸 URL", async (id) => {
    const draft = await loadTemplateDraft(id);
    const offenders: string[] = [];
    JSON.stringify(draft, (k, v) => {
      // 漏网检查：转换后仍以 url 落点指向 wa.me / tel: / mailto: / t.me 的，
      // 说明 Task 8 的批量转换没覆盖到，会导致该按钮永远指向模板占位号
      if (k === "target" && v?.kind === "url" && /wa\.me|^tel:|^mailto:|t\.me/i.test(v.url)) offenders.push(v.url);
      return v;
    });
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: 跑测试**

Run: `npx vitest run landing-editor/samples/templates.structure.test.ts`
Expected: PASS。若第二条报出 offender，回 Task 8 补转换 —— **不要放宽正则**

- [ ] **Step 3: 提交**

```bash
git add landing-editor/samples/templates.structure.test.ts
git commit -m "test: 全库断言模板已接入渠道模型"
```

---

## Task 12: 收尾验证

- [ ] **Step 1: 全量测试**

Run: `npx vitest run && npx tsc --noEmit && npx eslint .`
Expected: 全绿，`tsc` / `eslint` 无输出

- [ ] **Step 2: E2E**

Run: `npx playwright test e2e/`
Expected: 全绿。落地页相关用例断言不应有任何改动 —— 本阶段用户可见行为为零变化。

- [ ] **Step 3: 视觉走查**

起本地 dev，对 `dental`（原 WhatsApp 主转化）与 `b2b-sourcing`（原表单主转化）两套模板各截一张预览图，与改造前对比。截图放 `.playwright-mcp/refactor_20260801_留资渠道通用化/`。

- [ ] **Step 4: 记录结果**

把测试输出与截图结论写进 `docs/refactor_20260801_留资渠道通用化/test-results.md`，失败项如实记录。

- [ ] **Step 5: 提交并开 PR**

```bash
git add docs/ .playwright-mcp/ 2>/dev/null; git commit -m "docs: 阶段 1 测试结果"
git push -u origin refactor_20260801_留资渠道通用化:refactor_20260801_留资渠道通用化
```

PR 描述必须包含：**本阶段用户可见行为为零变化**，以及迁移的自校验机制说明（供 reviewer 判断风险）。

---

## 阶段 1 完成定义

1. `npx vitest run` 全绿，含 53 条等价性回归
2. 本地迁移 up / down / up 往返成功
3. `dental` 与 `b2b-sourcing` 预览截图与改造前一致
4. 无任何用户可见能力变化（`ContactForm` 面板属阶段 2）
