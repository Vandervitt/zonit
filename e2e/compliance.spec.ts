import { test, expect } from '@playwright/test';
import { seedPublishedSite, cleanupSite, closeDb, SLUG_PREFIX } from './helpers/db';
import { makeBaseTemplate } from './helpers/template';

const COOKIE_SLUG = `${SLUG_PREFIX}cookie`;
const AGE_SLUG = `${SLUG_PREFIX}age`;

test.describe('Phase 3 / Batch C — GDPR cookie consent', () => {
  test.beforeAll(async () => {
    await seedPublishedSite(
      COOKIE_SLUG,
      makeBaseTemplate({
        compliance: {
          cookieConsent: {
            enabled: true,
            policyVersion: '2026-01-01',
            title: 'We value your privacy',
            description: 'Cookie disclosure for E2E.',
            acceptText: 'Accept',
            rejectText: 'Reject',
          },
        },
      }),
    );
  });

  test.afterAll(async () => {
    await cleanupSite(COOKIE_SLUG);
    await closeDb();
  });

  test('首次访问展示 banner；点击 Accept 后写 localStorage，刷新不再展示', async ({ page }) => {
    await page.goto(`/site/${COOKIE_SLUG}`);

    const banner = page.getByText('We value your privacy');
    await expect(banner).toBeVisible();

    await page.getByRole('button', { name: 'Accept' }).click();
    await expect(banner).toBeHidden();

    const stored = await page.evaluate(() => localStorage.getItem('zonit:cookie-consent'));
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.version).toBe('2026-01-01');
    expect(parsed.accepted).toBe(true);

    await page.reload();
    await expect(page.getByText('We value your privacy')).toBeHidden();
  });
});

test.describe('Phase 3 / Batch C — Age gate', () => {
  test.beforeAll(async () => {
    await seedPublishedSite(
      AGE_SLUG,
      makeBaseTemplate({
        compliance: {
          ageGate: {
            enabled: true,
            minimumAge: 21,
            title: 'Are you 21+?',
            description: 'Restricted content ahead.',
            confirmText: 'Yes, enter',
            rejectText: 'No, leave',
          },
        },
      }),
    );
  });

  test.afterAll(async () => {
    await cleanupSite(AGE_SLUG);
    await closeDb();
  });

  test('首次访问被遮罩拦截；确认后 localStorage 记录最低年龄', async ({ page }) => {
    await page.goto(`/site/${AGE_SLUG}`);

    const gate = page.getByText('Are you 21+?');
    await expect(gate).toBeVisible();

    await page.getByRole('button', { name: 'Yes, enter' }).click();
    await expect(gate).toBeHidden();

    const stored = await page.evaluate(() => localStorage.getItem('zonit:age-confirmed'));
    expect(stored).toBe('21');
  });
});
