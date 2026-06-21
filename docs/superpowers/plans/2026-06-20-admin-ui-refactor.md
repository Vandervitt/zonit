# admin / super-admin UI 重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Ant Design v5（深青·明亮主题）完全重构 admin 与 super-admin 后台 UI，砍掉 demo/空页，把真实功能做扎实，仅新增只读 `GET /api/ai/usage`。

**Architecture:** antd 严格限定在 `/admin`、`/super-admin` 路由，经各自 layout 的 AntdRegistry + ConfigProvider 注入主题与 SSR 样式；官网与落地页渲染端保持 Tailwind 不变。自建 `Layout`（Sider/Header/Content）外壳，数据密集页用 ProTable/ProForm 提速。所有真实功能逻辑（SWR/mutation/API）原样保留，仅替换展示层。

**Tech Stack:** Next.js 16 App Router · React 19.2 · Ant Design v5 · @ant-design/nextjs-registry · @ant-design/pro-components · @ant-design/v5-patch-for-react-19 · @ant-design/icons

**关键约束（React 19）：** antd v5 在 React 19 下，静态方法（message/Modal/notification）需引入 `@ant-design/v5-patch-for-react-19`，否则运行时告警/失效。所有用到静态方法的地方，改用 `App.useApp()` 的 hooks 版本，并在外壳套 `<App>`。

---

## File Structure

**新建：**
- `app/admin/(workspace)/_shell/AdminProviders.tsx` — AntdRegistry + ConfigProvider + antd `App` 包裹（client）
- `app/admin/(workspace)/_shell/AdminShell.tsx` — 自建 Layout（Sider/Header），客户端，含导航与用户菜单
- `app/admin/(workspace)/_shell/nav.ts` — admin 导航数据（图标/label/href/disabled）
- `app/super-admin/_shell/SuperAdminProviders.tsx` — 同 AdminProviders（深色 Sider 变体复用同主题）
- `app/super-admin/_shell/SuperAdminShell.tsx` — super-admin Layout 外壳
- `lib/theme/antd-theme.ts` — antd ThemeConfig（深青 token，单一来源）
- `app/api/ai/usage/route.ts` — GET 只读额度
- `lib/ai/usage-summary.ts` — 额度汇总纯函数（可单测）
- `lib/ai/usage-summary.test.ts` — 单测
- `app/admin/(workspace)/settings/page.tsx` — 重写为真页
- `app/admin/(workspace)/help/page.tsx` — 重写为真页
- `components/admin/*` — 新 antd 版页面内容组件（按页拆分）

**修改：**
- `app/admin/(workspace)/layout.tsx` — 改为 AdminProviders + AdminShell
- `app/admin/(workspace)/page.tsx` — 概览 Dashboard 重写
- `app/admin/(workspace)/landing-pages/page.tsx` — ProTable 重写
- `app/admin/(workspace)/domains/page.tsx` — antd 重写（逻辑保留）
- `app/admin/(workspace)/media/page.tsx` — antd 重写
- `app/admin/(workspace)/billing/page.tsx` — antd 重写
- `app/super-admin/layout.tsx` — SuperAdminProviders + SuperAdminShell
- `app/super-admin/page.tsx` — antd 重写（复用 getStats）
- `app/super-admin/users/page.tsx` — ProTable 重写
- `app/admin/editor/[id]/page.tsx`（及其外壳组件）— 顶栏/侧边 antd 化
- `lib/constants/routes.ts` — 增加 `Settings`、`Help` 路由与 `AiUsage` API 常量

**删除：**
- `app/admin/(workspace)/statistics/page.tsx`
- `app/admin/(workspace)/tasks/page.tsx`
- `app/admin/(workspace)/reports/page.tsx`
- `app/admin/(workspace)/notifications/page.tsx`
- `components/SalesFunnelCard.tsx`、`components/HighRiskCustomers.tsx`、`components/AICoPilotCard.tsx`（确认无其他引用后）

---

## Phase 0 — 依赖与主题基座

### Task 1: 安装 antd 依赖

**Files:** `package.json`

- [ ] **Step 1: 安装**

Run:
```bash
pnpm add antd @ant-design/nextjs-registry @ant-design/pro-components @ant-design/icons @ant-design/v5-patch-for-react-19
```
Expected: 安装成功，`package.json` 出现这些依赖。

- [ ] **Step 2: 验证版本与 React 19 兼容**

Run: `node -e "console.log(require('antd/package.json').version)"`
Expected: 输出 `5.x`。

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: 引入 Ant Design v5 及 React 19 兼容补丁"
```

---

### Task 2: antd 主题配置（单一来源）

**Files:** Create `lib/theme/antd-theme.ts`

- [ ] **Step 1: 写主题配置**

```typescript
// lib/theme/antd-theme.ts
// admin / super-admin 的 antd 主题（深青·明亮），与官网 --primary (#0d9488) 对齐。
// 单一来源：改这里即可全后台换肤。
import type { ThemeConfig } from "antd";
import { theme as antdTheme } from "antd";

const BRAND = "#0d9488"; // 深青，与官网 styles/theme.css 的 --primary 一致

export const adminTheme: ThemeConfig = {
  cssVar: true,
  hashed: false,
  token: {
    colorPrimary: BRAND,
    colorInfo: BRAND,
    colorSuccess: "#18c98c",
    colorWarning: "#f59e0b",
    colorError: "#ef4444",
    borderRadius: 10,
    fontFamily:
      'var(--font-body), ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    colorBgLayout: "#f6fafb",
    colorTextBase: "#334155",
  },
  components: {
    Layout: {
      siderBg: "#ffffff",
      headerBg: "#ffffff",
      bodyBg: "#f6fafb",
    },
    Menu: {
      itemSelectedBg: "#effefb",
      itemSelectedColor: BRAND,
      itemBorderRadius: 10,
    },
  },
};

