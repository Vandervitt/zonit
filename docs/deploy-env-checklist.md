# 生产环境变量配置 & 冒烟清单（Phase 0）

> 配套 `docs/launch-plan.md` 的 **Phase 0 — 上线收口**。本文件回答两件事：
> 1. 上线前每个环境变量配什么、从哪拿、配到哪；
> 2. 配完怎么自动 + 人工验证一遍。
>
> 清单**全部源自代码实际读取点**（`grep process.env` + `@vercel/blob`/迁移脚本隐式读取），非凭记忆。

---

## 一、自动化工具

| 命令 | 作用 |
|---|---|
| `pnpm check:env` | 预检当前 shell 环境变量是否齐备（缺必填 → 退出码 1）|
| `node --env-file=.env.local scripts/check-env.mjs` | 预检本地 `.env.local` |
| `node --env-file=.env.production.local scripts/check-env.mjs --prod` | 预检生产变量（`--prod` 下禁用旗标变阻断）|
| `pnpm smoke https://<域名>` | 部署后 HTTP 冒烟（探活 + 关键鉴权连线）|

预检本地需 Node ≥ 20.6（原生 `--env-file`）；更低版本用 `set -a && source .env.local && set +a && pnpm check:env`。

---

## 二、环境变量清单

图例：🔴 必填（缺则核心闭环断）· 🟡 建议（缺则该功能不可用）· ⛔ 禁止进生产

### 数据库 🔴

| 变量 | 用途 / 代码位置 | 获取 | Vercel 范围 |
|---|---|---|---|
| `DATABASE_URL` | 应用运行时连接（pooled），`lib/db.ts` | Neon 的 **pooler** 串（`-pooler` 主机）| Production / Preview |
| `DATABASE_URL_UNPOOLED` | **构建期**迁移直连，`vercel-build → migrate:up` | Neon 的**直连**串（无 `-pooler`）| Production / Preview |

> ⚠️ `vercel-build` = `pnpm migrate:up && next build`，每次生产构建都会拿 `DATABASE_URL_UNPOOLED` 对生产库跑迁移。该变量必须在**构建环境**可用，否则部署直接失败。

### 认证 🔴

| 变量 | 用途 | 获取 |
|---|---|---|
| `AUTH_SECRET` | next-auth 会话加密 | `openssl rand -base64 32` —— **须重新生成（历史已泄露）** |
| `NEXTAUTH_URL` | 邀请邮件链接基址，`lib/email.ts` | 生产应用地址，如 `https://app.zonit.com` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth，`auth.ts` | Google Cloud Console —— **secret 须轮换**；回调加 `<域名>/api/auth/callback/google` |
| `ADMIN_EMAILS` | 逗号分隔，登录即授予 ADMIN，`auth.ts:153` | 平台管理员邮箱列表 |

可选 OAuth（启用才配）：`AUTH_MICROSOFT_ENTRA_ID_ID/SECRET/ISSUER`、`AUTH_APPLE_ID/SECRET`。

### 域名发布 🔴（产品命脉）

| 变量 | 用途 | 获取 |
|---|---|---|
| `VERCEL_API_TOKEN` | 加/验证自有域名，`lib/vercel.ts` | vercel.com → Account Settings → Tokens |
| `VERCEL_PROJECT_ID` | 同上 | 项目 Settings → General |
| `VERCEL_TEAM_ID` | 同上 | 团队 Settings |

> 缺任意一个 → 用户「发布到自有域名」必失败，整个价值主张断在最后一步。

### 媒体上传 🔴

| 变量 | 用途 | 获取 |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | 编辑器图片上传，`app/api/media`（`@vercel/blob` 自动读取）| 在 Vercel 建一个 **Blob Store** 并 Connect 到项目，token 会自动注入 |

> 缺则 `put()` 失败，新手做不出带图的页 → 激活率差。

### 转化追踪 🔴 / ⛔

| 变量 | 用途 | 说明 |
|---|---|---|
| `CRON_SECRET` 🔴 | 守护 `/api/cron/capi-flush`（CAPI 兜底重发）| 随机串；Vercel Cron 命中时自动带 `Authorization: Bearer` |
| `CAPI_FAKE` ⛔ | 测试不打真实平台 | **禁止进生产** |

`vercel.json` 已配 cron：`0 0 * * *`（每天 00:00 UTC）调 `/api/cron/capi-flush`。

> **cron 频率与 Vercel 套餐（2026-07-15 记录）**：该 cron 是失败 CAPI 事件的兜底重发（非核心页面功能，落地页展示/留资不依赖它）。原为 `*/10 * * * *`（每 10 分钟），但 Vercel **Hobby 套餐 cron 只允许每天一次**，`*/10` 会导致**部署直接失败**（部署 check 链接指向 cron usage-and-pricing）。故降频为 `0 0 * * *`：失败事件最长 24h 内补发，平台归因窗口内一般仍有效。若后续投放上量、需要更及时的转化回传，**升级 Vercel Pro 后可恢复 `*/10 * * * *`**（Pro 无 cron 频率限制）。

### AI 生成 🟡

通用适配器（`lib/ai/client.ts`），按下面任一方式配；缺则落地页 AI 生成不可用：

