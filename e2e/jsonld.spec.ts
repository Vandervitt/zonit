import { test, expect, type Page } from '@playwright/test';
import { seedPublishedSite, cleanupSite, closeDb, SLUG_PREFIX } from './helpers/db';
import {
  makeBaseTemplate, faqBlock, reviewsBlock, videoTestimonialsBlock,
} from './helpers/template';

const SLUG = `${SLUG_PREFIX}jsonld`;

// 抓页面里所有 application/ld+json 节点并解析为 JSON
async function readJsonLd(page: Page): Promise<Record<string, unknown>[]> {
  const texts = await page.locator('script[type="application/ld+json"]').allTextContents();
  return texts.map(t => JSON.parse(t));
}

test.describe('Phase 3 / Batch B — JSON-LD 自动派生', () => {
  test.beforeAll(async () => {
    const tpl = makeBaseTemplate({
      lowerBlocks: [faqBlock()],
      afterBundles: [reviewsBlock(), videoTestimonialsBlock()],
    });
    await seedPublishedSite(SLUG, tpl);
  });

  test.afterAll(async () => {
    await cleanupSite(SLUG);
    await closeDb();
  });

  test('已发布页注入 Product/FAQPage/Review/VideoObject/Organization 五类结构化数据', async ({ page }) => {
    await page.goto(`/site/${SLUG}`);
    const nodes = await readJsonLd(page);

    const types = nodes.map(n => n['@type']);
    expect(types).toContain('Product');
    expect(types).toContain('FAQPage');
    expect(types).toContain('Review');
    expect(types).toContain('VideoObject');
    expect(types).toContain('Organization');

    const product = nodes.find(n => n['@type'] === 'Product') as Record<string, any>;
    expect(product.name).toBe('Pro');
    expect(product.offers.price).toBe('99');
    expect(product.offers.priceCurrency).toBe('USD');
    expect(product.aggregateRating.ratingValue).toBe(4.8);

    const faq = nodes.find(n => n['@type'] === 'FAQPage') as Record<string, any>;
    expect(faq.mainEntity).toHaveLength(2);
    expect(faq.mainEntity[0].name).toContain('worldwide');

    const reviews = nodes.filter(n => n['@type'] === 'Review') as Record<string, any>[];
    expect(reviews).toHaveLength(2);
    expect(reviews[0].author.name).toBe('Alice');
    expect(reviews[0].reviewRating.ratingValue).toBe(5);

    const org = nodes.find(n => n['@type'] === 'Organization') as Record<string, any>;
    expect(org.name).toBe('E2E Brand');
    expect(org.email).toBe('hello@e2e.test');
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
