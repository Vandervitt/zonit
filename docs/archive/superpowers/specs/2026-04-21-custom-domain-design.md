# 自定义域名功能设计文档

**日期**：2026-04-21  
**状态**：待实现

---

## 背景

PingPage 订阅分级中，Starter 及以上用户可绑定自定义独立域名。当前系统只支持公共子域名（`slug.pingpage.site`）。本功能允许用户将自己的域名（如 `mybrand.com`）指向其 PingPage 站点，浏览器地址栏保持自定义域名不变。

### 配额限制

| 套餐 | 可启用域名数 |
|------|------------|
| Free | 0 |
| Starter | 1 |
| Pro | 5 |
| Agency | 无限 |

用户可添加任意数量的域名（无限制），但同时**启用**的域名数不得超过套餐配额。

---

## 整体架构

```
用户请求 mybrand.com
        ↓
  proxy.ts（Vercel Edge）
  读取 Host header → 查 domains 表（enabled=true, verified=true）
        ↓ 匹配到
  NextResponse.rewrite("/site/[slug]")
  浏览器地址栏保持 mybrand.com
        ↓
  app/site/[slug]/page.tsx 正常渲染
```

---

## 数据库

### 新建 `domains` 表

```sql
CREATE TABLE domains (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_id    TEXT REFERENCES sites(id) ON DELETE SET NULL,
  domain     TEXT NOT NULL UNIQUE,
  enabled    BOOLEAN NOT NULL DEFAULT false,
  verified   BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_domains_user_id ON domains(user_id);
CREATE INDEX idx_domains_domain ON domains(domain) WHERE enabled = true AND verified = true;
```

### 迁移文件

新建 `lib/migrations/004_add_domains_table.sql`，包含上述建表语句。`sites.custom_domain` 列不再使用（已存在，保留不动，不做数据迁移）。

---

## 域名生命周期

### 添加域名（无配额限制）

1. 用户填写域名 → `POST /api/domains`
2. 校验域名格式
3. 检查域名是否已被其他用户绑定
4. 调 Vercel API 添加域名到项目（获取 DNS 配置信息）
5. DB 写入 `domains`（`enabled=false`, `verified=false`）
6. 返回需要配置的 DNS 记录：`CNAME cname.vercel-dns.com`

### 启用域名（受配额限制）

1. 用户点击「启用」→ `PATCH /api/domains/[id]` `{ enabled: true }`
2. 查询 `COUNT(*) WHERE user_id=? AND enabled=true`，对比 `domainsLimit`
3. 超出配额返回 403；通过则更新 `enabled=true`

### 停用域名

`PATCH /api/domains/[id]` `{ enabled: false }`，无配额检查，直接更新。

### 验证状态轮询

`GET /api/domains/[id]/status` → 调 Vercel API 查验证状态 → 若通过则更新 `verified=true`。  
前端每 5 秒轮询一次，最长 5 分钟。

### 删除域名

1. `DELETE /api/domains/[id]`
2. 调 Vercel API 从项目中删除域名
3. 删除 DB 记录

---

## API 路由

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/domains` | 列出当前用户所有域名 |
| POST | `/api/domains` | 添加域名 |
| PATCH | `/api/domains/[id]` | 启用/停用/更换绑定站点 |
| GET | `/api/domains/[id]/status` | 查 Vercel 验证状态 |
| DELETE | `/api/domains/[id]` | 删除域名 |

---

## proxy.ts 改造

在现有鉴权逻辑**之前**插入自定义域名路由判断：

```typescript
const appHost = new URL(process.env.NEXT_PUBLIC_APP_URL!).hostname;
const host = request.headers.get("host") ?? "";

if (host && !host.includes(appHost)) {
  // 自定义域名请求，跳过鉴权，直接路由到对应站点
  const result = await pool.query(
    `SELECT s.slug FROM domains d
     JOIN sites s ON s.id = d.site_id
     WHERE d.domain = $1 AND d.enabled = true AND d.verified = true
       AND s.status = 'published'`,
    [host]
  );
  if (result.rows[0]) {
    return NextResponse.rewrite(
      new URL(`/site/${result.rows[0].slug}`, request.url)
    );
  }
  return new NextResponse("Not Found", { status: 404 });
}
// 继续执行现有鉴权逻辑...
```

---

## Vercel API 集成

封装在 `lib/vercel.ts`：

```typescript
// 添加域名
addDomainToProject(domain: string): Promise<{ cname: string }>

// 查验证状态
getDomainVerification(domain: string): Promise<"pending" | "verified" | "error">

// 删除域名
removeDomainFromProject(domain: string): Promise<void>
```

所需环境变量：
- `VERCEL_API_TOKEN` — 个人访问令牌
- `VERCEL_PROJECT_ID` — 项目 ID
- `VERCEL_TEAM_ID` — 可选，Team 账号需要

---

## UI

### `/domains` 独立管理页

- 页面顶部：已使用配额显示（如"已启用 2/5 个域名"）
- 域名列表表格：域名、绑定站点、验证状态（待验证/已验证/验证失败）、启用开关、删除按钮
- 「添加域名」按钮 → Dialog：
  1. 输入域名
  2. 选择绑定站点（下拉）
  3. 提交后展示 DNS 配置指引（CNAME 记录）及轮询验证状态

### 站点设置快捷入口

在 `SiteCard` 下方或编辑器侧边栏增加一行：当前绑定域名（或"未绑定"）+ 「绑定域名」跳转到 `/domains` 并预填站点。

### Sidebar 新增入口

在现有导航菜单中添加「域名」菜单项，图标使用 `Globe`，路径 `/domains`。

---

## 错误处理

| 场景 | HTTP 状态 | 错误码 |
|------|-----------|--------|
| 域名格式非法 | 400 | `INVALID_DOMAIN` |
| 域名已被占用 | 409 | `DOMAIN_TAKEN` |
| 启用超出配额 | 403 | `QUOTA_EXCEEDED` |
| Vercel API 失败 | 502 | `VERCEL_API_ERROR` |

---

## Cloudflare 配置说明（展示给用户）

用户在 Cloudflare 添加 CNAME 记录时：
- 子域名（`www.mybrand.com`）：代理状态可开启（橙色云朵）或关闭均可
- 顶级域名（`mybrand.com`）：需将 Cloudflare 代理设为**仅 DNS**（灰色云朵），否则 Vercel SSL 验证会失败

---

## 实现顺序

1. DB 迁移（`004_add_domains_table.sql`）
2. `lib/vercel.ts` Vercel API 封装
3. API 路由（`/api/domains` 系列）
4. `proxy.ts` 改造
5. `/domains` 管理页 UI
6. Sidebar 入口 + SiteCard 快捷入口



