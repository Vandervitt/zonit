# AI 一键成页 + 区块改写 — 设计文档

- 日期：2026-06-20
- 状态：设计已与用户逐段确认，待 spec 复核
- 适用分支：`refactor_20260618_官网科技风重构`（或后续专用分支）

## 1. 背景与目标

落地页用户最大的流失点在「面对空白编辑器不知从何下手」。AI 一键成页让用户粘贴/填写产品或公司介绍后，由 OpenAI 模型**依据用户选定的模板填充文案**，几秒生成一张可投放、可继续编辑的落地页。它同时是**激活武器**（缩短「注册→看见第一张页面」）和**涨价杠杆**（按额度计费，补上「模板不再受限」后腾出的差异化位置）。

本期范围：
- **整页生成**：选模板 → 引导表单（+可选粘贴）→ AI 填充 → 校验 → 建页。
- **区块级 AI 改写**：编辑器内对单个字段/区块「一键改写/润色/出 CTA 变体」。

非目标（本期不做）：
- 全自由生成（AI 自行决定 section 组合）——本期只做「模板填充」。
- AI 多语言翻译纳入统一 AI 套件——延后。
- 用 credits 购买「改写」额度——本期 credits 仅用于整页生成。

## 2. 关键决策（已与用户确认）

| 决策点 | 结论 |
|---|---|
| 生成策略 | **模板填充**：用户先选模板，AI 只按既有 section 结构填写文案 |
| 输入方式 | **引导表单 + 可选粘贴**：结构化字段 + 可粘贴大段介绍作上下文 |
| 计费模型 | **固定月额度 + 超额加购 credits** |
| 本期范围 | **整页生成 + 区块级改写** |
| Free 额度 | **给极少额度**（整页 3/月）+ 邮箱验证 + 速率限制防滥用 |
| 生成机制 | **方案一：槽位抽取 + Structured Outputs 填充**（结构由模板与代码保证，AI 只写文案） |
| 模型接入 | 默认直连 **OpenAI**（`gpt-4o-mini` 出草稿控成本）；可选叠加 Vercel AI Gateway 做可观测/失败回退（不改变「用 OpenAI」的决定） |

## 3. 现有架构对接点

- **live schema**：`types/schema.draft.ts → LandingPageDraft`（`hero` + `sections[]` + `footer` + 可选 `floatingButton`/`tracking`）。
- **结构约束与校验**：`SECTION_REGISTRY`（required/singleton/requiredGroup）、`validateSections`、`isLandingPageStructureValid` 已存在，直接复用。
- **建页流程**：`POST /api/landing-pages` → 鉴权 → `PLANS[plan].landingPagesLimit` 拦截 → `getTemplate(templateId).draft` → `createLandingPage(userId, name, draft)`。
- **计划/用量**：`getUserPlan`（读 `users.plan`）；**当前无 AI 用量计数**，本设计新增。
- **支付**：已接 LemonSqueezy（`app/api/webhooks/lemonsqueezy`）。
- **schema 铁律**：`docs/constraints/landing-page-schema.md`（必有 `primaryConversion`；form CTA 必须有 `leadForm` 且至少一个可达联系字段；footer 至少一条合规链接；高风险声称需 disclaimer；分析事件须 lead-gen 取向，非交易）。

## 4. 模块划分

新增 `lib/ai/` 模块，职责单一、可独立测试：

| 文件 | 职责 | 依赖 |
|---|---|---|
| `lib/ai/client.ts` | OpenAI 客户端封装：模型配置、可选 AI Gateway 入口、**可注入 fake**（测试用） | `openai` SDK + env |
| `lib/ai/slots.ts` | 从 `LandingPageDraft` 抽取「文案槽位」+ 把填好的槽位合并回 draft（纯函数，不碰图片/链接/tracking/结构） | `types/schema.draft` |
| `lib/ai/prompt.ts` | system prompt（护栏）+ brief→user prompt 构造 | — |
| `lib/ai/generate.ts` | 编排：抽槽 → 调结构化输出 → 合并 → 校验 → 护栏 → 重试 | 上面四个 |
| `lib/ai/guardrails.ts` | 非交易化内容检测（禁词扫描）、候选剔除（纯函数） | — |
| `lib/ai/usage.ts` | 额度/credits 检查与扣减、用量账本 | `lib/db`、`lib/plans` |

**API 路由**（沿用现有鉴权风格）：
- `POST /api/landing-pages/generate` — 整页生成（选模板 + brief → 校验 → 建页）。
- `POST /api/ai/rewrite` — 区块级改写，只返回候选文案（不落库）。
- credits 加购复用 LemonSqueezy webhook。

**UI 入口**：
- 整页：模板库选定模板后，提供「用 AI 填充」与「空白开始」两条路径；AI 路径弹出引导表单。
- 区块：编辑器各表单/工具栏加「✨ AI 改写」按钮，出 2–3 候选供选用。
- 额度：编辑器与列表页显示剩余额度，耗尽时引导升级或加购。

