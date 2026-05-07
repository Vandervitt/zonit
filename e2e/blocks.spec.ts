import { test, expect } from '@playwright/test';
import { seedPublishedSite, cleanupSite, closeDb, SLUG_PREFIX } from './helpers/db';
import { makeBaseTemplate, paymentBadgesBlock, shippingInfoBlock } from './helpers/template';

const SLUG = `${SLUG_PREFIX}blocks`;

test.describe('Phase 3 / Batch A — PaymentBadges + ShippingInfo 渲染', () => {
  test.beforeAll(async () => {
    await seedPublishedSite(
      SLUG,
      makeBaseTemplate({
        afterBundles: [paymentBadgesBlock(), shippingInfoBlock()],
      }),
    );
  });

  test.afterAll(async () => {
    await cleanupSite(SLUG);
    await closeDb();
  });

  test('PaymentBadges 模块渲染标题、徽章 label 与安全提示', async ({ page }) => {
    await page.goto(`/site/${SLUG}`);
    await expect(page.getByText('Secure Payment Methods')).toBeVisible();
    await expect(page.getByText('Visa')).toBeVisible();
    await expect(page.getByText('Cash on Delivery')).toBeVisible();
    await expect(page.getByText('SSL encrypted')).toBeVisible();
  });

  test('ShippingInfo 模块渲染标题、预计送达、保障条目', async ({ page }) => {
    await page.goto(`/site/${SLUG}`);
    await expect(page.getByText('Shipping & Returns')).toBeVisible();
    await expect(page.getByText('Order today, get it within 7 days')).toBeVisible();
    await expect(page.getByText('Worldwide Shipping')).toBeVisible();
    await expect(page.getByText('Free over $50')).toBeVisible();
  });
});
