# Phase 3 — 海外落地页投放工程化

> Schema 重构三阶段中最后一阶段，目标：让 schema 不仅"能编辑出页面"，还能直接服务于**SEO**、**广告投放追踪**、**多地区合规**这三件投放工程师每天都要碰的事情。
>
> 当前状态：Phase 1（结构性修复）和 Phase 2（11 个营销 block 接入编辑器/渲染器）已合入 `preview` 分支。Phase 3 仅 schema 层未触达。

---

## 接手须知

1. 项目根的 `CLAUDE.md` 是最高优先级约束，请先读：
   - 这是改造过的 Next.js，APIs/约定可能与训练数据不一致；改 Next 相关代码前先看 `node_modules/next/dist/docs/`
   - middleware 文件名是 **proxy.ts**
   - 只用 Tailwind utility class，不写自定义 CSS / inline style
   - **MVP 优先**：最小改动、happy path、不写防御性代码、不写多版本备份
   - commit 用中文 + Conventional Commits（`type(scope): subject`），别提 Claude

2. Schema 改动必须双侧同步：
   - `types/schema.ts` —— TS 类型
   - `lib/schema.zod.ts` —— Zod 校验（用既有的 `block(type, data)` 工厂）

3. 改完先跑 `npx tsc --noEmit` 验证类型，过滤目标文件别被 4 个不相关的预存在错误（`app/api/domains`, `auth.ts`, `lib/email.ts`）干扰。

4. 读完 `review_schama.md` 了解原始 review 上下文（用户在那里挑出 SEO JSON-LD、Sticky CTA、LeadForm、视频证言等需求；前 4 个已在 Phase 2 完成，剩下 SEO 是 Phase 3 重点）。

---

## 五个工作项

### 1. SEO JSON-LD 自动派生

**问题**：`SeoMeta` 目前只有 title/description/keywords/og/twitter，但没法把 `BundlesSchema` / `FAQSchema` / `ReviewsSchema` 里已经有的结构化数据吐成 Google 搜索结果里的富片段（FAQ 折叠展开、Product Star Rating），白白丢 CTR。

**做什么**：

- `types/schema.ts` 在 `SeoMeta` 加 `jsonLd?: { autoDerive?: boolean; custom?: object[] }`
- 新增纯函数 `lib/jsonLd.ts:deriveJsonLd(template: LandingPageTemplate): object[]`：
  - 从 `template.bundles.tiers` 派生 `Product` + `Offer`（用 `currency` `price`，`isRecommended` 的那条优先）
  - 从 `template.lowerBlocks` 找 `FAQ` block → `FAQPage`
  - 从 `template.lowerBlocks` / `template.afterBundles` 找 `Reviews` block → `AggregateRating` + 前 5 条 `Review`
  - 从 `template.afterBundles` 找 `VideoTestimonials` → `VideoObject[]`
  - 从 `template.footer` 派生 `Organization`
- 渲染入口（`PreviewRenderer` 之外的真实 SSR 入口，需要先确认在哪 —— 从 `app/[domain]/...` 路由查起）注入 `<script type="application/ld+json">`
- 编辑器侧给个 toggle："自动生成 SEO 结构化数据"，默认开

**验收**：Google Rich Results Test 能在测试页上识别 FAQ + Product。

---

### 2. AnalyticsPixel 事件可配置

