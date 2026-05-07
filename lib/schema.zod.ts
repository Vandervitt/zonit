import { z } from 'zod';
import { BLOCK_TYPES } from './constants/blocks';
import type { BlockType } from '@/types/schema';

const NonEmpty = z.string().min(1);

const CallToActionSchema = z.object({
  text: NonEmpty,
  url: NonEmpty,
  icon: z.string().optional(),
  theme: z.enum(['primary', 'secondary', 'whatsapp', 'telegram']).optional(),
  channel: z.enum(['whatsapp', 'telegram', 'line', 'phone', 'email', 'form', 'external']).optional(),
  target: z.enum(['_self', '_blank']).optional(),
  prefilledMessage: z.string().optional(),
});

const ImageMetaSchema = z.object({
  src: NonEmpty,
  alt: z.string(),
});

const HeroHighlightSchema = z.object({
  id: NonEmpty,
  text: NonEmpty,
  icon: z.string().optional(),
});

const HeroProofPointSchema = z.object({
  label: NonEmpty,
  value: z.string().optional(),
});

const HeroMediaSchema = z.object({
  type: z.enum(['image', 'video']),
  src: NonEmpty,
  alt: z.string().optional(),
  poster: z.string().optional(),
  autoplay: z.boolean().optional(),
  muted: z.boolean().optional(),
  loop: z.boolean().optional(),
  playsInline: z.boolean().optional(),
});

const CountdownSchemaZ = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  endsAt: NonEmpty,
  expiredFallback: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
  }).optional(),
  cta: CallToActionSchema.optional(),
  variant: z.enum(['banner', 'section']).optional(),
});

const HeroSchemaZ = z.object({
  badge: z.string().optional(),
  title: NonEmpty,
  subtitle: z.string(),
  background: z.object({
    type: z.enum(['image', 'color', 'video']),
    value: NonEmpty,
    overlayOpacity: z.number().min(0).max(1).optional(),
  }),
  cta: CallToActionSchema,
  secondaryCta: CallToActionSchema.optional(),
  trustText: z.string().optional(),
  highlights: z.array(HeroHighlightSchema).optional(),
  proofPoints: z.array(HeroProofPointSchema).optional(),
  media: HeroMediaSchema.optional(),
  countdown: CountdownSchemaZ.optional(),
  variant: z.enum(['overlay', 'split-left', 'split-right']).optional(),
});

const OfferTierSchema = z.object({
  id: NonEmpty,
  name: NonEmpty,
  labelText: z.string().optional(),
  description: z.string(),
  valueProps: z.array(z.string()),
  tag: z.string().optional(),
  image: z.string().optional(),
  urgencyText: z.string().optional(),
  isRecommended: z.boolean().optional(),
  cta: CallToActionSchema,
});

const OfferSchemaZ = z.object({
  title: NonEmpty,
  subtitle: z.string().optional(),
  tiers: z.array(OfferTierSchema).min(1),
  variant: z.enum(['cards-row', 'cards-column']).optional(),
});

const StepItemSchema = z.object({
  id: NonEmpty,
  icon: NonEmpty,
  title: NonEmpty,
  description: z.string(),
});

const HowItWorksSchemaZ = z.object({
  title: NonEmpty,
  subtitle: z.string().optional(),
  steps: z.array(StepItemSchema).min(1),
});

const FooterLinkSchema = z.object({
  text: NonEmpty,
  url: NonEmpty,
});

const MicroFooterSchemaZ = z.object({
  brandName: NonEmpty,
  copyrightYear: NonEmpty,
  contactEmail: z.string().optional(),
  links: z.array(FooterLinkSchema),
  disclaimer: z.string().optional(),
});

const FeatureItemSchema = z.object({
  id: NonEmpty,
  icon: NonEmpty,
  title: NonEmpty,
  description: z.string(),
});

