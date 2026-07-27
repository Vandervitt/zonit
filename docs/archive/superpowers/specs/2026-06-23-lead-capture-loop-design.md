# 设计：线索闭环 —— 表单兜底 + 收件箱（子项 D）

| | |
|---|---|
| 文档类型 | 设计 spec |
| 状态 | 待评审 |
| 日期 | 2026-06-23 |
| 分支 | `feat_20260623_线索闭环` |
| 关联 | 产品功能缺口拆分（A–G）中的子项 D；A、B 已合入 main |

## 背景与设计意图

落地页此前转化只有 WhatsApp / Telegram / 电话 / 邮件**站外深链**，线索落在商户私域，平台内看不到任何线索。本子项补上「表单兜底」这一层并做成平台内可见闭环。

**核心定位（贯穿全设计）**：

- **深链 = 直接进私域**：点 WhatsApp/Telegram 即把访客带入商户私域，无需再留其他联系方式。这是首选转化路径，CTA 优先走深链。
- **表单 = 兜底回收**：捕获「没点深链、但愿意留信息」的那部分访客。表单不与深链抢转化，是回收网。
- 因此 `leads` 收件箱**只收表单提交**（含至少一个可联系字段）；深链点击仍由现有 `analytics_events.cta_click` 匿名记录，不进 leads。两套边界清晰：**leads = 有联系方式的真线索；cta_click = 匿名互动指标**。

约束依据（`docs/constraints/landing-page-schema.md`）：lead 必须含至少一个可联系字段（phone/email/whatsapp/telegram）；name 可选但单独不构成有效 lead；一页至多一个 leadForm；保持非交易（无下单/结账/购物车等语义）。

## 范围

**做（端到端最小闭环）**：schema 加 `leadForm` 页面级可选件 → 公开页渲染表单 + 提交 → `leads` 表 + `POST /api/leads`（带归因 + 防滥用）→ 编辑器配置面板 → 后台「线索」收件箱（列表/详情/已读/删除/导出 CSV）。

**不做（Future Work）**：Webhook / 邮件通知；人机验证码（Turnstile/reCAPTCHA）；自定义限定字段 / form builder；CTA 唤起的弹窗表单；线索状态流转（跟进中/已成交等 CRM 化）。

## 关键现状

- schema、渲染器、编辑器**均无** `leadForm`/表单区块（约束文档定义了规则，但 `types/schema.draft.ts` 未建模）。从零做。
- 已有 `analytics_events` 表（无 PII，匿名 page_view/cta_click）+ `POST /api/track`（公开、CORS、`cap()` 截断）。leads 端点复用其 CORS/截断风格，但**存 PII**，故独立表、独立设计。
- 页面级可选件已有先例：`floatingButton?`（条件渲染、不进 `sections[]` 排序流、编辑器有独立配置面板 `FloatingButtonForm`）。`leadForm` 完全类比它。

## 第 1 块：数据模型 & schema

### schema（`types/schema.draft.ts` 新增）

```ts
interface LeadFormFieldConfig { enabled: boolean; required: boolean }

interface LeadForm {
  enabled: boolean;          // 总开关，默认 false（转化优先走深链）
  title: string;             // 表单标题
  description?: string;
  submitText: string;        // 提交按钮文案
  successMessage: string;    // 提交成功提示
  fields: {                  // 固定字段集（预设，不可增删；只能开关 + 必填）
    name: LeadFormFieldConfig;
    email: LeadFormFieldConfig;
    phone: LeadFormFieldConfig;
    whatsapp: LeadFormFieldConfig;
    telegram: LeadFormFieldConfig;
    message: LeadFormFieldConfig;
  };
}
// LandingPageDraft 增加：leadForm?: LeadForm
```

`name`/`message` 不是联系方式；`email`/`phone`/`whatsapp`/`telegram` 为联系方式字段（校验「至少启用一个联系方式」用）。

### 迁移 `migrations/014_add_leads.js`

```
leads(
  id          BIGSERIAL    PRIMARY KEY,
  page_id     TEXT         NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  payload     JSONB        NOT NULL,     -- 仅含启用且非空字段：{name,email,phone,whatsapp,telegram,message}
  channel     TEXT,                      -- 归因（沿用 cap 截断），表单提交固定 'form'
  utm_source  TEXT, utm_medium TEXT, utm_campaign TEXT,
  is_read     BOOLEAN      NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
)
CREATE INDEX idx_leads_page_time   ON leads(page_id, created_at);
CREATE INDEX idx_leads_page_unread ON leads(page_id, is_read);
```
down：删索引 + 表。

## 第 2 块：公开页渲染 + 提交端点

### 渲染器（`landing-renderer/sections/LeadForm.tsx` 新增）

- `LandingPage.tsx` 在 `Footer` 之前插入：`{page.leadForm?.enabled && <LeadForm data={page.leadForm} pageId={pageId} theme={theme} />}`（类比 `floatingButton` 条件渲染）。`LandingPage` 当前不接收 pageId，需从 `app/p/[slug]` 透传（公开页已有 `page.id`）。
- 客户端组件：按 `fields[k].enabled` 渲染输入，`required` 控制必填；含隐藏 honeypot 字段（`company_url`，CSS 隐藏 + `tabIndex=-1` + `autocomplete=off`）。
- 提交：`POST /api/leads`，body `{ pageId, fields:{...}, utm, channel:'form', company_url }`；UTM 复用 `landing-renderer/tracking/utm.ts` 解析。成功 → 显示 `successMessage` 并清空；失败 → 错误提示，可重试。
- Tailwind-only，配色用传入 `theme`。

### 提交端点 `POST /api/leads`（公开、无登录，新增 route）