**问题**：现在像素只能配 `id`，但投放方真正要做的是 **"click_whatsapp_cta"`view_bundles"** 这类自定义事件，没法告诉 Pixel "用户滚到 Bundles 时触发 view_content"。

**做什么**：

- `types/schema.ts` 给 `AnalyticsPixel` 加：
  ```ts
  events?: {
    trigger: 'page_view' | 'cta_click' | 'block_in_view' | 'form_submit' | 'time_on_page';
    name: string;                    // 事件名，如 "Lead", "InitiateCheckout"
    blockType?: BlockType;           // block_in_view / cta_click 时定位到的 block
    delaySeconds?: number;           // time_on_page 用
    params?: Record<string, string | number>;
  }[];
  ```
- `lib/zod` 配套 schema
- 编辑器侧扩展现有 SeoEditor / AnalyticsEditor 面板（如果没有就新建）：
  - 事件列表增删改
  - `trigger` = `block_in_view` / `cta_click` 时联动渲染 `blockType` 下拉，候选项从 `BLOCK_TYPES` 来
- 客户端运行时（先不做，留 todo）：在 `PreviewRenderer` 之外的发布版渲染层添加 IntersectionObserver / 点击委托

**MVP 边界**：本阶段只做 schema + 编辑器，运行时埋点解释器留给下一迭代。

---

### 3. PageMeta.alternateLocales（hreflang）

**问题**：海外站做多语言/多地区时，Google 要求 `<link rel="alternate" hreflang>` 才能把流量正确分配到对应地区版本，schema 当前没字段。

**做什么**：

- `types/schema.ts`：
  ```ts
  // 在 PageMeta 或 LandingPageTemplate.meta 上
  alternateLocales?: {
    locale: string;     // 'en-US' | 'es-MX' | 'pt-BR' | ...
    url: string;        // 该 locale 的完整 URL
  }[];
  ```
- Zod 校验 `locale` 用 BCP 47 的简单正则：`/^[a-z]{2}(-[A-Z]{2})?$/`
- SSR 入口注入 `<link>` 标签
- 编辑器：用单独的"国际化"折叠面板，列表增删改

---

### 4. CallToAction.download — Lead Magnet

**问题**：海外做高客单 B2B / 网赚教育时，`下载 PDF` `领取免费指南` 是冷流量首选诱饵，比直接 WhatsApp 跳转转化更稳。

**做什么**：

- `types/schema.ts` 给 `CallToAction` 加：
  ```ts
  download?: {
    fileUrl: string;        // 资源 URL
    fileName?: string;      // 下载时的文件名
    requireLeadCapture?: boolean;  // 是否先弹出 LeadForm 再放行
    leadFormBlockId?: string;       // 关联的 LeadForm block id（同一 template 内）
  };
  ```
- `BlockForms.tsx` 的 `CtaFields` 加可选折叠区"下载行为（Lead Magnet）"
- `requireLeadCapture` = true 时校验 `leadFormBlockId` 必填、且 template 里真的存在这个 id
- 渲染层：CTA 按钮根据 `download` 决定是触发下载 / 弹 modal 套 LeadForm

---

### 5. compliance —— GDPR Cookie + Age Gate

**问题**：欧洲必须 cookie consent banner、博彩/烟酒/成人/某些保健品类需要 age gate，否则广告平台直接拒审 + 罚款。

**做什么**：

- `types/schema.ts`：
  ```ts
  compliance?: {
    cookieConsent?: {
      enabled: boolean;
      title?: string;                          // "We value your privacy"
      description?: string;
      acceptText?: string;                     // "Accept All"
      rejectText?: string;                     // "Reject Non-Essential"
      learnMoreUrl?: string;                   // 链到 footer.links 里的某个隐私政策
      policyVersion?: string;                  // "2024-09-01"，policy 改版用
    };
    ageGate?: {
      enabled: boolean;
      minimumAge: 18 | 21;
      title?: string;                          // "Are you of legal age?"
      description?: string;
      confirmText?: string;
      rejectText?: string;
      rejectRedirectUrl?: string;              // 拒绝后跳走，避免合规风险
    };
  };
  ```
- 在 `LandingPageTemplate` 顶层挂 `compliance?:`
- 编辑器：站点设置面板（不在 block 列表里）加"合规"折叠区
- `PreviewRenderer` 渲染层：cookie banner 用 `position: fixed` 底部条；age gate 用全屏遮罩

**MVP 边界**：consent 状态先简单写 localStorage（key 含 policyVersion，policy 升级后会重新弹）。先不做完整 IAB TCF v2.2 整合。

---

### 6. PaymentBadges + ShippingInfo（独立 OptionalBlock）

**问题**：当前 `BundleTier` 内嵌的 `guaranteeText` `urgencyText` 都是单条字符串，但跑 COD（货到付款）的中东/东南亚商家需要把"Visa/Mastercard 受理 + 国家配送 + 关税承担"做成专门的信任 section。

**做什么**：

- `types/schema.ts`：
  ```ts
  export interface PaymentBadgesSchema {
    title?: string;             // 'Secure Payment Methods'
    badges: {
      id: string;
      provider: 'visa' | 'mastercard' | 'amex' | 'paypal' | 'apple-pay' | 'google-pay' | 'cod' | 'bank-transfer' | 'crypto' | string;
      label?: string;
    }[];
    secureNote?: string;        // 'SSL encrypted · PCI-DSS compliant'
  }

  export interface ShippingInfoSchema {
    title: string;
    items: {
      id: string;
      icon: IconType;
      title: string;            // 'Worldwide Shipping'
      description: string;      // 'Free over $50, 7-14 days'
    }[];
    estimatedDelivery?: string; // 'Order today, get it by Oct 12'
    returnsPolicyUrl?: string;
  }
  ```
- 加入 `OptionalBlockType` 联合
- `lib/constants/blocks.ts` `OPTIONAL_BLOCK_TYPES` 加两项
- `lib/templates.ts` `getDefaultBlockData` 加默认数据
- `AddBlockDialog` 加两个 BlockOption（zone = Middle 或 Lower）
- `BlockEditorPanel` 三表 + switch 加两项
- `BlockForms.tsx` 加 `PaymentBadgesForm` + `ShippingInfoForm`
- `PreviewRenderer` 加两个渲染器
- 把添加模块上限 11 改成 13

---

## 推荐实施顺序

按"投放工程师的痛点紧迫度 + 改动隔离度"建议批次：

1. **批次 A**（独立、不碰运行时）：第 6 项 `PaymentBadges + ShippingInfo` —— 走熟悉的 Phase 2b 流程，是练手
2. **批次 B**（核心收益、纯 schema + SSR 入口）：第 1 项 `JSON-LD 派生` —— SEO 直接长尾流量，纯函数 + 入口注入
3. **批次 C**（合规相关，可能影响发布版渲染）：第 5 项 `compliance` + 第 3 项 `alternateLocales`
4. **批次 D**（埋点 + 转化）：第 2 项 `Pixel events` + 第 4 项 `download` —— 这两件都需要客户端运行时配合，留到最后做

每批次走完都建议：

- 单独 commit（`feat(schema): ...` / `feat(editor): ...`）
- 至少跑通 happy path（Add → 编辑 → 预览 → 真实 SSR 入口），别只在 PreviewRenderer 里看着对就交差
- 改 SSR 入口前先 `Grep` 找到当前发布版页面渲染在哪（猜测在 `app/[domain]/page.tsx` 一类）

---

## 关键文件速查

| 关注点 | 文件 |
|---|---|
| 类型 | `types/schema.ts` |
| Zod 校验 | `lib/schema.zod.ts` |
| 默认数据 | `lib/templates.ts` |
| Block 常量/枚举 | `lib/constants/blocks.ts` |
| Add 对话框 | `components/sites/AddBlockDialog.tsx` |
| Block 编辑器主面板 | `components/sites/BlockEditorPanel.tsx` |
| 各 block 表单 | `components/sites/BlockForms.tsx` |
| 预览渲染器 | `components/sites/PreviewRenderer.tsx` |
| 真实 SSR 渲染入口 | 待确认，`app/[domain]/...` 起步 |
| AI 重写按钮 | `components/editor/AiRewriteButton.tsx` |

---

## 不要做的事

- 不要重新讨论 Phase 1/2 的方案（`orderedBlocks` 双源已删、`OptionalBlock` 已用 `Extract<>` 派生、`IconType` 已收紧、11 个 block 全部接入）
- 不要为了"统一性"重写 PreviewRenderer 的现有渲染分支
- 不要在没确认真实 SSR 入口在哪之前就在 PreviewRenderer 里塞 JSON-LD `<script>` —— PreviewRenderer 是预览，不是发布产物
- 不要新增"垂直切片方案"——三阶段是用户在多轮 review 后明确选择"水平切片"的结果
