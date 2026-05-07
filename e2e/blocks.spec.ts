import { test, expect } from '@playwright/test';
import { seedPublishedSite, cleanupSite, closeDb, SLUG_PREFIX } from './helpers/db';
import { makeBaseTemplate, leadFormBlock } from './helpers/template';

const SLUG = `${SLUG_PREFIX}blocks`;

test.describe('Phase 3 / Batch A — LeadForm 渲染', () => {
  test.beforeAll(async () => {
    await seedPublishedSite(
      SLUG,
      makeBaseTemplate({
        lowerBlocks: [leadFormBlock()],
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