复用 `/api/track` 的 CORS 与 `cap()` 截断。流程：

1. 解析 JSON。**honeypot**：`company_url` 非空 → 返回 204 静默丢弃（不入库、不提示，避免机器人察觉）。
2. **频率限制**：同 IP（`x-forwarded-for` 首段）1 分钟内 > 5 条 → 429。内存滑动窗口实现（`lib/leads/rate-limit.ts`，单实例足够；Future Work 注明可换 KV）。
3. **校验**（`lib/leads/validate.ts` 纯函数，可单测）：
   - 输入 `payload` 各字段 `cap()` 截断（name/各联系方式 ≤200，message ≤2000）。
   - **至少一个联系方式**（email/phone/whatsapp/telegram 之一 trim 后非空），否则 400 `BAD_REQUEST`。
   - email 含 `@`、phone 仅 `+/数字/空格/-`（基本格式，宽松）。
   - 返回「清洗后的 payload（只保留非空字段）」或错误。
4. 入库 `leads`（payload JSONB + channel='form' + utm）。坏 page_id → FK 错误 best-effort 忽略（同 track）。
5. 返回 204。

> 说明：端点按 `pageId` 入库，不强制校验 leadForm 配置一致性（公开页已渲染对应字段；服务端只做「至少一联系方式 + 长度/格式」硬校验，保持端点轻量与健壮）。

## 第 3 块：编辑器配置

- **`landing-editor/forms/LeadFormForm.tsx`（新增）**：页面级配置面板（类比 `FloatingButtonForm`）。总开关；标题/描述/提交文案/成功提示输入；6 个预设字段各一行（启用开关 + 必填开关）。轻提示「建议至少启用一个联系方式」（硬校验在端点）。
- **editorStore（`landing-editor/store/`）**：`EditorState` 加 `leadForm: LeadForm | null`；action `toggleLeadForm`（开→`createLeadForm()` 默认值；关→null）、`updateLeadForm`；`toDraft` 输出 `leadForm`（非空时）；`fromDraft` 读入。`createLeadForm()` 默认值放 `store/defaults.ts`（与 `createFloatingButton` 同处）。
- **入口**：复用现有页面级件编辑入口（与 FloatingButton 同一处属性面板区域）；`leadForm` 不进 `sections[]`，`BlockList`/排序不变。
- **预览**：`PreviewPane` 已整页渲染 `toDraft(state)`，leadForm 自动出现在页尾，预览无需改。

## 第 4 块：后台收件箱

- **store `lib/leads/store.ts`（新增）**：
  - `listLeads(userId, opts?: { pageId?: string; unreadOnly?: boolean }): Promise<LeadRow[]>`——经 `landing_pages` JOIN 限定本租户，返回含 `page_name`。
  - `markLeadRead(id, userId, isRead): Promise<LeadRow | null>`、`deleteLead(id, userId): Promise<boolean>`、`countUnread(userId): Promise<number>`。均按 user 隔离（经 page 关联，防越权）。
- **API**：
  - `GET /api/leads`（**登录**）：列出本租户线索（query `pageId`/`unreadOnly`）。与公开 `POST` 同 route 文件，按方法区分鉴权。
  - `PATCH /api/leads/[id]`（登录）：`{ isRead }` 标记已读/未读。
  - `DELETE /api/leads/[id]`（登录）：删除。
  - `GET /api/leads/export?format=csv`（登录）：CSV 导出本租户线索；CSV 序列化用纯函数 `lib/leads/csv.ts`（可单测，处理逗号/引号/换行转义）。
- **页面 `/admin/(workspace)/leads/page.tsx`（新增）**：antd Table——列：页面名 / 联系方式摘要 / 来源(channel+utm) / 时间 / 已读状态；行展开看 payload 全字段；操作：标记已读/未读、删除；顶部「导出 CSV」。侧边栏加「线索」入口（未读数 badge 可选，取 `countUnread`）。

## 测试

- **单测（vitest）**：
  - `lib/leads/validate.ts`：至少一联系方式（全空→拒）、字段截断、email/phone 格式、清洗只留非空。
  - `lib/leads/csv.ts`：含逗号/引号/换行的转义、表头、空集。
- **e2e（happy path，沿用 Dev Login + pg）**，新建 `e2e/leads.spec.ts`：
  - 建页 → 编辑器开 leadForm → 发布；公开页（或预览）填表提交 → 直查 DB `leads` 有该行（payload + channel='form'）。
  - 后台 `/admin/leads` 可见该线索 → 标记已读 → 状态更新。
  - 反例：honeypot `company_url` 填值 → 不入库；无任何联系方式 → 400（前端提示）。
  - 注：公开提交 e2e 在 dev 同源直接 `POST /api/leads` 验证（避免依赖真实自有域名多租户路由）。

## 影响面 / 兼容

- schema 加可选 `leadForm?`，旧草稿无该字段 → 渲染器条件渲染天然兼容（默认不显示）。
- `LandingPage` 组件签名加 `pageId`（公开页透传）；`PreviewPane` 调用处可传占位 pageId（预览不真实提交，表单提交在预览 iframe 内对 `/api/leads` 的请求可不接或忽略——预览以展示为主）。
- 新增 PII 表 `leads`：仅本租户经鉴权可读；公开端点只写不读。
- 非交易约束：表单仅收集联系方式/留言，无任何交易字段。

## Future Work（非本子项）

- 新线索 Webhook / 邮件通知（依赖外部凭据）。
- 人机验证码（量级出现刷量时再加）。
- 自定义限定字段（预算/国家/预约偏好）/ form builder。
- 频率限制换 KV（多实例一致）。
- 线索状态流转（CRM 化）/ 标签 / 备注。