### 引导表单（brief）字段

| 字段 | 必填 | 说明 |
|---|---|---|
| `productName` | 是 | 产品/公司名 |
| `description` | 是 | 它做什么 / 解决什么（可由粘贴的介绍填入） |
| `targetAudience` | 否 | 目标客户 |
| `tone` | 否 | 语气（专业 / 亲和 / 紧迫 / 高端 …，select） |
| `keyBenefits` | 否 | 核心卖点（最多 3–5 条） |
| `ctaGoal` | 否 | CTA 目标（咨询 / 预约 / 留资 / WhatsApp / 电话） |
| `language` | 否 | 语言/locale，缺省自动推断，回退英文 |
| `pastedIntro` | 否 | 可选大段介绍，作额外上下文 |

> 「可选粘贴」即 `pastedIntro` 文本框，随表单一并发送作上下文；不做「先抽取成表单再确认」的二步流程（那是未采纳的输入方案）。

## 5. 数据流

### 5.1 整页生成（`POST /api/landing-pages/generate`，同步，Vercel 默认 300s 超时足够）

```
1. 鉴权 (auth) → userId
2. 落地页数量上限检查（复用现有 landingPagesLimit 拦截）
3. AI 额度检查（usage.checkPageQuota：月额度 → 不足看 credits → 都无 → 403）
4. getTemplate(templateId).draft                 # 模板既定结构
5. slots = deriveSlots(draft)                    # 仅抽文案槽位
6. prompt = buildPrompt(brief, slots)
7. filled = client.structuredOutput(prompt, slotsJsonSchema)   # 只填文案
8. newDraft = mergeSlots(draft, filled)          # 图片/链接/tracking 原样保留
9. 校验：isLandingPageStructureValid(newDraft) && guardrails.pass(newDraft)
        └ 不通过 → 回喂原因，最多自动重试 1 次；仍失败 → 返回错误且【不扣额度】
10. usage.consumePage(userId)                    # 先扣月额度，再扣 credits
11. createLandingPage(userId, name, newDraft) → 201 + 跳转编辑器
```

**关键不变式**：校验失败（第 9 步）**不扣费**；扣费（第 10 步）只在校验通过后发生。

### 5.2 区块级改写（`POST /api/ai/rewrite`，快，同步）

```
1. 鉴权
2. usage.checkRewriteQuota(userId)
3. 入参：{ sectionType, field, currentText, instruction?, brief? }
4. client.structuredOutput → N 个候选文案（默认 2–3）
5. guardrails 扫描候选（含交易禁词的剔除）
6. usage.consumeRewrite(userId)
7. 返回候选数组 → 编辑器预览 → 用户选用 → 走现有 autosave
```

改写**不直接落库**，只回文案，保持编辑器为唯一写入口。

### 5.3 槽位机制不变式

`mergeSlots(draft, deriveSlots(draft)) === draft` —— 抽取再合并必须等于原 draft，从代码层面保证 AI 只动文案、动不了结构/图片/链接/tracking。

## 6. 计费与额度

### 6.1 PLANS 扩展（`lib/plans.ts`，单一数据源）

`PlanConfig` 新增：
```ts
aiPageQuota: number;     // 每月 AI 整页生成次数
aiRewriteQuota: number;  // 每月区块改写次数（Infinity = 不限）
```

初始值：

| | Free | Starter | Pro | Agency |
|---|---|---|---|---|
| AI 整页/月 | **3** | 15 | 80 | 300 |
| AI 改写/月 | 10 | 100 | ∞ | ∞ |

`PLAN_FEATURE_ROWS` 增两行展示：「AI 整页生成」「AI 智能改写」。

### 6.2 用量账本 + credits（新 DB 迁移）

```sql
CREATE TABLE ai_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id  <fk users.id> NOT NULL,
  kind     TEXT NOT NULL,        -- 'page' | 'rewrite'
  source   TEXT NOT NULL,        -- 'quota' | 'credit'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON ai_usage (user_id, kind, created_at);

ALTER TABLE users ADD COLUMN ai_credit_balance INT NOT NULL DEFAULT 0;
```

> 迁移按 `docs/dev-database-migration-workflow.md` 与 `migrations/` 既有编号续号执行。

### 6.3 扣减与重置（`lib/ai/usage.ts`）

- **月额度**：统计当前自然月内 `ai_usage` 行数 vs `PLANS[plan].aiPageQuota` / `aiRewriteQuota`。**自然月重置**（v1 最简，不绑定订阅周期）。
- **整页消费顺序**：先用月额度（`source='quota'`），耗尽用 credits（`source='credit'`，并 `ai_credit_balance -= 1`）；两者皆空 → 403 `{ error, reason: 'ai_quota_exhausted', hints: { upgrade, topup } }`。
- **改写**：仅用月额度，耗尽 → 引导升级（v1 不支持 credits 买改写）。

