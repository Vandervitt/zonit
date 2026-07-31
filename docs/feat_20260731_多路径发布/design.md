# 多路径发布 — 设计方案

> 状态：**待评审**（评审通过后再实现）
> 分支：`feat_20260731_多路径发布`
> 前置：PR #136（租户域非根路径 404）—— 独立成立，先合

## 1. 背景

当前发布模型是**一域名一页**：`domains.landing_page_id` 单 FK（`migrations/010`），`handleTenancy` 只按 host 解析 slug，pathname 不参与。

两个促成改造的事实：

**① 套餐额度自相矛盾。** `landingPagesLimit` 只在创建时门控（`api/landing-pages/route.ts:34`、`generate:61`、`duplicate:15`），而实际能上线的页数受 `domainsLimit` 物理限制：

| 套餐 | 可建页 | 域名 | 实际可上线 | 建了发不出去 |
|---|---|---|---|---|
| Free | 1 | 0 | 0（仅预览） | — |
| Starter | 3 | 1 | 1 | 2 |
| Pro | 20 | 5 | 5 | **15** |
| Agency | ∞ | ∞ | ∞ | — |

Pro 客户按定价页承诺能建 20 张，实际只有 5 张能对外服务。

**② 客群与架构不匹配。** 模板库已覆盖 12 行业（诊所、律所、教培、B2B、本地服务），这类客户要的是 `brand.com/invisalign`、`brand.com/whitening` 同品牌多服务页，而非一个域名一个 offer。

## 2. 已定产品决策

以下为本次评审前已拍板，实现阶段不再讨论：

| # | 决策 |
|---|---|
| D1 | 发布额度 = `landingPagesLimit`，不新增计费维度。Starter **3 → 5**，Pro 20，Agency ∞ 保持 |
| D2 | `domainsLimit` 不变（Free 0 / Starter 1 / Pro 5 / Agency ∞），含义从「发布规模」变为「品牌数」 |
| D3 | Free 仍不能发布，只能建页 + 预览 |
| D4 | Starter 定位为「单品牌多服务页」，**不再享有一域名一 offer 的风控隔离**；投放型客户应上 Pro。此分层需在定价页显式写出 |
| D5 | 降档策略：保留存量 + 禁止新增发布 + **7 天宽限后自动下线超额部分** |
| D6 | 根路径未发布时，域名根返回 404（不 fallback 到任意页），后台显式提示 |
| D7 | 一张 page 只能发布到一个位置（`landing_page_id` 唯一），要多处请复制页面 |
| D8 | 风控叙事改口：「一域名一 offer」从系统强制降级为建议，文档同步 |

## 3. 数据模型

### 3.1 新表

```sql
CREATE TABLE domain_routes (
  id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  domain_id       TEXT        NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  path            TEXT        NOT NULL,   -- 规范化：恒以 / 开头，无尾斜杠，根为 '/'
  landing_page_id TEXT        NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 同一域名下路径唯一
CREATE UNIQUE INDEX idx_domain_routes_domain_path ON domain_routes(domain_id, path);
-- D7：一张页只能发布到一处
CREATE UNIQUE INDEX idx_domain_routes_page ON domain_routes(landing_page_id);
CREATE INDEX idx_domain_routes_domain ON domain_routes(domain_id);
```

### 3.2 存量迁移

```sql
INSERT INTO domain_routes (domain_id, path, landing_page_id)
SELECT id, '/', landing_page_id
  FROM domains
 WHERE landing_page_id IS NOT NULL
ON CONFLICT DO NOTHING;
```

`domains.landing_page_id` **本次保留但停止写入**，仅作回滚保险；确认生产稳定后再单独迁移删除。理由：这是公开渲染链路的解析依据，一旦删列且新链路有问题，所有客户页面同时下线。

### 3.3 路径规范化与校验

| 规则 | 取值 |
|---|---|
| 大小写 | 一律转小写 |
| 前后缀 | 必须以 `/` 开头；除根外去掉尾斜杠 |
| 字符集 | `[a-z0-9-]`，段间单 `/` |
| 深度 | ≤ 2 段（`/a`、`/a/b`） |
| 总长 | ≤ 64 字符 |

**保留路径**（发布时硬拦，错误码 `path_reserved`）：

