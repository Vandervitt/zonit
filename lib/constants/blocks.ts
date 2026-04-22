import type { BlockType, OptionalBlockType } from '@/types/schema';

export const BLOCK_TYPES: BlockType[] = [
  'Hero', 'ProductBundles', 'HowItWorks', 'MicroFooter',
  'Features', 'Reviews', 'TrustBanner', 'AuthorityStory', 'FAQ',
];

export const OPTIONAL_BLOCK_TYPES: OptionalBlockType[] = [
  'Features', 'Reviews', 'TrustBanner', 'AuthorityStory', 'FAQ',
];

export enum BlockZone {
  Upper = 'upper',
  Lower = 'lower',
  Both = 'both',
}

export const FixedBlockKey = {
  Hero: 'hero',
  Bundles: 'bundles',
  HowItWorks: 'howItWorks',
  Footer: 'footer',
} as const;
