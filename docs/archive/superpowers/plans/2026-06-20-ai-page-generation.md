# AI 一键成页 + 区块改写 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让用户选定模板后，由 OpenAI 依据模板「只填文案」生成可投放落地页，并提供编辑器内区块级 AI 改写，全程受额度计费与双层护栏约束。

**Architecture:** 新增 `lib/ai/` 纯逻辑模块（槽位抽取/合并、prompt、护栏、编排、用量），AI 只填模板文案、结构由代码保证；两个 API 路由（整页生成 / 区块改写）复用现有鉴权与建页 store；新增 `ai_usage` 表 + `users.ai_credit_balance` 列做计量；credits 经现有 LemonSqueezy webhook 加购。

**Tech Stack:** Next 16 App Router、TypeScript、`openai` ^6（Structured Outputs）、`zod` ^4、`pg` + node-pg-migrate、Vitest（本计划新增单测）、Playwright（既有 e2e）。

参考 spec：`docs/superpowers/specs/2026-06-20-ai-page-generation-design.md`

---

## 文件结构总览

| 文件 | 创建/修改 | 职责 |
|---|---|---|
| `vitest.config.ts` | 创建 | 单测运行配置（含 `@/` 别名） |
| `lib/ai/types.ts` | 创建 | `Slot` / `GenerationBrief` / `RewriteRequest` / `RewriteResult` 等共享类型 |
| `lib/ai/slots.ts` | 创建 | `deriveSlots` / `mergeSlots`（纯函数，仅文案） |
| `lib/ai/guardrails.ts` | 创建 | 交易禁词扫描、生成后合规校验、候选剔除 |
| `lib/ai/prompt.ts` | 创建 | system / user prompt 构造、slot 结构化输出 schema |
| `lib/ai/client.ts` | 创建 | OpenAI 封装 + 可注入 fake（测试/e2e 用） |
| `lib/ai/generate.ts` | 创建 | 编排：抽槽→调模型→合并→校验→重试 |
| `lib/ai/usage.ts` | 创建 | 额度/credits 检查与扣减、用量汇总 |
| `lib/plans.ts` | 修改 | 新增 `aiPageQuota` / `aiRewriteQuota` + 两行对比 |
| `migrations/012_add_ai_usage.js` | 创建 | `ai_usage` 表 + `users.ai_credit_balance` 列 |
| `app/api/landing-pages/generate/route.ts` | 创建 | 整页生成路由 |
| `app/api/ai/rewrite/route.ts` | 创建 | 区块改写路由 |
| `app/api/webhooks/lemonsqueezy/route.ts` | 修改 | 一次性订单 → 加 credits |
| `components/ai/GeneratePageDialog.tsx` | 创建 | 引导表单弹窗（整页生成入口） |
| `landing-editor/components/TemplateGallery.tsx` | 修改 | 模板卡片增「用 AI 填充」入口 |
| `landing-editor/forms/fields.tsx` | 修改 | 文本字段增「✨ AI 改写」按钮 |
| `e2e/ai-generate.spec.ts` | 创建 | 端到端（fake AI client） |

---

## Task 1: 引入 Vitest 单测基础设施

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`（scripts + devDependencies）
- Create: `lib/ai/__tests__/smoke.test.ts`（临时验证，最后一步删）

- [ ] **Step 1: 安装 vitest**

Run:
```bash
pnpm add -D vitest@^3
```
Expected: `package.json` 的 devDependencies 出现 `vitest`。

- [ ] **Step 2: 创建 vitest 配置（含 `@/` 别名，匹配 tsconfig paths）**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "lib/**/__tests__/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**"],
  },
});
```

- [ ] **Step 3: 加 test 脚本**

Modify `package.json` scripts，在 `"test:e2e"` 上方加：
```json
    "test": "vitest run",
    "test:watch": "vitest",
```

- [ ] **Step 4: 写冒烟测试确认 runner 工作**

Create `lib/ai/__tests__/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("vitest smoke", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: 运行**

Run: `pnpm test`
Expected: PASS（1 passed）。

- [ ] **Step 6: 删冒烟测试并提交**

```bash
rm lib/ai/__tests__/smoke.test.ts
git add package.json pnpm-lock.yaml vitest.config.ts
git commit -m "chore(test): 引入 vitest 单测基础设施"
```

---

## Task 2: PLANS 扩展（AI 额度字段 + 对比行）

**Files:**
- Modify: `lib/plans.ts`
- Test: `lib/plans.test.ts`

- [ ] **Step 1: 写失败测试**

Create `lib/plans.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { PLANS } from "@/lib/plans";