- 前缀：`/api/*`、`/_next/*`、`/.well-known/*`
- 精确：`/robots.txt`、`/sitemap.xml`、`/llms.txt`、`/favicon.ico`

理由：这些在 `tenant-proxy.ts` 的放行名单里**先于租户解析返回**，客户即使发布成功也永远打不开——必须在写入时挡掉，而非留到运行期。

## 4. 解析链路

```
brand.com/invisalign
   ↓ handleTenancy
放行名单（/_next、元数据路由、访客 API）→ 先行 return
   ↓
resolveTenantRoute(host, normalizePath(pathname))
   ↓ 命中 → rewrite /p/{slug}（透传 TENANT_HOST_HEADER + 原始 path）
   ↓ 未命中 → 404
```

解析查询（`domains.domain` 已有 UNIQUE 索引，加 `domain_routes` 复合唯一索引后为两次索引查找）：

```sql
SELECT lp.slug
  FROM domain_routes r
  JOIN domains d       ON d.id = r.domain_id
  JOIN landing_pages lp ON lp.id = r.landing_page_id
 WHERE d.domain = $1 AND r.path = $2
   AND d.enabled AND d.verified AND lp.status = 'published'
```

**canonical 需要原始路径**：改写后下游只能看到 `/p/{slug}`，因此除现有 `TENANT_HOST_HEADER` 外，需再透传一个 `TENANT_PATH_HEADER`，供 `generateMetadata` 生成 `https://{host}{path}`。这是本次唯一新增的跨层约定。

## 5. 降档处置（D5）

### 5.1 关键约束：没有「降档事件」

`getUserPlan` 返回的是**读时计算**的 `effectivePlan = max(plan, comp_plan)`（`lib/plans-db.ts:17`）。其中 `comp_plan` 过期是**纯时间驱动的——过期那一刻没有任何代码运行**。

因此**不存在可埋点的降档时刻**，方案必须是**每日对账**，而非事件驱动。

另一约束：Vercel Hobby 仅 1 条 cron，已被 `/api/cron/daily`（`vercel.json`，`0 1 * * *`）占用，宽限扫描必须并入该编排器，不能新开 cron。精度为天级，故对外文案写「7 天后」，不写精确时刻。

### 5.2 状态与流转

新增 `users.publish_over_quota_since TIMESTAMPTZ NULL`。每日对账对每个有已发布页的用户执行：

| 条件 | 动作 |
|---|---|
| 未超额 | `since = NULL`（自动解除，含客户自行下线达标的情况） |
| 超额 且 `since IS NULL` | `since = NOW()`，发首次通知邮件 |
| 超额 且 `NOW() - since ≥ 6d` 且 `< 7d` | 发到期前提醒邮件 |
| 超额 且 `NOW() - since ≥ 7d` | 下线超额部分，`since = NULL` |

**幂等**：整个流转由「当前是否超额」推导，重复执行不产生副作用。客户中途自行下线两张 → 次日对账即自动解除，无需额外干预入口。

### 5.3 下线顺序

`status → 'draft'`（**unpublish，非 delete**），草稿数据完整保留，可一键重发。

保留优先级：

1. **根路径页优先保留** —— 否则域名根直接 404，伤害最大
2. 其余按 `published_at ASC` 保留最早的

被下线的页同时删除其 `domain_routes` 行，释放路径。

### 5.4 通知

平台只知道邮件是否交给 Resend，不知道客户是否收到（`docs/lead-capture-channels.md:95`），故**不能只靠邮件**：

- 后台横幅：进后台即可见，显示超额数量、剩余天数、去处理入口
- 邮件：进入宽限首日 + 到期前 1 日各一封

### 5.5 升回套餐

不自动恢复（路径可能已被占用），后台提供一键重发入口。

## 6. 影响面清单

