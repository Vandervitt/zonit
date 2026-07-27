# 设计：admin / super-admin UI 完全重构（Ant Design v5 · 深青·明亮）

- 日期：2026-06-20
- 范围：本 spec 为「① admin UI 完全重构」。投放分析采集管道为独立的「② 分析管道」spec，本次不实现，仅预留入口。
- 主题：深青·明亮（与官网统一，`colorPrimary #0d9488`）。

## 背景与动机

现有 admin 后台是套用某后台模板的残留：概览页是与产品无关的 CRM demo（Analytical board / Sales Funnel / High-Risk Customers），`Statistics / Tasks / Report / Notifications / Settings / Help` 均为只有标题的空占位页。真正有后端支撑的功能只有：落地页、域名、素材库、计费、AI 额度。

本次基于产品定位（海外获客落地页 SaaS）对 admin / super-admin 做 UI 完全重构，统一到 Ant Design v5 + 深青·明亮主题，砍掉 demo 与空页，把真实功能做扎实。

## 关键事实（探查结论）

- 落地页是非交易、引导联系的：CTA 为 WhatsApp / tel / mailto / sms / telegram 深链跳转，**无平台托管表单**，故无传统「表单 leads 入库」。
- 现有追踪是客户端 Pixel（page_view / cta_click 广播给 Meta/GA4/TikTok），数据进广告平台、不进 Zap Bridge。`landing-renderer/tracking/sinks.ts` 注释明确 first-party 采集 sink「留作后续刀」——即平台第一方采集尚未实现。
- 因此「投放分析」需要的真实数据源在本 spec 中**不存在**，留作 ② 分析管道 spec；本 spec 概览页只展示「资产与额度」类真实可查数据。
- `ai_usage` 有计算逻辑（`lib/ai/usage.ts`）但无对前端的 GET 查询接口。
- 落地页列表 API（`GET /api/landing-pages`）、域名、素材、计费 API 均可直接复用。
- super-admin 已有 `getStats`（平台用户/页面统计），可复用。

## 技术架构

- 依赖：`antd` v5、`@ant-design/nextjs-registry`（App Router SSR registry，避免样式闪烁）、`@ant-design/pro-components`（ProTable / ProForm 按需）、`@ant-design/icons`。
- `ConfigProvider` 注入主题 token，**仅包裹 admin 与 super-admin 路由组**：
  - `token.colorPrimary = #0d9488`（深青，与官网 primary 一致）
  - 圆角、字号、明亮中性与官网呼应；`cssVar: true`、`hashed` 默认。
- 两套样式体系隔离：官网继续 Tailwind；admin/super-admin 改用 antd（不再消费 `styles/theme.css` 的工具类）。`CLAUDE.md` 的「Tailwind only」铁律在后台区按用户明确指示让步，antd 严格限定在 `/admin`、`/super-admin` 路由，不影响官网与生成的落地页。
- AntdRegistry 通过各自的 layout（`app/admin/(workspace)/layout.tsx`、`app/super-admin/layout.tsx`）包裹，确保 antd 不进入官网与落地页渲染端。

## 布局外壳（自建 antd Layout）

自建 `Layout`：`Sider`（可折叠）+ `Header`（面包屑 / 套餐徽章 / 用户菜单）+ `Content`。不使用 ProLayout（默认风格偏传统企业蓝，定制深青明亮成本高、不易与官网统一）。

- admin 导航（Sider Menu）：概览 / 落地页 / 域名 / 素材库 / 投放分析〔`disabled` + 「即将上线」Tag〕/ 账户与计费 / 设置 / 帮助。
- super-admin 导航：概览 / 用户 / 平台设置。深色 Sider 区分平台运营身份，仍属深青色系。

## 页面处置清单

### admin —— 重做（真功能，逻辑不变，UI 换 antd）

- 落地页：ProTable 展示列表（名称 / 状态(已发布·草稿) / 更新时间 / 操作）；操作含 编辑（跳编辑器）、预览、发布/取消发布、删除；顶部「新建落地页」（选模板 / AI 生成，复用 `GeneratePageDialog`）。沿用现有 `/api/landing-pages*`。
- 域名：列表 + 未验证轮询（5s）+ 添加域名弹窗 + 启用/停用 + 删除 + 套餐上限拦截升级。沿用现有逻辑（`/api/domains*`）。
- 素材库：上传区 + 网格 + 删除。沿用 `/api/media*`。
- 账户与计费：当前套餐卡 + 用量 + 可升级套餐 + Lemon Squeezy checkout/portal。沿用 `/api/billing*`。

### admin —— 新建真页

