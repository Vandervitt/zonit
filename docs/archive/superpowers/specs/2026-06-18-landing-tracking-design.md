# 落地页追踪闭环（首刀）· 设计 spec

| | |
|---|---|
| 文档类型 | 详细设计（spec）|
| 状态 | 设计已确认，待写实现计划 |
| 日期 | 2026-06-18 |
| 关联 | 产品说明书 `docs/landing-page-flow-product-overview.md`（路线图 P0）；核心 schema `types/schema.draft.ts` |

> **一句话**：让落地页支持「多方 Pixel 注入 + 转化事件埋点 + UTM 捕获透传 + 最小 CMP 同意」，全部围绕核心 schema `types/schema.draft.ts`，纯客户端闭环；服务端转化 API、自有采集面板均不在本刀。

---

## 一、背景与目标

产品路线图 P0 为「多方 Pixel + 服务端转化 API + UTM」。经拆分，**首刀只做客户端追踪闭环**，价值快、外部依赖少：

- 落地页发布后，按用户填写的各平台 Pixel ID 注入像素并上报标准转化事件；
- 捕获广告流量带来的 UTM/点击 id，随事件上报，并透传到 http(s) 外链 CTA；
- 用最小 CMP 同意条做 opt-in 门控，满足基本合规。

**硬约束（继承自 CLAUDE.md 与产品说明书）**

- 只围绕 `types/schema.draft.ts` 的 `LandingPageDraft`，**不碰旧 schema**（`types/schema.ts` / `app/site/[slug]` / `deriveJsonLd` 一律不用）。
- **非交易红线**：事件名系统固定，绝不出现 Purchase/Checkout/AddToCart 等交易语义。
- Tailwind only，`proxy.ts` 作中间件，提交用中文 Conventional Commits。

## 二、范围

**做（In Scope）**

1. `LandingPageDraft` 新增顶层 `tracking` 数据结构。
2. 运行期 `TrackingProvider`：UTM 捕获 → CMP 门控 → Pixel 注入与 `page_view` → CTA 委托监听 `cta_click` + 外链 UTM 透传。
3. 事件 sink 抽象：首刀只实现 `PixelSink`（Meta / GA4 / Google Ads / TikTok），预留 first-party 采集 sink 扩展点（不实现）。
4. 内置「内部事件 → 各平台标准事件」映射常量表。
5. 渲染器各 CTA `<a>` 加 `data-cta` 标记（唯一侵入点）。
6. 编辑器工具栏新增「追踪」面板：填 4 个 Pixel ID、UTM 透传开关、同意条开关与文案。
7. 发布门禁纳入 `tracking` 字段格式校验（复用既有校验体系）。

**不做（Non-Goals，留后续刀）**

- 服务端转化 API（Meta CAPI / TikTok Events API / Google Enhanced Conversions）——第二刀。
- first-party 事件采集（`/api/track` + 事件表）与 **super-admin 数据面板**——单独一刀（本刀只留 sink 扩展点）。
- 表单区块与 `form_submit` 事件（依赖 P1 表单区块）。
- SEO 编辑面板（P2，届时另加顶层 `seo`）。
- GTM 容器、4 家以外的更多平台（靠通用 provider 结构后续增配）。

## 三、数据模型（`types/schema.draft.ts`）

`LandingPageDraft` 新增**顶层可选字段** `tracking`（命名为 `tracking` 而非 `pageMeta`，避免与旧 schema 混淆；将来 SEO 再单独加顶层 `seo`）：

```ts
/** 支持的 Pixel 平台（首刀 4 家；扩展只在此联合类型与映射表增项）。 */
export type PixelProvider = 'meta' | 'ga4' | 'googleAds' | 'tiktok';

/** 单个平台的 Pixel 配置：用户只填 ID。 */
export interface PixelConfig {
  provider: PixelProvider;
  id: string;        // Pixel / Measurement / Conversion ID
  enabled: boolean;  // 关闭则不注入（保留已填 ID）
}

/** 页面级追踪配置。 */
export interface PageTracking {
  pixels: PixelConfig[];        // 多方 pixel，按 provider 去重
  utmPassthrough: boolean;      // 是否把 UTM 拼到 http(s) 外链 CTA（默认 true）
  consent: {
    enabled: boolean;           // 是否显示同意条并做 opt-in 门控（默认 true）
    text?: string;              // 同意条文案（留空用默认文案）
  };
}

// LandingPageDraft 增加：
//   tracking?: PageTracking;
```

设计要点：

- **事件名不进 schema**：内部事件（`page_view` / `cta_click`）→ 各平台标准事件的映射是**代码内置常量**，用户不可改，从根上杜绝越界交易事件名。
- `tracking` 整体可选；缺省视为「无 pixel、显示默认同意条、UTM 透传开」。
- `toDraft` / 默认值 / sample 草稿按需补 `tracking` 默认（不破坏既有页面）。

## 四、运行期架构

### 4.1 注入位置

公开页 `app/p/[slug]/page.tsx`（服务端组件，多租户按 host rewrite 到此）在 `<LandingPage>` 外层包裹**客户端组件** `TrackingProvider`：

