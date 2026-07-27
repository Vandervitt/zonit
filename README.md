# Zap Bridge

面向出海获客的落地页搭建平台：模板画廊选型 → 编辑器改稿 → 发布到自定义域名 → 回收线索。

技术栈：Next.js 16（App Router）· React 19 · TypeScript · Tailwind v4 · PostgreSQL（node-pg-migrate）· Auth.js v5 · 部署在 Vercel。

## 快速开始

```bash
pnpm install
pnpm db:start        # 本地 Postgres（Docker）
pnpm migrate:up      # 执行迁移
pnpm db:seed-dev     # 灌入开发管理员账号
pnpm dev             # http://localhost:3001
```

环境变量自查：`pnpm check:env`。

## 常用命令

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 开发服务器（端口 3001） |
| `pnpm build` | 生产构建 |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest 单测 |
| `pnpm test:e2e` | Playwright E2E |
| `pnpm migrate:create` | 新建迁移文件 |
| `pnpm smoke` | 冒烟检查 |

## 目录结构

| 路径 | 内容 |
|---|---|
| `app/` | 路由、页面与 API（App Router） |
| `landing-editor/` | 落地页编辑器：store、面板、模板样稿 |
| `landing-renderer/` | 落地页渲染与埋点 |
| `components/` | 通用组件（前台 Tailwind、后台 antd） |
| `lib/` | 领域逻辑：计费、认证、线索、SEO、AI |
| `migrations/` | 手写迁移脚本 |
| `e2e/` | Playwright 用例 |
| `docs/` | 规范与产品文档（`docs/archive/` 为历史过程记录） |

## 文档索引

**强制规范的事实源是 [`CLAUDE.md`](./CLAUDE.md) 及其直接链接的专项文档：**

- 产品定位与范围：[`docs/constraints/product-positioning.md`](./docs/constraints/product-positioning.md)
- 落地页 schema 规则：[`docs/constraints/landing-page-schema.md`](./docs/constraints/landing-page-schema.md)
- 编码风格：[`docs/constraints/coding-style.md`](./docs/constraints/coding-style.md)
- 前端样式规则：[`docs/constraints/frontend-style.md`](./docs/constraints/frontend-style.md)
- 测试与验证：[`docs/constraints/testing-and-validation.md`](./docs/constraints/testing-and-validation.md)
- 本地评审流程：[`docs/constraints/local-review-workflow.md`](./docs/constraints/local-review-workflow.md)
- 提交规范：[`docs/constraints/commit-guidelines.md`](./docs/constraints/commit-guidelines.md)

其他参考：

- 产品说明书：[`docs/product-manual.md`](./docs/product-manual.md)
- 自定义域名发布：[`docs/custom-domain-publishing.md`](./docs/custom-domain-publishing.md)
- 数据库迁移（工具配置）：[`docs/database-migrations.md`](./docs/database-migrations.md)
- 开发库迁移排障：[`docs/dev-database-migration-workflow.md`](./docs/dev-database-migration-workflow.md)
- 超管端指南：[`docs/SUPER_ADMIN_GUIDE.md`](./docs/SUPER_ADMIN_GUIDE.md)
- 部署环境清单：[`docs/deploy-env-checklist.md`](./docs/deploy-env-checklist.md)

## 约定

- 落地页产物保持非交易性质：不引入支付、购物车、订单等电商概念。
- 样式仅用 Tailwind，禁止自定义 CSS 与内联样式。
- 中间件文件是 `proxy.ts`。
- 提交信息使用中文 Conventional Commits。
