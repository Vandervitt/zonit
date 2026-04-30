import { z } from 'zod';

const NonEmpty = z.string().min(1);

const BillingPeriodSchema = z.enum(['one-time', 'day', 'week', 'month', 'quarter', 'year', 'lifetime', 'custom']);

const CallToActionSchema = z.object({
  text: NonEmpty,
  url: NonEmpty,
  icon: z.string().optional(),
  theme: z.enum(['primary', 'secondary', 'whatsapp', 'telegram']).optional(),
  channel: z.enum(['whatsapp', 'telegram', 'line', 'phone', 'email', 'checkout', 'form', 'external']).optional(),
  target: z.enum(['_self', '_blank']).optional(),
  rel: z.string().optional(),
  prefilledMessage: z.string().optional(),
  eventName: z.string().optional(),
  trackingId: z.string().optional(),
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
  variant: z.enum(['overlay', 'split-left', 'split-right']).optional(),
});

const BundleTierSchema = z.object({
  id: NonEmpty,
  name: NonEmpty,
  price: NonEmpty,
  originalPrice: z.string().optional(),
  description: z.string(),
  features: z.array(z.string()),
  tag: z.string().optional(),
  image: z.string().optional(),
  currency: z.string().optional(),
  billingPeriod: BillingPeriodSchema.optional(),
  discountLabel: z.string().optional(),
  guaranteeText: z.string().optional(),
  urgencyText: z.string().optional(),
  isRecommended: z.boolean().optional(),
  cta: CallToActionSchema,
});

const BundlesSchemaZ = z.object({
  title: NonEmpty,
  subtitle: z.string().optional(),
  tiers: z.array(BundleTierSchema).min(1),
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

const SeoMetaSchema = z.object({
  title: NonEmpty,
  description: NonEmpty,
  canonicalUrl: z.string().optional(),
  ogImage: z.string().optional(),
  robots: z.string().optional(),
});

const AnalyticsPixelSchema = z.object({
  provider: z.enum(['meta', 'google', 'tiktok', 'linkedin', 'x', 'custom']),
  id: NonEmpty,
});

const AnalyticsConfigSchema = z.object({
  pixels: z.array(AnalyticsPixelSchema).optional(),
  experimentId: z.string().optional(),
});

const PageMetaSchema = z.object({
  locale: z.string().optional(),
  market: z.string().optional(),
  currency: z.string().optional(),
  seo: SeoMetaSchema.optional(),
  analytics: AnalyticsConfigSchema.optional(),
});

const block = <T extends string, D extends z.ZodTypeAny>(type: T, data: D) =>
  z.object({ id: NonEmpty, type: z.literal(type), data, variantKey: z.string().optional() });

const PageBlockSchema = z.discriminatedUnion('type', [
  block('Hero', HeroSchemaZ),
  block('ProductBundles', BundlesSchemaZ),
  block('HowItWorks', HowItWorksSchemaZ),
  block('MicroFooter', MicroFooterSchemaZ),
  block('Features', FeaturesSchemaZ),
  block('Reviews', ReviewsSchemaZ),
  block('TrustBanner', TrustBannerSchemaZ),
  block('AuthorityStory', AuthoritySchemaZ),
  block('FAQ', FAQSchemaZ),
]);

const OptionalBlockSchema = z.discriminatedUnion('type', [
  block('Features', FeaturesSchemaZ),
  block('Reviews', ReviewsSchemaZ),
  block('TrustBanner', TrustBannerSchemaZ),
  block('AuthorityStory', AuthoritySchemaZ),
  block('FAQ', FAQSchemaZ),
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
  bundles: BundlesSchemaZ,
  howItWorks: HowItWorksSchemaZ,
  footer: MicroFooterSchemaZ,
  upperBlocks: z.array(OptionalBlockSchema),
  lowerBlocks: z.array(OptionalBlockSchema),
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