- 概览 Overview（见下节）。
- 设置：个人资料（昵称/邮箱只读）、账户信息、当前套餐快捷入口。MVP 以展示为主，可编辑项最小化（昵称）。
- 帮助：FAQ 折叠列表 + 文档/联系入口（静态内容，非交易）。

### admin —— 砍掉

- 页面：`statistics` / `tasks` / `reports` / `notifications`。
- 组件：`components/SalesFunnelCard.tsx` / `components/HighRiskCustomers.tsx` / `components/AICoPilotCard.tsx`（CRM demo，无引用后删除）。

### admin —— 预留

- 投放分析：导航项 `disabled`（不可点击）+ 「即将上线」Tag，**不建页面**。由 ② 分析管道 spec 兑现。

### super-admin（纳入本 spec）

- 概览：复用 `getStats`，用 antd Statistic/Card 展示平台用户数、落地页数等。
- 用户：ProTable（邮箱 / 角色 / 套餐 / 注册时间）+ 邀请用户弹窗（复用 `InviteUserDialog` 逻辑，UI antd 化）。
- 平台设置：占位/最小真页。

### 编辑器外壳（纳入本 spec）

- `/admin/editor/[id]` 的顶栏（保存 / 发布 / 预览 / 设备切换）与侧边控制 UI 改用 antd 组件。
- 中间可视化画布（`landing-editor` 渲染/拖拽部分）**不动**。

## 概览 Dashboard 内容（真实数据 =「资产与额度」视角）

明确边界：当前无访问量/转化数据，概览是「落地页资产 + 用量」视角，不是「投放效果」。

- 4 张 KPI 卡（antd `Statistic` + `Card`）：
  1. 落地页总数（含已发布 / 草稿拆分）
  2. 绑定域名（总数 / 已验证数）
  3. AI 额度（本月已用 / 上限 + credit 余额，来自新 `GET /api/ai/usage`）
  4. 当前套餐（名称 + 落地页用量进度条 X/上限）
- 最近落地页表：最近编辑的 5 张，快捷 编辑 / 预览 / 发布。
- 快捷操作卡：新建落地页（选模板 / AI 生成）、绑定域名、查看定价。
- 「投放分析即将上线」引导卡（占位，② 兑现）。

## 小后端补充（只读，属本 spec 合理范围）

- 新增 `GET /api/ai/usage`：返回当前用户本月 `page` / `rewrite` 用量计数、对应套餐上限、`ai_credit_balance`。read-only，把已有数据暴露给概览卡，不属于「新建分析管道」。
- 其余全部复用现有 API。

## 数据流

- 概览卡数据：`GET /api/landing-pages`（落地页计数/状态/最近）、`GET /api/domains`（域名计数/验证）、`session.user.plan` + `PLANS`（套餐上限）、新 `GET /api/ai/usage`（额度）。
- 列表页：沿用各自现有 SWR + mutation 流。
- super-admin 概览：服务端 `getStats`。

## 组件边界

- `app/admin/(workspace)/layout.tsx`：AntdRegistry + ConfigProvider + 自建 Layout（Sider/Header）。一个职责：admin 外壳与主题注入。
- `app/super-admin/layout.tsx`：同上，super-admin 外壳。
- 每个页面组件：一个路由一个 page，数据获取与展示内聚；复用现有 hooks（`useMutation`、SWR fetcher）。
- 新 `components/admin/*`（antd 版）替换旧自定义 admin 组件；旧 shadcn admin 组件在 admin 区不再引用（保留给可能的其他引用方，逐步清理）。

## 测试与验证

- 现有 vitest（35）为纯逻辑层，不受 UI 重构影响，须保持全绿。
- 新增 `GET /api/ai/usage` 配单测（月计数 + credit 余额 + 上限映射）。
- `tsc --noEmit` / `eslint` / `next build` 全绿。
- 浏览器抽查：admin 概览 / 落地页 / 域名 / 素材 / 计费 / 设置 / 帮助；super-admin 概览 / 用户；编辑器外壳。

## 非目标（明确排除）

- 不实现投放分析采集管道（first-party sink / 采集端点 / events 表 / 聚合 API / 分析页）——② spec。
- 不改可视化编辑画布。
- 不改官网与生成的落地页渲染端。
- 不引入支付/交易概念到生成的落地页。

## 风险与缓解

- 两套样式体系并存：antd 限定路由 + Registry 隔离，避免污染官网/落地页。
- antd 包体积：仅后台路由加载，官网不受影响（路由级代码分割）。
- 主题一致性：ConfigProvider token 与官网 `--primary` 对齐（#0d9488）。
