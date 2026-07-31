# 自有域名发布（Custom Domain Publishing）

在本项目建的落地页，发布到**客户自己的域名**对外访问的完整机制与踩过的坑。改动多租户改写、域名接入、发布链路前必读。

## 架构：两套互相独立的「域名登记」

一个 host 要能对外打开，必须**两套登记同时成立**：

| 层 | 登记在哪 | 由谁维护 | 决定什么 |
|---|---|---|---|
| 边缘层 | Vercel 项目域名列表 | `addDomainToProject`（`lib/vercel.ts`） | 能不能连上、有没有证书、路由到哪个部署 |
| 应用层 | DB `domains` + `domain_routes` + `landing_pages.status` | `/api/domains` + 发布路由 | 这个 host **的某个路径**映射到哪个已发布页 |

二者会脱节（例：在 Vercel 后台手工删了域名，DB 行还在）→ 应用显示「已发布」，边缘却 `DEPLOYMENT_NOT_FOUND`。发布路由已用**幂等重挂**兜底（见下）。

## 生命周期

1. **添加**（`POST /api/domains`）：`addDomainToProject` 把域名挂进 Vercel 项目 **+** 建 DB 行（`enabled=false`）**+** 返回客户需配置的 DNS 记录。
2. **启用**（`PATCH /api/domains/[id]` `{enabled:true}`）：域名列表里的开关，启用时校验套餐 `domainsLimit` 配额。
3. **发布**（`POST /api/landing-pages/[id]/publish`）：**幂等重挂** `addDomainToProject` 兜底 → 校验路径（规范化 + 保留字）→ 写 `domain_routes` → `status=published`。要求域名 `enabled && verified`。请求体接受 `path`，缺省为根路径。

## 多路径解析（域名 + 路径 → 页面）

一个域名可承载多张页，各占一个路径。解析依据是 `domain_routes(domain_id, path, landing_page_id)`：

- `(domain_id, path)` 唯一 —— 解析主键
- `landing_page_id` 唯一 —— 一页一位置，改发到别处自动释放原位
- `path` 有 CHECK 约束，形状与 `lib/domains/route-path.ts` 的 `normalizeRoutePath` **同源**

**规范化必须两端同源**。解析（proxy）与写入（发布接口）若各写一套规则，会出现最难查的一类不一致：库里存 `/Services`，访客请求 `/services`，两边都自认没错，页面就是打不开。

**保留路径**（`isReservedRoutePath`）：`/api`、`/_next`、`/.well-known` 前缀，以及 `/robots.txt`、`/sitemap.xml`、`/llms.txt`、`/favicon.ico`。这些在 proxy 里**先于**租户解析返回，写进库也永远打不开，故必须在发布时挡掉。注意除 `/api` 外，其余项的形状本就过不了规范化（下划线、点号不在字符集内），显式列出是纵深防御。

**未绑定路径一律 404，不回落到根页**：回落会让每个错误路径都变成一份重复内容——正是 PR #136 修掉的 soft-404。同理，只发了 `/invisalign` 而没发根路径时，直接访问域名就是 404，域名列表会显式提示。

**`domains.landing_page_id` 是过渡期遗留列**：P1 起解析已全部走 `domain_routes`，该列仍被**双写**作为回滚保险。它无法表达一域名多页，P2 之后语义已不成立，待生产稳定后单独迁移删除。**读取一律走 `domain_routes`，不要再用这一列。**

## 访客访问解析链路

```
DNS 解析 → Vercel 边缘（域名须在项目内，否则 DEPLOYMENT_NOT_FOUND）
  → proxy.ts handleTenancy：isCustomDomain(host) → getLandingSlugByCustomDomain → rewrite 到 /p/{slug}
  → app/p/[slug]/page.tsx 渲染
```

DNS 指向 Vercel 两种形态：域名在 Vercel 购买（nameserver 委托 Vercel，全托管）；或客户在自己 DNS 商加记录（见下）。

## 关键陷阱（都踩过、都修过）

1. **改写后 `host` 与 `pathname` 都被污染**：中间件 `rewrite` 到 `/p/[slug]` 后，下游页面 / `generateMetadata` 读到的 `headers().get("host")` 是 **app 主域**、pathname 是 `/p/{slug}` → 守卫误 404、canonical 指错。
   → 中间件改写时把真实客户域名盖进 `x-tenant-host`（`TENANT_HOST_HEADER`）、把规范化后的原始路径盖进 `x-tenant-path`（`TENANT_PATH_HEADER`）；页面 / metadata 一律用 `resolveTenantHostname()` / `resolveTenantPath()`（`lib/host.ts`）读取，**禁止直接用 `host` 或 `pathname` 判租户**。`proxy.ts` 终端会剥除客户端伪造的这两个头。

2. **`handleTenancy` 必须在 `auth()` 之外**：NextAuth `auth()` 包装器用 `new Response(body, response)` 重建响应，会**丢弃 `rewrite` 附带的上游请求头覆盖**（即 `x-tenant-host` 传不下去）。故 `proxy.ts` 里 `handleTenancy` 先行处理并**直接返回**改写响应，鉴权段单独用 `auth()` 包装。

3. **DNS 记录按域名形态、对任意注册商**（`lib/vercel.ts` `dnsRecordsFor`，按 Vercel 返回的 `apexName` 判定）：
   - 裸域 `example.com` → `A @ 76.76.21.21`（裸域不能用 CNAME；A 记录对 Cloudflare / Route53 / Namecheap / GoDaddy 全通用）
   - 子域 `www.example.com` → `CNAME www cname.vercel-dns.com`
   - Cloudflare 必须**灰云（仅 DNS，关代理）**，否则拦截证书签发与回源。

4. **Vercel 敏感环境变量无法回读**：`DATABASE_URL` / `VERCEL_PROJECT_ID` / `VERCEL_API_TOKEN` / `AUTH_SECRET` 等 `type=sensitive`，`vercel env pull` 与 API `decrypt=true` 都返回**空**——这是掩码不是缺失，别据此判断「未配置」。

5. **在 Vercel 后台买域名 ≠ 挂进项目**：账号层拥有 ≠ 项目服务。必须走应用「添加域名」流程，或 `vercel domains add <domain> <project> --scope <team>`。

6. **`domains.enabled` 默认 `false`**（`migrations/004_add_domains_table.js`）：首次添加不自动启用，需在列表用启用开关打开（计入套餐配额）；`resolveTenantRoute` / 发布均要求 `enabled=true`。

## 关键文件

- `proxy.ts`、`lib/proxy/tenant-proxy.ts` — 多租户改写（`handleTenancy` 在 auth 外）
- `lib/host.ts` — `appHostname` / `isAppHost` / `isCustomDomain` / `resolveTenantHostname` / `resolveTenantPath` / `TENANT_HOST_HEADER` / `TENANT_PATH_HEADER`
- `lib/domains/route-path.ts` — `normalizeRoutePath` / `isReservedRoutePath`（与 DB CHECK 同源）
- `lib/domains-db.ts` — `resolveTenantRoute` / `listPublishedRoutes` / `bindDomainToLandingPage`
- `lib/vercel.ts` — `addDomainToProject` / `dnsRecordsFor` / `dnsRecordName` / `getDomainVerification`
- `app/api/domains/route.ts`、`[id]/route.ts`、`[id]/status/route.ts` — 增删改查 / 启用 / 验证
- `app/api/landing-pages/[id]/publish/route.ts` — 发布（幂等重挂）
- `app/p/[slug]/page.tsx` — 公开渲染
- `components/domains/AddDomainDialog.tsx` — 添加弹窗（渲染 DNS 记录）