- 通用：`AI_PROVIDER` + `AI_API_KEY` + `AI_BASE_URL` + `AI_MODEL`（+ `AI_JSON_MODE`）
- 各源 key：`OPENAI_API_KEY`(+`OPENAI_BASE_URL`/`OPENAI_MODEL`)、`DASHSCOPE_API_KEY`、`GEMINI_API_KEY`
- ⛔ `AI_FAKE`：测试桩，**禁止进生产**

### 计费 LemonSqueezy 🟡（启用付费才需要，要配就配全）

`LEMONSQUEEZY_API_KEY`、`LEMONSQUEEZY_STORE_ID`、`LEMONSQUEEZY_WEBHOOK_SECRET`、`LEMONSQUEEZY_VARIANT_STARTER/PRO/AGENCY`、`LS_CREDITS_50_VARIANT_ID`、`LS_CREDITS_200_VARIANT_ID`。webhook 指向 `<域名>/api/webhooks/lemonsqueezy`。详见 `docs/billing-lemonsqueezy-setup.md`。

### 邮件 / 其他 🟡

| 变量 | 用途 |
|---|---|
| `RESEND_API_KEY` / `EMAIL_FROM` | 邀请/通知邮件；缺则不发送仅记录错误 |
| `UNSPLASH_ACCESS_KEY` | 编辑器配图搜索 |
| `NEXT_PUBLIC_APP_URL` 🔴 | 客户端可见的应用地址 |

### 监控 / 可观测性 🟡

| 变量 | 用途 / 代码位置 | 获取 |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | 启用 Sentry 错误上报（客户端 `instrumentation-client.ts` + 服务端兜底）| sentry.io 建项目后的 DSN；**缺则 Sentry 整体 no-op**，不影响其他功能 |
| `SENTRY_DSN` | 服务端专用 DSN（`sentry.server/edge.config.ts`），未配则回退用 `NEXT_PUBLIC_SENTRY_DSN` | 通常与上同一个 DSN |
| `SENTRY_ORG` + `SENTRY_PROJECT` + `SENTRY_AUTH_TOKEN` | **构建期**上传 source map（`next.config.ts` 三者齐备才套 `withSentryConfig`）| sentry.io org/project slug 与 Auth Token |

> - **只想要错误捕获**：配 `NEXT_PUBLIC_SENTRY_DSN` 即可，运行时立即生效，无需改构建。
> - **想要可读堆栈（source map）**：再配 `SENTRY_ORG/PROJECT/AUTH_TOKEN`，且需允许 `@sentry/cli` 的 build 脚本——把 `pnpm-workspace.yaml` 里 `allowBuilds['@sentry/cli']` 改为 `true`（或 `pnpm approve-builds`）后重装。CI 无这些密钥时走不套包装的干净路径，构建不受影响。
> - **Speed Insights / Web Analytics 无需 env**：部署到 Vercel 自动采集（`<SpeedInsights/>` + `<Analytics/>` 已挂在 `app/layout.tsx`）；三端全部页面覆盖。

### ⛔ 绝不可进生产

`AI_FAKE` · `CAPI_FAKE` · `DEV_USER_EMAIL`（dev 免密登录开关）· `DEBUG` · `HTTP_PROXY`/`HTTPS_PROXY`（本地代理）。
> 另：`32d26f8 dev 账号固定 pro` 已进 main——确认其逻辑由 `NODE_ENV`/`DEV_USER_EMAIL` 守卫，生产不会把测试账号当 pro。

---

## 三、在 Vercel 配置

```bash
# 逐个添加（会交互式询问值与环境）
vercel env add DATABASE_URL production
vercel env add AUTH_SECRET production
# ... 其余同理

# 拉回本地做生产预检
vercel env pull .env.production.local
node --env-file=.env.production.local scripts/check-env.mjs --prod
```

也可在 Dashboard → Project → Settings → Environment Variables 批量录入。Blob/集成类（`BLOB_READ_WRITE_TOKEN`）优先用 Vercel 集成连接，token 自动注入，不要手抄。

---

## 四、密钥轮换（上线前必做）

`.env.local` 注释里历史暴露过 Neon 串 / `AUTH_SECRET` / Google secret。上线前全部轮换：

- [ ] 重新生成 `AUTH_SECRET`
- [ ] 轮换 `AUTH_GOOGLE_SECRET`
- [ ] 轮换 Neon 数据库密码 → 更新 `DATABASE_URL(_UNPOOLED)`
- [ ] 确认 `.env.local` 不在版本库（`.gitignore` 已含）

---

## 五、人工冒烟清单（自动脚本覆盖不到的）

`pnpm smoke <域名>` 过了之后，用真实账号 + 真实域名走一遍：

- [ ] `curl -sS https://<域名>/api/health` → 返回 `{"status":"ok","db":"up",...}` 且 HTTP 200（DB 断则 503，可接 uptime 探针）
- [ ] 注册 / Google 登录 → 进后台
- [ ] 新建落地页 → 编辑 → **上传一张图**（验证 Blob）
- [ ] 绑定 + 验证一个自有域名（验证 `VERCEL_*`）
- [ ] 发布 → 浏览器访问该域名根路径，页面正常
- [ ] 提交一次表单/留资 → 后台「线索」可见
- [ ] Meta 事件管理工具 / TikTok 后台看到 CAPI 回传事件
- [ ] （启用付费时）checkout → webhook → 套餐切换 → 门禁生效

---

> 维护：完成项直接勾选；新增/移除 env 时同步更新本表与 `scripts/check-env.mjs` 的清单。
