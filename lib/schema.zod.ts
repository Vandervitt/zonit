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

const BeforeAfterPairSchema = z.object({
  id: NonEmpty,
  before: ImageMetaSchema,
  after: ImageMetaSchema,
  caption: z.string().optional(),
});

const BeforeAfterSchemaZ = z.object({
  title: NonEmpty,
  subtitle: z.string().optional(),
  pairs: z.array(BeforeAfterPairSchema).min(1),
  variant: z.enum(['side-by-side', 'slider']).optional(),
  disclaimer: z.string().optional(),
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

const MediaLogoSchema = z.object({
  id: NonEmpty,
  name: NonEmpty,
  image: NonEmpty,
  url: z.string().optional(),
});

const MediaLogosSchemaZ = z.object({
  title: z.string().optional(),
  logos: z.array(MediaLogoSchema).min(1),
  variant: z.enum(['mono', 'color']).optional(),
});

const VideoTestimonialItemSchema = z.object({
  id: NonEmpty,
  authorName: NonEmpty,
  authorRole: z.string().optional(),
  videoUrl: NonEmpty,
  poster: z.string().optional(),
  duration: z.string().optional(),
  quote: z.string().optional(),
  country: z.string().optional(),
});

const VideoTestimonialsSchemaZ = z.object({
  title: NonEmpty,
  subtitle: z.string().optional(),
  items: z.array(VideoTestimonialItemSchema).min(1),
  variant: z.enum(['carousel', 'grid']).optional(),
});

const GuaranteeBadgeSchema = z.object({
  id: NonEmpty,
  icon: NonEmpty,
  text: NonEmpty,
  subtext: z.string().optional(),
});

const GuaranteeSchemaZ = z.object({
  title: NonEmpty,
  subtitle: z.string().optional(),
  description: z.string().optional(),
  badges: z.array(GuaranteeBadgeSchema).optional(),
  image: z.string().optional(),
  cta: CallToActionSchema.optional(),
});

const PaymentBadgeSchema = z.object({
  id: NonEmpty,
  provider: NonEmpty,
  label: z.string().optional(),
});

const PaymentBadgesSchemaZ = z.object({
  title: z.string().optional(),
  badges: z.array(PaymentBadgeSchema).min(1),
  secureNote: z.string().optional(),
});

const ShippingInfoItemSchema = z.object({
  id: NonEmpty,
  icon: NonEmpty,
  title: NonEmpty,
  description: NonEmpty,
});

const ShippingInfoSchemaZ = z.object({
  title: NonEmpty,
  items: z.array(ShippingInfoItemSchema).min(1),
  estimatedDelivery: z.string().optional(),
  returnsPolicyUrl: z.string().optional(),
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
  block('Countdown', CountdownSchemaZ),
  block('BeforeAfter', BeforeAfterSchemaZ),
  block('LeadForm', LeadFormSchemaZ),
  block('MediaLogos', MediaLogosSchemaZ),
  block('VideoTestimonials', VideoTestimonialsSchemaZ),
  block('Guarantee', GuaranteeSchemaZ),
  block('PaymentBadges', PaymentBadgesSchemaZ),
  block('ShippingInfo', ShippingInfoSchemaZ),
]);

const OptionalBlockSchema = z.discriminatedUnion('type', [
  block('Features', FeaturesSchemaZ),
  block('Reviews', ReviewsSchemaZ),
  block('TrustBanner', TrustBannerSchemaZ),
  block('AuthorityStory', AuthoritySchemaZ),
  block('FAQ', FAQSchemaZ),
  block('Countdown', CountdownSchemaZ),
  block('BeforeAfter', BeforeAfterSchemaZ),
  block('LeadForm', LeadFormSchemaZ),
  block('MediaLogos', MediaLogosSchemaZ),
  block('VideoTestimonials', VideoTestimonialsSchemaZ),
  block('Guarantee', GuaranteeSchemaZ),
  block('PaymentBadges', PaymentBadgesSchemaZ),
  block('ShippingInfo', ShippingInfoSchemaZ),
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
  afterBundles: z.array(OptionalBlockSchema).optional(),
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
