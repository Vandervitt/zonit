# 后台访问性能优化 · 排查、定位、方案与效果

日期：2026-10-27
相关 PR：#226（菜单预取 + loading.tsx）、#227（函数区域 iad1 → sin1，生产库换新加坡 Neon）
测量环境：国内网络，Chrome，生产站 `urgizat.com`，同一账号、同一套脚本、同样的点击顺序

## 1. 现象

admin 端与 super-admin 端切换菜单「又卡又慢」：点击后画面长时间不动，切过去后数据又要等好几秒。

## 2. 排查

### 2.1 读代码，列出候选

| 候选 | 依据 | 结论 |
|---|---|---|
| 两端都没有 `loading.tsx` | `find app/admin app/super-admin -name loading.tsx` 为空 | 动态路由无法预取，**待测** |
| admin 布局 `force-dynamic` | `app/admin/(workspace)/layout.tsx` | 同上 |
| jwt 回调每次 `auth()` 都查库 | `auth.ts` 的 `jwt` 回调：SELECT 用户 + `touchLastSeen` UPDATE；middleware 与路由各调一次 | 已登录请求串行查库 5 次以上，**待测** |
| 函数与库跨区 | Neon 在 `aws-us-east-1`，Vercel 函数默认 `iad1` | 同区，单条查询本身不慢 |

### 2.2 生产实测：先看网络瀑布

点菜单后的请求时序（节选）：

```
== /admin/leads   urlChangedAt=2357ms
/admin/leads?…        start=5     dur=2276   ← RSC 请求，期间 URL/高亮/页面都不动
/api/landing-pages    start=2349  dur=2260   ← RSC 回来后页面才挂载，再发 SWR
/api/leads/tags       start=2349  dur=879
/api/leads?…          start=2349  dur=2676
```

每次点击至少 **2 次串行往返**，第 1 次期间没有任何视觉反馈。

### 2.3 关键对照：慢在服务端还是网络

把接口逐个串行调用，与完全不查库的 `/api/auth/csrf` 对比：

| 接口 | 耗时 |
|---|---|
| `/api/auth/csrf`（不查库） | 834–925ms |
| `/api/leads`、`/api/ai/usage`、`/api/milestones`、`/api/landing-pages` | 861–1081ms |

查库接口与不查库接口几乎一样 → **服务端处理几乎不耗时，耗时全在网络往返**。jwt 回调查库不是瓶颈（函数与库同区，每次几毫秒），排除。

再拆网络这一段：

| 请求 | 耗时 | `x-vercel-id` |
|---|---|---|
| 静态资源（边缘直出） | 160–220ms | — |
| `/api/auth/csrf`（打到函数） | 834–925ms | `sin1::iad1` |

请求本来就从**新加坡边缘节点**进入 Vercel，再转发到 **iad1** 执行；这段转发每个请求多约 650ms。

## 3. 定位

总耗时 ≈ 串行往返次数 × 每次往返耗时，两个因子分别对应两个根因：

1. **往返次数多、且第一次是盲等**：两端无 `loading.tsx`，admin 布局又是 `force-dynamic`，`<Link>` 对动态路由不预取。点击后先等 RSC 往返（画面不动 =「卡」），admin 页面是客户端组件，挂载后再发 SWR 又一次往返（=「慢」）。
2. **每次往返贵**：国内 → 新加坡边缘 → 美东函数，约 0.9s/次。

## 4. 方案

### 4.1 PR #226：去掉点击后的盲等往返

| 文件 | 改动 | 理由 |
|---|---|---|
| `app/admin/(workspace)/_shell/AdminShell.tsx` | 菜单 `<Link prefetch>` 完整预取 | admin 各页都是客户端组件，RSC 载荷只含组件引用、不含数据；预取后点击即切页，只剩取数那一次往返 |
| `app/admin/(workspace)/loading.tsx` | 路由级骨架屏 | 慢网下预取未完成就点击时，也能立即切页 |
| `app/super-admin/loading.tsx` | 路由级骨架屏，**刻意不做完整预取** | 超管各页在服务端查库，完整预取会在每次进后台时把各页聚合 SQL 全跑一遍，且数据会被缓存 5 分钟 |

验证要点：
- 预取只在生产构建生效，`next dev` 的 E2E 测不到。用本地 `next build && next start` + Playwright 给每个请求注入 800ms 延迟做改前/改后基准。
- 在 admin 布局临时加日志，确认完整预取**不会**重跑布局里的查库：整轮只渲染 1 次，即首次进入。

### 4.2 PR #227：把每次往返变便宜

| 改动 | 说明 |
|---|---|
| `vercel.json` 加 `"regions": ["sin1"]` | 函数在新加坡执行 |
| 生产库换成 Neon `neon-singapore`（aws-ap-southeast-1） | Neon 项目不能改区域，经 Vercel Storage 新建并连接 |
| `CLAUDE.md` 增加同区约束 | 每个已登录请求串行查库 5 次以上，只挪函数不挪库会让每次查库跨太平洋（约 220ms），单请求累计 1.1–1.5s，比迁移前更慢 |

