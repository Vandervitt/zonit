import { test, expect, type Page } from '@playwright/test';
import { seedPublishedSite, cleanupSite, closeDb, SLUG_PREFIX, isDbE2EEnabled } from './helpers/db';
import {
  makeBaseTemplate, faqBlock, reviewsBlock,
} from './helpers/template';

const SLUG = `${SLUG_PREFIX}jsonld`;

async function readJsonLd(page: Page): Promise<Record<string, unknown>[]> {
  const texts = await page.locator('script[type="application/ld+json"]').allTextContents();
  return texts.map(t => JSON.parse(t));
}

test.describe('JSON-LD 自动派生', () => {
  test.skip(!isDbE2EEnabled, 'Set RUN_DB_E2E=1 to run database-backed e2e tests.');

  test.beforeAll(async () => {
    const tpl = makeBaseTemplate({
      blocks: [reviewsBlock(), faqBlock()],
    });
    await seedPublishedSite(SLUG, tpl);
  });

  test.afterAll(async () => {
    await cleanupSite(SLUG);
    await closeDb();
  });

  test('注入 Organization + FAQPage 结构化数据', async ({ page }) => {
    await page.goto(`/site/${SLUG}`);
    const nodes = await readJsonLd(page);

    const types = nodes.map(n => n['@type']);
    expect(types).toContain('Organization');
    expect(types).toContain('FAQPage');

    const org = nodes.find(n => n['@type'] === 'Organization') as Record<string, unknown>;
    expect(org.name).toBe('E2E Brand');
    expect(org.email).toBe('hello@e2e.test');

    const faq = nodes.find(n => n['@type'] === 'FAQPage') as Record<string, unknown>;
    const faqItems = faq.mainEntity as Array<Record<string, unknown>>;
    expect(faqItems).toHaveLength(2);
    expect(faqItems[0].name).toContain('worldwide');
  });

  test('JSON-LD 内的 < 已被转义，避免 </script> 注入', async ({ page }) => {
    await page.goto(`/site/${SLUG}`);
    const html = await page.content();
    const blocks = html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g) ?? [];
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) {
      const body = block.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
      expect(body).not.toMatch(/<\//);
    }
  });
});
