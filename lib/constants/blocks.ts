import type { BlockType } from '@/types/schema';

export const BLOCK_TYPES: BlockType[] = [
  'Features', 'Reviews', 'TrustBanner', 'LogoWall', 'AuthorityStory', 'FAQ',
  'Countdown', 'Assurance',
];

export const OPTIONAL_BLOCK_TYPES: BlockType[] = [
  'Features', 'Reviews', 'TrustBanner', 'LogoWall', 'AuthorityStory', 'FAQ',
  'Countdown', 'Assurance',
];

export const FixedBlockKey = {
  Hero: 'hero',
  Offer: 'offer',
  HowItWorks: 'howItWorks',
  Footer: 'footer',
  LeadForm: 'leadForm',
  StickyCta: 'stickyCta',
} as const;