const FeaturesSchemaZ = z.object({
  title: NonEmpty,
  subtitle: z.string().optional(),
  items: z.array(FeatureItemSchema).min(1),
  layout: z.enum(['grid', 'list']).optional(),
});

const ReviewItemSchema = z.object({
  id: NonEmpty,
  authorName: NonEmpty,
  authorRole: z.string().optional(),
  avatar: z.string().optional(),
  rating: z.number().min(1).max(5),
  content: NonEmpty,
  proofImage: z.string().optional(),
  videoUrl: z.string().optional(),
  sourcePlatform: z.string().optional(),
  verified: z.boolean().optional(),
  reviewDate: z.string().optional(),
  country: z.string().optional(),
});

const ReviewsSchemaZ = z.object({
  title: NonEmpty,
  subtitle: z.string().optional(),
  averageRating: z.number().min(0).max(5).optional(),
  totalReviews: z.string().optional(),
  ratingSummary: z.object({
    average: z.number().min(0).max(5),
    scale: z.number().positive().optional(),
    totalLabel: z.string().optional(),
  }).optional(),
  items: z.array(ReviewItemSchema).min(1),
  disclaimer: z.string().optional(),
  variant: z.enum(['grid', 'carousel']).optional(),
});

const TrustBadgeSchema = z.object({
  id: NonEmpty,
  icon: NonEmpty,
  text: NonEmpty,
  subtext: z.string().optional(),
});

const TrustBannerSchemaZ = z.object({
  theme: z.enum(['light', 'dark', 'brand']).optional(),
  badges: z.array(TrustBadgeSchema).min(1),
});

const AuthorityCredentialSchema = z.object({
  id: NonEmpty,
  label: NonEmpty,
  image: z.string().optional(),
});

const AuthoritySchemaZ = z.object({
  title: NonEmpty,
  subtitle: z.string().optional(),
  paragraphs: z.array(z.string()).min(1),
  image: ImageMetaSchema,
  stats: z.array(z.object({ label: NonEmpty, value: NonEmpty })).optional(),
  credentials: z.array(AuthorityCredentialSchema).optional(),
  signature: z.object({ name: NonEmpty, role: NonEmpty }).optional(),
  variant: z.enum(['image-left', 'image-right']).optional(),
});

const FAQItemSchema = z.object({
  id: NonEmpty,
  question: NonEmpty,
  answer: NonEmpty,
});

const FAQSchemaZ = z.object({
  title: NonEmpty,
  subtitle: z.string().optional(),
  items: z.array(FAQItemSchema).min(1),
  contactCta: CallToActionSchema.optional(),
});

const LeadFormFieldSchema = z.object({
  id: NonEmpty,
  name: NonEmpty,
  label: NonEmpty,
  type: z.enum(['text', 'email', 'phone', 'select', 'textarea', 'checkbox']),
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
  options: z.array(z.object({ label: NonEmpty, value: NonEmpty })).optional(),
});

const LeadFormSchemaZ = z.object({
  title: NonEmpty,
  subtitle: z.string().optional(),
  fields: z.array(LeadFormFieldSchema).min(1),
  submitText: NonEmpty,
  successMessage: z.string().optional(),
  webhookUrl: z.string().optional(),
  consentText: z.string().optional(),
  eventName: z.string().optional(),
});

const AssuranceBadgeSchema = z.object({
  id: NonEmpty,
  icon: NonEmpty,
  text: NonEmpty,
  subtext: z.string().optional(),
});

const AssuranceSchemaZ = z.object({
  title: NonEmpty,
  subtitle: z.string().optional(),
  description: z.string().optional(),
  badges: z.array(AssuranceBadgeSchema).optional(),
  image: z.string().optional(),
  cta: CallToActionSchema.optional(),
});


