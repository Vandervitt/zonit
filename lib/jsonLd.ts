// 从 LandingPageTemplate 派生 schema.org JSON-LD 节点。
// 纯函数，服务端可调用；返回数组，调用方负责注入 <script type="application/ld+json">。
//
// 默认派生范围：Organization + FAQPage

import type {
  LandingPageTemplate,
  OptionalBlock,
  FAQSchema,
} from '@/types/schema';

type JsonLdNode = Record<string, unknown>;

const allBlocks = (template: LandingPageTemplate): OptionalBlock[] => [
  ...(template.blocks ?? []),
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
  const nodes: JsonLdNode[] = [];

  const blocks = allBlocks(template);
  nodes.push(deriveOrganization(template));
  const faq = findBlock(blocks, 'FAQ');
  if (faq) nodes.push(deriveFaq(faq.data));

  return nodes;
}
