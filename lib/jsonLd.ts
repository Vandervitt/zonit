// 从 LandingPageTemplate 派生 schema.org JSON-LD 节点。
// 纯函数，服务端可调用；返回数组，调用方负责注入 <script type="application/ld+json">。
//
// 默认派生范围：Organization + FAQPage
// deriveReviews: true  → Review / AggregateRating（需显式开启）

import type {
  LandingPageTemplate,
  OptionalBlock,
  FAQSchema,
  ReviewsSchema,
} from '@/types/schema';

type JsonLdNode = Record<string, unknown>;

const allBlocks = (template: LandingPageTemplate): OptionalBlock[] => [
  ...template.upperBlocks,
  ...(template.afterOffer ?? []),
  ...template.lowerBlocks,
];

function findBlock<T extends OptionalBlock['type']>(
  blocks: OptionalBlock[],
  type: T,
): Extract<OptionalBlock, { type: T }> | undefined {
  return blocks.find(b => b.type === type) as Extract<OptionalBlock, { type: T }> | undefined;
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
  const config = seo?.jsonLd;
  const auto = config?.autoDerive ?? true;
  const nodes: JsonLdNode[] = [];

  if (auto) {
    const blocks = allBlocks(template);
    if (config?.organization ?? true) {
      nodes.push(deriveOrganization(template));
    }
    const faq = findBlock(blocks, 'FAQ');
    if ((config?.faqPage ?? true) && faq) nodes.push(deriveFaq(faq.data));

    if (config?.deriveReviews) {
      const reviews = findBlock(blocks, 'Reviews');
      if (reviews) nodes.push(...deriveReviews(reviews.data));
    }
  }

  if (config?.custom?.length) {
    nodes.push(...(config.custom as JsonLdNode[]));
  }
  return nodes;
}
