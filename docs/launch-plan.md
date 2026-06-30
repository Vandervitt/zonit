# Zap Bridge 上线规划（快速上线指导）

> **文档类型**：上线路线图 / 工作指导清单
> **生成日期**：2026-06-30
> **适用分支基线**：审计基于 main + 近 12 天已合并的子项（CAPI / 线索 / SEO 面板 / 营销官网 / 计费）
> **关联文档**：`docs/landing-page-flow-product-overview.md`（产品说明书）、`docs/constraints/*`（约束）、`docs/billing-lemonsqueezy-setup.md`

---

## 一句话结论

**当前瓶颈不是「功能不够」，而是「从未在生产环境真正跑通过一遍」。** 离快速上线最近的路是**收口配置 + 真机冒烟 + 少量加固**，不是再写功能。继续堆模板 / 多语言会推迟上线。

**行动建议：冻结新功能，全力打通 Phase 0 这一条生产链路** —— 它是当前 ROI 最高、且唯一真正阻断上线的事。

---

## 现状盘点

### 架构层 —— 已成型且合理
- Next.js 16 + App Router，`proxy.ts` 中间件做 host 路由，多租户按域名渲染（`app/p/[slug]` + `lib/host.ts`）
- 三端清晰：营销官网（`/` → `MarketingHome`）/ 租户后台（`app/admin/(workspace)`）/ 平台后台（`app/super-admin`）
- 鉴权 next-auth v5（OAuth + credentials + 邀请制），数据按 user 隔离
- 数据 Postgres + node-pg-migrate（016 迁移，`vercel-build` 自动 `migrate:up`）

### 产品功能层 —— 已远超原定「本期范围」，几乎全齐

| 能力 | 状态 |
|---|---|
| 选模板 → 编辑 → 预览 → 发布闭环 | ✅ 代码层通，本地 e2e 绿 |
| 模板库（29 套电商梯队） | ✅ 已上 main |
| AI 生成 / 改写（多 LLM 适配器） | ✅ `lib/ai` 全套 + 用量计费 |
| 多方 Pixel + UTM + consent | ✅ 客户端就绪 |
| 服务端转化 CAPI（Meta/TikTok + Cron 兜底） | ✅ 已合（子项 E） |
| 线索收件箱 + 表单 + 导出 | ✅ `app/admin/.../leads` |
| SEO 编辑面板（每页覆盖 + noindex） | ✅ 已合（子项 F） |
| 平台计费 LemonSqueezy（checkout / portal / webhook） | ✅ 已实现 |
| 营销官网（漏斗前门） | ✅ 已存在（原审计记的「缺失」已不成立） |
| 多语言 i18n | 📋 仅有设计 / 计划（子项 G，未动工） |

---

## 真正卡住上线的关键路径（P0，全是非功能项）

1. **🔴 Vercel 域名能力未配置** —— `.env.local` 里 `VERCEL_API_TOKEN / PROJECT_ID / TEAM_ID` 仍全空。产品硬约束命脉：发布到自有域名要调 `lib/vercel.ts`，没 token → **任何用户都无法发布**，价值主张断在最后一步。
2. **🔴 图片上传不可用** —— `BLOB_READ_WRITE_TOKEN` 未在 env 中定义，编辑器只能贴外链图，新手做不出能看的页。
3. **🔴 端到端从未在生产跑过** —— 仅本地 e2e 绿。「注册 → 建页 → 绑真域名 → 发布 → 公网访问 → pixel/CAPI 真打到 Meta」整链一次都没在真环境验证。
4. **🟠 密钥卫生** —— `.env.local` 注释中历史泄露过 Neon 串 / AUTH_SECRET / Google secret，上线前必须轮换。

---

## 规划 Outline（按上线关键路径排序）

### Phase 0 — 上线收口（预计 1–3 天 · 唯一阻断项，必须先做）

- [ ] 在 Vercel 配齐生产环境变量：
  - [ ] `DATABASE_URL` / `DATABASE_URL_UNPOOLED`
  - [ ] `AUTH_SECRET`（重新生成）
  - [ ] `VERCEL_API_TOKEN` / `VERCEL_PROJECT_ID` / `VERCEL_TEAM_ID`
  - [ ] `BLOB_READ_WRITE_TOKEN`
  - [ ] OAuth（Google / 其他已启用 provider）
  - [ ] `CRON_SECRET`（CAPI Cron 兜底鉴权）
  - [ ] LemonSqueezy keys + webhook secret
- [ ] 轮换所有曾暴露的密钥（Neon / AUTH_SECRET / Google secret）
- [ ] 生产部署一次 → `vercel-build` 把迁移推到生产库
- [ ] 拿一个真实域名走完整冒烟：
  - [ ] 注册 / 登录
  - [ ] 建页 → 编辑 → 图片上传（Blob 真传）
  - [ ] 绑定 + 验证自有域名（Vercel API 真调）
  - [ ] 发布 → 公网访问该域名
  - [ ] pixel / CAPI 真回传校验（Meta 事件管理工具能看到）
- [x] 验证审计里 P1 的错误边界/收录基建确已在 main：`not-found.tsx` / `error.tsx` / `global-error.tsx` / `robots.ts` / `sitemap.ts` —— ✅ 2026-06-30 已确认 5 个文件均在 main

### Phase 1 — 上线即用的体验 / 合规补强（可与 Phase 0 并行 · 预计 3–5 天）

- [ ] **CMP / Cookie 同意覆盖核查**：跑 pixel + 欧盟流量必须有 consent gate，确认 schema 的 compliance 真接到了 pixel 注入闭环（合规红线）
- [ ] **计费链路真机**：checkout → webhook → 套餐切换 → 门禁生效走一遍真账单（注意 dev 现固定 pro，会掩盖问题）
- [ ] **后台 onboarding**：把「Time-to-First-Publish < 15 分钟」做成可达（空状态引导 / 域名未绑提示）
- [ ] **可观测性**：Sentry / 结构化日志 + `@vercel/analytics` 上线，建立最低限度监控

### Phase 2 — 上线后迭代（明确不进首发）

- [ ] 第二梯队线索类模板（金融 / 法律 / 教育 / B2B）—— 已要求暂缓
- [ ] 多语言 i18n（子项 G）—— 设计在，但不该卡首发
- [ ] A/B 测试、版本历史、退出挽留弹窗等增长向功能

---

## 需要拍板的 3 个决策点

1. **上线定义**：内测 / 首批付费客户软上线，还是公开 GA？决定 Phase 1 哪些能砍到上线后。
2. **图片上传**：Blob 配置是上线必做，还是首发先只允许外链图、Blob 推后？（建议必做，否则激活率差）
3. **当前分支处置**：`feat_20260627_模板画廊官网风格改造` 工作区干净，这套改造是否先并入主线再开始 Phase 0？

---

> 维护说明：Phase 0/1 的勾选项可作为上线 checklist 持续更新；完成后把对应阻断项从「真正卡住上线的关键路径」中划掉。
