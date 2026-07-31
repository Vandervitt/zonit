# 平台子域试用发布 · 设计

分支：`feat_20260801_平台子域试用发布`
状态：**待审批**

## 1. 要解决的问题

新用户注册即得 Pro 7 天，试用期真的能建页、绑域名、发布（已核实 `auth.ts:194`
`token.plan = effectivePlan(currentPlan, comp)`，赠送档确实生效）。但**发布的前提是
"你得先自己有一个域名，并且会改 DNS 记录"**。

漏斗因此断在这里：

```
注册 → 建页 → 编辑 → 【绑域名 + 配 DNS + 等验证】 → 发布 → 收线索
                        ↑ 断点：没有域名的用户到不了后面
```

对目标客群（诊所、律所、教培的老板）这一步很可能直接劝退。而现有的预览分享链接
（`app/api/landing-pages/[id]/preview-link/route.ts`，签名 token、7 天）**禁用表单提交**，
所以这类用户永远走不到「收到第一条线索」——恰恰是产品的整个价值主张。

**目标**：试用期内不碰 DNS 就能走完「发布 → 收线索」全链路。

## 2. 核心发现：租户解析一行都不用改

`isAppHost()` 只认 `appHostname`（= `zapbridge.tech`）及其子域。因此
`acme.zapbridge.site` 会落进 `isCustomDomain()`，被当作**租户自有域名**，
直接走现有的 `resolveTenantRoute(host, path)` 解析链路。

这不是推测：`zapbridge.site` 现在就是这样在工作的——它作为「客户自有域名」绑了一张
skincare 模板样例页，线上可访问。

所以本方案**不改 `lib/host.ts`、不改 `proxy.ts`、不改公开渲染链路**。
工程量从「改造租户解析」降级为「加一个自动化的域名分配入口」。

风险面因此大幅收窄：改错了也不会波及存量客户页面的解析。

## 3. 域名选型

`zapbridge.site`。理由：

- 语义中性通用，`acme.zapbridge.site` 放在诊所 / 律所 / 教培下都不违和
- 存量只有一张模板样例页（我们自己的测试数据），可清理
- NS 已在 Vercel、Edge Network 就绪、apex 已绑到 `project-36oi3`，加通配符零 DNS 工作量

**排除**：

| 域名 | 原因 |
|---|---|
| `zapbridge.tech` | 平台主域。免费用户内容一旦出问题会烧到主域 SEO 与广告信誉，必须隔离 |
| `.online` / `.space` / `.website` | 留作独立站、官网等其他业务 |
| `.store` | 与 CLAUDE.md 硬规则「生成页必须非交易」语义冲突 |
| `.beauty` | 行业绑死，非美妆客户拿到很怪 |
| `.help` | 留给帮助中心更顺 |
| `.fun` | 语气不适合医疗、法律客户 |
| `.xyz` | 滥用率高影响广告过审；且有存量测试页 |

## 4. 数据模型

迁移 `038_add_platform_subdomain.js`：

```sql
ALTER TABLE domains
  ADD COLUMN IF NOT EXISTS is_platform_subdomain BOOLEAN NOT NULL DEFAULT false;

-- 每用户至多一个平台子域（见 §6 滥用防护）
CREATE UNIQUE INDEX IF NOT EXISTS idx_domains_one_platform_subdomain
  ON domains(user_id) WHERE is_platform_subdomain = true;
```

不新建表：平台子域**就是一条 domains 记录**，只是 `verified` / `enabled` 由平台直接置
true（无需 DNS 验证，因为域名本来就是我们的）。这样发布、多路径、配额对账、
取消发布等全部现有逻辑天然适用。

## 5. 改动清单

