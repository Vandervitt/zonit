// 从 LandingPageTemplate 派生 schema.org JSON-LD 节点。
// 纯函数，服务端可调用；返回数组，调用方负责注入 <script type="application/ld+json">。
//
// 覆盖范围：
//   - bundles.tiers          → Product + Offer
//   - any FAQ block          → FAQPage
//   - any Reviews block      → AggregateRating + 前 5 条 Review
//   - any VideoTestimonials  → VideoObject[]
//   - footer                 → Organization

import type {
  LandingPageTemplate,
  OptionalBlock,
  FAQSchema,
  ReviewsSchema,
  VideoTestimonialsSchema,
} from '@/types/schema';

type JsonLdNode = Record<string, unknown>;

const allBlocks = (template: LandingPageTemplate): OptionalBlock[] => [
  ...template.upperBlocks,
  ...(template.afterBundles ?? []),
  ...template.lowerBlocks,
];

function findBlock<T extends OptionalBlock['type']>(
  blocks: OptionalBlock[],
  type: T,
): Extract<OptionalBlock, { type: T }> | undefined {
  return blocks.find(b => b.type === type) as Extract<OptionalBlock, { type: T }> | undefined;
}

// 价格字符串 "$49" / "49" → "49"
function normalizePrice(raw: string): string | undefined {
  const m = raw.match(/[\d.]+/);
  return m ? m[0] : undefined;
}

function deriveProduct(template: LandingPageTemplate, blocks: OptionalBlock[]): JsonLdNode | undefined {
  const tiers = template.bundles.tiers;
  if (!tiers.length) return undefined;
  // 优先选 isRecommended 的那条作为主 SKU
  const main = tiers.find(t => t.isRecommended) ?? tiers[0];
  const price = normalizePrice(main.price);
  const reviewsBlock = findBlock(blocks, 'Reviews');
  const rating = reviewsBlock?.data.ratingSummary?.average ?? reviewsBlock?.data.averageRating;

  const node: JsonLdNode = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: main.name,
    description: main.description || template.bundles.title,
  };
  if (main.image) node.image = main.image;
  if (price) {
    node.offers = {
      '@type': 'Offer',
      price,
      priceCurrency: main.currency || template.pageMeta?.currency || 'USD',
      availability: 'https://schema.org/InStock',
    };
  }
  if (rating && reviewsBlock) {
    node.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating,
      reviewCount: reviewsBlock.data.items.length,
    };
  }
  return node;
}

function deriveFaq(faq: FAQSchema): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

function deriveReviews(reviews: ReviewsSchema): JsonLdNode[] {
  return reviews.items.slice(0, 5).map(item => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: { '@type': 'Person', name: item.authorName },
    reviewRating: { '@type': 'Rating', ratingValue: item.rating, bestRating: 5 },
    reviewBody: item.content,
    ...(item.reviewDate ? { datePublished: item.reviewDate } : {}),
  }));
}

function deriveVideos(videos: VideoTestimonialsSchema): JsonLdNode[] {
  return videos.items.map(item => ({
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: `${item.authorName} testimonial`,
    description: item.quote || `Customer testimonial from ${item.authorName}`,
    contentUrl: item.videoUrl,
    ...(item.poster ? { thumbnailUrl: item.poster } : {}),
    uploadDate: new Date().toISOString().slice(0, 10),
  }));
}

function deriveOrganization(template: LandingPageTemplate): JsonLdNode {
  const footer = template.footer;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: footer.brandName,
    ...(footer.contactEmail ? { email: footer.contactEmail } : {}),
    ...(template.pageMeta?.seo?.canonicalUrl ? { url: template.pageMeta.seo.canonicalUrl } : {}),
  };
}

export function deriveJsonLd(template: LandingPageTemplate): JsonLdNode[] {
  const seo = template.pageMeta?.seo;
  const auto = seo?.jsonLd?.autoDerive ?? true;
  const nodes: JsonLdNode[] = [];

  if (auto) {
    const blocks = allBlocks(template);
    const product = deriveProduct(template, blocks);
    if (product) nodes.push(product);
    const faq = findBlock(blocks, 'FAQ');
    if (faq) nodes.push(deriveFaq(faq.data));
    const reviews = findBlock(blocks, 'Reviews');
    if (reviews) nodes.push(...deriveReviews(reviews.data));
    const videos = findBlock(blocks, 'VideoTestimonials');
    if (videos) nodes.push(...deriveVideos(videos.data));
    nodes.push(deriveOrganization(template));
  }

  if (seo?.jsonLd?.custom?.length) {
    nodes.push(...(seo.jsonLd.custom as JsonLdNode[]));
  }
  return nodes;
}