// super-admin：深色 Sider 变体，复用同色系。
export const superAdminSiderTheme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: { colorPrimary: BRAND, borderRadius: 10 },
};
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: 通过（exit 0）。

- [ ] **Step 3: Commit**

```bash
git add lib/theme/antd-theme.ts
git commit -m "feat(admin): 新增 antd 深青明亮主题配置"
```

---

### Task 3: 路由常量补充

**Files:** Modify `lib/constants/routes.ts`

- [ ] **Step 1: 增加 Settings / Help 路由与 AiUsage API 常量**

在 `Routes` enum 增加（紧随 `LandingPages` 之后）：
```typescript
  Settings = '/admin/settings',
  Help = '/admin/help',
```
在 `ApiRoutes` enum 增加（紧随 `Media` 之后）：
```typescript
  LandingPages = '/api/landing-pages',
  AiUsage = '/api/ai/usage',
```
（`ApiRoutes.LandingPages` 供概览/列表页 SWR key 使用；与现有 `apiLandingPagesPath()` 同值。）

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: 通过。

- [ ] **Step 3: Commit**

```bash
git add lib/constants/routes.ts
git commit -m "feat(admin): 补充 Settings/Help 路由与 AiUsage API 常量"
```

---

## Phase 1 — 只读额度 API（TDD）

### Task 4: AI 额度汇总纯函数 + 单测

**Files:**
- Create: `lib/ai/usage-summary.ts`
- Test: `lib/ai/usage-summary.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
// lib/ai/usage-summary.test.ts
import { describe, it, expect } from "vitest";
import { buildUsageSummary } from "./usage-summary";

describe("buildUsageSummary", () => {
  it("映射套餐上限与已用量、credit 余额", () => {
    const s = buildUsageSummary({
      plan: "free",
      pageUsed: 2,
      rewriteUsed: 5,
      creditBalance: 3,
    });
    expect(s.page).toEqual({ used: 2, limit: 3 });
    expect(s.rewrite).toEqual({ used: 5, limit: 10 });
    expect(s.creditBalance).toBe(3);
  });

  it("Infinity 上限用 null 表示不限", () => {
    const s = buildUsageSummary({
      plan: "pro",
      pageUsed: 10,
      rewriteUsed: 0,
      creditBalance: 0,
    });
    expect(s.rewrite.limit).toBeNull(); // pro 的 aiRewriteQuota = Infinity
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run lib/ai/usage-summary.test.ts`
Expected: FAIL（buildUsageSummary 未定义）。

- [ ] **Step 3: 实现**

```typescript
// lib/ai/usage-summary.ts
import { PLANS, type PlanId } from "@/lib/plans";

export interface UsageSummary {
  page: { used: number; limit: number | null };
  rewrite: { used: number; limit: number | null };
  creditBalance: number;
}

const norm = (n: number): number | null => (n === Infinity ? null : n);

export function buildUsageSummary(input: {
  plan: PlanId;
  pageUsed: number;
  rewriteUsed: number;
  creditBalance: number;
}): UsageSummary {
  const p = PLANS[input.plan];
  return {
    page: { used: input.pageUsed, limit: norm(p.aiPageQuota) },
    rewrite: { used: input.rewriteUsed, limit: norm(p.aiRewriteQuota) },
    creditBalance: input.creditBalance,
  };
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run lib/ai/usage-summary.test.ts`
Expected: PASS（2 passed）。

- [ ] **Step 5: Commit**

```bash
git add lib/ai/usage-summary.ts lib/ai/usage-summary.test.ts
git commit -m "feat(ai): 新增额度汇总纯函数及单测"
```

---

### Task 5: GET /api/ai/usage

**Files:** Create `app/api/ai/usage/route.ts`

- [ ] **Step 1: 查阅现有 usage 计数方式**

参考 `lib/ai/usage.ts`：`monthCount(db, userId, kind)` 统计本月某 kind 用量；`users.ai_credit_balance` 为 credit 余额。`kind` ∈ `"page" | "rewrite"`。
DB 实例参考其他 route 的获取方式（如 `app/api/landing-pages/route.ts` 用 `lib/landing-pages/store` 间接持有 db；额度相关用 `lib/db` 默认实例——执行时查 `lib/ai/usage.ts` 的调用方 `app/api/landing-pages/generate/route.ts` 看它如何拿到 db 与 plan）。

- [ ] **Step 2: 实现 route**

```typescript
// app/api/ai/usage/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getUserPlan } from "@/lib/plans-db";
import { db } from "@/lib/db";
import { buildUsageSummary } from "@/lib/ai/usage-summary";

async function monthCount(userId: string, kind: "page" | "rewrite"): Promise<number> {
  const r = await db.query(
    `SELECT count(*)::int AS c FROM ai_usage
     WHERE user_id = $1 AND kind = $2 AND created_at >= date_trunc('month', now())`,
    [userId, kind],
  );
  return Number(r.rows[0]?.c ?? 0);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  const userId = session.user.id;
  const [plan, pageUsed, rewriteUsed, creditRow] = await Promise.all([
    getUserPlan(userId),
    monthCount(userId, "page"),
    monthCount(userId, "rewrite"),
    db.query(`SELECT ai_credit_balance FROM users WHERE id = $1`, [userId]),
  ]);
  const creditBalance = Number(creditRow.rows[0]?.ai_credit_balance ?? 0);
  return NextResponse.json(buildUsageSummary({ plan, pageUsed, rewriteUsed, creditBalance }));
}
```