| 层 | 文件 | 改动 |
|---|---|---|
| 迁移 | `migrations/038_*.js` | 加列 + 每用户唯一索引 |
| 配置 | 环境变量 `PLATFORM_SUBDOMAIN_ROOT` | 值为 `zapbridge.site`，不硬编码 |
| API | `app/api/domains/platform-subdomain/route.ts`（新） | 分配子域：生成 slug → 查重 → 写 domains（verified/enabled/is_platform_subdomain 全 true） |
| API | `app/api/domains/route.ts` | **安全**：拒绝用户手动添加以 `.{PLATFORM_SUBDOMAIN_ROOT}` 结尾的域名 |
| 额度 | `getEnabledDomainCount` | 排除平台子域 —— 否则 Free 的 `domainsLimit: 0` 会把它算进去 |
| slug | `lib/domains/subdomain.ts`（新） | 按页面标题 slugify + 冲突加短后缀 + 保留字黑名单 |
| UI | 域名列表 | 平台子域不显示 DNS 配置指引、不显示「未指向本平台」橙标 |
| UI | 发布弹窗 | 增加「用平台提供的地址」选项 |

**保留字黑名单**（必须，否则用户可占 `www.zapbridge.site` 等）：
`www`、`api`、`admin`、`app`、`mail`、`smtp`、`ftp`、`ns1`、`ns2`、`cdn`、`static`、
`assets`、`blog`、`docs`、`help`、`support`、`status`、`dev`、`test`、`staging`。

## 6. 额度与到期（已拍板）

- **不占 `domainsLimit`**：平台子域是平台资源，不是客户的域名槽位
- **占 `landingPagesLimit`**：发布行为本身照常计入额度
- **每用户 1 个子域**：配合已上线的多路径发布（#137-139），一个子域下可按路径发多张页，
  试用期 Pro 的 20 张额度完全够用。同时天然限制滥用
- **试用到期**：复用现有 `publish-quota` 对账，**零新增机制**。Free 的
  `landingPagesLimit` 是 1 → 超额部分进 7 天宽限 → 到期自动下线，保留最早发布的那张
  （根路径优先）。带水印（Free/Starter 既有逻辑天然生效）

即 Free 稳态 = **1 张带水印的子域页面持续在线，能收线索**。不断崖，且水印页为平台带流量。

## 7. SEO

不加 `noindex`。理由：

- 一页一位置（`idx_domain_routes_page` 唯一索引）保证同一张页不可能同时存在于
  子域和自有域名 → **不存在重复内容问题**
- 客户后来迁到自有域名时，子域 route 被删 → 404 → 搜索引擎自然移除
- 子域页面能被索引对客户是价值，对平台无害（`zapbridge.site` 与主域
  `zapbridge.tech` 是不同域名，权重互不影响）

## 8. 需要人工执行的生产变更

**这两项我不会自动执行，需你确认后操作：**

1. Vercel 项目 `project-36oi3` 添加通配符域名 `*.zapbridge.site`
   （NS 在 Vercel，DNS 自动配置）
2. 清理 `zapbridge.site` apex 上的存量测试页（skincare 模板样例）——
   或保留作平台演示页，二选一

另需在 Vercel 环境变量加 `PLATFORM_SUBDOMAIN_ROOT=zapbridge.site`。

## 9. 风险

| 风险 | 缓解 |
|---|---|
| 免费用户内容滥用损害域名信誉 | 已隔离在 `zapbridge.site`，烧不到主域；每用户 1 子域；水印；沿用现有发布前校验（占位号拦截等） |
| 用户手动抢注他人子域 | `POST /api/domains` 显式拒绝平台域后缀 + 保留字黑名单 |
| 客户拿子域去投广告，平台方 TLD 过审率低、转化差 | 文案明确定位为「先跑通、看效果」，投放引导绑自有域名 |
| 削弱付费动力 | Free 稳态仅 1 张、带水印、不能用自己品牌域名——付费理由完整保留 |

## 10. 未决

- 子域分配的入口放在哪：建页后引导、发布弹窗内、还是域名页？倾向**发布弹窗内**
  （用户第一次撞到「没有可用域名」正是在那里）
- 是否允许用户改子域 slug：倾向允许改一次（改了旧地址即失效，需提示）
- 效果验证：`platform_milestones` 五步漏斗（`signup → page_created → domain_verified
  → page_published → first_lead`）已埋点，上线后看 `page_created → page_published`
  这一跳是否抬升
