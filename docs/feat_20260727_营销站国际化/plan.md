# PR 1：i18n 基建 + 首页双语 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立零依赖的 i18n 基建，让 `/` 出英文、`/zh` 出中文，首页（含 nav / footer / 套餐对比表）双语完整，SEO 双语信号齐备。

**Architecture:** 英文页保持现有物理路径，新增 `app/zh/` 镜像树（设计文档方案 B）。一份 `LOCALIZED_ROUTES` 清单同时驱动路径助手、sitemap、镜像对等性测试与切换器。字典以英文为事实源，中文用 `satisfies Dictionary` 在编译期强制 key 对齐。`proxy.ts` 零改动。

**Tech Stack:** Next.js 16 App Router、TypeScript、Tailwind v4、vitest（node 环境）、Playwright。

**设计文档：** `docs/feat_20260727_营销站国际化/design.md`

---

## 前置约定（每个 Task 都适用）

- 分支：`feat_20260727_营销站国际化`（已建，基线 `main`，已提交设计文档 `7e5a088`）
- 提交信息用中文 Conventional Commits，**禁止任何 AI 署名**
- vitest 的 `include` 只覆盖 `lib/**`、`landing-editor/**`、`landing-renderer/**`、`app/**` 下的 `*.test.ts`（见 `vitest.config.ts`）。**新测试必须放进这些目录**，放 `components/**` 不会被执行
- 单测命令：`pnpm test`；跑单文件：`pnpm vitest run <path>`
- 样式只用 Tailwind，禁止自定义 CSS 与内联 style（`app/og/route.tsx` 是唯一豁免，本 PR 不动它）

## 文件结构

**新建**

| 文件 | 职责 |
| --- | --- |
| `lib/i18n/config.ts` | locale 常量与类型、html lang / og locale 映射。无依赖，最底层 |
| `lib/i18n/routes.ts` | `LOCALIZED_ROUTES` 清单 + `localePath` / `stripLocale` / `isLocalizedRoute` |
| `lib/i18n/routes.test.ts` | 路径助手单测 + `app/zh/` 镜像对等性测试 |
| `lib/i18n/dictionaries/en/{common,home,plans}.ts` | 英文字典（事实源） |
| `lib/i18n/dictionaries/zh/{common,home,plans}.ts` | 中文字典 |
| `lib/i18n/dictionaries/index.ts` | `getDictionary(locale)` + `Dictionary` 类型导出 |
| `lib/seo/sitemap-entries.ts` | 营销面 sitemap 条目的纯函数（从 `app/sitemap.ts` 抽出，便于测试） |
| `lib/seo/sitemap-entries.test.ts` | 双语条目 + hreflang 完整性 |
| `lib/seo/site.test.ts` | `marketingMetadata` / `siteStructuredData` 的 locale 派生 |
| `lib/plans.i18n.test.ts` | `planFeatureRows` / `formatPlanLimit` 的双语行为 |
| `components/marketing/LocaleSwitcher.tsx` | 语言切换器（client） |
| `app/zh/layout.tsx` | 中文子树布局，承载 `lang="zh-Hans"` |
| `app/zh/page.tsx` | `/zh` 首页薄壳 |
| `e2e/i18n.spec.ts` | 双语 E2E |

**修改**

| 文件 | 改动 |
| --- | --- |
| `lib/plans.ts` | 剥离展示文案：`highlights` 移入字典，`PLAN_FEATURE_ROWS` 改工厂函数，`priceText` 拆结构化字段 |
| `lib/seo/site.ts` | `SITE_LOCALE`/`SITE_DESCRIPTION` 双语化；`marketingMetadata` 加 `locale` 与 hreflang |
| `app/sitemap.ts` | 改用 `lib/seo/sitemap-entries.ts` |
| `app/page.tsx` | 传 `locale="en"` |
| `components/billing/PlanComparison.tsx` | 接字典切片 |
| `components/marketing/chrome.tsx` | nav/footer 字典化 + 挂切换器 |
| `components/marketing/MarketingHome.tsx` | 全量字典化 |
| `lib/proxy/auth-proxy.ts` | `/zh/login`、`/zh/register` 的已登录跳转 |
| `lib/proxy/auth-proxy.test.ts` | 补上述用例 |

## ⚠️ 开工前需用户确认的一项

`lib/plans.ts` 的价格是 `CN¥29.99/月`。英文站沿用 `CN¥` 对国际受众是别扭的，但**改计价货币是商业决策不是 i18n 决策**（涉及 Dodo Payments 的实际收款币种）。

**本计划的处理：金额与货币符号原样保留，只把 `/月` 后缀本地化为 `/mo`。** 若要改成 USD 计价，属独立需求，不在本 PR 范围。

---

## Task 1: locale 配置与路径助手

**Files:**
- Create: `lib/i18n/config.ts`
- Create: `lib/i18n/routes.ts`
- Test: `lib/i18n/routes.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `lib/i18n/routes.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { locales, defaultLocale, htmlLang, ogLocale } from "./config";
import { LOCALIZED_ROUTES, localePath, stripLocale, isLocalizedRoute } from "./routes";

describe("i18n config", () => {
  it("英文是默认 locale，且只支持 en/zh", () => {
    expect(defaultLocale).toBe("en");
    expect([...locales]).toEqual(["en", "zh"]);
  });

  it("每个 locale 都有 html lang 与 og locale 映射", () => {
    expect(htmlLang.en).toBe("en");
    expect(htmlLang.zh).toBe("zh-Hans");
    expect(ogLocale.en).toBe("en_US");
    expect(ogLocale.zh).toBe("zh_CN");
  });
});

describe("localePath", () => {
  it("英文不加前缀", () => {
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("en", "/pricing")).toBe("/pricing");
  });

  it("中文加 /zh 前缀，根路径特判为 /zh 而非 /zh/", () => {
    expect(localePath("zh", "/")).toBe("/zh");
    expect(localePath("zh", "/pricing")).toBe("/zh/pricing");
  });

  it("非营销路由一律不加前缀——加了会 404", () => {
    expect(localePath("zh", "/admin")).toBe("/admin");
    expect(localePath("zh", "/admin/billing")).toBe("/admin/billing");
    expect(localePath("zh", "/api/leads")).toBe("/api/leads");
    expect(localePath("zh", "/p/some-slug")).toBe("/p/some-slug");
  });

  it("带 hash / query 的营销路径仍能正确加前缀", () => {
    expect(localePath("zh", "/#pricing")).toBe("/zh#pricing");
    expect(localePath("zh", "/pricing#compare")).toBe("/zh/pricing#compare");
  });
});

describe("stripLocale", () => {
  it("剥掉 /zh 前缀并回报 locale", () => {
    expect(stripLocale("/zh")).toEqual({ locale: "zh", pathname: "/" });
    expect(stripLocale("/zh/pricing")).toEqual({ locale: "zh", pathname: "/pricing" });
  });

  it("无前缀视为英文", () => {
    expect(stripLocale("/")).toEqual({ locale: "en", pathname: "/" });
    expect(stripLocale("/pricing")).toEqual({ locale: "en", pathname: "/pricing" });
  });

  it("不把 /zhengsomething 误判成中文前缀", () => {
    expect(stripLocale("/zhen")).toEqual({ locale: "en", pathname: "/zhen" });
  });

  it("localePath 与 stripLocale 互为逆运算", () => {
    for (const route of LOCALIZED_ROUTES) {
      for (const locale of locales) {
        expect(stripLocale(localePath(locale, route))).toEqual({ locale, pathname: route });
      }
    }
  });
});

