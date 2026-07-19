# Phase 0 上线执行单（可勾选）

> 配套 `docs/launch-plan.md`（Phase 0 目标）与 `docs/deploy-env-checklist.md`（字段字典）。
> 本文件是**按顺序执行的操作单**：每步都可勾选，标注「值去哪拿 / 命令 / 验证」。
> 需要你的账号权限的步骤标 👤；脚本能自动验证的标 🤖。

前置：Vercel CLI 未安装。二选一路线——
- **CLI 路线**：`npm i -g vercel && vercel login && vercel link`（一次装好，后续 `vercel env add / pull` 最省事）
- **Dashboard 路线**：全程在 vercel.com 网页 Settings → Environment Variables 操作，跳过所有 `vercel env` 命令

---

## Step 1 · 轮换已泄露密钥 👤

`.env.local` 注释里历史暴露过这些值，上线前必须换新。**先生成新值，Step 4 再录入 Vercel。**

- [ ] `AUTH_SECRET`：本地跑 `openssl rand -base64 32`，复制输出
- [ ] `AUTH_GOOGLE_SECRET`：Google Cloud Console → APIs & Services → Credentials → 对应 OAuth Client → **Reset secret**
- [ ] Neon 数据库密码：Neon Dashboard → 项目 → Roles → Reset password，拿到两条新连接串：
  - [ ] `DATABASE_URL`：带 `-pooler` 的 **pooled** 串
  - [ ] `DATABASE_URL_UNPOOLED`：不带 `-pooler` 的**直连**串
- [ ] 顺手确认 `.env.local` 在 `.gitignore` 内（不进版本库）

## Step 2 · 开通 Blob 存储 👤

- [ ] Vercel Dashboard → Storage → Create → **Blob** → 建好后 **Connect** 到本项目
- [ ] 连接后 `BLOB_READ_WRITE_TOKEN` 会**自动注入**项目环境变量——不要手抄，Step 4 里它已就位

## Step 3 · 取域名发布三件套 👤

缺任一项，用户「发布到自有域名」这个核心卖点就断（`lib/vercel.ts`）。

- [ ] `VERCEL_API_TOKEN`：vercel.com → Account Settings → **Tokens** → Create
- [ ] `VERCEL_PROJECT_ID`：项目 Settings → General → Project ID
- [ ] `VERCEL_TEAM_ID`：团队 Settings → 页面里的 Team ID

## Step 4 · 录入生产环境变量 👤

把下列变量配到 **Production（建议连 Preview 一起）**。完整用途见 `deploy-env-checklist.md`。

必填清单（12 项）：
- [ ] `DATABASE_URL`（Step 1）
- [ ] `DATABASE_URL_UNPOOLED`（Step 1，**构建期迁移要用，务必在构建环境可见**）
- [ ] `AUTH_SECRET`（Step 1 新值）
- [ ] `NEXTAUTH_URL` = 生产地址，如 `https://app.zapbridge.com`
- [ ] `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`（secret 用 Step 1 新值）
- [ ] `VERCEL_API_TOKEN` / `VERCEL_PROJECT_ID` / `VERCEL_TEAM_ID`（Step 3）
- [ ] `BLOB_READ_WRITE_TOKEN`（Step 2 已自动注入，确认存在即可）
- [ ] `NEXT_PUBLIC_APP_URL` = 对外应用地址
- [ ] `CRON_SECRET` = 随机串（`openssl rand -hex 32`），守护 `/api/cron/capi-flush`

配套：
- [ ] `ADMIN_EMAILS` = 平台管理员邮箱（逗号分隔，登录即授 ADMIN）
- [ ] 至少一个 AI key：`AI_API_KEY` / `OPENAI_API_KEY` / `DASHSCOPE_API_KEY` / `GEMINI_API_KEY`（否则落地页 AI 生成不可用）
- [ ] 建议：`RESEND_API_KEY` + `EMAIL_FROM`（邀请邮件）、`UNSPLASH_ACCESS_KEY`（配图搜索）
- [ ] 付费如启用：LemonSqueezy 全套（见 `deploy-env-checklist.md`）

CLI 路线示例：
```bash
vercel env add AUTH_SECRET production
vercel env add DATABASE_URL production
# ...逐个；Blob token 已自动注入，无需 add
```

⛔ 确认这些**没进生产**：`AI_FAKE` · `CAPI_FAKE` · `DEV_USER_EMAIL` · `DEBUG` · `HTTP_PROXY`/`HTTPS_PROXY`

## Step 5 · 生产变量预检 🤖

```bash
vercel env pull .env.production.local          # CLI 路线；Dashboard 路线手动建此文件
node --env-file=.env.production.local scripts/check-env.mjs --prod
```
- [ ] 输出「✅ 预检通过」（`--prod` 下危险旗标会直接判为阻断，退出码 1）
- [ ] `.env.production.local` 用完删掉，勿入库

## Step 6 · 首次生产部署 👤

- [ ] 触发部署（`vercel --prod` 或 push 到生产分支由 Vercel 自动构建）
- [ ] 盯构建日志：`vercel-build` = `pnpm migrate:up && next build`，会拿 `DATABASE_URL_UNPOOLED` 对生产库跑迁移——**迁移这步过了才算真通**
- [ ] Google OAuth 回调加白：`<生产域名>/api/auth/callback/google`

## Step 7 · 冒烟验证

🤖 自动 HTTP 探活：
- [ ] `pnpm smoke https://<生产域名>` 全绿（首页/定价/robots/sitemap/cron 鉴权/后台保护/404）

👤 真实账号 + 真实域名走一遍闭环：
- [ ] 注册 / Google 登录 → 进后台
- [ ] 新建落地页 → 编辑 → **上传一张图**（验证 Blob）
- [ ] 绑定 + 验证一个自有域名（验证 `VERCEL_*`）
- [ ] 发布 → 浏览器访问该域名根路径，页面正常
- [ ] 提交一次留资 → 后台「线索」可见
- [ ] Meta / TikTok 后台看到 CAPI 回传事件
- [ ]（启用付费时）checkout → webhook → 套餐切换 → 门禁生效

---

## 收口

- [ ] 所有勾选完成 → Phase 0「从未在生产跑通过」这条阻断解除
- [ ] 回填 `docs/launch-plan.md` 对应 Phase 0 项为已完成
- [ ] 转入 Phase 1（加固）

> 维护：env 增减时同步改 `scripts/check-env.mjs` 与 `deploy-env-checklist.md`。
