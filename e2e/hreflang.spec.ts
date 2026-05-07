import { test, expect } from '@playwright/test';
import { seedPublishedSite, cleanupSite, closeDb, SLUG_PREFIX } from './helpers/db';
import { makeBaseTemplate } from './helpers/template';

const SLUG = `${SLUG_PREFIX}hreflang`;

test.describe('Phase 3 / Batch C — alternateLocales hreflang', () => {
  test.beforeAll(async () => {
    const tpl = makeBaseTemplate({
      pageMeta: {
        locale: 'en-US',
        alternateLocales: [
          { locale: 'en-US', url: 'https://example.com/en' },
          { locale: 'es-MX', url: 'https://example.com/es' },
          { locale: 'pt-BR', url: 'https://example.com/pt' },
        ],
      },
    });
    await seedPublishedSite(SLUG, tpl);
  });

  test.afterAll(async () => {
    await cleanupSite(SLUG);
    await closeDb();
  });

  test('SSR 注入每个 locale 的 <link rel="alternate" hreflang>', async ({ page }) => {
    await page.goto(`/site/${SLUG}`);

    const links = page.locator('link[rel="alternate"][hreflang]');
    await expect(links).toHaveCount(3);

    const expected = [
      { hreflang: 'en-US', href: 'https://example.com/en' },
      { hreflang: 'es-MX', href: 'https://example.com/es' },
      { hreflang: 'pt-BR', href: 'https://example.com/pt' },
    ];
    for (const { hreflang, href } of expected) {
      const link = page.locator(`link[rel="alternate"][hreflang="${hreflang}"]`);
      await expect(link).toHaveAttribute('href', href);
    }
  });
});