describe("PLANS AI 额度", () => {
  it("各套餐整页/改写额度符合 spec", () => {
    expect(PLANS.free.aiPageQuota).toBe(3);
    expect(PLANS.free.aiRewriteQuota).toBe(10);
    expect(PLANS.starter.aiPageQuota).toBe(15);
    expect(PLANS.starter.aiRewriteQuota).toBe(100);
    expect(PLANS.pro.aiPageQuota).toBe(80);
    expect(PLANS.pro.aiRewriteQuota).toBe(Infinity);
    expect(PLANS.agency.aiPageQuota).toBe(300);
    expect(PLANS.agency.aiRewriteQuota).toBe(Infinity);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm test lib/plans.test.ts`
Expected: FAIL（`aiPageQuota` undefined）。

- [ ] **Step 3: 实现**

Modify `lib/plans.ts`：在 `PlanConfig` interface 的 `aiTranslation: boolean;` 下加：
```ts
  // AI 用量（月额度；Infinity = 不限）
  aiPageQuota: number;
  aiRewriteQuota: number;
```

在每个套餐对象补字段：
- `free`: `aiPageQuota: 3, aiRewriteQuota: 10,`
- `starter`: `aiPageQuota: 15, aiRewriteQuota: 100,`
- `pro`: `aiPageQuota: 80, aiRewriteQuota: Infinity,`
- `agency`: `aiPageQuota: 300, aiRewriteQuota: Infinity,`

在 `PLAN_FEATURE_ROWS` 数组末尾加两行：
```ts
  { label: "AI 整页生成", valueFor: (p) => fmtLimit(p.aiPageQuota, "次/月") },
  { label: "AI 智能改写", valueFor: (p) => fmtLimit(p.aiRewriteQuota, "次/月") },
```

- [ ] **Step 4: 运行确认通过**

Run: `pnpm test lib/plans.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add lib/plans.ts lib/plans.test.ts
git commit -m "feat(plans): 套餐新增 AI 整页/改写月额度字段与对比行"
```

---

## Task 3: 共享类型 + 槽位抽取/合并（核心纯函数）

**Files:**
- Create: `lib/ai/types.ts`
- Create: `lib/ai/slots.ts`
- Test: `lib/ai/slots.test.ts`

- [ ] **Step 1: 定义共享类型**

Create `lib/ai/types.ts`:
```ts
import type { LandingSectionType } from "@/types/schema.draft";

/** 单个可填文案槽位：path 为 draft 内定位路径，id 为其字符串形式。 */
export interface Slot {
  id: string;                 // 如 "hero.title" / "sections.2.data.items.0.q"
  path: (string | number)[];  // 与 id 对应的结构化路径
  label: string;              // 给模型的人类可读标签（取末段 key）
  text: string;               // 当前文案
}

/** 模型回填结果：按 id 给出新文案。 */
export interface FilledSlot {
  id: string;
  text: string;
}

/** 整页生成的引导表单输入。 */
export interface GenerationBrief {
  productName: string;
  description: string;
  targetAudience?: string;
  tone?: string;
  keyBenefits?: string[];
  ctaGoal?: string;
  language?: string;
  pastedIntro?: string;
}

/** 区块改写请求。 */
export interface RewriteRequest {
  sectionType: LandingSectionType | "hero" | "footer";
  field: string;
  currentText: string;
  instruction?: string;
  brief?: Partial<GenerationBrief>;
}

export interface RewriteResult {
  candidates: string[];
}
```

- [ ] **Step 2: 写失败测试（含核心不变式）**

Create `lib/ai/slots.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { deriveSlots, mergeSlots } from "@/lib/ai/slots";
import { TEMPLATES } from "@/landing-editor/samples/registry";

describe("deriveSlots / mergeSlots", () => {
  it("round-trip：抽取再合并等于原 draft（所有模板）", () => {
    for (const t of TEMPLATES) {
      const slots = deriveSlots(t.draft);
      const rebuilt = mergeSlots(t.draft, slots);
      expect(rebuilt).toEqual(t.draft);
    }
  });

  it("只抽文案，不抽图片/链接/类型等字段", () => {
    const slots = deriveSlots(TEMPLATES[0].draft);
    const ids = slots.map((s) => s.id);
    expect(ids).toContain("hero.title");
    expect(ids.some((id) => id.endsWith(".src"))).toBe(false);
    expect(ids.some((id) => id.endsWith(".link"))).toBe(false);
    expect(ids.some((id) => id.endsWith(".type"))).toBe(false);
  });

  it("mergeSlots 写回新文案且不改原对象", () => {
    const draft = TEMPLATES[0].draft;
    const slots = deriveSlots(draft);
    const merged = mergeSlots(draft, [{ id: slots[0].id, path: slots[0].path, label: slots[0].label, text: "新标题XYZ" }]);
    // 找到 hero.title 这条
    const titleSlot = deriveSlots(merged).find((s) => s.id === slots[0].id);
    expect(titleSlot?.text).toBe("新标题XYZ");
    expect(draft).toEqual(mergeSlots(draft, deriveSlots(draft))); // 原对象不被破坏
  });
});
```

- [ ] **Step 3: 运行确认失败**

Run: `pnpm test lib/ai/slots.test.ts`
Expected: FAIL（`deriveSlots` 未定义）。

- [ ] **Step 4: 实现 slots.ts**

Create `lib/ai/slots.ts`:
```ts
import type { LandingPageDraft } from "@/types/schema.draft";
import type { Slot, FilledSlot } from "./types";

/** 这些 string 键不是营销文案，跳过：图片/链接/枚举/标识/图标/时间。 */
const NON_TEXT_KEYS = new Set([
  "src", "link", "poster", "id", "provider", "type",
  "endsAt", "alt", "icon", "emoji", "channel",
]);

/** 递归抽取所有营销文案字段。 */
export function deriveSlots(draft: LandingPageDraft): Slot[] {
  const slots: Slot[] = [];

  const walk = (value: unknown, path: (string | number)[]) => {
    if (typeof value === "string") {
      const key = String(path[path.length - 1] ?? "");
      if (NON_TEXT_KEYS.has(key)) return;
      slots.push({ id: path.join("."), path: [...path], label: key, text: value });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, [...path, i]));
      return;
    }
    if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) {
        if (NON_TEXT_KEYS.has(k) && typeof v === "string") continue;
        walk(v, [...path, k]);
      }
    }
  };

  walk(draft as unknown, []);
  return slots;
}

/** 把回填文案合并回 draft（深拷贝，不改原对象）。未知 id 忽略。 */
export function mergeSlots(
  draft: LandingPageDraft,
  filled: Array<Slot | FilledSlot>,
): LandingPageDraft {
  const clone: LandingPageDraft = structuredClone(draft);
  const byId = new Map<string, (string | number)[]>(
    deriveSlots(draft).map((s) => [s.id, s.path]),
  );

  for (const f of filled) {
    const path = "path" in f && f.path ? f.path : byId.get(f.id);
    if (!path) continue;
    let cur: any = clone;
    for (let i = 0; i < path.length - 1; i++) cur = cur?.[path[i]];
    if (cur && typeof cur === "object") cur[path[path.length - 1]] = f.text;
  }
  return clone;
}
```

- [ ] **Step 5: 运行确认通过**

Run: `pnpm test lib/ai/slots.test.ts`
Expected: PASS（3 passed）。

- [ ] **Step 6: 提交**

```bash
git add lib/ai/types.ts lib/ai/slots.ts lib/ai/slots.test.ts
git commit -m "feat(ai): 槽位抽取/合并纯函数（仅文案，结构不变式）"
```

---

## Task 4: 护栏（交易禁词 + 生成后合规校验）

**Files:**
- Create: `lib/ai/guardrails.ts`
- Test: `lib/ai/guardrails.test.ts`

- [ ] **Step 1: 写失败测试**

Create `lib/ai/guardrails.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { findBannedTerms, filterCandidates, checkDraftCompliance } from "@/lib/ai/guardrails";
import { TEMPLATES } from "@/landing-editor/samples/registry";