> 执行注意：`import { db } from "@/lib/db"` 的确切路径与导出名以仓库实际为准（执行时 grep `export.*db` in `lib/db*`）。若 db 实例获取方式不同，按 `app/api/landing-pages/generate/route.ts` 的既有方式对齐。

- [ ] **Step 3: 类型检查 + 手测**

Run: `npx tsc --noEmit`
Expected: 通过。
手测（dev 起后，登录态）：`curl -s localhost:3001/api/ai/usage` 返回 `{page,rewrite,creditBalance}` 结构或 401。

- [ ] **Step 4: Commit**

```bash
git add app/api/ai/usage/route.ts
git commit -m "feat(api): 新增只读 GET /api/ai/usage 额度查询"
```

---

## Phase 2 — admin 外壳

### Task 6: AdminProviders（Registry + 主题 + App）

**Files:** Create `app/admin/(workspace)/_shell/AdminProviders.tsx`

- [ ] **Step 1: 写组件**

```tsx
// app/admin/(workspace)/_shell/AdminProviders.tsx
"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import "@ant-design/v5-patch-for-react-19";
import { adminTheme } from "@/lib/theme/antd-theme";

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={adminTheme} locale={zhCN}>
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  );
}
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: 通过。

- [ ] **Step 3: Commit**

```bash
git add "app/admin/(workspace)/_shell/AdminProviders.tsx"
git commit -m "feat(admin): antd Registry + 主题 + App 提供者"
```

---

### Task 7: admin 导航数据 + AdminShell

**Files:**
- Create `app/admin/(workspace)/_shell/nav.ts`
- Create `app/admin/(workspace)/_shell/AdminShell.tsx`

- [ ] **Step 1: 导航数据**

```typescript
// app/admin/(workspace)/_shell/nav.ts
import {
  AppstoreOutlined, FileTextOutlined, GlobalOutlined, PictureOutlined,
  LineChartOutlined, CreditCardOutlined, SettingOutlined, QuestionCircleOutlined,
} from "@ant-design/icons";
import { Routes } from "@/lib/constants";

export interface AdminNavItem {
  key: string;
  label: string;
  icon: React.ComponentType;
  href?: string;
  disabled?: boolean;
  badge?: string;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { key: "overview", label: "概览", icon: AppstoreOutlined, href: Routes.Dashboard },
  { key: "pages", label: "落地页", icon: FileTextOutlined, href: Routes.LandingPages },
  { key: "domains", label: "域名", icon: GlobalOutlined, href: Routes.Domains },
  { key: "media", label: "素材库", icon: PictureOutlined, href: Routes.Media },
  { key: "analytics", label: "投放分析", icon: LineChartOutlined, disabled: true, badge: "即将上线" },
  { key: "billing", label: "账户与计费", icon: CreditCardOutlined, href: Routes.Billing },
  { key: "settings", label: "设置", icon: SettingOutlined, href: Routes.Settings },
  { key: "help", label: "帮助", icon: QuestionCircleOutlined, href: Routes.Help },
];
```

- [ ] **Step 2: AdminShell（Sider + Header + Content）**

```tsx
// app/admin/(workspace)/_shell/AdminShell.tsx
"use client";

import { useState, createElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Layout, Menu, Tag, Dropdown, Avatar, Typography } from "antd";
import { ThunderboltFilled, LogoutOutlined } from "@ant-design/icons";
import { ADMIN_NAV } from "./nav";
import { PLANS, type PlanId } from "@/lib/plans";

