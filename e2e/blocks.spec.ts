import { test, expect } from '@playwright/test';
import { seedPublishedSite, cleanupSite, closeDb, SLUG_PREFIX, isDbE2EEnabled } from './helpers/db';
import { makeBaseTemplate, leadFormFixture } from './helpers/template';

const SLUG = `${SLUG_PREFIX}blocks`;

test.describe('Phase 3 / Batch A — LeadForm 渲染', () => {
  test.skip(!isDbE2EEnabled, 'Set RUN_DB_E2E=1 to run database-backed e2e tests.');

  test.beforeAll(async () => {
    await seedPublishedSite(
      SLUG,
      makeBaseTemplate({
        leadForm: leadFormFixture(),
      }),
    );
  });

  test.afterAll(async () => {
    await cleanupSite(SLUG);
    await closeDb();
  });

  test('LeadForm 模块渲染标题与提交按钮', async ({ page }) => {
    await page.goto(`/site/${SLUG}`);
    await expect(page.getByText('Get a Free Quote')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Request' })).toBeVisible();
  });

  test('LeadForm 渲染必填字段', async ({ page }) => {
    await page.goto(`/site/${SLUG}`);
    await expect(page.getByLabel('Full Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
  });
});