describe("findBannedTerms", () => {
  it("命中英文交易词", () => {
    expect(findBannedTerms("Add to cart and checkout now").length).toBeGreaterThan(0);
  });
  it("命中中文交易词", () => {
    expect(findBannedTerms("立即购买，加入购物车").length).toBeGreaterThan(0);
  });
  it("命中价格符号模式", () => {
    expect(findBannedTerms("only $49 today").length).toBeGreaterThan(0);
  });
  it("干净的 lead-gen 文案放行", () => {
    expect(findBannedTerms("免费预约咨询，留下您的 WhatsApp")).toEqual([]);
  });
});

describe("filterCandidates", () => {
  it("剔除含禁词的候选", () => {
    expect(filterCandidates(["免费咨询", "now only $9 buy now"])).toEqual(["免费咨询"]);
  });
});

describe("checkDraftCompliance", () => {
  it("合法模板通过", () => {
    const r = checkDraftCompliance(TEMPLATES[0].draft);
    expect(r.ok).toBe(true);
  });
  it("含交易词的 draft 被拒", () => {
    const bad = structuredClone(TEMPLATES[0].draft);
    bad.hero.title = "立即购买 buy now";
    const r = checkDraftCompliance(bad);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("banned_terms");
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm test lib/ai/guardrails.test.ts`
Expected: FAIL（未定义）。

- [ ] **Step 3: 实现 guardrails.ts**

Create `lib/ai/guardrails.ts`:
```ts
import type { LandingPageDraft } from "@/types/schema.draft";
import { isLandingPageStructureValid } from "@/types/schema.draft";
import { deriveSlots } from "./slots";

const BANNED_PATTERNS: RegExp[] = [
  /\b(checkout|add to cart|buy now|order now|subscribe|refund|coupon|discount code)\b/i,
  /购物车|立即购买|马上下单|加入购物车|立即下单|退款|优惠码|折扣码|货到付款/,
  /(?:\$|¥|€|£)\s?\d/,            // 价格符号 + 数字
  /\b\d+(?:\.\d+)?\s?(?:usd|cny|eur|gbp)\b/i,
];

/** 返回命中的禁词/模式片段（空数组表示干净）。 */
export function findBannedTerms(text: string): string[] {
  const hits: string[] = [];
  for (const re of BANNED_PATTERNS) {
    const m = text.match(re);
    if (m) hits.push(m[0]);
  }
  return hits;
}

/** 从候选文案中剔除含禁词的项。 */
export function filterCandidates(candidates: string[]): string[] {
  return candidates.filter((c) => findBannedTerms(c).length === 0);
}

export type ComplianceReason = "banned_terms" | "invalid_structure";

export interface ComplianceResult {
  ok: boolean;
  reason?: ComplianceReason;
  detail?: string;
}

/** 生成后合规校验：禁词扫描 + 结构合法性。 */
export function checkDraftCompliance(draft: LandingPageDraft): ComplianceResult {
  for (const slot of deriveSlots(draft)) {
    const hits = findBannedTerms(slot.text);
    if (hits.length > 0) {
      return { ok: false, reason: "banned_terms", detail: `${slot.id}: ${hits.join(", ")}` };
    }
  }
  if (!isLandingPageStructureValid(draft)) {
    return { ok: false, reason: "invalid_structure" };
  }
  return { ok: true };
}
```

- [ ] **Step 4: 运行确认通过**

Run: `pnpm test lib/ai/guardrails.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add lib/ai/guardrails.ts lib/ai/guardrails.test.ts
git commit -m "feat(ai): 交易禁词扫描与生成后合规护栏"
```

---

## Task 5: Prompt 构造 + 结构化输出 schema

**Files:**
- Create: `lib/ai/prompt.ts`
- Test: `lib/ai/prompt.test.ts`

- [ ] **Step 1: 写失败测试**

Create `lib/ai/prompt.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { buildSystemPrompt, buildFillUserPrompt, slotFillJsonSchema } from "@/lib/ai/prompt";
import { deriveSlots } from "@/lib/ai/slots";
import { TEMPLATES } from "@/landing-editor/samples/registry";

describe("prompt 构造", () => {
  it("system prompt 含非交易护栏与不编造证据要求", () => {
    const sys = buildSystemPrompt();
    expect(sys).toMatch(/lead|留资|咨询/i);
    expect(sys).toMatch(/不得|禁止|must not/i);
  });

  it("user prompt 含 brief 与槽位 id", () => {
    const slots = deriveSlots(TEMPLATES[0].draft);
    const prompt = buildFillUserPrompt(
      { productName: "Acme", description: "B2B 咨询" },
      slots,
    );
    expect(prompt).toContain("Acme");
    expect(prompt).toContain(slots[0].id);
  });

  it("slotFillJsonSchema 是 array of {id,text}", () => {
    const schema = slotFillJsonSchema();
    expect(schema.type).toBe("object");
    expect(schema.properties.slots.type).toBe("array");
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm test lib/ai/prompt.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 prompt.ts**

Create `lib/ai/prompt.ts`:
```ts
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
  const briefLines = [
    `产品/公司：${brief.productName}`,
    `介绍：${brief.description}`,
    brief.targetAudience && `目标客户：${brief.targetAudience}`,
    brief.tone && `语气：${brief.tone}`,
    brief.keyBenefits?.length && `核心卖点：${brief.keyBenefits.join("；")}`,
    brief.ctaGoal && `转化目标：${brief.ctaGoal}`,
    brief.language && `语言：${brief.language}`,
    brief.pastedIntro && `补充资料：${brief.pastedIntro}`,
  ].filter(Boolean).join("\n");

  const slotLines = slots
    .map((s) => `- id="${s.id}" 字段="${s.label}" 原文="${s.text}"`)
    .join("\n");

  return [
    "【Brief】", briefLines, "",
    "【待填槽位】（为每个 id 产出贴合 brief 的新文案，保持语言一致）",
    slotLines, "",
    "返回 JSON：{ slots: [{ id, text }, ...] }，必须覆盖全部 id。",
  ].join("\n");
}

export function buildRewriteUserPrompt(req: RewriteRequest, n: number): string {
  return [
    `请改写以下落地页「${req.field}」字段文案，产出 ${n} 个不同候选。`,
    req.instruction && `要求：${req.instruction}`,
    req.brief?.productName && `产品：${req.brief.productName}`,
    req.brief?.tone && `语气：${req.brief.tone}`,
    `原文："${req.currentText}"`,
    "保持 lead-gen 导向、长度量级相近、与原文语言一致。",
    "返回 JSON：{ candidates: [string, ...] }。",
  ].filter(Boolean).join("\n");
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
```

- [ ] **Step 4: 运行确认通过**

Run: `pnpm test lib/ai/prompt.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add lib/ai/prompt.ts lib/ai/prompt.test.ts
git commit -m "feat(ai): prompt 构造与结构化输出 schema"
```

---

## Task 6: OpenAI 客户端封装 + 可注入 fake

**Files:**
- Create: `lib/ai/client.ts`
- Test: `lib/ai/client.test.ts`

- [ ] **Step 1: 写失败测试（fake 模式）**

Create `lib/ai/client.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import { setAiClient, getAiClient, resetAiClient } from "@/lib/ai/client";

describe("ai client 注入", () => {
  beforeEach(() => resetAiClient());

  it("可注入 fake 并被 getAiClient 返回", async () => {
    setAiClient({
      async completeJson() {
        return { slots: [{ id: "hero.title", text: "FAKE" }] };
      },
    });
    const out = await getAiClient().completeJson({ system: "s", user: "u", schema: {}, schemaName: "x" });
    expect(out).toEqual({ slots: [{ id: "hero.title", text: "FAKE" }] });
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm test lib/ai/client.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 client.ts**

Create `lib/ai/client.ts`:
```ts
import OpenAI from "openai";

export interface CompleteJsonArgs {
  system: string;
  user: string;
  schema: unknown;       // JSON Schema
  schemaName: string;
}

export interface AiClient {
  completeJson<T = unknown>(args: CompleteJsonArgs): Promise<T>;
}

let override: AiClient | null = null;

/** 测试/e2e 注入 fake。 */
export function setAiClient(client: AiClient) {
  override = client;
}
export function resetAiClient() {
  override = null;
}

class OpenAiClient implements AiClient {
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  private model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  async completeJson<T = unknown>({ system, user, schema, schemaName }: CompleteJsonArgs): Promise<T> {
    const resp = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: schemaName, schema: schema as Record<string, unknown>, strict: true },
      },
    });
    const content = resp.choices[0]?.message?.content ?? "{}";
    return JSON.parse(content) as T;
  }
}

/** 取当前 client：注入优先；否则 fake 标志；否则真 OpenAI。 */
export function getAiClient(): AiClient {
  if (override) return override;
  if (process.env.AI_FAKE === "1") return fakeClient;
  return new OpenAiClient();
}

/** 进程级 fake（e2e 用，由 AI_FAKE=1 启用）：原样回填占位。 */
const fakeClient: AiClient = {
  async completeJson<T>({ user }: CompleteJsonArgs): Promise<T> {
    const ids = [...user.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
    if (ids.length > 0) {
      return { slots: ids.map((id) => ({ id, text: `AI 文案 · ${id}` })) } as T;
    }
    return { candidates: ["AI 候选一", "AI 候选二"] } as T;
  },
};
```

- [ ] **Step 4: 运行确认通过**

Run: `pnpm test lib/ai/client.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add lib/ai/client.ts lib/ai/client.test.ts
git commit -m "feat(ai): OpenAI 客户端封装与可注入 fake"
```

---

## Task 7: 生成编排（抽槽→模型→合并→校验→重试）

**Files:**
- Create: `lib/ai/generate.ts`
- Test: `lib/ai/generate.test.ts`

- [ ] **Step 1: 写失败测试**

Create `lib/ai/generate.test.ts`:
```ts
import { describe, it, expect, afterEach } from "vitest";
import { generateDraftFromBrief, rewriteText } from "@/lib/ai/generate";
import { setAiClient, resetAiClient } from "@/lib/ai/client";
import { TEMPLATES } from "@/landing-editor/samples/registry";

afterEach(() => resetAiClient());

describe("generateDraftFromBrief", () => {
  it("回填后产出合法 draft", async () => {
    setAiClient({
      async completeJson() {
        // 回填每个槽位为干净文案
        return { slots: [] }; // 空回填即沿用原文，结构仍合法
      },
    });
    const r = await generateDraftFromBrief(TEMPLATES[0].draft, { productName: "A", description: "B" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.draft.hero.title).toBeTruthy();
  });

  it("模型产出禁词 → 重试一次仍失败则返回错误", async () => {
    let calls = 0;
    setAiClient({
      async completeJson() {
        calls++;
        return { slots: [{ id: "hero.title", text: "立即购买 buy now" }] };
      },
    });
    const r = await generateDraftFromBrief(TEMPLATES[0].draft, { productName: "A", description: "B" });
    expect(r.ok).toBe(false);
    expect(calls).toBe(2); // 首次 + 重试 1 次
  });
});

describe("rewriteText", () => {
  it("返回剔除禁词后的候选", async () => {
    setAiClient({
      async completeJson() {
        return { candidates: ["免费咨询", "buy now $9"] };
      },
    });
    const out = await rewriteText({ sectionType: "hero", field: "title", currentText: "x" });
    expect(out.candidates).toEqual(["免费咨询"]);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm test lib/ai/generate.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 generate.ts**

Create `lib/ai/generate.ts`:
```ts
import type { LandingPageDraft } from "@/types/schema.draft";
import type { GenerationBrief, RewriteRequest, RewriteResult, FilledSlot } from "./types";
import { deriveSlots, mergeSlots } from "./slots";
import { buildSystemPrompt, buildFillUserPrompt, buildRewriteUserPrompt, slotFillJsonSchema, rewriteJsonSchema } from "./prompt";
import { checkDraftCompliance, filterCandidates, type ComplianceReason } from "./guardrails";
import { getAiClient } from "./client";

export type GenerateResult =
  | { ok: true; draft: LandingPageDraft }
  | { ok: false; reason: ComplianceReason | "model_error"; detail?: string };

const REWRITE_CANDIDATES = 3;

/** 整页：抽槽→填→合并→校验，失败自动重试 1 次。 */
export async function generateDraftFromBrief(
  template: LandingPageDraft,
  brief: GenerationBrief,
): Promise<GenerateResult> {
  const slots = deriveSlots(template);
  const system = buildSystemPrompt();
  const user = buildFillUserPrompt(brief, slots);
  const client = getAiClient();

  let last: GenerateResult = { ok: false, reason: "model_error" };
  for (let attempt = 0; attempt < 2; attempt++) {
    let filled: FilledSlot[] = [];
    try {
      const out = await client.completeJson<{ slots: FilledSlot[] }>({
        system, user: attempt === 0 ? user : `${user}\n\n上次产出含违规或不合法内容，请严格遵守规则重试。`,
        schema: slotFillJsonSchema(), schemaName: "slot_fill",
      });
      filled = out.slots ?? [];
    } catch (e) {
      last = { ok: false, reason: "model_error", detail: String(e) };
      continue;
    }
    const draft = mergeSlots(template, filled);
    const compliance = checkDraftCompliance(draft);
    if (compliance.ok) return { ok: true, draft };
    last = { ok: false, reason: compliance.reason!, detail: compliance.detail };
  }
  return last;
}

/** 区块改写：产出候选并剔除禁词。 */
export async function rewriteText(req: RewriteRequest): Promise<RewriteResult> {
  const out = await getAiClient().completeJson<{ candidates: string[] }>({
    system: buildSystemPrompt(),
    user: buildRewriteUserPrompt(req, REWRITE_CANDIDATES),
    schema: rewriteJsonSchema(), schemaName: "rewrite",
  });
  return { candidates: filterCandidates(out.candidates ?? []) };
}
```

- [ ] **Step 4: 运行确认通过**

Run: `pnpm test lib/ai/generate.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add lib/ai/generate.ts lib/ai/generate.test.ts
git commit -m "feat(ai): 生成编排（抽槽/合并/校验/重试）与区块改写"
```

---

## Task 8: DB 迁移（ai_usage 表 + ai_credit_balance 列）

**Files:**
- Create: `migrations/012_add_ai_usage.js`

- [ ] **Step 1: 创建迁移**

Create `migrations/012_add_ai_usage.js`:
```js
/** @type {import('node-pg-migrate').MigrationBuilder} */
// AI 用量计量：ai_usage 流水表（按月统计额度消耗）+ users.ai_credit_balance（持久 credits，永不过期）。
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS ai_usage (
      id         BIGSERIAL   PRIMARY KEY,
      user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind       TEXT        NOT NULL CHECK (kind IN ('page','rewrite')),
      source     TEXT        NOT NULL CHECK (source IN ('quota','credit')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ai_usage_user_kind_time ON ai_usage(user_id, kind, created_at);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_credit_balance INT NOT NULL DEFAULT 0;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_ai_usage_user_kind_time;
    DROP TABLE IF EXISTS ai_usage;
    ALTER TABLE users DROP COLUMN IF EXISTS ai_credit_balance;
  `);
};
```

- [ ] **Step 2: 应用迁移（本地 DB 须先 `pnpm db:start`）**

Run: `pnpm migrate:up`
Expected: 输出 `Migrating files: > 012_add_ai_usage`，无报错。

- [ ] **Step 3: 验证表存在**

Run:
```bash
DOTENV_CONFIG_PATH=.env.local node -r dotenv/config -e "const{Pool}=require('pg');new Pool({connectionString:process.env.DATABASE_URL_UNPOOLED,ssl:false}).query(\"select to_regclass('ai_usage') as t\").then(r=>{console.log(r.rows[0]);process.exit(0)})"
```
Expected: `{ t: 'ai_usage' }`。

- [ ] **Step 4: 提交**

```bash
git add migrations/012_add_ai_usage.js
git commit -m "feat(db): 新增 ai_usage 表与 users.ai_credit_balance 列"
```

---

## Task 9: 用量层（额度/credits 检查与扣减）

**Files:**
- Create: `lib/ai/usage.ts`
- Test: `lib/ai/usage.test.ts`

设计：`usage.ts` 接受一个最小化的 db 接口（`{ query }`），便于单测注入 mock，不直连 `@/lib/db`。

- [ ] **Step 1: 写失败测试（mock db）**

Create `lib/ai/usage.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";
import { checkAndConsume } from "@/lib/ai/usage";

function mockDb(rows: Record<string, unknown[]>) {
  // 依 SQL 关键字返回不同结果
  return {
    query: vi.fn(async (sql: string) => {
      if (sql.includes("count")) return { rows: rows.count ?? [{ c: "0" }] };
      if (sql.includes("ai_credit_balance") && sql.startsWith("SELECT")) return { rows: rows.balance ?? [{ ai_credit_balance: 0 }] };
      return { rows: [] };
    }),
  };
}

describe("checkAndConsume page", () => {
  it("月额度未满 → 用 quota 成功", async () => {
    const db = mockDb({ count: [{ c: "1" }], balance: [{ ai_credit_balance: 0 }] });
    const r = await checkAndConsume(db as any, "u1", "page", 3);
    expect(r.ok).toBe(true);
    expect(r.source).toBe("quota");
  });

  it("月额度满但有 credit → 用 credit", async () => {
    const db = mockDb({ count: [{ c: "3" }], balance: [{ ai_credit_balance: 5 }] });
    const r = await checkAndConsume(db as any, "u1", "page", 3);
    expect(r.ok).toBe(true);
    expect(r.source).toBe("credit");
  });

  it("额度与 credit 皆空 → 拒绝", async () => {
    const db = mockDb({ count: [{ c: "3" }], balance: [{ ai_credit_balance: 0 }] });
    const r = await checkAndConsume(db as any, "u1", "page", 3);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("ai_quota_exhausted");
  });

  it("rewrite 满额 → 拒绝（不查 credit）", async () => {
    const db = mockDb({ count: [{ c: "10" }] });
    const r = await checkAndConsume(db as any, "u1", "rewrite", 10);
    expect(r.ok).toBe(false);
  });

  it("Infinity 额度永远放行", async () => {
    const db = mockDb({ count: [{ c: "9999" }] });
    const r = await checkAndConsume(db as any, "u1", "rewrite", Infinity);
    expect(r.ok).toBe(true);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm test lib/ai/usage.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 usage.ts**

Create `lib/ai/usage.ts`:
```ts
export interface DbLike {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>;
}

export type UsageKind = "page" | "rewrite";

export type ConsumeResult =
  | { ok: true; source: "quota" | "credit" }
  | { ok: false; reason: "ai_quota_exhausted" };

/** 统计本自然月某 kind 的用量行数。 */
async function monthCount(db: DbLike, userId: string, kind: UsageKind): Promise<number> {
  const r = await db.query(
    `SELECT count(*)::int AS c FROM ai_usage
     WHERE user_id = $1 AND kind = $2 AND created_at >= date_trunc('month', now())`,
    [userId, kind],
  );
  return Number(r.rows[0]?.c ?? 0);
}

async function creditBalance(db: DbLike, userId: string): Promise<number> {
  const r = await db.query(`SELECT ai_credit_balance FROM users WHERE id = $1`, [userId]);
  return Number(r.rows[0]?.ai_credit_balance ?? 0);
}

/**
 * 检查并扣减一次用量。
 * - page：先月额度，满了用 credit（credit 永不过期）。
 * - rewrite：仅月额度。
 * quota=Infinity 表示不限。原子性：扣减前先判定，再写 ai_usage / 扣 credit。
 */
export async function checkAndConsume(
  db: DbLike,
  userId: string,
  kind: UsageKind,
  quota: number,
): Promise<ConsumeResult> {
  if (quota === Infinity) {
    await db.query(`INSERT INTO ai_usage (user_id, kind, source) VALUES ($1, $2, 'quota')`, [userId, kind]);
    return { ok: true, source: "quota" };
  }

  const used = await monthCount(db, userId, kind);
  if (used < quota) {
    await db.query(`INSERT INTO ai_usage (user_id, kind, source) VALUES ($1, $2, 'quota')`, [userId, kind]);
    return { ok: true, source: "quota" };
  }

  if (kind === "page") {
    const bal = await creditBalance(db, userId);
    if (bal > 0) {
      await db.query(`UPDATE users SET ai_credit_balance = ai_credit_balance - 1 WHERE id = $1`, [userId]);
      await db.query(`INSERT INTO ai_usage (user_id, kind, source) VALUES ($1, 'page', 'credit')`, [userId]);
      return { ok: true, source: "credit" };
    }
  }
  return { ok: false, reason: "ai_quota_exhausted" };
}

/** 给 UI 的用量汇总。 */
export async function getUsageSummary(db: DbLike, userId: string) {
  return {
    pageUsed: await monthCount(db, userId, "page"),
    rewriteUsed: await monthCount(db, userId, "rewrite"),
    creditBalance: await creditBalance(db, userId),
  };
}
```

- [ ] **Step 4: 运行确认通过**

Run: `pnpm test lib/ai/usage.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add lib/ai/usage.ts lib/ai/usage.test.ts
git commit -m "feat(ai): 用量层（月额度+credits 检查与扣减）"
```

---

## Task 10: 整页生成 API 路由

**Files:**
- Create: `app/api/landing-pages/generate/route.ts`
- Modify: `lib/constants/errors.ts`（加 AI 错误码）

- [ ] **Step 1: 加错误码**

Modify `lib/constants/errors.ts`，在 `ApiErrors` 对象内（`VALIDATION_FAILED` 一行下方）加三个键（`BAD_REQUEST` 确认当前不存在，必须新增）：
```ts
  BAD_REQUEST: 'bad_request',
  AI_QUOTA_EXHAUSTED: 'ai_quota_exhausted',
  AI_GENERATION_FAILED: 'ai_generation_failed',
```

- [ ] **Step 2: 实现路由**

Create `app/api/landing-pages/generate/route.ts`:
```ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { ApiErrors } from "@/lib/constants";
import { getTemplate } from "@/landing-editor/samples/registry";
import { createLandingPage, listLandingPages } from "@/lib/landing-pages/store";
import { getUserPlan } from "@/lib/plans-db";
import { PLANS } from "@/lib/plans";
import { generateDraftFromBrief } from "@/lib/ai/generate";
import { checkAndConsume } from "@/lib/ai/usage";
import type { GenerationBrief } from "@/lib/ai/types";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  const userId = session.user.id;

  const plan = await getUserPlan(userId);
  const pageLimit = PLANS[plan].landingPagesLimit;
  if (pageLimit !== Infinity) {
    const existing = await listLandingPages(userId);
    if (existing.length >= pageLimit) {
      return NextResponse.json({ error: ApiErrors.LIMIT_EXCEEDED }, { status: 403 });
    }
  }

  const body = (await request.json()) as { templateId?: string; brief?: GenerationBrief };
  if (!body.brief?.productName || !body.brief?.description) {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }

  // 额度预检（不扣，先确认有额度，避免白跑模型）
  const quota = PLANS[plan].aiPageQuota;
  // 真正扣费在生成成功后；此处仅预检：用 getUsageSummary 思路简单复用 checkAndConsume 的判定较复杂，
  // 因此策略：先生成，成功后再扣；扣费失败（并发耗尽）则回滚建页。
  const template = getTemplate(body.templateId);
  const result = await generateDraftFromBrief(template.draft, body.brief);
  if (!result.ok) {
    return NextResponse.json(
      { error: ApiErrors.AI_GENERATION_FAILED, reason: result.reason },
      { status: 422 },
    );
  }

  const consumed = await checkAndConsume(pool, userId, "page", quota);
  if (!consumed.ok) {
    return NextResponse.json(
      { error: ApiErrors.AI_QUOTA_EXHAUSTED, hints: { upgrade: "/pricing", topup: "/admin/billing" } },
      { status: 403 },
    );
  }

  const row = await createLandingPage(userId, `${template.name} (AI)`, result.draft);
  return NextResponse.json(row, { status: 201 });
}
```

- [ ] **Step 3: 类型/lint/构建校验**

Run: `npx tsc --noEmit && npx eslint app/api/landing-pages/generate/route.ts lib/constants/errors.ts`
Expected: 无错误。

- [ ] **Step 4: 提交**

```bash
git add app/api/landing-pages/generate/route.ts lib/constants/errors.ts
git commit -m "feat(api): 整页 AI 生成路由（额度+护栏+建页）"
```

---

## Task 11: 区块改写 API 路由

**Files:**
- Create: `app/api/ai/rewrite/route.ts`

- [ ] **Step 1: 实现路由**

Create `app/api/ai/rewrite/route.ts`:
```ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { ApiErrors } from "@/lib/constants";
import { getUserPlan } from "@/lib/plans-db";
import { PLANS } from "@/lib/plans";
import { rewriteText } from "@/lib/ai/generate";
import { checkAndConsume } from "@/lib/ai/usage";
import type { RewriteRequest } from "@/lib/ai/types";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  const userId = session.user.id;

  const body = (await request.json()) as RewriteRequest;
  if (!body?.field || typeof body.currentText !== "string") {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }

  const plan = await getUserPlan(userId);
  const consumed = await checkAndConsume(pool, userId, "rewrite", PLANS[plan].aiRewriteQuota);
  if (!consumed.ok) {
    return NextResponse.json(
      { error: ApiErrors.AI_QUOTA_EXHAUSTED, hints: { upgrade: "/pricing" } },
      { status: 403 },
    );
  }

  const result = await rewriteText(body);
  return NextResponse.json(result);
}
```

- [ ] **Step 2: 类型/lint 校验**

Run: `npx tsc --noEmit && npx eslint app/api/ai/rewrite/route.ts`
Expected: 无错误。

- [ ] **Step 3: 提交**

```bash
git add app/api/ai/rewrite/route.ts
git commit -m "feat(api): 区块 AI 改写路由（额度+候选剔除）"
```

---

## Task 12: LemonSqueezy webhook 支持一次性订单加 credits

**Files:**
- Modify: `app/api/webhooks/lemonsqueezy/route.ts`
- Modify: `lib/lemonsqueezy.ts`（加 `getCreditsFromVariantId`）

- [ ] **Step 1: 加 variant→credits 映射**

Modify `lib/lemonsqueezy.ts`，在文件末尾加：
```ts
/** 一次性 credits 商品 variant → 充值数量。未命中返回 0。 */
export function getCreditsFromVariantId(variantId: number): number {
  const map: Record<string, number> = {
    [process.env.LS_CREDITS_50_VARIANT_ID ?? ""]: 50,
    [process.env.LS_CREDITS_200_VARIANT_ID ?? ""]: 200,
  };
  return map[String(variantId)] ?? 0;
}
```

- [ ] **Step 2: webhook 处理 order_created**

Modify `app/api/webhooks/lemonsqueezy/route.ts`：

import 行加入 `getCreditsFromVariantId`：
```ts
import { verifyWebhookSignature, getPlanFromVariantId, getCreditsFromVariantId } from "@/lib/lemonsqueezy";
```

在 `SUBSCRIPTION_EVENTS` 常量下方加：
```ts
const ORDER_EVENT = "order_created";
```

把 payload 类型里的 `attributes` 扩展为可含 `first_order_item`：
```ts
    data: { id: string; attributes: { customer_id: number; variant_id: number; status: string; first_order_item?: { variant_id: number } } };
```

在 `const eventName = payload.meta.event_name;` 之后、`if (!SUBSCRIPTION_EVENTS.has(eventName))` 之前插入一次性订单分支：
```ts
  if (eventName === ORDER_EVENT) {
    const userId = payload.meta.custom_data?.user_id;
    if (!userId) {
      return NextResponse.json({ error: "Missing user_id in custom_data" }, { status: 400 });
    }
    const variantId = payload.data.attributes.first_order_item?.variant_id ?? payload.data.attributes.variant_id;
    const credits = getCreditsFromVariantId(variantId);
    if (credits > 0) {
      await pool.query(
        "UPDATE users SET ai_credit_balance = ai_credit_balance + $1 WHERE id = $2",
        [credits, userId],
      );
    }
    return NextResponse.json({ received: true });
  }
```

- [ ] **Step 3: 类型/lint 校验**

Run: `npx tsc --noEmit && npx eslint app/api/webhooks/lemonsqueezy/route.ts lib/lemonsqueezy.ts`
Expected: 无错误。

- [ ] **Step 4: 提交**

```bash
git add app/api/webhooks/lemonsqueezy/route.ts lib/lemonsqueezy.ts
git commit -m "feat(billing): LemonSqueezy 一次性订单为账户充值 AI credits"
```

---

## Task 13: 整页生成 UI（模板库入口 + 引导表单弹窗）

**Files:**
- Create: `components/ai/GeneratePageDialog.tsx`
- Modify: `landing-editor/components/TemplateGallery.tsx`

> 复用现有 UI 原语 `components/ui/*`（dialog/button/input/textarea/label）。先确认这些文件存在：`ls components/ui | grep -E "dialog|button|input|textarea|label"`，命名以实际为准。

- [ ] **Step 1: 实现弹窗组件**

Create `components/ai/GeneratePageDialog.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { landingEditorPath } from "@/lib/constants";

export function GeneratePageDialog({ templateId, children }: { templateId: string; children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ productName: "", description: "", targetAudience: "", tone: "", ctaGoal: "", pastedIntro: "" });

  const submit = async () => {
    if (!form.productName || !form.description) {
      toast.error("请填写产品名与介绍");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/landing-pages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, brief: form }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "ai_quota_exhausted") toast.error("AI 额度已用完，请升级或加购 credits");
        else if (data.error === "limit_exceeded") toast.error("落地页数量已达套餐上限");
        else toast.error("生成失败，请重试");
        return;
      }
      toast.success("已生成，正在打开编辑器");
      router.push(landingEditorPath(data.id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>用 AI 填充这套模板</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>产品 / 公司名 *</Label><Input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} /></div>
          <div><Label>它做什么 / 解决什么 *</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label>目标客户</Label><Input value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} /></div>
          <div><Label>语气</Label><Input placeholder="专业 / 亲和 / 紧迫 / 高端" value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} /></div>
          <div><Label>转化目标</Label><Input placeholder="咨询 / 预约 / 留资 / WhatsApp" value={form.ctaGoal} onChange={(e) => setForm({ ...form, ctaGoal: e.target.value })} /></div>
          <div><Label>可选：粘贴公司/产品介绍</Label><Textarea value={form.pastedIntro} onChange={(e) => setForm({ ...form, pastedIntro: e.target.value })} /></div>
          <Button className="w-full" disabled={loading} onClick={submit}>{loading ? "AI 生成中…" : "生成落地页"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: 在模板库卡片接入入口**

Modify `landing-editor/components/TemplateGallery.tsx`：在每张模板卡片现有「使用此模板」按钮旁，包一个 AI 入口。引入：
```tsx
import { GeneratePageDialog } from "@/components/ai/GeneratePageDialog";
```
在卡片操作区加（`t.id` 为当前遍历模板 id）：
```tsx
<GeneratePageDialog templateId={t.id}>
  <button className="text-sm font-medium text-cyan-600 hover:underline">✨ 用 AI 填充</button>
</GeneratePageDialog>
```

- [ ] **Step 3: 类型/lint/构建校验**

Run: `npx tsc --noEmit && npx eslint components/ai/GeneratePageDialog.tsx landing-editor/components/TemplateGallery.tsx && npm run build`
Expected: 无错误，构建通过。

- [ ] **Step 4: 提交**

```bash
git add components/ai/GeneratePageDialog.tsx landing-editor/components/TemplateGallery.tsx
git commit -m "feat(ui): 模板库 AI 一键成页入口与引导表单"
```

---

## Task 14: 编辑器区块 AI 改写按钮

**Files:**
- Create: `components/ai/RewriteButton.tsx`
- Modify: `landing-editor/forms/fields.tsx`

- [ ] **Step 1: 实现改写按钮组件**

Create `components/ai/RewriteButton.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

export function RewriteButton({
  field, currentText, onApply,
}: {
  field: string;
  currentText: string;
  onApply: (text: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<string[]>([]);

  const run = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionType: "hero", field, currentText }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error === "ai_quota_exhausted" ? "AI 改写额度已用完" : "改写失败");
        return;
      }
      setCandidates(data.candidates ?? []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" onClick={run} className="inline-flex items-center gap-1 text-xs text-cyan-600 hover:underline">
          <Sparkles className="h-3 w-3" /> {loading ? "改写中…" : "AI 改写"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-2">
        {candidates.length === 0 && <p className="text-xs text-slate-400">点击「AI 改写」生成候选</p>}
        {candidates.map((c, i) => (
          <button key={i} type="button" onClick={() => onApply(c)} className="block w-full rounded-md border p-2 text-left text-sm hover:bg-slate-50">
            {c}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 2: 在文本字段接入**

Modify `landing-editor/forms/fields.tsx`：找到通用文本输入字段组件（如 `TextField`），在其 label 行右侧加改写入口。引入：
```tsx
import { RewriteButton } from "@/components/ai/RewriteButton";
```
在该字段的 label 容器内、值与 onChange 可达处加：
```tsx
<RewriteButton field={label} currentText={String(value ?? "")} onApply={(t) => onChange(t)} />
```
（`label`/`value`/`onChange` 用该组件已有的 props 名；以文件实际签名为准。）

- [ ] **Step 3: 类型/lint/构建校验**

Run: `npx tsc --noEmit && npx eslint components/ai/RewriteButton.tsx landing-editor/forms/fields.tsx && npm run build`
Expected: 无错误，构建通过。

- [ ] **Step 4: 提交**

```bash
git add components/ai/RewriteButton.tsx landing-editor/forms/fields.tsx
git commit -m "feat(ui): 编辑器文本字段 AI 改写入口"
```

---

## Task 15: 端到端（fake AI client）

**Files:**
- Create: `e2e/ai-generate.spec.ts`
- Modify: `playwright.config.ts`（webServer env 注入 `AI_FAKE=1`）

- [ ] **Step 1: 让 e2e 的 dev server 用 fake AI**

Modify `playwright.config.ts`：在 `webServer` 配置加 `env`：
```ts
  webServer: {
    // ...existing command/url...
    env: { ...process.env, AI_FAKE: "1" },
  },
```
（若已有 `webServer`，仅补 `env` 字段；保留原有 command/url/reuseExistingServer。）

- [ ] **Step 2: 写 e2e**

Create `e2e/ai-generate.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

// 复用现有登录辅助（参照 e2e/landing-pages-flow.spec.ts 的登录方式）。
test("AI 一键成页：填表单 → 跳转编辑器且文案已填充", async ({ page }) => {
  // TODO(执行者)：按 e2e/landing-pages-flow.spec.ts 完成登录后访问模板库
  await page.goto("/admin/editor"); // 模板库页（以实际模板选择路由为准）
  await page.getByText("用 AI 填充").first().click();
  await page.getByLabel("产品 / 公司名 *").fill("Acme Consulting");
  await page.getByLabel("它做什么 / 解决什么 *").fill("为出海企业提供获客咨询");
  await page.getByRole("button", { name: "生成落地页" }).click();

  // fake client 回填 "AI 文案 · <id>"，编辑器应载入该页
  await expect(page).toHaveURL(/\/admin\/editor\//);
});
```

> 执行者须参照 `e2e/landing-pages-flow.spec.ts` 的既有登录步骤补全登录；选择器以实际渲染为准。

- [ ] **Step 3: 运行 e2e**

Run: `pnpm test:e2e e2e/ai-generate.spec.ts`
Expected: PASS（fake client 下无需 OpenAI key）。

- [ ] **Step 4: 提交**

```bash
git add e2e/ai-generate.spec.ts playwright.config.ts
git commit -m "test(e2e): AI 一键成页端到端（fake client）"
```

---

## Task 16: 全量校验闸 + 收尾

- [ ] **Step 1: 跑全部单测**

Run: `pnpm test`
Expected: 全 PASS。

- [ ] **Step 2: 类型 + lint + 构建**

Run: `npx tsc --noEmit && npx eslint && npm run build`
Expected: 全部无错误。

- [ ] **Step 3: 更新 .env 示例与文档**

在 `.env.local`（本地）确认存在：`OPENAI_API_KEY`、`OPENAI_MODEL`（可选）、`LS_CREDITS_50_VARIANT_ID`、`LS_CREDITS_200_VARIANT_ID`。若仓库有 `.env.example`，同步补这些键（不含真实值）。

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "chore(ai): 收尾——环境变量与文档同步"
```

---

## 自检记录（spec 覆盖核对）

- 模板填充 / 槽位机制 → Task 3（含 round-trip 不变式）✓
- 引导表单 + 可选粘贴 → Task 13（GenerationBrief / pastedIntro）✓
- 固定月额度 + credits 加购 → Task 2 / 8 / 9 / 12 ✓
- 整页生成 + 区块改写 → Task 10 / 11 / 13 / 14 ✓
- Free 极少额度（整页 3） → Task 2 ✓
- 槽位抽取 + Structured Outputs → Task 5 / 6 / 7 ✓
- 双层护栏（prompt + 代码） → Task 5（system prompt）/ Task 4 / 7（校验+重试不扣费）✓
- credits 永不过期 → Task 8（持久列）/ Task 9（仅月额度按月统计，credit 独立）✓
- 不编造证据 → Task 5（system prompt 明确）✓
- 测试策略（单元/集成/e2e，不打真实 OpenAI） → Task 3–9 单元 / Task 6 fake / Task 15 e2e ✓
- 自然月重置 → Task 9（`date_trunc('month', now())`）✓

> 已知留给执行者的现场确认点（非占位，均有兜底说明）：`components/ui/*` 原语命名、`fields.tsx` 通用字段 props 名、TemplateGallery 卡片操作区结构、e2e 登录步骤——三处均注明「以实际为准」并给出参照文件。
