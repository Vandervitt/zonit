import type { BlockType, OptionalBlockType } from '@/types/schema';

export const BLOCK_TYPES: BlockType[] = [
  'Hero', 'ProductBundles', 'HowItWorks', 'MicroFooter',
  'Features', 'Reviews', 'TrustBanner', 'AuthorityStory', 'FAQ',
  'Countdown', 'BeforeAfter', 'LeadForm', 'MediaLogos', 'VideoTestimonials',
  'Guarantee', 'PaymentBadges', 'ShippingInfo',
];

export const OPTIONAL_BLOCK_TYPES: OptionalBlockType[] = [
  'Features', 'Reviews', 'TrustBanner', 'AuthorityStory', 'FAQ',
  'Countdown', 'BeforeAfter', 'LeadForm', 'MediaLogos', 'VideoTestimonials',
  'Guarantee', 'PaymentBadges', 'ShippingInfo',
];

export enum BlockZone {
  Upper = 'upper',
  Middle = 'middle',
  Lower = 'lower',
  Both = 'both',
}

export const FixedBlockKey = {
  Hero: 'hero',
  Bundles: 'bundles',
  HowItWorks: 'howItWorks',
  Footer: 'footer',
  StickyCta: 'stickyCta',
} as const;