取舍：美国访客打开落地页时，首字节时间预计 +150–200ms（落地页按请求渲染，函数位置随之改变）；东南亚与中东变快。当时没有付费用户、真实外部流量接近零，而产品重心在国内用户（外贸工厂老板）使用后台，所以选择迁移。

数据处理：不迁历史数据，只复制保留的 3 个用户及其 `trial_emails`（防止重发试用到期信）、`platform_milestones`、`admin_audit_logs`（`actor_id` 置空），以及 `platform_settings`。复制后逐表核对行数与关键字段，与旧库一致。

## 5. 效果对比（生产实测）

### 5.1 admin：点击 → URL 变化 / 本页数据全部返回

| 页面 | 最初基线 | PR #226 后 | PR #227 后 |
|---|---|---|---|
| 线索 | 2357ms / ~5.0s | 144ms / 3.6s | **58ms / 590ms** |
| 落地页 | 910ms / ~1.8s | 162ms / — | **49ms / 281ms** |
| 域名 | 936ms / ~3.6s | 80ms / 1.2s | **33ms / 288ms** |
| 概览 | 969ms / ~3.3s | 71ms / 2.3s | **60ms / 315ms** |

注：「—」表示该轮切换时 SWR 直接用了缓存，没有发出新请求。

### 5.2 super-admin：点击 → 骨架出现 / 内容就绪

| 页面 | 最初基线 | PR #226 后 | PR #227 后 |
|---|---|---|---|
| 用户 | 无骨架，切页需 1 次完整往返 | 50ms / 3582ms | **28ms / 381ms** |
| 用户反馈 | 同上 | 45ms / 1407ms | **26ms / 332ms** |
| 平台设置 | 同上 | 40ms / 1707ms | **19ms / 362ms** |
| 概览 | 同上 | 45ms / 1241ms | **29ms / 383ms** |

注：super-admin 的最初基线未在生产单独测量；本地基准（注入 800ms RTT）为点击后 866–925ms 才切页，见 5.4。

### 5.3 单接口串行往返

| | 迁移前 | 迁移后 |
|---|---|---|
| 不查库接口 `/api/auth/csrf` | 834–925ms（`sin1::iad1`） | 167–225ms（`sin1::sin1`） |
| 查库接口 | 861–1081ms | 171–443ms |

### 5.4 本地基准（PR #226，注入 800ms RTT）

| | 点击 → 切页 改前 → 改后 | 数据完成 改前 → 改后 |
|---|---|---|
| admin | 863–921ms → 42–90ms | ~1750ms → ~900ms |
| super-admin | 866–925ms → 43–52ms | ~860ms（不变，数据本需 1 次往返） |

**总体**：后台从点击到数据加载完，由 3–5 秒降到 0.3–0.6 秒；点击后 60ms 内即有界面反馈。

**口径说明**：super-admin「用户」页降幅最大，其中一部分来自新库数据量小（4 个用户、几乎没有关联数据），聚合 SQL 的工作量远小于旧库。这一页的改善不能全部归因于迁移，用户量上来后需要复测。

## 6. 过程中的坑

| 坑 | 表现 | 处理 |
|---|---|---|
| 本地 `next start` 读取 `.env.production.local` | Vercel CLI 拉回的 sensitive 变量是空值，会覆盖 `.env.local` 的 `AUTH_SECRET` / `DATABASE_URL`，报 `MissingSecret` | 用 `node --env-file=.env.local node_modules/next/dist/bin/next start` 启动（进程环境优先于 .env 文件）。已核实空连接串连的是 localhost 并被拒，没碰生产库 |
| prefetch 只在生产构建生效 | dev 模式 E2E 无法验证 | 本地生产构建 + Playwright `route` 注入延迟 + `next-auth/jwt` 的 `encode` 签本地会话 cookie |
| Playwright `networkidle` 不可靠 | URL 一变就判空闲，漏算之后的 SWR 请求 | 改为手动统计在途请求数，归零且静默 600ms 才算完成 |
| 新库连接报 `DATABASE_URL` 已存在 | 旧变量未随断开删除 | 手动删除旧库写入的全部 `DATABASE_URL*` / `POSTGRES_*` / `PG*` 变量后再连 |
| Preview 构建失败 | 新库只勾了 Production，Preview 缺 `DATABASE_URL_UNPOOLED` | 连接里补勾 Preview 后重新部署 |
| Preview 迁移没落到生产主分支 | 连接选的是 Isolated copies，迁移跑在 `preview/<分支名>` 分支 | 保留这个更安全的配置；调整顺序为合并后再复制数据（复制前确认保留用户在空库窗口内未登录） |

## 7. 遗留

- 每次取数据仍需 1 次往返（国内 → 新加坡约 0.2s），这是物理下限。
- super-admin「用户」页的聚合 SQL 需要在数据量上来后复测。
- 旧库 `neon-for-zapbrige`（us-east-1，`long-brook-97677049`）已于 2026-10-27 验证通过后在 Vercel 控制台断开并删除，回滚路径随之失效。
