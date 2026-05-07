import type { BlockType, OptionalBlockType } from '@/types/schema';

export const BLOCK_TYPES: BlockType[] = [
  'Hero', 'Offer', 'HowItWorks', 'MicroFooter',
  'Features', 'Reviews', 'TrustBanner', 'AuthorityStory', 'FAQ',
  'Countdown', 'LeadForm', 'Assurance',
];

export const OPTIONAL_BLOCK_TYPES: OptionalBlockType[] = [
  'Features', 'Reviews', 'TrustBanner', 'AuthorityStory', 'FAQ',
  'Countdown', 'LeadForm', 'Assurance',
];

export enum BlockZone {
  Upper = 'upper',
  Middle = 'middle',
  Lower = 'lower',
  Both = 'both',
}

export const FixedBlockKey = {
  Hero: 'hero',
  Offer: 'offer',
  HowItWorks: 'howItWorks',
  Footer: 'footer',
  StickyCta: 'stickyCta',
} as const;
