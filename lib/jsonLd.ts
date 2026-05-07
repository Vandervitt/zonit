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
  VideoTestimonialsSchema,
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
    nodes.push(deriveOrganization(template));
    const faq = findBlock(blocks, 'FAQ');
    if (faq) nodes.push(deriveFaq(faq.data));

    if (seo?.jsonLd?.deriveReviews) {
      const reviews = findBlock(blocks, 'Reviews');
      if (reviews) nodes.push(...deriveReviews(reviews.data));
    }

    const videos = findBlock(blocks, 'VideoTestimonials');
    if (videos) nodes.push(...deriveVideos(videos.data));
  }

  if (seo?.jsonLd?.custom?.length) {
    nodes.push(...(seo.jsonLd.custom as JsonLdNode[]));
  }
  return nodes;
}
