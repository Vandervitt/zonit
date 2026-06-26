import { defineConfig, devices } from '@playwright/test';

// Phase 3 happy-path E2E 配置
// - 直接通过 pg 注入已发布站点 fixture，绕开登录态/编辑器
// - webServer 复用本地 next dev（端口 3001，匹配 package.json）
// - 使用 .env.local 的真实 DATABASE_URL，所有 fixture 均带 e2e- 前缀，跑完即清理

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/helpers/global-setup.ts',
  globalTeardown: './e2e/helpers/global-teardown.ts',
  fullyParallel: false,             // fixture 共享同一个测试用户，关闭并行避免冲突
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // AI_FAKE=1 让 /api/landing-pages/generate 与 /api/ai/rewrite 走确定性 fake，
    // e2e 无需真实 OPENAI_API_KEY。CAPI_FAKE=1 让 CAPI provider.send 走确定性 fake，不打真实平台。
    env: { AI_FAKE: '1', CAPI_FAKE: '1' },
  },
});