### 6.4 credits 加购

- LemonSqueezy 一次性商品（如 50 次 / 200 次两档）。
- 复用 `app/api/webhooks/lemonsqueezy`：识别一次性订单 → `ai_credit_balance += 数量`。
- 入口：额度耗尽提示 + billing 页。

> 取舍记录：credits 引入「一次性支付」路径（现有仅订阅）。这是「额度+credits」决策的必然成本，已纳入范围。

## 7. 护栏与校验

两道护栏，缺一不可。

### 7.1 生成前（prompt 内置，`lib/ai/prompt.ts`）

- **非交易化（硬规则）**：严禁产出支付/购物车/下单/价格/订阅/退款/COD 等交易语义；CTA 一律 lead-gen 措辞（咨询/预约/留资/WhatsApp/电话/邮件）。
- **不编造证据（合规关键）**：`stats` 数值、`reviews` 具名好评、`beforeAfter` 案例、医疗/金融/美容等高风险声称**不得虚构**；产出明确占位文案并提示用户填真实证据；高风险模块保留 `disclaimer`、避免「保证见效」类绝对化表述。
- **贴 brief**：语气、目标客户、卖点、语言严格来自 brief，不跑题。
- **只填文案**：只输出给定槽位，由 Structured Outputs 的 JSON Schema 强约束，不臆造结构。

### 7.2 生成后（代码，`lib/ai/guardrails.ts`，纯函数）

- **禁词扫描**：对合并后 draft 全部文案字段扫描交易禁词（checkout/cart/order/refund/buy now、价格符号模式 `$\d+`、「立即购买/下单/加入购物车」等中英文）。命中 → 该次判失败。
- **结构校验**：`isLandingPageStructureValid(newDraft)` 必须通过。
- **必填完整性**：`hero.title`、`hero.cta`、footer 合规链接、含 form CTA 时必须有 `leadForm` 且至少一个可达联系字段（沿用 schema 规则），缺失即失败。
- **自动重试 1 次**：失败时把原因回喂模型重试一次；仍失败 → 返回错误且**不扣额度**。
- **改写候选**：同样过禁词扫描，命中的候选直接剔除。

### 7.3 可观测

失败原因（禁词命中/结构不合法/重试耗尽）记日志，便于后续调 prompt。

> 设计取舍：宁可「误杀重生成」也不让违规/虚假内容落地——生成页面要投广告，合规与真实性优先于单次成功率。

## 8. 测试策略

全程**不打真实 OpenAI**（`lib/ai/client.ts` 暴露可注入接口，测试用确定性 fake 读 fixture）。

### 8.1 单元
- `slots.ts` 不变式：`mergeSlots(draft, deriveSlots(draft)) === draft`（对全部样例模板 + 各 section 类型）。
- `guardrails.ts`：交易禁词（中英文 + 价格符号）命中检测；干净文案放行；候选剔除。
- `usage.ts`（mock db）：月额度计数与边界、消费顺序（先额度后 credits）、credits 扣减、自然月重置、改写额度独立计数。

### 8.2 集成（API，mock OpenAI）
- `/api/landing-pages/generate`：正常建页且 `ai_usage`+1；**校验/护栏失败不扣额度**（重点回归）；AI 额度耗尽 403 + reason；`landingPagesLimit` 已满 403；未登录 401。
- `/api/ai/rewrite`：返回候选、扣改写额度、含禁词候选被剔除、额度耗尽 403。
- LemonSqueezy webhook：一次性订单 → `ai_credit_balance` 增加。

### 8.3 E2E（Playwright，stub AI 端点）
- 选模板 → 「用 AI 填充」→ 填 brief → 提交 → 跳转编辑器且文案已填充。
- 编辑器内「✨ AI 改写」→ 出候选 → 选用 → 自动保存生效。
- 额度耗尽 → 出现升级/加购引导。

### 8.4 本地校验闸（提交前必跑）
`tsc --noEmit` + `eslint` + `next build` + 上述测试。

## 9. 环境变量

- `OPENAI_API_KEY`（必需）
- `OPENAI_MODEL`（默认 `gpt-4o-mini`）
- 可选：AI Gateway 相关配置（若启用）
- LemonSqueezy credits 商品/variant ID（用于 webhook 识别一次性订单）

## 10. 风险与缓解

| 风险 | 缓解 |
|---|---|
| Free 被刷、成本失控 | Free 仅 3 次/月 + 邮箱验证 + 速率限制 |
| AI 生成交易/虚假内容 | 双层护栏（prompt + 代码禁词/结构/合规校验），失败重试且不落地 |
| 生成质量不稳 | 槽位填充（结构固定）+ 结构化输出 + brief 结构化输入 |
| 一次性支付带来复杂度 | 复用现有 LS webhook，credits 仅作用于整页生成 |
| 月度重置语义 | v1 采用自然月，文档与 UI 明确标注；订阅周期对齐列为后续 |
