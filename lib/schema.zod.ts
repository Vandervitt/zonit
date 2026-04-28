import { z } from 'zod';

const NonEmpty = z.string().min(1);

const CallToActionSchema = z.object({
  text: NonEmpty,
  url: NonEmpty,
  icon: z.string().optional(),
  theme: z.enum(['primary', 'secondary', 'whatsapp', 'telegram']).optional(),
});

const ImageMetaSchema = z.object({
  src: NonEmpty,
  alt: z.string(),
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
  trustText: z.string().optional(),
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
});

const ReviewsSchemaZ = z.object({
  title: NonEmpty,
  subtitle: z.string().optional(),
  averageRating: z.number().min(0).max(5).optional(),
  totalReviews: z.string().optional(),
  items: z.array(ReviewItemSchema).min(1),
  variant: z.enum(['grid', 'carousel']).optional(),
});

const TrustBadgeSchema = z.object({
  id: NonEmpty,
  icon: NonEmpty,
  text: NonEmpty,
});

const TrustBannerSchemaZ = z.object({
  theme: z.enum(['light', 'dark', 'brand']).optional(),
  badges: z.array(TrustBadgeSchema).min(1),
});

const AuthoritySchemaZ = z.object({
  title: NonEmpty,
  subtitle: z.string().optional(),
  paragraphs: z.array(z.string()).min(1),
  image: ImageMetaSchema,
  stats: z.array(z.object({ label: NonEmpty, value: NonEmpty })).optional(),
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

const OptionalBlockSchema = z.discriminatedUnion('type', [
  z.object({ id: NonEmpty, type: z.literal('Features'), data: FeaturesSchemaZ }),
  z.object({ id: NonEmpty, type: z.literal('Reviews'), data: ReviewsSchemaZ }),
  z.object({ id: NonEmpty, type: z.literal('TrustBanner'), data: TrustBannerSchemaZ }),
  z.object({ id: NonEmpty, type: z.literal('AuthorityStory'), data: AuthoritySchemaZ }),
  z.object({ id: NonEmpty, type: z.literal('FAQ'), data: FAQSchemaZ }),
]);

export const LandingPageTemplateSchema = z.object({
  templateId: NonEmpty,
  templateName: NonEmpty,
  themeConfig: z.object({
    mode: z.enum(['light', 'dark']),
    primaryColor: NonEmpty,
  }),
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