describe("isLocalizedRoute", () => {
  it("清单内路由为真", () => {
    expect(isLocalizedRoute("/")).toBe(true);
    expect(isLocalizedRoute("/pricing")).toBe(true);
  });

  it("尚未镜像的营销页为假——分期交付期间必须降级到英文侧路径，否则链到 404", () => {
    // PR 1 只镜像了首页。/templates 的 /zh 镜像要到 PR 3 才存在，
    // 此时中文首页导航里的「模板库」必须仍指向 /templates（内容尚为中文，正好合适）。
    expect(isLocalizedRoute("/templates")).toBe(false);
    expect(localePath("zh", "/templates")).toBe("/templates");
    expect(isLocalizedRoute("/guides")).toBe(false);
    expect(localePath("zh", "/guides")).toBe("/guides");
  });

  it("后台与接口为假", () => {
    expect(isLocalizedRoute("/admin")).toBe(false);
    expect(isLocalizedRoute("/api/leads")).toBe(false);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm vitest run lib/i18n/routes.test.ts
```

预期：FAIL，报 `Cannot find module './config'`。

- [ ] **Step 3: 实现 config.ts**

```ts
// lib/i18n/config.ts
// 站点语言基座：仅常量与类型，不依赖任何模块（被 routes / dictionaries / seo 共用）。

export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];

/** 默认语言占据无前缀根路径（见设计文档 §3）。 */
export const defaultLocale: Locale = "en";

/** <html lang> / 嵌套 lang 属性取值。 */
export const htmlLang: Record<Locale, string> = { en: "en", zh: "zh-Hans" };

/** OpenGraph og:locale 取值。 */
export const ogLocale: Record<Locale, string> = { en: "en_US", zh: "zh_CN" };

/** hreflang 取值（x-default 另行指向默认语言）。 */
export const hreflang: Record<Locale, string> = { en: "en", zh: "zh-Hans" };

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
```

- [ ] **Step 4: 实现 routes.ts**

```ts
// lib/i18n/routes.ts
// 营销面路由清单——本文件是「哪些路由参与国际化」的唯一事实源，同时驱动：
// ① localePath 的合法性守卫 ② sitemap 双语条目 ③ app/zh 镜像对等性测试 ④ 语言切换器可见性。
// 分期交付期间按 PR 逐条追加：新增一条 = 必须同时补 app/zh 下的镜像文件，否则对等性测试变红。
import { defaultLocale, type Locale } from "./config";

export const ZH_PREFIX = "/zh";

/** 已完成国际化的营销路由（PR 1 只含首页；后续 PR 逐条追加）。 */
export const LOCALIZED_ROUTES = ["/"] as const;

/**
 * 已完成国际化的动态子树前缀：其下任意子路径都参与国际化（如 /templates/<id>）。
 * PR 1 为空——**清单只登记「镜像已存在」的路由**。提前登记会让 localePath
 * 产出 /zh/templates 这类尚不存在的地址，把中文页导航直接链到 404。
 * PR 3 上模板画廊时加 "/templates"，PR 4 上指南时加 "/guides"。
 */
export const LOCALIZED_PREFIXES: readonly string[] = [];

/** 分离出路径主体与 hash/query 后缀，避免把前缀插到 # 后面。 */
function splitSuffix(path: string): [string, string] {
  const i = path.search(/[#?]/);
  return i === -1 ? [path, ""] : [path.slice(0, i), path.slice(i)];
}

export function isLocalizedRoute(path: string): boolean {
  const [pathname] = splitSuffix(path);
  if ((LOCALIZED_ROUTES as readonly string[]).includes(pathname)) return true;
  return LOCALIZED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * 给营销路由加语言前缀。
 * 非营销路由（/admin、/api、/p 等）原样返回——它们没有 /zh 镜像，加前缀必然 404。
 */
export function localePath(locale: Locale, path: string): string {
  if (!isLocalizedRoute(path)) return path;
  if (locale === defaultLocale) return path;
  const [pathname, suffix] = splitSuffix(path);
  const base = pathname === "/" ? ZH_PREFIX : `${ZH_PREFIX}${pathname}`;
  return `${base}${suffix}`;
}

/** 从实际 URL 路径反解语言与去前缀路径（供语言切换器使用）。 */
export function stripLocale(path: string): { locale: Locale; pathname: string } {
  const [pathname, suffix] = splitSuffix(path);
  if (pathname === ZH_PREFIX) return { locale: "zh", pathname: `/${suffix}` };
  if (pathname.startsWith(`${ZH_PREFIX}/`)) {
    return { locale: "zh", pathname: `${pathname.slice(ZH_PREFIX.length)}${suffix}` };
  }
  return { locale: defaultLocale, pathname: `${pathname}${suffix}` };
}
```

- [ ] **Step 5: 跑测试确认通过**

```bash
pnpm vitest run lib/i18n/routes.test.ts
```

预期：PASS，全部用例绿。

- [ ] **Step 6: 提交**

```bash
git add lib/i18n/config.ts lib/i18n/routes.ts lib/i18n/routes.test.ts
git commit -m "feat: 新增 i18n locale 配置与营销路由路径助手"
```

---

## Task 2: 字典骨架（common + home）

**Files:**
- Create: `lib/i18n/dictionaries/en/common.ts`、`en/home.ts`、`en/index.ts`
- Create: `lib/i18n/dictionaries/zh/common.ts`、`zh/home.ts`、`zh/index.ts`
- Create: `lib/i18n/dictionaries/index.ts`

本 Task 无独立单测：key 一致性由 `satisfies Dictionary` 在 `tsc` 阶段强制，运行时再测一遍是重复。验证手段是 Step 5 的 `tsc`。

- [ ] **Step 1: 英文 common 字典**

```ts
// lib/i18n/dictionaries/en/common.ts
export const common = {
  brand: "Zap Bridge",
  nav: {
    templates: "Templates",
    guides: "Guides",
    antiBan: "Anti-duplication",
    pricing: "Pricing",
    login: "Log in",
    register: "Start free",
  },
  footer: {
    templates: "Templates",
    antiBan: "Anti-duplication",
    pricing: "Pricing",
    privacy: "Privacy",
    terms: "Terms",
    login: "Log in",
    register: "Start free",
  },
  localeSwitcher: {
    /** 切到另一种语言时按钮显示的文案（即目标语言的自称）。 */
    toEn: "English",
    toZh: "中文",
    ariaLabel: "Switch language",
  },
} as const;
```

- [ ] **Step 2: 英文 home 字典**

```ts
// lib/i18n/dictionaries/en/home.ts
export const home = {
  meta: {
    title: "Zap Bridge — Ad-ready landing pages for overseas lead gen",
    description:
      "Ad-ready landing pages built for overseas lead generation: start from 30+ industry templates, draft a full page with AI, and ship your first version in minutes. Pixels, UTMs, and server-side conversion forwarding are configured in one place, so ad spend lands on pages you can attribute and convert.",
    ogDescription:
      "30+ inquiry and lead-capture templates plus AI full-page drafting — first version in minutes. Publish to your own brand domain and configure Meta, TikTok, and Google tracking by plan.",
  },
  hero: {
    badge: "Overseas lead-gen engine",
    titleLine1: "Ad-ready landing pages",
    titleLine2: "that make every click traceable",
    subtitle:
      "Built for founders and small teams running paid acquisition: start from 30+ industry templates, let AI draft the whole page, and ship your first version in minutes. Pixels, UTMs, and server-side conversion forwarding are configured in one place — so your ad spend lands on pages you can actually attribute and convert.",
    ctaPrimary: "Start free",
    ctaSecondary: "See pricing",
    note: "7 days of full Pro on sign-up · No credit card · No code",
  },
  editorMock: {
    pixelBadge: "Meta Pixel · fired",
    leadBadge: "Lead +1",
  },
  marquee: {
    heading: "Works with your ad and analytics stack",
  },
  steps: {
    kicker: "// three steps to live",
    title: "From template to live campaign in three steps",
    desc: "The whole build is visual — no code required. When you are ready to go public, upgrade and verify your own domain to publish.",
    items: [
      {
        title: "Pick a lead-gen template",
        desc: "Choose from 30+ overseas lead-gen templates matched to your industry and inquiry flow, and start with the page structure and copy baseline already in place.",
      },
      {
        title: "Edit content visually",
        desc: "Select a section to rewrite copy and swap images. Drag to reorder, autosave as you go, and preview desktop and mobile live.",
      },
      {
        title: "Upgrade and publish to your own domain",
        desc: "When you are ready to run ads, upgrade, connect your brand domain and pass DNS verification, then publish the page and set its SEO details.",
      },
    ],
  },
  features: {
    kicker: "// built for conversion",
    title: "Everything a converting page needs, ready to go",
    desc: "Pages, domains, tracking, AI copy — get your inquiry and lead pages right first, then switch on the rest as your campaigns scale.",
    items: {
      templates: {
        title: "Overseas lead-gen template library",
        desc: "30+ inquiry and lead-capture templates across beauty, aesthetics, apparel, home, gadgets, supplements, and baby care — skip the blank page and start from an ad-ready structure.",
      },
      editor: {
        title: "Visual content editing",
        desc: "Rewrite copy and swap images through section forms, reorder by drag, autosave as you work, and preview desktop and mobile live — what you see is what you ship, with no dev queue.",
      },
      domain: {
        title: "Publish on your own brand domain",
        desc: "Paid plans connect your own brand domain and publish once DNS verification passes. Independent SEO title, description, and share image — visitors only ever see your brand.",
      },
      tracking: {
        title: "Multi-platform tracking + conversion forwarding",
        desc: "Configure Meta, TikTok, GA4, and Google Ads by plan. Pro and above add Meta / TikTok server-side conversion forwarding and UTM source capture, giving ad platforms a fuller conversion signal.",
      },
      antiBan: {
        title: "Anti-duplication",
        desc: "Agency plans reseed page variants in one click: content stays put while hero layout, wrapper structure, and meta fingerprint shift with the seed — lowering the odds that same-template pages get flagged as duplicates.",
        linkLabel: "How anti-duplication works",
      },
      ai: {
        title: "AI full-page generation & rewriting",
        desc: "Feed in your business details and AI drafts the full page — marketing copy plus stock imagery — on your current template, or rewrite section by section. First draft in minutes; always fact-check claims, cases, and assets before publishing.",
      },
    },
  },
  tracking: {
    kicker: "// lead-gen data tracking",
    title: "CTA and source data, back in your dashboard",
    desc: "Once tracking is on, third-party pixels report page views and CTA activity, while the platform dashboard rolls up PV, CTA clicks, channel, and UTM source. Pro and above can also configure Meta / TikTok server-side conversion forwarding.",
    bullets: [
      "Meta, TikTok, GA4, and Google Ads on Pro and above",
      "Meta / TikTok server-side forwarding, deduplicated against form events",
      "UTM sources recorded, with per-page visit and CTA basics",
      "Optional cookie consent bar — third-party pixels load only after consent",
    ],
    funnel: {
      consent: { label: "Cookie consent gate", note: "On by default; pixels load after consent" },
      pixels: { label: "Multi-platform pixels", note: "Meta / TikTok / GA4 / Google Ads" },
      capture: { label: "Lead activity capture", note: "CTA clicks + form submits" },
      forwarding: { label: "Conversion forwarding + dashboard", note: "Meta / TikTok CAPI + PV / CTA / UTM" },
    },
  },
  pricing: {
    kicker: "// simple, transparent pricing",
    title: "Ship your first version free, upgrade when you go live",
    desc: "Free lets you create, save, and preview online. Upgrade to connect your own domain and unlock more pages, tracking, and AI credits by plan.",
    ctaFree: "Start free",
    ctaPaid: "Sign up to upgrade",
  },
  finalCta: {
    titleLine1: "Your next campaign",
    titleLine2: "deserves an ad-ready landing page",
    desc: "Create, edit, and preview right now — no credit card. Upgrade when you are ready to run ads and publish to your own brand domain.",
    ctaPrimary: "Start free",
    ctaSecondary: "Already have an account? Log in",
  },
} as const;
```

- [ ] **Step 3: 英文字典入口 + Dictionary 类型**

```ts
// lib/i18n/dictionaries/en/index.ts
import { common } from "./common";
import { home } from "./home";
import { plans } from "./plans";

export const en = { common, home, plans };

/** 英文是字典事实源；中文以 `satisfies Dictionary` 对齐，漏 key / 多 key 均编译期报错。 */
export type Dictionary = typeof en;
```

> `./plans` 在 Task 3 创建。本 Task 先写 `common` 与 `home`，Step 5 的 `tsc` 会因缺 `plans` 报错——这是预期的，Task 3 结束后才应全绿。若希望本 Task 独立可验证，可先建空壳 `export const plans = {} as const;` 再于 Task 3 填充。

- [ ] **Step 4: 中文字典**

`lib/i18n/dictionaries/zh/common.ts` 与 `zh/home.ts`：结构与英文逐一对应，值取**现有组件里的中文原文**（从 `components/marketing/chrome.tsx` 与 `MarketingHome.tsx` 原样搬运，不要重写）。对照关系：

| 字典 key | 中文原文出处 |
| --- | --- |
| `common.nav.*` | `chrome.tsx` SiteNav 的「模板库 / 指南 / 反同质化 / 套餐定价 / 登录 / 免费开始」 |
| `common.footer.*` | `chrome.tsx` SiteFooter 的同名链接 + 「隐私政策 / 服务条款」 |
| `home.meta.*` | `app/page.tsx` 现有 `marketingMetadata` 的 title / description / ogDescription |
| `home.hero.*` | `MarketingHome.tsx` Hero 的 badge / h1 两行 / 副标题 / 两个 CTA / 底部小字 |
| `home.editorMock.*` | 「Meta Pixel · 已触发」「Lead 转化 +1」 |
| `home.marquee.heading` | 「支持接入这些投放与分析工具」 |
| `home.steps.*` | `STEPS` 常量三条 + Steps 的 SectionHead |
| `home.features.*` | `FEATURES` 常量六条 + Features 的 SectionHead |
| `home.tracking.*` | TrackingShowcase 的 kicker/标题/描述/四条 bullet + `FUNNEL` 常量四条 |
| `home.pricing.*` | Pricing 区 SectionHead + `ctaFor` 的「免费开始 / 注册后升级」 |
| `home.finalCta.*` | FinalCTA 的两行标题 / 描述 / 两个 CTA |

`common.localeSwitcher` 是新增内容，无现成中文可搬：`toEn` / `toZh` 两种语言下**取值相同**（`"English"` / `"中文"`——语言自称不翻译，用户要在任一语言界面里认出目标语言），只有 `ariaLabel` 需要译（英文 `"Switch language"`，中文 `"切换语言"`）。

`zh/index.ts`：

```ts
// lib/i18n/dictionaries/zh/index.ts
import type { Dictionary } from "../en";
import { common } from "./common";
import { home } from "./home";
import { plans } from "./plans";

export const zh = { common, home, plans } satisfies Dictionary;
```

字典总入口：

```ts
// lib/i18n/dictionaries/index.ts
import type { Locale } from "../config";
import { en, type Dictionary } from "./en";
import { zh } from "./zh";

export type { Dictionary };

const DICTIONARIES: Record<Locale, Dictionary> = { en, zh };

/**
 * 同步返回字典（静态 import，无 async 开销）。
 * Server Component 直接取；client 组件由父级以 props 传入需要的切片，
 * 只有被用到的切片会进客户端 payload，不会两种语言都打包。
 */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
```

- [ ] **Step 5: 类型校验**

```bash
pnpm exec tsc --noEmit
```

预期：Task 3 完成前会因缺 `./plans` 报错；把 `zh/home.ts` 故意删掉一个 key 再跑，应看到 `satisfies Dictionary` 报缺失属性——这是本 Task 的验证点，确认后补回。

- [ ] **Step 6: 提交**

```bash
git add lib/i18n/dictionaries
git commit -m "feat: 新增 en/zh 字典骨架与 getDictionary"
```

---

## Task 3: 套餐文案外提（plans.ts 结构化）

`lib/plans.ts` 的展示文案被公开定价区与 `/admin` 计费页共用。本 Task 把文案搬进字典，`plans.ts` 只留结构化数据。

**Files:**
- Modify: `lib/plans.ts`
- Create: `lib/i18n/dictionaries/en/plans.ts`、`zh/plans.ts`
- Test: `lib/plans.i18n.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// lib/plans.i18n.test.ts
import { describe, it, expect } from "vitest";
import { PLANS, PLAN_ORDER, planFeatureRows, formatPlanLimit, planPriceText } from "./plans";
import { getDictionary } from "./i18n/dictionaries";

describe("formatPlanLimit", () => {
  it("Infinity 按语言输出不限", () => {
    expect(formatPlanLimit(Infinity, "en", "pages")).toBe("Unlimited");
    expect(formatPlanLimit(Infinity, "zh", "pages")).toBe("无限");
  });

  it("0 输出破折号，与语言无关", () => {
    expect(formatPlanLimit(0, "en", "domains")).toBe("—");
    expect(formatPlanLimit(0, "zh", "domains")).toBe("—");
  });

  it("有限值带本地化量词", () => {
    expect(formatPlanLimit(3, "en", "pages")).toBe("3 pages");
    expect(formatPlanLimit(3, "zh", "pages")).toBe("3 张");
    expect(formatPlanLimit(80, "en", "perMonth")).toBe("80 / mo");
    expect(formatPlanLimit(80, "zh", "perMonth")).toBe("80 次/月");
  });
});

describe("planPriceText", () => {
  it("free 档显示免费文案，不显示金额", () => {
    expect(planPriceText(PLANS.free, "en")).toEqual({ amount: "Free", suffix: "" });
    expect(planPriceText(PLANS.free, "zh")).toEqual({ amount: "免费", suffix: "" });
  });

  it("付费档保留货币与金额，仅后缀本地化", () => {
    expect(planPriceText(PLANS.pro, "en")).toEqual({ amount: "CN¥79.99", suffix: "/mo" });
    expect(planPriceText(PLANS.pro, "zh")).toEqual({ amount: "CN¥79.99", suffix: "/月" });
  });
});

describe("planFeatureRows", () => {
  it("两种语言行数一致、结构一致", () => {
    const rowsEn = planFeatureRows(getDictionary("en").plans);
    const rowsZh = planFeatureRows(getDictionary("zh").plans);
    expect(rowsEn.length).toBe(rowsZh.length);
    expect(rowsEn.length).toBeGreaterThan(0);
  });

  it("布尔型权益的取值不随语言变化（只有文案变，逻辑不变）", () => {
    const rowsEn = planFeatureRows(getDictionary("en").plans);
    const rowsZh = planFeatureRows(getDictionary("zh").plans);
    for (const planId of PLAN_ORDER) {
      rowsEn.forEach((row, i) => {
        const a = row.valueFor(PLANS[planId]);
        const b = rowsZh[i].valueFor(PLANS[planId]);
        if (typeof a === "boolean") expect(b).toBe(a);
      });
    }
  });

  it("反同质化行仅 agency 为真——权益门控不能被 i18n 改动破坏", () => {
    const rows = planFeatureRows(getDictionary("en").plans);
    const antiBanRow = rows.find((r) => r.key === "antiBan");
    expect(antiBanRow).toBeDefined();
    expect(antiBanRow!.valueFor(PLANS.agency)).toBe(true);
    expect(antiBanRow!.valueFor(PLANS.pro)).toBe(false);
    expect(antiBanRow!.valueFor(PLANS.free)).toBe(false);
  });

  it("每档 highlights 两种语言条数一致", () => {
    const en = getDictionary("en").plans;
    const zh = getDictionary("zh").plans;
    for (const planId of PLAN_ORDER) {
      expect(en.highlights[planId].length).toBe(zh.highlights[planId].length);
    }
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm vitest run lib/plans.i18n.test.ts
```

预期：FAIL，`planFeatureRows is not a function` / 找不到导出。

- [ ] **Step 3: 英文 plans 字典**

```ts
// lib/i18n/dictionaries/en/plans.ts
export const plans = {
  free: "Free",
  unlimited: "Unlimited",
  perMonthSuffix: "/mo",
  units: { pages: "pages", domains: "domains", perMonth: "/ mo" },
  table: {
    feature: "Feature",
    description: "What it does",
    mostPopular: "Most popular",
    ctaFree: "Start free",
    ctaUpgrade: "Upgrade",
  },
  rows: {
    landingPages: { label: "Landing pages", desc: "Total pages you can create and save" },
    customDomain: { label: "Custom domains", desc: "Publish pages on your own brand domain" },
    templates: { label: "Lead-gen templates", desc: "30+ inquiry and lead-capture templates as your editing starting point" },
    editor: { label: "Visual content editor", desc: "Edit copy and images through forms, reorder sections, preview live" },
    basicPixel: { label: "Basic tracking (1× Meta Pixel)", desc: "Connect one Meta Pixel to track landing page conversions" },
    watermark: { label: "Remove platform watermark", desc: "Drop the footer watermark — the page is purely your brand" },
    advancedTracking: { label: "Multi-platform tracking & CAPI", desc: "Meta / TikTok / Google tracking plus Meta / TikTok server-side forwarding" },
    antiBan: { label: "Anti-duplication", desc: "Reseed page variants to scatter the structural fingerprint, lowering duplicate-detection odds" },
    leadWebhook: { label: "Lead webhook", desc: "POST new leads to your CRM / Zapier in real time, signed" },
    aiPage: { label: "AI full-page generation", desc: "Feed in business details and AI drafts full page copy on your template" },
    aiRewrite: { label: "AI rewriting", desc: "Polish and rewrite section by section to produce variants fast" },
  },
  highlights: {
    free: ["1 landing page", "All 30+ lead-gen templates", "Visual content editor", "Online preview (publishing needs a paid plan and domain)"],
    starter: ["3 landing pages + 1 custom domain", "1× Meta Pixel tracking"],
    pro: ["20 landing pages + 5 domains", "Platform watermark removed", "Meta / TikTok / Google tracking + Meta / TikTok CAPI"],
    agency: ["Unlimited pages + unlimited domains", "Anti-duplication", "AI generation raised to 300 / mo"],
  },
} as const;
```

- [ ] **Step 4: 中文 plans 字典**

`lib/i18n/dictionaries/zh/plans.ts` 结构同上，值从 `lib/plans.ts` 现有中文原样搬运：`free: "免费"`、`unlimited: "无限"`、`perMonthSuffix: "/月"`、`units: { pages: "张", domains: "个", perMonth: "次/月" }`、`table` 取「功能 / 说明 / 最受欢迎 / 免费开始 / 立即升级」、`rows` 取 `PLAN_FEATURE_ROWS` 现有 label 与 desc、`highlights` 取各档 `highlights` 数组。

- [ ] **Step 5: 改造 plans.ts**

`PlanConfig` 中删除 `highlights: string[]`，`priceText: string` 换为结构化字段：

```ts
export interface PlanConfig {
  id: PlanId;
  label: string;              // "Free" / "Starter"...，品牌名不翻译
  priceAmount: number;        // 0 / 29.99 / 79.99 / 199.99
  currency: string;           // "CN¥"——计价货币属商业决策，不随语言变化
  color: string;
  highlight?: boolean;
  landingPagesLimit: number;
  domainsLimit: number;
  hasWatermark: boolean;
  basicPixel: boolean;
  advancedTracking: boolean;
  antiBan: boolean;
  leadWebhook: boolean;
  aiPageQuota: number;
  aiRewriteQuota: number;
}
```

各档去掉 `highlights`、把 `priceText: "CN¥79.99/月"` 换成 `priceAmount: 79.99, currency: "CN¥"`，其余字段原样不动。

追加展示层函数：

```ts
import type { Locale } from "./i18n/config";
import type { Dictionary } from "./i18n/dictionaries";

type PlansDict = Dictionary["plans"];
type LimitUnit = keyof PlansDict["units"];

export function formatPlanLimit(n: number, locale: Locale, unit: LimitUnit): string {
  const dict = locale === "en" ? enPlans : zhPlans;   // 见下方 import 说明
  if (n === Infinity) return dict.unlimited;
  if (n === 0) return "—";
  return `${n} ${dict.units[unit]}`;
}

export function planPriceText(plan: PlanConfig, locale: Locale): { amount: string; suffix: string } {
  const dict = locale === "en" ? enPlans : zhPlans;
  if (plan.priceAmount === 0) return { amount: dict.free, suffix: "" };
  return { amount: `${plan.currency}${plan.priceAmount}`, suffix: dict.perMonthSuffix };
}

export interface PlanFeatureRow {
  /** 稳定标识，供测试与后续引用锚定（不随语言变化）。 */
  key: string;
  label: string;
  desc: string;
  valueFor: (plan: PlanConfig) => string | boolean;
}

/** 按字典产出对比表行；权益判定逻辑与语言无关。 */
export function planFeatureRows(t: PlansDict, locale: Locale = "en"): PlanFeatureRow[] {
  const r = t.rows;
  return [
    { key: "landingPages", ...r.landingPages, valueFor: (p) => formatPlanLimit(p.landingPagesLimit, locale, "pages") },
    { key: "customDomain", ...r.customDomain, valueFor: (p) => formatPlanLimit(p.domainsLimit, locale, "domains") },
    { key: "templates", ...r.templates, valueFor: () => true },
    { key: "editor", ...r.editor, valueFor: () => true },
    { key: "basicPixel", ...r.basicPixel, valueFor: (p) => p.basicPixel },
    { key: "watermark", ...r.watermark, valueFor: (p) => !p.hasWatermark },
    { key: "advancedTracking", ...r.advancedTracking, valueFor: (p) => p.advancedTracking },
    { key: "antiBan", ...r.antiBan, valueFor: (p) => p.antiBan },
    { key: "leadWebhook", ...r.leadWebhook, valueFor: (p) => p.leadWebhook },
    { key: "aiPage", ...r.aiPage, valueFor: (p) => formatPlanLimit(p.aiPageQuota, locale, "perMonth") },
    { key: "aiRewrite", ...r.aiRewrite, valueFor: (p) => formatPlanLimit(p.aiRewriteQuota, locale, "perMonth") },
  ];
}
```

`formatPlanLimit` / `planPriceText` 里的 `enPlans` / `zhPlans` 通过 `import { plans as enPlans } from "./i18n/dictionaries/en/plans"` 与 `zh` 同理直接引入——绕开 `getDictionary` 可避免 `plans.ts ↔ dictionaries/index.ts` 的循环依赖。

- [ ] **Step 6: 修复所有 `highlights` / `priceText` 的调用点**

```bash
grep -rn "\.highlights\|priceText\|PLAN_FEATURE_ROWS" --include=*.ts --include=*.tsx app components lib | grep -v node_modules
```

逐一改为 `getDictionary(locale).plans.highlights[planId]` 与 `planPriceText(plan, locale)` / `planFeatureRows(...)`。`/admin` 侧调用点一律传 `"zh"`，保持后台中文不变。

- [ ] **Step 7: 跑测试确认通过**

```bash
pnpm vitest run lib/plans.i18n.test.ts && pnpm test && pnpm exec tsc --noEmit
```

预期：新测试全绿；`pnpm test` 中既有的 `plans.*.test.ts`（`plans.test.ts`、`plans.antiban.test.ts`、`plans.effectivePlan.test.ts`、`plans.activeCompPlan.test.ts`）**必须同样全绿**——它们守护的是权益门控逻辑，本次只动展示层，一条都不该红。

- [ ] **Step 8: 提交**

```bash
git add lib/plans.ts lib/plans.i18n.test.ts lib/i18n/dictionaries app components
git commit -m "refactor: 套餐展示文案外提至字典，plans.ts 只留结构化数据"
```

---

## Task 4: PlanComparison 接字典

**Files:**
- Modify: `components/billing/PlanComparison.tsx`

- [ ] **Step 1: 组件签名改造**

```tsx
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/routes";
import type { Locale } from "@/lib/i18n/config";
import { PLANS, PLAN_ORDER, planFeatureRows, planPriceText } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

export function PlanComparison({
  locale = "en",
  ctaFor,
}: {
  locale?: Locale;
  ctaFor?: (planId: PlanId) => { href: string; label: string };
}) {
  const t = getDictionary(locale).plans;
  const rows = planFeatureRows(t, locale);
  const cta = ctaFor ?? ((planId: PlanId) =>
    planId === "free"
      ? { href: localePath(locale, Routes.Register), label: t.table.ctaFree }
      : { href: Routes.Billing, label: t.table.ctaUpgrade });
  // ...
}
```

- [ ] **Step 2: 替换表内所有硬编码中文**

| 原文 | 替换为 |
| --- | --- |
| `功能` | `{t.table.feature}` |
| `说明` | `{t.table.description}` |
| `最受欢迎` | `{t.table.mostPopular}` |
| `{isFree ? "免费" : plan.priceText.split("/")[0]}` 及 `/月` | `planPriceText(plan, locale)` 返回的 `{amount}` 与 `{suffix}` |
| `PLAN_FEATURE_ROWS.map` | `rows.map`，`key={row.key}` |

注意 `Routes.Billing` 指向 `/admin/billing`，**不加 locale 前缀**（后台不参与国际化，`localePath` 的守卫会原样返回，但这里直接写裸路径更直白）。

- [ ] **Step 3: 验证**

```bash
pnpm exec tsc --noEmit && pnpm exec eslint components/billing/PlanComparison.tsx
```

预期：无输出（通过）。

- [ ] **Step 4: 提交**

```bash
git add components/billing/PlanComparison.tsx
git commit -m "feat: PlanComparison 支持 locale 切换文案"
```

---

## Task 5: SEO 层 locale 化 + hreflang

**Files:**
- Modify: `lib/seo/site.ts`
- Test: `lib/seo/site.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// lib/seo/site.test.ts
import { describe, it, expect } from "vitest";
import { marketingMetadata, siteStructuredData, SITE_URL, siteDescription } from "./site";

describe("marketingMetadata", () => {
  it("英文页 canonical 无前缀，中文页带 /zh", () => {
    const en = marketingMetadata({ locale: "en", title: "T", description: "D", path: "/" });
    const zh = marketingMetadata({ locale: "zh", title: "T", description: "D", path: "/" });
    expect(en.alternates?.canonical).toBe(`${SITE_URL}/`);
    expect(zh.alternates?.canonical).toBe(`${SITE_URL}/zh`);
  });

  it("已国际化路由的两种语言都输出完整 hreflang，且 x-default 指向英文", () => {
    for (const locale of ["en", "zh"] as const) {
      const m = marketingMetadata({ locale, title: "T", description: "D", path: "/" });
      const langs = m.alternates?.languages as Record<string, string>;
      expect(langs["en"]).toBe(`${SITE_URL}/`);
      expect(langs["zh-Hans"]).toBe(`${SITE_URL}/zh`);
      expect(langs["x-default"]).toBe(`${SITE_URL}/`);
    }
  });

  it("尚未国际化的页面不输出 hreflang——否则两条 alternate 会指向同一 URL", () => {
    const m = marketingMetadata({ locale: "zh", title: "T", description: "D", path: "/pricing" });
    expect(m.alternates?.canonical).toBe(`${SITE_URL}/pricing`);
    expect(m.alternates?.languages).toBeUndefined();
  });

  it("og:locale 随语言变化", () => {
    expect(marketingMetadata({ locale: "en", title: "T", description: "D", path: "/" }).openGraph?.locale).toBe("en_US");
    expect(marketingMetadata({ locale: "zh", title: "T", description: "D", path: "/" }).openGraph?.locale).toBe("zh_CN");
  });
});

describe("siteStructuredData", () => {
  it("inLanguage 随语言变化", () => {
    const graph = (locale: "en" | "zh") =>
      (siteStructuredData(locale)["@graph"] as Record<string, unknown>[]).find((n) => n["@type"] === "WebSite");
    expect(graph("en")!.inLanguage).toBe("en");
    expect(graph("zh")!.inLanguage).toBe("zh-Hans");
  });

  it("Organization 描述随语言变化", () => {
    const org = (locale: "en" | "zh") =>
      (siteStructuredData(locale)["@graph"] as Record<string, unknown>[]).find((n) => n["@type"] === "Organization");
    expect(org("en")!.description).toBe(siteDescription.en);
    expect(org("zh")!.description).toBe(siteDescription.zh);
    expect(siteDescription.en).not.toBe(siteDescription.zh);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm vitest run lib/seo/site.test.ts
```

预期：FAIL，`siteDescription` 未导出 / `marketingMetadata` 不接受 `locale`。

- [ ] **Step 3: 改造 site.ts**

删除 `SITE_LOCALE` 与 `SITE_DESCRIPTION` 两个单语常量，替换为：

```ts
import { htmlLang, ogLocale, hreflang, defaultLocale, locales, type Locale } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/routes";

export const siteDescription: Record<Locale, string> = {
  en: "Zap Bridge is an ad-ready landing page platform for overseas lead generation: 30+ industry templates plus AI full-page drafting get your first version out in minutes, published to your own brand domain with pixels, UTMs, and server-side conversion forwarding built in.",
  zh: "Zap Bridge 是面向海外获客的投放级落地页平台：30+ 行业模板 + AI 整页成稿，几分钟做出第一版；发布到自有品牌域名，像素、UTM 与服务端转化回传一站配好。",
};
```

`marketingMetadata` 增加必填 `locale: Locale`，canonical 改为 `absoluteUrl(localePath(input.locale, input.path))`，并**仅对已镜像路由**追加 hreflang：

```ts
// 未进入 LOCALIZED_ROUTES 的页面尚无 /zh 镜像，localePath 会原样返回英文侧路径，
// 此时若仍输出 languages，en 与 zh-Hans 会指向同一 URL——对搜索引擎是噪音。
const languages = isLocalizedRoute(input.path)
  ? {
      "x-default": absoluteUrl(localePath(defaultLocale, input.path)),
      ...Object.fromEntries(locales.map((l) => [hreflang[l], absoluteUrl(localePath(l, input.path))])),
    }
  : undefined;

return {
  title: input.title,
  description: input.description,
  alternates: { canonical, ...(languages ? { languages } : {}) },
  openGraph: { type: "website", url: canonical, siteName: SITE_NAME, locale: ogLocale[input.locale], /* ...其余不变 */ },
  // twitter 不变
};
```

`isLocalizedRoute` 从 `@/lib/i18n/routes` 引入。

`siteStructuredData` 改签名为 `siteStructuredData(locale: Locale)`，`description` 取 `siteDescription[locale]`，`inLanguage` 取 `htmlLang[locale]`。

- [ ] **Step 4: 修复调用点**

```bash
grep -rn "marketingMetadata\|siteStructuredData\|SITE_LOCALE\|SITE_DESCRIPTION" --include=*.ts --include=*.tsx app lib components | grep -v node_modules
```

本 PR 只有首页会传 `locale`；其余营销页（pricing / anti-ban / templates / guides / privacy / terms）尚未国际化，**一律显式传 `locale: "zh"`**，保持它们当前的中文 canonical 与描述不变，等各自的 PR 再改。这一步是防止 PR 1 把未改造页面的 SEO 悄悄改坏。

- [ ] **Step 5: 跑测试确认通过**

```bash
pnpm vitest run lib/seo/site.test.ts && pnpm exec tsc --noEmit
```

预期：全绿。

- [ ] **Step 6: 提交**

```bash
git add lib/seo/site.ts lib/seo/site.test.ts app
git commit -m "feat: SEO metadata 支持 locale 与 hreflang"
```

---

## Task 6: sitemap 双语

**Files:**
- Create: `lib/seo/sitemap-entries.ts`
- Create: `lib/seo/sitemap-entries.test.ts`
- Modify: `app/sitemap.ts`

`app/sitemap.ts` 依赖 `headers()` 与数据库，难以直接单测；把营销面条目抽成纯函数即可测。

- [ ] **Step 1: 写失败测试**

```ts
// lib/seo/sitemap-entries.test.ts
import { describe, it, expect } from "vitest";
import { marketingEntries } from "./sitemap-entries";
import { LOCALIZED_ROUTES } from "@/lib/i18n/routes";

const BASE = "https://zapbridge.tech";

describe("marketingEntries", () => {
  it("已国际化路由输出双语两条", () => {
    const urls = marketingEntries(BASE, new Date()).map((e) => e.url);
    for (const route of LOCALIZED_ROUTES) {
      const en = route === "/" ? `${BASE}/` : `${BASE}${route}`;
      const zh = route === "/" ? `${BASE}/zh` : `${BASE}/zh${route}`;
      expect(urls).toContain(en);
      expect(urls).toContain(zh);
    }
  });

  it("双语条目都带 en / zh-Hans 两个 alternates", () => {
    const entries = marketingEntries(BASE, new Date());
    const home = entries.find((e) => e.url === `${BASE}/`);
    expect(home?.alternates?.languages).toEqual({
      en: `${BASE}/`,
      "zh-Hans": `${BASE}/zh`,
    });
  });

  it("尚未国际化的营销页只出英文侧单条，不伪造 /zh 链接", () => {
    const urls = marketingEntries(BASE, new Date()).map((e) => e.url);
    expect(urls).toContain(`${BASE}/pricing`);
    expect(urls).not.toContain(`${BASE}/zh/pricing`);
  });

  it("不产生重复 URL", () => {
    const urls = marketingEntries(BASE, new Date()).map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm vitest run lib/seo/sitemap-entries.test.ts
```

预期：FAIL，找不到模块 `./sitemap-entries`。

- [ ] **Step 3: 实现 sitemap-entries.ts**

```ts
// lib/seo/sitemap-entries.ts
// 平台主域营销面的 sitemap 条目（纯函数，便于测试）。
// 已进入 LOCALIZED_ROUTES 的路由出双语两条并互挂 hreflang；
// 尚未国际化的页面只出当前（中文内容占据的）英文侧路径单条——不伪造 /zh 链接，
// 否则 sitemap 会指向 404，损伤收录。
import type { MetadataRoute } from "next";
import { locales, hreflang, defaultLocale } from "@/lib/i18n/config";
import { LOCALIZED_ROUTES, localePath } from "@/lib/i18n/routes";
import { Routes } from "@/lib/constants";

const PRIORITY: Record<string, number> = {
  "/": 1,
  [Routes.Templates]: 0.9,
  [Routes.Pricing]: 0.8,
  [Routes.Guides]: 0.8,
  [Routes.AntiBan]: 0.6,
};

/** 尚未国际化的营销页（后续 PR 逐条从这里移入 LOCALIZED_ROUTES）。 */
const PENDING_ROUTES = [Routes.Pricing, Routes.AntiBan, Routes.Templates, Routes.Guides] as const;

export function marketingEntries(base: string, now: Date): MetadataRoute.Sitemap {
  const abs = (path: string) => (path === "/" ? `${base}/` : `${base}${path}`);
  const entries: MetadataRoute.Sitemap = [];

  for (const route of LOCALIZED_ROUTES) {
    const languages: Record<string, string> = {};
    for (const l of locales) languages[hreflang[l]] = abs(localePath(l, route));
    for (const l of locales) {
      entries.push({
        url: abs(localePath(l, route)),
        lastModified: now,
        changeFrequency: "weekly",
        priority: l === defaultLocale ? (PRIORITY[route] ?? 0.7) : (PRIORITY[route] ?? 0.7) * 0.9,
        alternates: { languages },
      });
    }
  }

  for (const route of PENDING_ROUTES) {
    entries.push({
      url: abs(route),
      lastModified: now,
      changeFrequency: "monthly",
      priority: PRIORITY[route] ?? 0.7,
    });
  }

  return entries;
}
```

- [ ] **Step 4: 接入 app/sitemap.ts**

把 `app/sitemap.ts` 里主域分支的 `marketing` 数组整段换成 `marketingEntries(base, now)`，模板与指南条目保持原样（各自 PR 再双语化）。租户自有域分支完全不动。

- [ ] **Step 5: 跑测试确认通过**

```bash
pnpm vitest run lib/seo/sitemap-entries.test.ts && pnpm exec tsc --noEmit
```

预期：全绿。

- [ ] **Step 6: 提交**

```bash
git add lib/seo/sitemap-entries.ts lib/seo/sitemap-entries.test.ts app/sitemap.ts
git commit -m "feat: sitemap 输出双语条目与 hreflang"
```

---

## Task 7: nav / footer 字典化 + 语言切换器

**Files:**
- Modify: `components/marketing/chrome.tsx`
- Create: `components/marketing/LocaleSwitcher.tsx`

- [ ] **Step 1: 实现切换器**

```tsx
// components/marketing/LocaleSwitcher.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath, stripLocale } from "@/lib/i18n/routes";
import type { Locale } from "@/lib/i18n/config";

/**
 * 语言切换器：URL 是语言的唯一事实源。
 * 不写 cookie、不做 Accept-Language 自动重定向——自动重定向会让爬虫按出口 IP
 * 拿到非预期语言版本，污染 canonical / hreflang 信号（见设计文档 §4.5）。
 */
export function LocaleSwitcher({ locale, className }: { locale: Locale; className?: string }) {
  const pathname = usePathname();
  const { pathname: bare } = stripLocale(pathname ?? "/");
  const target: Locale = locale === "en" ? "zh" : "en";
  const t = getDictionary(locale).common.localeSwitcher;

  return (
    <Link
      href={localePath(target, bare)}
      hrefLang={target === "en" ? "en" : "zh-Hans"}
      aria-label={t.ariaLabel}
      className={className}
    >
      {target === "en" ? t.toEn : t.toZh}
    </Link>
  );
}
```

- [ ] **Step 2: chrome.tsx 接 locale**

`SiteNav`、`SiteFooter`、`PricingLink` 三处签名加 `locale: Locale`：

- `SiteNav({ fonts, locale })`：取 `const t = getDictionary(locale).common;`，六个链接文案换成 `t.nav.*`，`href` 全部包一层 `localePath(locale, Routes.X)`，并在「登录」前插入 `<LocaleSwitcher locale={locale} className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-aqua-700" />`
- `SiteFooter({ fonts, locale })`：同理换 `t.footer.*` 与 `localePath`，并在链接组末尾加同款切换器
- `PricingLink({ locale, ... })`：默认 `href` 从 `` `${Routes.Home}#pricing` `` 改为 `` `${localePath(locale, Routes.Home)}#pricing` ``，滚动拦截逻辑不动

`SectionHead`、`Backdrop`、`fadeUp` 不涉及文案，保持不变。

- [ ] **Step 3: 验证**

```bash
pnpm exec tsc --noEmit && pnpm exec eslint components/marketing
```

预期：无输出。

- [ ] **Step 4: 提交**

```bash
git add components/marketing/chrome.tsx components/marketing/LocaleSwitcher.tsx
git commit -m "feat: 站点导航与页脚字典化并接入语言切换器"
```

---

## Task 8: MarketingHome 字典化

**Files:**
- Modify: `components/marketing/MarketingHome.tsx`

这是机械替换：文件顶部的四个数据常量改为从字典派生，各分区组件多接一个字典切片。

- [ ] **Step 1: 数据常量改为字典派生**

`PLATFORMS` 是品牌名数组（`"Meta Pixel"` 等），**不翻译，保持不变**。

`STEPS` / `FEATURES` / `FUNNEL` 三个常量删除其中的中文，改为在组件内把字典与图标拼装：

```tsx
const STEP_ICONS = [LayoutTemplate, Pencil, Globe] as const;
const STEP_NOS = ["01", "02", "03"] as const;

const FEATURE_ICONS = {
  templates: LayoutTemplate, editor: Pencil, domain: Globe,
  tracking: Radar, antiBan: ShieldCheck, ai: Sparkles,
} as const;

const FUNNEL_ICONS = {
  consent: Lock, pixels: Radar, capture: MousePointerClick, forwarding: BarChart3,
} as const;
```

`FEATURES` 中 antiBan 那条的 `link.href` 改为 `localePath(locale, Routes.AntiBan)`，label 取 `t.features.items.antiBan.linkLabel`。

- [ ] **Step 2: 组件签名统一加 locale + 字典**

`MarketingHome` 签名改为：

```tsx
export default function MarketingHome({ fonts, locale }: { fonts: Fonts; locale: Locale }) {
  const t = getDictionary(locale).home;
  return (
    <div className={`relative min-h-screen bg-background text-foreground ${fonts.body}`}>
      <Backdrop />
      <div className="relative">
        <SiteNav fonts={fonts} locale={locale} />
        <main>
          <Hero fonts={fonts} locale={locale} t={t} />
          <LogoMarquee fonts={fonts} t={t} />
          <Steps fonts={fonts} t={t} />
          <Features fonts={fonts} locale={locale} t={t} />
          <TrackingShowcase fonts={fonts} t={t} />
          <Pricing fonts={fonts} locale={locale} t={t} />
          <FinalCTA fonts={fonts} locale={locale} t={t} />
        </main>
        <SiteFooter fonts={fonts} locale={locale} />
      </div>
    </div>
  );
}
```

`type HomeDict = Dictionary["home"]`，各子组件参数加 `t: HomeDict`。只有需要出链接的（Hero / Features / Pricing / FinalCTA）才要 `locale`。

- [ ] **Step 3: 逐区替换硬编码中文**

按 Task 2 Step 4 的对照表，把每处中文换成对应 `t.*`。所有 `<Link href={Routes.X}>` 换成 `<Link href={localePath(locale, Routes.X)}>`。`Pricing` 区的 `PlanComparison` 传 `locale={locale}`，`ctaFor` 的两个 label 取 `t.pricing.ctaFree` / `t.pricing.ctaPaid`。

Hero 的 `heroRise` 入场动画（只做位移、不做 opacity，保 LCP 首帧可见）**必须原样保留**——这是既有的性能优化，不要在替换文案时顺手改掉。

- [ ] **Step 4: 确认无残留中文**

```bash
grep -n '[一-龥]' components/marketing/MarketingHome.tsx
```

预期：只剩注释里的中文，JSX 与数据里应为零。

- [ ] **Step 5: 验证**

```bash
pnpm exec tsc --noEmit && pnpm exec eslint components/marketing/MarketingHome.tsx
```

预期：无输出。

- [ ] **Step 6: 提交**

```bash
git add components/marketing/MarketingHome.tsx
git commit -m "feat: 首页组件全量字典化"
```

---

## Task 9: 路由薄壳（`/` 与 `/zh`）

**Files:**
- Modify: `app/page.tsx`
- Create: `app/zh/layout.tsx`
- Create: `app/zh/page.tsx`

- [ ] **Step 1: 抽出共享首页壳**

创建 `components/marketing/pages/Home.tsx`：

```tsx
import type { Metadata } from "next";
import { fontBody, fontHead, fontMono } from "@/lib/fonts";
import MarketingHome from "@/components/marketing/MarketingHome";
import { Routes } from "@/lib/constants";
import { marketingMetadata, siteStructuredData } from "@/lib/seo/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

export function homeMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale).home.meta;
  return {
    ...marketingMetadata({
      locale,
      title: t.title,
      description: t.description,
      path: Routes.Home,
      ogDescription: t.ogDescription,
    }),
    // GSC URL 前缀验证只注入英文首页，避免重复标签
    ...(locale === "en"
      ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION || undefined } }
      : {}),
  };
}

export function HomeView({ locale }: { locale: Locale }) {
  return (
    <>
      <JsonLd data={siteStructuredData(locale)} />
      <MarketingHome
        locale={locale}
        fonts={{ display: fontHead.className, body: fontBody.className, mono: fontMono.className }}
      />
    </>
  );
}
```

- [ ] **Step 2: 英文壳**

```tsx
// app/page.tsx
import { homeMetadata, HomeView } from "@/components/marketing/pages/Home";

export const metadata = homeMetadata("en");

export default function Page() {
  return <HomeView locale="en" />;
}
```

- [ ] **Step 3: 中文子树布局**

```tsx
// app/zh/layout.tsx
// 根布局是全站唯一能输出 <html> 的地方，故 /zh 子树只能在内层声明语言（设计文档 §5.1）。
// SSR 首帧 <html lang> 仍是 en；语言信号由 hreflang + og:locale + JSON-LD inLanguage 承担，
// 此处的嵌套 lang 保证屏幕阅读器读到正确语言，客户端再同步 documentElement。
import { htmlLang } from "@/lib/i18n/config";
import { SyncHtmlLang } from "@/components/marketing/SyncHtmlLang";

export default function ZhLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang={htmlLang.zh}>
      <SyncHtmlLang lang={htmlLang.zh} />
      {children}
    </div>
  );
}
```

```tsx
// components/marketing/SyncHtmlLang.tsx
"use client";

import { useEffect } from "react";

/** 把 <html lang> 同步为当前子树语言（仅影响客户端 DOM，SSR 首帧不变）。 */
export function SyncHtmlLang({ lang }: { lang: string }) {
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = lang;
    return () => { document.documentElement.lang = previous; };
  }, [lang]);
  return null;
}
```

- [ ] **Step 4: 中文壳**

```tsx
// app/zh/page.tsx
import { homeMetadata, HomeView } from "@/components/marketing/pages/Home";

export const metadata = homeMetadata("zh");

export default function Page() {
  return <HomeView locale="zh" />;
}
```

- [ ] **Step 5: 构建验证**

```bash
pnpm exec tsc --noEmit && pnpm build
```

预期：构建成功，产物中出现 `/` 与 `/zh` 两条路由。

> 备注：本地 `pnpm build` 可能因网络封锁 Google Fonts 而失败（既有已知问题，见项目记录）。若出现字体下载失败，记录该现象并依赖 CI 构建结论，**不要**为绕过它去改字体配置。

- [ ] **Step 6: 提交**

```bash
git add app/page.tsx app/zh components/marketing/pages components/marketing/SyncHtmlLang.tsx
git commit -m "feat: 首页双语路由上线（/ 英文，/zh 中文）"
```

---

## Task 10: 路由镜像对等性测试

方案 B 的固有风险是「加了营销页忘补 `app/zh` 镜像」。这个测试是唯一的机械兜底。

**Files:**
- Modify: `lib/i18n/routes.test.ts`

- [ ] **Step 1: 追加测试**

```ts
import { existsSync } from "node:fs";
import { join } from "node:path";

describe("app/zh 镜像对等性", () => {
  const appDir = join(process.cwd(), "app");

  /** 路由 "/" → app/page.tsx；"/pricing" → app/pricing/page.tsx。 */
  const enPageFor = (route: string) =>
    route === "/" ? join(appDir, "page.tsx") : join(appDir, route.slice(1), "page.tsx");
  const zhPageFor = (route: string) =>
    route === "/" ? join(appDir, "zh", "page.tsx") : join(appDir, "zh", route.slice(1), "page.tsx");

  it.each(LOCALIZED_ROUTES)("%s 同时存在英文与中文页面文件", (route) => {
    expect(existsSync(enPageFor(route)), `缺英文页：${enPageFor(route)}`).toBe(true);
    expect(existsSync(zhPageFor(route)), `缺中文镜像：${zhPageFor(route)}`).toBe(true);
  });

  it("app/zh 子树存在语言布局", () => {
    expect(existsSync(join(appDir, "zh", "layout.tsx"))).toBe(true);
  });
});
```

- [ ] **Step 2: 验证测试能真的失败**

临时把 `app/zh/page.tsx` 改名，跑测试：

```bash
mv app/zh/page.tsx app/zh/page.tsx.bak && pnpm vitest run lib/i18n/routes.test.ts; mv app/zh/page.tsx.bak app/zh/page.tsx
```

预期：先 FAIL 并打印「缺中文镜像」，恢复后重跑 PASS。**这一步不能跳过**——没见过失败的测试不算数。

- [ ] **Step 3: 确认通过**

```bash
pnpm vitest run lib/i18n/routes.test.ts
```

预期：PASS。

- [ ] **Step 4: 提交**

```bash
git add lib/i18n/routes.test.ts
git commit -m "test: 新增 app/zh 路由镜像对等性校验"
```

---

## Task 11: `/zh/login` 已登录跳转

`proxy.ts` 零改动。`auth-proxy.ts` 的受保护前缀判定也不动——`/zh/admin` 不是已注册路由，直接 404，不存在绕过。只补一个体验缺口。

**Files:**
- Modify: `lib/proxy/auth-proxy.ts`
- Modify: `lib/proxy/auth-proxy.test.ts`

- [ ] **Step 1: 写失败测试**

先读 `lib/proxy/auth-proxy.test.ts` 现有的用例写法与 mock 构造方式，沿用同款风格追加：

```ts
it("已登录访问 /zh/login 跳转 /admin", () => {
  const res = handleAuth(makeReq("/zh/login", { user: { role: UserRole.USER } }));
  expect(res?.status).toBe(307);
  expect(res?.headers.get("location")).toContain("/admin");
});

it("已登录访问 /zh/register 跳转 /admin", () => {
  const res = handleAuth(makeReq("/zh/register", { user: { role: UserRole.USER } }));
  expect(res?.status).toBe(307);
  expect(res?.headers.get("location")).toContain("/admin");
});

it("未登录访问 /zh/login 放行", () => {
  expect(handleAuth(makeReq("/zh/login", null))).toBeNull();
});

it("/zh 首页始终放行", () => {
  expect(handleAuth(makeReq("/zh", null))).toBeNull();
});

it("/zh/admin 不被当作受保护后台（它不是已注册路由，交给 Next 出 404）", () => {
  expect(handleAuth(makeReq("/zh/admin", null))).toBeNull();
});
```

`makeReq` 用现有文件里的辅助函数；若命名不同，按现有写法调整。

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm vitest run lib/proxy/auth-proxy.test.ts
```

预期：前两个用例 FAIL（返回 null 而非 307）。

- [ ] **Step 3: 最小实现**

`handleAuth` 中原有：

```ts
if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
```

改为：

```ts
// 中文镜像路由同样适用（/zh/login、/zh/register）
const AUTH_ENTRY_PATHS = new Set(["/login", "/register", "/zh/login", "/zh/register"]);
if (isLoggedIn && AUTH_ENTRY_PATHS.has(pathname)) {
```

- [ ] **Step 4: 跑测试确认通过**

```bash
pnpm vitest run lib/proxy/auth-proxy.test.ts
```

预期：PASS，且**既有用例一条不红**。

- [ ] **Step 5: 提交**

```bash
git add lib/proxy/auth-proxy.ts lib/proxy/auth-proxy.test.ts
git commit -m "fix: 已登录访问中文登录/注册页同样跳转后台"
```

---

## Task 12: E2E 与全量验证

**Files:**
- Create: `e2e/i18n.spec.ts`

- [ ] **Step 1: 写 E2E**

```ts
// e2e/i18n.spec.ts
// 双语首页：/ 出英文、/zh 出中文，切换器往返保持路径，hreflang 齐备，后台与租户页不受影响。
// 不依赖数据库 fixture，故无需 RUN_DB_E2E。
import { test, expect } from "@playwright/test";

test.describe("营销站双语", () => {
  test("/ 渲染英文首页", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Ad-ready landing pages");
    await expect(page.getByRole("link", { name: "Start free" }).first()).toBeVisible();
  });

  test("/zh 渲染中文首页", async ({ page }) => {
    await page.goto("/zh");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("投放级落地页");
    await expect(page.getByRole("link", { name: "免费开始" }).first()).toBeVisible();
  });

  test("切换器往返保持在首页", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "中文" }).first().click();
    await expect(page).toHaveURL(/\/zh$/);
    await page.getByRole("link", { name: "English" }).first().click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("两种语言的 head 都含完整 hreflang", async ({ page }) => {
    for (const path of ["/", "/zh"]) {
      await page.goto(path);
      const langs = await page.locator('link[rel="alternate"][hreflang]').evaluateAll(
        (els) => els.map((e) => e.getAttribute("hreflang")),
      );
      expect(langs).toContain("en");
      expect(langs).toContain("zh-Hans");
      expect(langs).toContain("x-default");
    }
  });

  test("中文页 canonical 指向 /zh", async ({ page }) => {
    await page.goto("/zh");
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toMatch(/\/zh$/);
  });

  test("/zh 下的套餐对比表也是中文", async ({ page }) => {
    await page.goto("/zh");
    await expect(page.getByText("最受欢迎").first()).toBeVisible();
  });

  test("未国际化的后台入口不受影响：/zh/admin 返回 404", async ({ page }) => {
    const res = await page.goto("/zh/admin");
    expect(res?.status()).toBe(404);
  });
});
```

- [ ] **Step 2: 跑 E2E**

先确认 3001 端口是否已有用户自己启动的 dev server（有就复用，`reuseExistingServer` 已配好，**不要 kill 用户的进程**）：

```bash
lsof -i :3001 | head
pnpm test:e2e e2e/i18n.spec.ts
```

预期：7 个用例全绿。若失败，读完整报错再定位，不要盲改选择器。

- [ ] **Step 3: 全量验证门槛**

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm lint && pnpm build
```

四条全部要看到成功退出码。`pnpm build` 若因 Google Fonts 网络问题失败，如实记录并说明依赖 CI 结论，不得据此声称「构建通过」。

- [ ] **Step 4: 人工走查**

启动 dev（若未在跑），浏览器实际打开确认：

- `/` 英文首页完整，无中文残留（特别检查套餐对比表、footer、hero 下方小字）
- `/zh` 中文首页与改造前视觉一致
- 切换器在 nav 与 footer 都能用，往返正常
- 首页 `#pricing` 锚点滚动在两种语言下都正常（`PricingLink` 的拦截逻辑）
- 页面源码里 `/zh` 页的 `<div lang="zh-Hans">` 存在

- [ ] **Step 5: 提交并推送**

```bash
git add e2e/i18n.spec.ts
git commit -m "test: 新增营销站双语 E2E"
git branch --show-current   # 必须是 feat_20260727_营销站国际化
git branch -vv | grep 国际化 # 确认后面不是 [origin/main]
git push -u origin feat_20260727_营销站国际化:feat_20260727_营销站国际化
```

- [ ] **Step 6: 更新过程文档**

在 `docs/feat_20260727_营销站国际化/` 下新建 `test-results.md`，如实记录本 PR 各层验证的实际输出（命令、退出码、失败项）。有跳过的步骤要写明跳过原因。

---

## 自检对照（本计划 vs 设计文档）

| 设计文档章节 | 覆盖它的 Task |
| --- | --- |
| §3.1 物理布局 | Task 9 |
| §3.2 页面薄壳 | Task 9 Step 1–4 |
| §3.3 LOCALIZED_ROUTES 单一事实源 | Task 1、Task 6、Task 10 |
| §4.1 字典 key 编译期一致性 | Task 2 |
| §4.2 props 传递不引 Context | Task 7、Task 8 |
| §4.4 localePath 守卫 | Task 1 |
| §4.5 语言切换器 / 不写 cookie | Task 7 |
| §5 SEO 表（SITE_LOCALE / 描述 / metadata / JSON-LD / sitemap） | Task 5、Task 6 |
| §5.1 `<html lang>` 妥协方案 | Task 9 Step 3 |
| §6.1 plans.ts 文案外提 | Task 3、Task 4 |
| §7 鉴权面 | Task 11 |
| §10 验证策略 | Task 12 |

**本 PR 明确不覆盖**（属后续 PR）：§6.2 registry.ts 模板文案、§6.3 TemplateArchetype slug 化、pricing / anti-ban / templates / guides / privacy / terms 各页正文、llms.txt 英文化。这些页面在本 PR 中通过 Task 5 Step 4 显式传 `locale: "zh"` 维持现状不变。