| 文件 | 改动 | 风险 |
|---|---|---|
| `migrations/036_add_domain_routes.js` | 新建表 + 回填 | 中 |
| `migrations/037_add_publish_quota_grace.js` | `users.publish_over_quota_since` | 低 |
| `lib/domains-db.ts` | `getLandingSlugByCustomDomain` → `resolveTenantRoute(host, path)`；`bindDomainToLandingPage` → route upsert | **高** |
| `lib/proxy/tenant-proxy.ts` | 按 `(host, path)` 解析；透传 `TENANT_PATH_HEADER` | **高** |
| `app/p/[slug]/page.tsx` | canonical 用实际路径（现 L39 硬编码 `/`） | 中 |
| `app/sitemap.ts` | 租户域列出该域名下全部已发布路径（现仅根） | 中 |
| `app/robots.ts` | `noindex` 判定改为逐页（现按唯一页判整站） | 中 |
| `lib/leads/origin-guard.ts` | L28 查询改 join `domain_routes` | **高**（错了会拦真实留资） |
| `lib/landing-pages/store.ts` | L61 `bound_domain` 的 `LATERAL … LIMIT 1` 改为返回 domain + path | 低 |
| `app/api/landing-pages/[id]/publish/route.ts` | 接收 `path`，规范化 + 保留字 + 冲突校验 | 中 |
| `landing-editor/components/PublishDialog.tsx` | 增加路径输入与预览 URL | 低 |
| `lib/plans.ts` | Starter `landingPagesLimit` 3 → 5 | 低 |
| `lib/publish-quota.ts` | **新增**：对账与宽限逻辑（纯函数，便于单测） | 中 |
| `app/api/cron/daily/route.ts` | 并入配额对账任务 | 低 |
| `lib/email.ts` | 超额通知邮件模板 | 低 |
| 后台横幅组件 | 新增 | 低 |
| `docs/product-manual.md` | 一域名一页 → 多路径；风控叙事改口（D8） | — |
| `docs/custom-domain-publishing.md` | 架构与 DNS 章节更新 | — |
| 定价页文案 | 写出 Starter/Pro 分层（D4）；页数由 `plans.ts` 派生自动跟随 | 低 |

## 7. 测试策略

**单元（vitest）**

- 路径规范化：大小写、尾斜杠、深度超限、非法字符、保留字全表
- `resolveTenantRoute`：命中根 / 命中子路径 / 未命中 404 / 域名未验证 / 页面非 published
- 放行名单优先级不被路径解析破坏（沿用 PR #136 的用例）
- `publish-quota` 对账：未超额清除、首次进入、到期前提醒、到期下线、根路径优先保留、幂等重跑
- `origin-guard`：多路径下同域多页的来源校验

**集成**

- 发布 API：路径冲突（同域同路径二次发布）、保留字、跨域名唯一性、D7 一页一位置

**E2E（Playwright）**

- 编辑器发布到自定义路径 → 预览 URL 正确
- 同域名发布两张不同路径页面 → 均可访问、canonical 各自正确
- 取消发布其一 → 该路径 404，另一张不受影响

**迁移验证**：本地库先跑回填，核对 `domain_routes` 行数 = `domains.landing_page_id IS NOT NULL` 行数。

## 8. 分阶段交付

| 阶段 | 内容 | 可独立上线 |
|---|---|---|
| **P0** | PR #136 非根路径 404 | ✅ 已提交 |
| **P1** | 迁移 + `domain_routes` + 解析链路改造（行为不变：仍只发根路径） | ✅ 纯重构，可先验证解析链路 |
| **P2** | 发布 UI 支持路径 + 校验 + SEO（canonical/sitemap/robots） | ✅ 功能上线 |
| **P3** | Starter 3→5 + 配额对账 + 宽限期 + 通知 | ✅ 计费侧 |

P1 单独上线是**刻意设计**：把「换解析引擎」和「开放多路径」拆开，前者出问题时回滚面小且行为可对比。

## 9. 风险与未决

**高风险点**

1. `origin-guard` 改错会拦下真实留资 —— 与 PR #124 修掉的是同一类损失。查库失败放行的兜底必须保留。
2. 解析链路是全部客户页面的公共路径，P1 上线需灰度或低峰期，并保留 `domains.landing_page_id` 回滚路径。
3. 回填迁移在生产执行前需先在 dev 库验证（项目无 Flyway，SQL 手工管理且须幂等）。

**未决（不阻塞实现，实现前确认即可）**

- 路径深度是否放宽到 3 段？当前定 2 段，够诊所/律所场景。
- 是否允许客户为同一 page 配「路径别名」（多路径指向同页）？D7 当前禁止，若日后放开需重新设计 canonical。
- 降档下线时是否需要给客户「指定保留哪几张」的显式入口？当前依赖「自行下线到达标」隐式实现，够用但不够直观。
