import { z } from 'zod';
import { BLOCK_TYPES } from './constants/blocks';
import type { BlockType } from '@/types/schema';

const NonEmpty = z.string().min(1);

const CallToActionSchema = z.object({
  text: NonEmpty,
  url: NonEmpty.optional(),
  icon: z.string().optional(),
  theme: z.enum(['primary', 'secondary', 'whatsapp', 'telegram']).optional(),
  channel: z.enum(['whatsapp', 'telegram', 'line', 'phone', 'email', 'form', 'booking', 'contact_link']).optional(),
  action: z.enum(['chat', 'call', 'email', 'open_form', 'scroll_to_form', 'booking_link', 'contact_link']).optional(),
  formTargetId: z.string().optional(),
  target: z.enum(['_self', '_blank']).optional(),
  prefilledMessage: z.string().optional(),
});

const PrimaryConversionSchema = z.object({
  channel: z.enum(['whatsapp', 'telegram', 'line', 'phone', 'email', 'form', 'booking', 'contact_link']),
  action: z.enum(['chat', 'call', 'email', 'open_form', 'scroll_to_form', 'booking_link', 'contact_link']),
  label: z.string().optional(),
  url: z.string().optional(),
  formTargetId: z.string().optional(),
  prefilledMessage: z.string().optional(),
});

const StickyCtaConfigSchema = CallToActionSchema.extend({
  label: z.string().optional(),
  position: z.enum(['bottom-left', 'bottom-right']).optional(),
  showAfterScrollPercent: z.number().min(0).max(100).optional(),
});

const ImageMetaSchema = z.object({
  src: NonEmpty,
  alt: z.string(),
});

const HeroStatSchema = z.object({
  id: NonEmpty,
  label: NonEmpty,
  value: z.string().optional(),
  icon: z.string().optional(),
});

const HeroMediaSchema = z.object({
  type: z.enum(['image', 'video']),
  src: NonEmpty,
  alt: z.string().optional(),
  poster: z.string().optional(),
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
  stats: z.array(HeroStatSchema).optional(),
  media: HeroMediaSchema.optional(),
  countdown: CountdownSchemaZ.optional(),
  variant: z.enum(['overlay', 'split-left', 'split-right']).optional(),
});

const OfferOptionSchema = z.object({
  id: NonEmpty,
  name: NonEmpty,
  labelText: z.string().optional(),
  description: z.string(),
  valueProps: z.array(z.string()),
  tag: z.string().optional(),
  image: z.string().optional(),
  urgencyText: z.string().optional(),
  cta: CallToActionSchema,
}).strict();

const OfferSchemaZ = z.object({
  title: NonEmpty,
  subtitle: z.string().optional(),
  options: z.array(OfferOptionSchema).min(1),
  showImages: z.boolean().optional(),
  variant: z.enum(['cards-row', 'cards-column']).optional(),
}).strict();

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
  url: z.string().optional(),
  content: z.string().optional(),
}).refine(link => Boolean(link.url?.trim() || link.content?.trim()), {
  message: 'Footer link must include either url or content.',
  path: ['url'],
});

const MicroFooterSchemaZ = z.object({
  brandName: NonEmpty,
  copyrightYear: NonEmpty,
  contactEmail: z.string().optional(),
  socialLinks: z.array(z.object({
    platform: z.string(),
    url: NonEmpty,
  })).optional(),
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
  ratingSummary: z.object({
    average: z.number().min(0).max(5),
    scale: z.number().positive().optional(),
    totalLabel: z.string().optional(),
  }).strict().optional(),
  items: z.array(ReviewItemSchema).min(1),
  disclaimer: z.string().optional(),
  variant: z.enum(['grid', 'carousel']).optional(),
}).strict();

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

const LogoWallItemSchema = z.object({
  id: NonEmpty,
  src: NonEmpty,
  alt: z.string(),
  url: z.string().optional(),
});

const LogoWallSchemaZ = z.object({
  title: z.string().optional(),
  logos: z.array(LogoWallItemSchema).min(1),
  variant: z.enum(['grayscale', 'colored']).optional(),
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
  webhookUrl: z.url().optional(),
  consentText: z.string().optional(),
  eventName: z.enum([
    'Lead',
    'Contact',
    'FormSubmit',
    'WhatsAppClick',
    'TelegramClick',
    'LineClick',
    'PhoneClick',
    'EmailClick',
    'ScheduleClick',
    'QuoteRequest',
  ]).optional(),
}).strict();

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
  title: NonEmpty,
  description: NonEmpty,
  canonicalUrl: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  robots: z.enum(['index,follow', 'noindex,nofollow']).optional(),
  generatedAt: z.string().optional(),
  jsonLd: z.object({
    organization: z.boolean().optional(),
    faqPage: z.boolean().optional(),
    localBusiness: z.boolean().optional(),
    service: z.boolean().optional(),
    contactPoint: z.boolean().optional(),
  }).strict().optional(),
});

const PixelEventSchema = z.object({
  trigger: z.enum(['page_view', 'cta_click', 'block_in_view', 'form_submit', 'time_on_page']),
  name: z.enum([
    'Lead',
    'Contact',
    'FormSubmit',
    'WhatsAppClick',
    'TelegramClick',
    'LineClick',
    'PhoneClick',
    'EmailClick',
    'ScheduleClick',
    'QuoteRequest',
  ]),
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
  block('LogoWall', LogoWallSchemaZ),
  block('AuthorityStory', AuthoritySchemaZ),
  block('FAQ', FAQSchemaZ),
  block('Countdown', CountdownSchemaZ),
  block('Assurance', AssuranceSchemaZ),
]);

const OptionalBlockSchema = z.discriminatedUnion('type', [
  block('Features', FeaturesSchemaZ),
  block('Reviews', ReviewsSchemaZ),
  block('TrustBanner', TrustBannerSchemaZ),
  block('LogoWall', LogoWallSchemaZ),
  block('AuthorityStory', AuthoritySchemaZ),
  block('FAQ', FAQSchemaZ),
  block('Countdown', CountdownSchemaZ),
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
  primaryConversion: PrimaryConversionSchema.optional(),
  hero: HeroSchemaZ,
  offer: OfferSchemaZ.optional(),
  howItWorks: HowItWorksSchemaZ.optional(),
  footer: MicroFooterSchemaZ,
  upperBlocks: z.array(OptionalBlockSchema),
  afterOffer: z.array(OptionalBlockSchema).optional(),
  lowerBlocks: z.array(OptionalBlockSchema),
  leadForm: LeadFormSchemaZ.optional(),
  stickyCta: StickyCtaConfigSchema.optional(),
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
