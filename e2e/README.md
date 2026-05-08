# Phase 3 Happy-Path E2E

针对 Phase 3 四批 schema/SSR 改动的可执行回归网（Playwright + 直连 pg 注入 fixture）。

## 设计原则

- **happy path only**：MVP 边界，不覆盖错误分支与权限矩阵
- **无登录**：fixture 通过 pg 直接 INSERT 已发布站点，绕过 NextAuth
- **可隔离**：所有 fixture slug 走 `e2e-` 前缀，专用测试 user_id；globalSetup/Teardown 自动清理
- **跑得起来**：webServer 复用本地 `pnpm dev`（端口 3001）

## 文件分布

| 文件 | 覆盖 |
|---|---|
| `e2e/blocks.spec.ts` | 批次 A：PaymentBadges / ShippingInfo 渲染 |
| `e2e/jsonld.spec.ts` | 批次 B：5 类 schema.org JSON-LD + 反 `</script>` 注入 |
| `e2e/hreflang.spec.ts` | 批次 C：alternateLocales 注入 `<link rel=alternate>` |
| `e2e/compliance.spec.ts` | 批次 C：cookie banner + age gate localStorage 持久化 |

> 批次 D（Pixel events / CTA download）schema 已就绪，但运行时埋点解释器与下载触发逻辑被 FEATURES.md 明确划入下一迭代，故暂无 E2E。

## 一次性安装

```bash
pnpm add -D @playwright/test dotenv
pnpm exec playwright install chromium
```

## 跑测试

```bash
# 后台 dev server 已起 / 由 webServer 自动起均可
pnpm test:e2e

# 调试单个文件 + headed
pnpm exec playwright test e2e/jsonld.spec.ts --headed
```

## 关于 fixture 数据库

数据库回归默认跳过，避免本地和 CI 在没有测试库密钥时误连开发库或因外部凭据失效失败。

要运行真实数据库回归：

```bash
RUN_DB_E2E=1 E2E_DATABASE_URL='postgres://...' pnpm test:e2e
```

若未提供 `E2E_DATABASE_URL`，测试会回退读取 `.env.local` / `.env` 里的 `DATABASE_URL`。
fixture 全部走 `e2e-` 前缀和固定 user_id，跑完 `globalTeardown` 会按前缀清理。

## 增加新用例

1. 在 `helpers/template.ts` 加 block 工厂或 template 变体
2. 新建 `e2e/<feature>.spec.ts`，`beforeAll` 调 `seedPublishedSite`，`afterAll` 调 `cleanupSite + closeDb`
3. 用 Playwright locator API 断言 SSR 输出或客户端交互