const SeoMetaSchema = z.object({
  mode: z.enum(['auto', 'manual']).optional(),
  title: NonEmpty,
  description: NonEmpty,
  canonicalUrl: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  robots: z.enum(['index,follow', 'noindex,nofollow']).optional(),
  generatedAt: z.string().optional(),
  source: z.enum(['ai', 'fallback', 'user']).optional(),
  jsonLd: z.object({
    organization: z.boolean().optional(),
    faqPage: z.boolean().optional(),
    autoDerive: z.boolean().optional(),
    deriveReviews: z.boolean().optional(),
    custom: z.array(z.record(z.string(), z.unknown())).optional(),
  }).optional(),
});

const PixelEventSchema = z.object({
  trigger: z.enum(['page_view', 'cta_click', 'block_in_view', 'form_submit', 'time_on_page']),
  name: NonEmpty,
  blockType: z.enum(BLOCK_TYPES as [BlockType, ...BlockType[]]).optional(),
  delaySeconds: z.number().nonnegative().optional(),
  params: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

const AnalyticsPixelSchema = z.object({
  provider: z.enum(['meta', 'google', 'tiktok', 'linkedin', 'x', 'custom']),
  id: NonEmpty,
  events: z.array(PixelEventSchema).optional(),
});

const AnalyticsConfigSchema = z.object({
  pixels: z.array(AnalyticsPixelSchema).optional(),
});

const PageMetaSchema = z.object({
  locale: z.string().optional(),
  market: z.string().optional(),
  seo: SeoMetaSchema.optional(),
  analytics: AnalyticsConfigSchema.optional(),
});

const block = <T extends string, D extends z.ZodTypeAny>(type: T, data: D) =>
  z.object({ id: NonEmpty, type: z.literal(type), data });

const PageBlockSchema = z.discriminatedUnion('type', [
  block('Hero', HeroSchemaZ),
  block('Offer', OfferSchemaZ),
  block('HowItWorks', HowItWorksSchemaZ),
  block('MicroFooter', MicroFooterSchemaZ),
  block('Features', FeaturesSchemaZ),
  block('Reviews', ReviewsSchemaZ),
  block('TrustBanner', TrustBannerSchemaZ),
  block('AuthorityStory', AuthoritySchemaZ),
  block('FAQ', FAQSchemaZ),
  block('Countdown', CountdownSchemaZ),
  block('LeadForm', LeadFormSchemaZ),
  block('Assurance', AssuranceSchemaZ),
]);

const OptionalBlockSchema = z.discriminatedUnion('type', [
  block('Features', FeaturesSchemaZ),
  block('Reviews', ReviewsSchemaZ),
  block('TrustBanner', TrustBannerSchemaZ),
  block('AuthorityStory', AuthoritySchemaZ),
  block('FAQ', FAQSchemaZ),
  block('Countdown', CountdownSchemaZ),
  block('LeadForm', LeadFormSchemaZ),
  block('Assurance', AssuranceSchemaZ),
]);

export const LandingPageTemplateSchema = z.object({
  templateId: NonEmpty,
  templateName: NonEmpty,
  themeConfig: z.object({
    mode: z.enum(['light', 'dark']),
    primaryColor: NonEmpty,
  }),
  pageMeta: PageMetaSchema.optional(),
  hero: HeroSchemaZ,
  offer: OfferSchemaZ,
  howItWorks: HowItWorksSchemaZ,
  footer: MicroFooterSchemaZ,
  upperBlocks: z.array(OptionalBlockSchema),
  afterOffer: z.array(OptionalBlockSchema).optional(),
  lowerBlocks: z.array(OptionalBlockSchema),
  stickyCta: CallToActionSchema.optional(),
});

export const PresetTemplateSchema = z.object({
  id: NonEmpty,
  name: NonEmpty,
  description: NonEmpty,
  category: NonEmpty,
  accentColor: NonEmpty,
  gradient: NonEmpty,
  data: LandingPageTemplateSchema,
});

export type ZodPresetTemplate = z.infer<typeof PresetTemplateSchema>;
export type ZodLandingPageTemplate = z.infer<typeof LandingPageTemplateSchema>;