const { Sider, Header, Content } = Layout;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const plan = (session?.user?.plan ?? "free") as PlanId;

  const selectedKey =
    ADMIN_NAV.find((i) => i.href && (pathname === i.href || pathname.startsWith(i.href + "/")))?.key
    ?? "overview";

  const menuItems = ADMIN_NAV.map((i) => ({
    key: i.key,
    icon: createElement(i.icon),
    disabled: i.disabled,
    label: i.disabled
      ? <span>{i.label} <Tag color="cyan" style={{ marginInlineStart: 6 }}>{i.badge}</Tag></span>
      : <Link href={i.href!}>{i.label}</Link>,
  }));

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light"
        style={{ borderInlineEnd: "1px solid #eef3f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 20px" }}>
          <span style={{ display: "grid", placeItems: "center", width: 30, height: 30,
            borderRadius: 8, background: "#0d9488", color: "#fff" }}>
            <ThunderboltFilled />
          </span>
          {!collapsed && <Typography.Text strong>Zap Bridge</Typography.Text>}
        </div>
        <Menu mode="inline" selectedKeys={[selectedKey]} items={menuItems} style={{ borderInlineEnd: 0 }} />
      </Sider>
      <Layout>
        <Header style={{ display: "flex", alignItems: "center", justifyContent: "flex-end",
          gap: 12, paddingInline: 20, borderBlockEnd: "1px solid #eef3f9" }}>
          <Tag color={plan === "free" ? "default" : "cyan"}>{PLANS[plan].label}</Tag>
          <Dropdown menu={{ items: [
            { key: "out", icon: <LogoutOutlined />, label: "退出登录",
              onClick: () => signOut({ callbackUrl: "/login" }) },
          ]}}>
            <Avatar src={session?.user?.image ?? undefined} style={{ background: "#0d9488", cursor: "pointer" }}>
              {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
            </Avatar>
          </Dropdown>
        </Header>
        <Content style={{ padding: 24 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
```

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit`
Expected: 通过。

- [ ] **Step 4: Commit**

```bash
git add "app/admin/(workspace)/_shell/nav.ts" "app/admin/(workspace)/_shell/AdminShell.tsx"
git commit -m "feat(admin): 自建 antd Layout 外壳与侧边导航"
```

---

### Task 8: 接入 admin layout

**Files:** Modify `app/admin/(workspace)/layout.tsx`

- [ ] **Step 1: 重写 layout**

```tsx
// app/admin/(workspace)/layout.tsx
import { AdminProviders } from "./_shell/AdminProviders";
import { AdminShell } from "./_shell/AdminShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProviders>
      <AdminShell>{children}</AdminShell>
    </AdminProviders>
  );
}
```

- [ ] **Step 2: dev 起服务，目视外壳**

Run: `pnpm dev`（端口 3001），登录后访问 `/admin`。
Expected: 出现 antd 浅色侧边栏 + 深青选中态 + 顶栏套餐徽章/头像；无样式闪烁；控制台无 React 19 静态方法告警。

- [ ] **Step 3: Commit**

```bash
git add "app/admin/(workspace)/layout.tsx"
git commit -m "feat(admin): 后台外壳切换为 antd Layout"
```

---

## Phase 3 — admin 页面

### Task 9: 概览 Dashboard

**Files:** Modify `app/admin/(workspace)/page.tsx`

> 数据：`GET /api/landing-pages`（计数/状态/最近）、`GET /api/domains`（计数/验证）、`session.user.plan` + `PLANS`、`GET /api/ai/usage`（额度）。SWR fetcher 复用 `lib/api/fetcher`。

- [ ] **Step 1: 重写概览页**

```tsx
// app/admin/(workspace)/page.tsx
"use client";

import Link from "next/link";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { Row, Col, Card, Statistic, Progress, Table, Button, Tag, Space, Typography } from "antd";
import { FileTextOutlined, GlobalOutlined, RobotOutlined, CrownOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { Routes, ApiRoutes, landingEditorPath } from "@/lib/constants";
import { PLANS, type PlanId } from "@/lib/plans";
import type { UsageSummary } from "@/lib/ai/usage-summary";

interface PageRow { id: string; name: string; slug: string | null; status: "draft" | "published"; updated_at: string; }
interface DomainRow { id: string; verified: boolean; }

export default function OverviewPage() {
  const { data: session } = useSession();
  const plan = (session?.user?.plan ?? "free") as PlanId;
  const planCfg = PLANS[plan];

  const pages = useSWR<PageRow[]>(ApiRoutes.LandingPages);
  const domains = useSWR<DomainRow[]>(ApiRoutes.Domains);
  const usage = useSWR<UsageSummary>(ApiRoutes.AiUsage);

  const pageList = pages.data ?? [];
  const published = pageList.filter((p) => p.status === "published").length;
  const drafts = pageList.length - published;
  const domainList = domains.data ?? [];
  const verified = domainList.filter((d) => d.verified).length;
  const pageLimit = planCfg.landingPagesLimit;
  const pagePct = pageLimit === Infinity ? 0 : Math.min(100, Math.round((pageList.length / pageLimit) * 100));

  const u = usage.data;
  const aiUsedText = u ? `${u.page.used}${u.page.limit === null ? "" : ` / ${u.page.limit}`}` : "—";

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <Typography.Title level={3} style={{ margin: 0 }}>概览</Typography.Title>

      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="落地页" value={pageList.length} prefix={<FileTextOutlined />} />
            <Typography.Text type="secondary">已发布 {published} · 草稿 {drafts}</Typography.Text></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="绑定域名" value={domainList.length} prefix={<GlobalOutlined />} />
            <Typography.Text type="secondary">已验证 {verified}</Typography.Text></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="本月 AI 成页" value={aiUsedText} prefix={<RobotOutlined />} />
            <Typography.Text type="secondary">credit 余额 {u?.creditBalance ?? "—"}</Typography.Text></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="当前套餐" value={planCfg.label} prefix={<CrownOutlined />} />
            {pageLimit !== Infinity && <Progress percent={pagePct} size="small" showInfo={false} style={{ marginTop: 8 }} />}
            <Typography.Text type="secondary">
              落地页 {pageList.length}{pageLimit === Infinity ? "（不限）" : ` / ${pageLimit}`}
            </Typography.Text></Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="最近落地页" extra={<Link href={Routes.LandingPages}>全部</Link>}>
            <Table<PageRow> rowKey="id" size="small" pagination={false} loading={pages.isLoading}
              dataSource={pageList.slice(0, 5)}
              columns={[
                { title: "名称", dataIndex: "name", ellipsis: true },
                { title: "状态", dataIndex: "status", width: 100,
                  render: (s: PageRow["status"]) => <Tag color={s === "published" ? "green" : "default"}>{s === "published" ? "已发布" : "草稿"}</Tag> },
                { title: "更新时间", dataIndex: "updated_at", width: 180, render: (t: string) => new Date(t).toLocaleString() },
                { title: "操作", width: 160, render: (_: unknown, r: PageRow) => (
                  <Space size="small">
                    <Link href={landingEditorPath(r.id)}>编辑</Link>
                    {r.status === "published" && r.slug && <a href={`/p/${r.slug}`} target="_blank" rel="noreferrer">预览</a>}
                  </Space>
                ) },
              ]} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Card title="快捷操作">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Link href="/admin/editor"><Button type="primary" block icon={<ArrowRightOutlined />}>新建落地页</Button></Link>
                <Link href={Routes.Domains}><Button block>绑定域名</Button></Link>
                <Link href={Routes.Pricing}><Button block type="text">查看套餐</Button></Link>
              </Space>
            </Card>
            <Card><Space align="center"><Tag color="cyan">即将上线</Tag>
              <Typography.Text type="secondary">投放分析（访问量 / CTA 点击 / 来源归因）正在路上。</Typography.Text></Space></Card>
          </Space>
        </Col>
      </Row>
    </Space>
  );
}
```

- [ ] **Step 2: 目视 + 类型检查**

Run: `npx tsc --noEmit`，并在 dev 访问 `/admin`。
Expected: 通过；四张 KPI 卡显示真实计数，最近落地页表、快捷操作、即将上线卡正常。

- [ ] **Step 3: Commit**

```bash
git add "app/admin/(workspace)/page.tsx"
git commit -m "feat(admin): 概览 Dashboard 改为真实资产与额度数据"
```

---

### Task 10: 落地页列表（ProTable / antd Table）

**Files:** Modify `app/admin/(workspace)/landing-pages/page.tsx`

> 保留现有数据/操作：SWR `/api/landing-pages`；编辑→`landingEditorPath(id)`；取消发布→`apiLandingUnpublishPath`；删除→`apiLandingPagePath`；新建→`/admin/editor`。新增预览（已发布且有 slug → `/p/{slug}`）。删除确认改用 antd `Popconfirm`（替代 `confirm()`）。

- [ ] **Step 1: 重写为 antd Table**

```tsx
// app/admin/(workspace)/landing-pages/page.tsx
"use client";

import useSWR from "swr";
import Link from "next/link";
import { Table, Button, Tag, Space, Popconfirm, Typography, App } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { landingEditorPath, apiLandingUnpublishPath, apiLandingPagePath, ApiRoutes } from "@/lib/constants";

interface PageRow { id: string; name: string; slug: string | null; status: "draft" | "published"; updated_at: string; }

export default function LandingPagesPage() {
  const { message } = App.useApp();
  const { data, mutate, isLoading } = useSWR<PageRow[]>(ApiRoutes.LandingPages);

  async function unpublish(id: string) {
    await fetch(apiLandingUnpublishPath(id), { method: "POST" });
    message.success("已取消发布");
    void mutate();
  }
  async function remove(id: string) {
    await fetch(apiLandingPagePath(id), { method: "DELETE" });
    message.success("已删除");
    void mutate();
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography.Title level={3} style={{ margin: 0 }}>落地页</Typography.Title>
        <Link href="/admin/editor"><Button type="primary" icon={<PlusOutlined />}>新建</Button></Link>
      </div>
      <Table<PageRow> rowKey="id" loading={isLoading} dataSource={data ?? []}
        locale={{ emptyText: "还没有落地页，点「新建」从模板开始" }}
        columns={[
          { title: "名称", dataIndex: "name", ellipsis: true },
          { title: "状态", dataIndex: "status", width: 110,
            render: (s: PageRow["status"]) => <Tag color={s === "published" ? "green" : "default"}>{s === "published" ? "已发布" : "草稿"}</Tag> },
          { title: "更新时间", dataIndex: "updated_at", width: 200, render: (t: string) => new Date(t).toLocaleString() },
          { title: "操作", width: 240, render: (_: unknown, r: PageRow) => (
            <Space size="middle">
              <Link href={landingEditorPath(r.id)}>编辑</Link>
              {r.status === "published" && r.slug && <a href={`/p/${r.slug}`} target="_blank" rel="noreferrer">预览</a>}
              {r.status === "published" && <a onClick={() => unpublish(r.id)}>取消发布</a>}
              <Popconfirm title="确定删除该落地页？" okText="删除" okButtonProps={{ danger: true }} onConfirm={() => remove(r.id)}>
                <a style={{ color: "#ef4444" }}>删除</a>
              </Popconfirm>
            </Space>
          ) },
        ]} />
    </Space>
  );
}
```

- [ ] **Step 2: 目视 + 类型检查**

Run: `npx tsc --noEmit`；dev 访问 `/admin/landing-pages`。
Expected: 表格列出落地页，编辑/预览/取消发布/删除（Popconfirm）正常。

- [ ] **Step 3: Commit**

```bash
git add "app/admin/(workspace)/landing-pages/page.tsx"
git commit -m "feat(admin): 落地页列表改用 antd Table"
```

---

### Task 11: 域名页（antd 重写，逻辑保留）

**Files:** Modify `app/admin/(workspace)/domains/page.tsx`；`components/domains/AddDomainDialog.tsx`（改用 antd `Modal`+`Form`）；`components/billing/UpgradeDialog.tsx`（antd `Modal`）

> 完整保留现有逻辑：`useSWR(ApiRoutes.Domains)`、5s 未验证轮询、`toggleMutation`/`deleteMutation`/`checkStatusMutation`、套餐上限拦截 `setUpgradeOpen`。仅替换展示：列表用 antd `List`/`Table`，徽章用 `Tag`，按钮用 antd `Button`，确认用 `Popconfirm`，弹窗用 antd `Modal`。

- [ ] **Step 1: 改写 `AddDomainDialog` 为 antd Modal + Form**

打开现有 `components/domains/AddDomainDialog.tsx`，保留其 props（`open/onOpenChange/onAdded`）与提交逻辑（POST 域名），把外层 shadcn Dialog 换成 antd：
```tsx
import { Modal, Form, Input } from "antd";
// <Modal open={open} onCancel={() => onOpenChange(false)} onOk={form.submit} title="添加域名" confirmLoading={...}>
//   <Form form={form} layout="vertical" onFinish={async (v) => { /* 原 POST 逻辑，成功后 onAdded(); onOpenChange(false) */ }}>
//     <Form.Item name="domain" label="域名" rules={[{ required: true }]}><Input placeholder="go.yourbrand.com" /></Form.Item>
//   </Form>
// </Modal>
```
（保留原有校验/错误提示文案，错误用 `App.useApp().message.error`。）

- [ ] **Step 2: 改写 `UpgradeDialog` 为 antd Modal**

把 shadcn Dialog 换 antd `Modal`，内容（当前套餐/升级引导）保留，CTA `Button type="primary"` 跳 `Routes.Billing`。

- [ ] **Step 3: 改写域名页主体**

保留 `DomainsPage` 顶部所有 hooks 与 handler 不变（`useSWR`、轮询 `useSWR(...,{refreshInterval:5000})`、`toggleMutation`、`deleteMutation`、`checkStatusMutation`、`handleToggle`、`handleCheckStatus`）。仅替换 `return` 的 JSX：
```tsx
import { Table, Button, Tag, Space, Popconfirm, Switch, Typography, Empty } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
// 顶部：标题「域名」+ 副标题「已启用 X/limit」+ 右侧 Button「添加域名」
// 列表用 Table：列[域名(+绑定落地页名), 验证状态(已验证 Tag green / 待验证 Tag + Reload 按钮 handleCheckStatus), 启用(Switch checked=enabled onChange=handleToggle), 操作(Popconfirm 删除)]
// 空态用 <Empty description="还没有绑定任何域名" />
```

- [ ] **Step 4: 目视 + 类型检查**

Run: `npx tsc --noEmit`；dev 访问 `/admin/domains`，测添加/启用/验证刷新/删除。
Expected: 行为与改造前一致，UI 为 antd。

- [ ] **Step 5: Commit**

```bash
git add "app/admin/(workspace)/domains/page.tsx" components/domains/AddDomainDialog.tsx components/billing/UpgradeDialog.tsx
git commit -m "feat(admin): 域名页与相关弹窗改用 antd"
```

---

### Task 12: 素材库页（antd 重写）

**Files:** Modify `app/admin/(workspace)/media/page.tsx`；`components/media/MediaGrid.tsx`、`components/media/UploadZone.tsx`（antd 化）

> 保留上传/列表/删除逻辑与 API（`/api/media*`）。上传用 antd `Upload`（或保留现有 input + 包 antd Button），网格用 antd `Image`/`Card` + `Popconfirm` 删除。tab 过滤（现有 `filter` 状态）改用 antd `Segmented` 或 `Tabs`。

- [ ] **Step 1: 改 MediaGrid 为 antd Card/Image 网格 + Popconfirm 删除**（保留 `handleDelete`、`deletingId` 等逻辑）
- [ ] **Step 2: 改 UploadZone 用 antd Button 触发现有上传逻辑（保留 `inputRef`/`uploading`/`error`，error 用 message）**
- [ ] **Step 3: 媒体页主体：标题 + `Segmented` 过滤（保留 `filter` 状态）+ 网格**
- [ ] **Step 4: 目视 + 类型检查**

Run: `npx tsc --noEmit`；dev 访问 `/admin/media`，测上传/删除/过滤。
Expected: 一致行为，antd UI。

- [ ] **Step 5: Commit**

```bash
git add "app/admin/(workspace)/media/page.tsx" components/media/MediaGrid.tsx components/media/UploadZone.tsx
git commit -m "feat(admin): 素材库改用 antd"
```

---

### Task 13: 账户与计费页（antd 重写）

**Files:** Modify `app/admin/(workspace)/billing/page.tsx`；`components/billing/PlanBadge.tsx`、`components/billing/PlanComparison.tsx`（admin 内用到的部分 antd 化）

> 保留 `checkout`/`portal` mutation 与 `SuccessToast` 逻辑。展示换 antd：当前套餐用 `Card` + `Descriptions`，可升级套餐用 `Card` 列表 + `Button`，`PlanBadge` 改用 antd `Tag`（颜色映射 free=default/starter=blue/pro=geekblue/agency=gold）。

- [ ] **Step 1: 改 `PlanBadge` 为 antd Tag**（导出同名组件，props 不变）
- [ ] **Step 2: 改 billing 页主体**（标题「账户与计费」+ 当前套餐 Descriptions（套餐/落地页上限/域名上限/水印）+ 管理订阅按钮 portal + 可升级套餐卡 + checkout）
- [ ] **Step 3: 目视 + 类型检查**

Run: `npx tsc --noEmit`；dev 访问 `/admin/billing`。
Expected: 套餐信息正确，升级/管理订阅按钮可用（跳转 LS）。

- [ ] **Step 4: Commit**

```bash
git add "app/admin/(workspace)/billing/page.tsx" components/billing/PlanBadge.tsx components/billing/PlanComparison.tsx
git commit -m "feat(admin): 账户与计费页改用 antd"
```

---

### Task 14: 设置页（新真页）

**Files:** Modify `app/admin/(workspace)/settings/page.tsx`

- [ ] **Step 1: 写设置页**

```tsx
// app/admin/(workspace)/settings/page.tsx
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, Descriptions, Typography, Space, Tag, Button } from "antd";
import { Routes } from "@/lib/constants";
import { PLANS, type PlanId } from "@/lib/plans";

export default function SettingsPage() {
  const { data: session } = useSession();
  const plan = (session?.user?.plan ?? "free") as PlanId;
  return (
    <Space direction="vertical" size={20} style={{ width: "100%", maxWidth: 720 }}>
      <Typography.Title level={3} style={{ margin: 0 }}>设置</Typography.Title>
      <Card title="个人资料">
        <Descriptions column={1}>
          <Descriptions.Item label="昵称">{session?.user?.name ?? "—"}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{session?.user?.email ?? "—"}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="账户" extra={<Link href={Routes.Billing}><Button type="link">管理</Button></Link>}>
        <Space><span>当前套餐</span><Tag color={plan === "free" ? "default" : "cyan"}>{PLANS[plan].label}</Tag></Space>
      </Card>
    </Space>
  );
}
```

- [ ] **Step 2: 类型检查 + 目视**

Run: `npx tsc --noEmit`；dev 访问 `/admin/settings`。
Expected: 显示昵称/邮箱/套餐。

- [ ] **Step 3: Commit**

```bash
git add "app/admin/(workspace)/settings/page.tsx"
git commit -m "feat(admin): 设置页改为真实账户信息"
```

---

### Task 15: 帮助页（新真页）

**Files:** Modify `app/admin/(workspace)/help/page.tsx`

- [ ] **Step 1: 写帮助页**

```tsx
// app/admin/(workspace)/help/page.tsx
"use client";

import { Card, Collapse, Typography, Space } from "antd";

const FAQ = [
  { key: "1", label: "如何发布落地页到我的域名？", children: <p>在「域名」绑定并验证你的域名，然后在编辑器中点「发布」，选择已验证域名即可。</p> },
  { key: "2", label: "AI 成页额度如何计算？", children: <p>按自然月计算，每月重置；额外 credit 永不过期，月额度用尽后自动消耗 credit。</p> },
  { key: "3", label: "落地页支持哪些转化方式？", children: <p>支持引导访客通过 WhatsApp、电话、邮件、Telegram 等方式联系或留资，不含购物车/支付。</p> },
];

export default function HelpPage() {
  return (
    <Space direction="vertical" size={20} style={{ width: "100%", maxWidth: 760 }}>
      <Typography.Title level={3} style={{ margin: 0 }}>帮助</Typography.Title>
      <Card title="常见问题"><Collapse items={FAQ} defaultActiveKey={["1"]} ghost /></Card>
      <Card title="需要更多帮助？">
        <Typography.Paragraph type="secondary">遇到问题可发邮件至 support@zapbridge.com，我们会尽快回复。</Typography.Paragraph>
      </Card>
    </Space>
  );
}
```

- [ ] **Step 2: 类型检查 + 目视**

Run: `npx tsc --noEmit`；dev 访问 `/admin/help`。
Expected: FAQ 折叠面板正常。

- [ ] **Step 3: Commit**

```bash
git add "app/admin/(workspace)/help/page.tsx"
git commit -m "feat(admin): 帮助页改为真实 FAQ"
```

---

### Task 16: 删除 demo 页与组件

**Files:** Delete demo pages + CRM 组件

- [ ] **Step 1: 确认无引用**

Run:
```bash
grep -rn "SalesFunnelCard\|HighRiskCustomers\|AICoPilotCard" app components | grep -v "components/SalesFunnelCard\|components/HighRiskCustomers\|components/AICoPilotCard"
```
Expected: 空（仅自身定义，无外部引用；概览页已不再引用）。

- [ ] **Step 2: 删除**

Run:
```bash
git rm "app/admin/(workspace)/statistics/page.tsx" "app/admin/(workspace)/tasks/page.tsx" "app/admin/(workspace)/reports/page.tsx" "app/admin/(workspace)/notifications/page.tsx" components/SalesFunnelCard.tsx components/HighRiskCustomers.tsx components/AICoPilotCard.tsx
```

- [ ] **Step 3: 类型检查（确认无悬空引用）**

Run: `npx tsc --noEmit`
Expected: 通过。

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(admin): 删除 demo 占位页与 CRM 示例组件"
```

---

## Phase 4 — super-admin

### Task 17: super-admin 外壳

**Files:**
- Create `app/super-admin/_shell/SuperAdminProviders.tsx`（同 AdminProviders）
- Create `app/super-admin/_shell/SuperAdminShell.tsx`（深色 Sider：概览/用户/平台设置）
- Modify `app/super-admin/layout.tsx`（保留 `auth()` + `SUPER_ADMIN` 角色校验与 `redirect`，外层包 Providers + Shell）

- [ ] **Step 1: SuperAdminProviders**（复制 AdminProviders，主题用 `adminTheme`；Sider 深色由 Shell 控制）
- [ ] **Step 2: SuperAdminShell**（antd Layout，`Sider theme="dark"`，菜单：概览`/super-admin`、用户`/super-admin/users`、平台设置`/super-admin/settings`；顶栏 Operator 邮箱 + 退出到 `/`）
- [ ] **Step 3: 改 layout**（保留服务端角色校验逻辑，渲染 `<SuperAdminProviders><SuperAdminShell>{children}</...>`）
- [ ] **Step 4: 类型检查 + 目视**

Run: `npx tsc --noEmit`；dev 以 super-admin 访问 `/super-admin`。
Expected: 深色侧栏 + 深青强调，角色校验仍生效。

- [ ] **Step 5: Commit**

```bash
git add app/super-admin/_shell app/super-admin/layout.tsx
git commit -m "feat(super-admin): antd 深色外壳"
```

---

### Task 18: super-admin 概览 + 用户

**Files:** Modify `app/super-admin/page.tsx`、`app/super-admin/users/page.tsx`；`components/admin/InviteUserDialog.tsx`（antd Modal）

- [ ] **Step 1: 概览**（保留服务端 `getStats`，用 antd `Row/Col/Card/Statistic` 展示用户数/落地页数等；CTA 卡用 antd `Card`+`Button`）
- [ ] **Step 2: 用户列表**（保留数据获取，改 antd `Table`：邮箱/角色 Tag/套餐/注册时间；顶部「邀请用户」开 antd Modal）
- [ ] **Step 3: InviteUserDialog 改 antd Modal + Form**（保留 `inviteMutation` 逻辑）
- [ ] **Step 4: 类型检查 + 目视**

Run: `npx tsc --noEmit`；dev 访问 `/super-admin`、`/super-admin/users`。
Expected: 统计与用户表正常，邀请弹窗可用。

- [ ] **Step 5: Commit**

```bash
git add app/super-admin/page.tsx app/super-admin/users/page.tsx components/admin/InviteUserDialog.tsx
git commit -m "feat(super-admin): 概览与用户列表改用 antd"
```

---

## Phase 5 — 编辑器外壳

### Task 19: 编辑器顶栏/侧边 antd 化（画布不动）

**Files:** Modify `app/admin/editor/[id]/page.tsx` 及其顶栏/侧边外壳组件（执行时先读该文件定位外壳与画布边界）

> 仅替换编辑器的「外壳 UI」：顶栏（保存 / 发布 / 预览 / 设备切换 / 返回）按钮与状态用 antd `Button`/`Segmented`/`message`；侧边控制面板容器用 antd。**中间可视化画布（landing-editor 渲染/拖拽）保持不变**。保留所有保存/发布逻辑与 props。

- [ ] **Step 1: 读编辑器页，标出外壳与画布边界**（不改画布）
- [ ] **Step 2: 顶栏按钮/状态换 antd**（保留 onSave/onPublish/onPreview 等回调）
- [ ] **Step 3: 设备切换用 antd `Segmented`**（保留现有 device 状态）
- [ ] **Step 4: 类型检查 + 目视**

Run: `npx tsc --noEmit`；dev 进入某落地页编辑器。
Expected: 顶栏/设备切换为 antd，画布与保存/发布功能正常。

- [ ] **Step 5: Commit**

```bash
git add app/admin/editor
git commit -m "feat(admin): 编辑器外壳改用 antd（画布不变）"
```

---

## Phase 6 — 收尾验证

### Task 20: 清理旧 admin 样式依赖 + 全量验证

**Files:** 扫描 admin 区残留 Tailwind/shadcn 依赖

- [ ] **Step 1: 扫描 admin 区是否还引用 styles 工具类/旧 shadcn 组件**

Run:
```bash
grep -rnE 'aqua-|text-foreground|bg-muted|@/components/ui/' "app/admin/(workspace)" app/super-admin | grep -v editor
```
Expected: 概览/列表/设置/帮助/billing/domains/media 页应已无 Tailwind 工具类（编辑器画布除外）。若有残留按 antd 替换。

- [ ] **Step 2: 全量类型检查 + lint**

Run: `npx tsc --noEmit && npx eslint "app/admin/**" "app/super-admin/**" components/admin lib/theme lib/ai/usage-summary.ts app/api/ai/usage/route.ts`
Expected: 0 error。

- [ ] **Step 3: 单测**

Run: `npx vitest run`
Expected: 全绿（原 35 + 新增 usage-summary 用例）。

- [ ] **Step 4: 生产构建**

Run: `npx next build`
Expected: exit 0；admin/super-admin 路由编译通过。

- [ ] **Step 5: 浏览器抽查**

dev 起服务，逐一目视：`/admin`（概览）、`/admin/landing-pages`、`/admin/domains`、`/admin/media`、`/admin/billing`、`/admin/settings`、`/admin/help`、`/super-admin`、`/super-admin/users`、某编辑器页。确认深青明亮主题统一、无样式闪烁、无 React 19 静态方法告警、官网首页仍 Tailwind 不受影响。

- [ ] **Step 6: 最终提交**

```bash
git add -A
git commit -m "chore(admin): admin/super-admin antd 重构收尾与验证"
```

---

## Self-Review 覆盖检查

- spec「技术架构」→ Task 1/2/6（依赖/主题/Registry）✓
- spec「布局外壳」→ Task 6/7/8（admin）、Task 17（super-admin）✓
- spec「页面处置·重做」→ Task 10/11/12/13（落地页/域名/素材/计费）✓
- spec「新建真页」→ Task 9（概览）/14（设置）/15（帮助）✓
- spec「砍掉」→ Task 16 ✓
- spec「预留投放分析」→ Task 7 导航 disabled+Tag ✓
- spec「super-admin」→ Task 17/18 ✓
- spec「编辑器外壳」→ Task 19 ✓
- spec「小后端补充 GET /api/ai/usage」→ Task 4/5 ✓
- spec「测试与验证」→ Task 4 单测、Task 20 全量 ✓
- spec「非目标」→ 不碰分析管道/画布/官网/落地页，计划全程遵守 ✓