```
app/p/[slug]/page.tsx (server)
  └─ <TrackingProvider tracking={page.data.tracking}>   (client)
       └─ <LandingPage page={page.data} />              (现有渲染器)
```

`TrackingProvider` 文件落在 `landing-renderer/tracking/`。

### 4.2 TrackingProvider 职责（按顺序）

1. **UTM 捕获**：首次加载读 `location.search` 的 `utm_source/medium/campaign/term/content`、`gclid`、`fbclid`，存 `sessionStorage`（键 `lp_utm`）。
2. **CMP 门控**：若 `consent.enabled`，底部渲染最小同意条（接受 / 拒绝），选择存 `localStorage`（键 `lp_consent`）。**未接受前不 init 任何 sink、不发火**；`consent.enabled=false` 时视为已同意。
3. **同意后初始化**：对每个 `enabled` 且 `id` 合法的 pixel 创建 `PixelSink` 并 `init()`，随即广播 `page_view`。
4. **CTA 监听**：在容器上委托监听 `click`，命中 `a[data-cta]` 时广播 `cta_click`（params 带 `channel` 与 UTM）；若目标是 http(s) 外链且 `utmPassthrough`，把 UTM 合并进 URL 再放行跳转（深链 WhatsApp/tel/mailto 保持原样）。

### 4.3 事件 sink 抽象

```ts
export interface EventSink {
  init(): void | Promise<void>;
  track(event: InternalEvent, params: EventParams): void;
}
type InternalEvent = 'page_view' | 'cta_click';
```

- 首刀实现：`PixelSink`（按 provider 注入脚本 + 调用各自 API）。用 `next/script` 注入第三方 SDK。
- 预留：`BeaconSink`（first-party → `/api/track`）**仅在注释/接口层面标注，不实现**；第二刀加它时只在 Provider 的 sink 列表里多挂一个，埋点与 CTA 逻辑零改动。

### 4.4 事件 → 平台映射（内置常量）

| 内部事件 | Meta (fbq) | GA4 (gtag) | Google Ads | TikTok (ttq) |
|---|---|---|---|---|
| page_view | PageView | page_view | page_view | Pageview |
| cta_click | Lead | generate_lead | conversion | Contact |

均为各平台**非交易**标准事件，系统固定不可改。

## 五、渲染器改动（唯一侵入点）

给落地页里的 CTA `<a>` 加 `data-cta="<channel>"`，`channel` 取自链接语义（whatsapp / tel / mailto / external 等，由 link 前缀推断）。涉及：Hero 主/副按钮、各区块按钮（Plans/Features 等含 CTA 的区块）、悬浮按钮。不改样式、不改结构，仅加属性。

## 六、编辑器 UI

`tracking` 是页面级、非区块。在编辑器工具栏新增「追踪」入口（与「预览」「发布」并列），点击打开面板：

- 4 个平台的 Pixel ID 输入（留空即 `enabled=false`，不注入）；
- UTM 透传开关；
- 同意条开关 + 文案输入。

复用既有 `landing-editor/ui` 原子（`Field`/`TextInput` 等）与自动保存（`tracking` 进 `toDraft`，随现有保存链路落库）。

## 七、校验与发布门禁

复用上次「发布门禁」体系（`landing-editor/lib/publishIssues.ts` + 后端 publish route）：

- Pixel `id` 已填但格式明显非法（如含空格/明显不符各平台格式）→ 记一条字段问题；
- 由于事件名系统固定，无交易语义越界可能；
- 前端拦截 + 后端 `collectFieldIssues` 兜底，保持与既有一致。

> 具体各平台 ID 的格式校验强度（严格正则 vs 仅非空白）在实现计划里定，倾向「宽松：非空白即可」，避免误伤。

## 八、合规

- 第三方 Pixel 注入受 **CMP opt-in 门控**：未同意不加载、不发火。
- 不收集 PII；UTM/点击 id/事件类型均为非个人身份信息。
- first-party 采集那一刀同样必须走同一同意门控（本刀先把门控做对，为后续复用）。

## 九、测试

**单元**

- UTM 解析与合并到 URL（含已有 query 的合并、深链不改写）；
- 事件 → 平台映射表正确；
- `pixels` 按 provider 去重、`enabled`/`id` 合法性判定。

**浏览器 E2E（Playwright / DevTools）**

- 未同意：页面无第三方 pixel 脚本、无对应网络请求；
- 同意后：注入对应脚本并发 `page_view`；
- 点击 CTA：广播 `cta_click`；http(s) 外链跳转 URL 带上 UTM，WhatsApp 深链不带；
- 编辑器「追踪」面板填 ID → 自动保存 → 发布页生效。

## 十、交付边界与后续刀

- **本刀**：客户端追踪闭环（本文档全部 In Scope）。
- **第二刀**：服务端转化 API（CAPI 等）。
- **面板刀**：first-party 采集（`/api/track` + 事件表 + 聚合）+ super-admin 全局数据面板（跨租户聚合，权限与租户自助看板区分；租户侧自助看板更后）。
