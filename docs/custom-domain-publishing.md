# 自有域名发布（Custom Domain Publishing）

在本项目建的落地页，发布到**客户自己的域名**对外访问的完整机制与踩过的坑。改动多租户改写、域名接入、发布链路前必读。

## 架构：两套互相独立的「域名登记」

一个 host 要能对外打开，必须**两套登记同时成立**：

| 层 | 登记在哪 | 由谁维护 | 决定什么 |
|---|---|---|---|
| 边缘层 | Vercel 项目域名列表 | `addDomainToProject`（`lib/vercel.ts`） | 能不能连上、有没有证书、路由到哪个部署 |
| 应用层 | DB `domains` 表 + `landing_pages.status` | `/api/domains` + 发布路由 | 这个 host 映射到哪个已发布页 |

二者会脱节（例：在 Vercel 后台手工删了域名，DB 行还在）→ 应用显示「已发布」，边缘却 `DEPLOYMENT_NOT_FOUND`。发布路由已用**幂等重挂**兜底（见下）。

## 生命周期

1. **添加**（`POST /api/domains`）：`addDomainToProject` 把域名挂进 Vercel 项目 **+** 建 DB 行（`enabled=false`）**+** 返回客户需配置的 DNS 记录。
2. **启用**（`PATCH /api/domains/[id]` `{enabled:true}`）：域名列表里的开关，启用时校验套餐 `domainsLimit` 配额。
3. **发布**（`POST /api/landing-pages/[id]/publish`）：**幂等重挂** `addDomainToProject` 兜底 → 绑定落地页 → `status=published`。要求域名 `enabled && verified`。

## 访客访问解析链路

```
DNS 解析 → Vercel 边缘（域名须在项目内，否则 DEPLOYMENT_NOT_FOUND）
  → proxy.ts handleTenancy：isCustomDomain(host) → getLandingSlugByCustomDomain → rewrite 到 /p/{slug}
  → app/p/[slug]/page.tsx 渲染
```

DNS 指向 Vercel 两种形态：域名在 Vercel 购买（nameserver 委托 Vercel，全托管）；或客户在自己 DNS 商加记录（见下）。

## 关键陷阱（都踩过、都修过）

1. **改写后 `host` 被污染成 app 主域**：中间件 `rewrite` 到 `/p/[slug]` 后，下游页面 / `generateMetadata` 读到的 `headers().get("host")` 是 **app 主域**，不是租户域名 → 守卫误 404、canonical 指错。
   → 中间件改写时把真实客户域名盖进 `x-tenant-host`（`TENANT_HOST_HEADER`）；页面 / metadata 一律用 `resolveTenantHostname()`（`lib/host.ts`）读取，**禁止直接用 `host` 判租户**。`proxy.ts` 终端会剥除客户端伪造的 `x-tenant-host`。

2. **`handleTenancy` 必须在 `auth()` 之外**：NextAuth `auth()` 包装器用 `new Response(body, response)` 重建响应，会**丢弃 `rewrite` 附带的上游请求头覆盖**（即 `x-tenant-host` 传不下去）。故 `proxy.ts` 里 `handleTenancy` 先行处理并**直接返回**改写响应，鉴权段单独用 `auth()` 包装。

3. **DNS 记录按域名形态、对任意注册商**（`lib/vercel.ts` `dnsRecordsFor`，按 Vercel 返回的 `apexName` 判定）：
   - 裸域 `example.com` → `A @ 76.76.21.21`（裸域不能用 CNAME；A 记录对 Cloudflare / Route53 / Namecheap / GoDaddy 全通用）
   - 子域 `www.example.com` → `CNAME www cname.vercel-dns.com`
   - Cloudflare 必须**灰云（仅 DNS，关代理）**，否则拦截证书签发与回源。

4. **Vercel 敏感环境变量无法回读**：`DATABASE_URL` / `VERCEL_PROJECT_ID` / `VERCEL_API_TOKEN` / `AUTH_SECRET` 等 `type=sensitive`，`vercel env pull` 与 API `decrypt=true` 都返回**空**——这是掩码不是缺失，别据此判断「未配置」。

5. **在 Vercel 后台买域名 ≠ 挂进项目**：账号层拥有 ≠ 项目服务。必须走应用「添加域名」流程，或 `vercel domains add <domain> <project> --scope <team>`。

6. **`domains.enabled` 默认 `false`**（`lib/migrations/004_add_domains_table.sql`）：首次添加不自动启用，需在列表用启用开关打开（计入套餐配额）；`getLandingSlugByCustomDomain` / 发布均要求 `enabled=true`。

## 关键文件

- `proxy.ts`、`lib/proxy/tenant-proxy.ts` — 多租户改写（`handleTenancy` 在 auth 外）
- `lib/host.ts` — `appHostname` / `isAppHost` / `isCustomDomain` / `resolveTenantHostname` / `TENANT_HOST_HEADER`
- `lib/vercel.ts` — `addDomainToProject` / `dnsRecordsFor` / `dnsRecordName` / `getDomainVerification`
- `app/api/domains/route.ts`、`[id]/route.ts`、`[id]/status/route.ts` — 增删改查 / 启用 / 验证
- `app/api/landing-pages/[id]/publish/route.ts` — 发布（幂等重挂）
- `app/p/[slug]/page.tsx` — 公开渲染
- `components/domains/AddDomainDialog.tsx` — 添加弹窗（渲染 DNS 记录）
