import { z } from 'zod';

const NonEmpty = z.string().min(1);
const TransactionUrlPattern = /(?:^|[/?#&=_-])(payment|checkout|cart|order|subscription|refund|cash-on-delivery|cod)(?:$|[/?#&=_-])/i;

const LeadUrl = NonEmpty.refine(value => !TransactionUrlPattern.test(value), {
  message: 'Lead-generation URLs must not point to payment, checkout, cart, order, subscription, refund, or COD paths.',
});

const CallToActionBaseSchema = z.object({
  text: NonEmpty,
  icon: z.string().optional(),
  target: z.enum(['_self', '_blank']).optional(),
  prefilledMessage: z.string().optional(),
  tracking: z.object({
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
    label: z.string().optional(),
  }).optional(),
});

const leadAction = <TChannel extends string, TDestination extends z.ZodTypeAny>(
  channel: TChannel,
  destination: TDestination,
) => CallToActionBaseSchema.extend({
  channel: z.literal(channel),
  destination,
}).strict();

const CallToActionSchema = z.union([
  leadAction('whatsapp', z.object({ type: z.literal('whatsapp'), url: LeadUrl }).strict()),
  leadAction('telegram', z.object({ type: z.literal('telegram'), url: LeadUrl }).strict()),
  leadAction('line', z.object({ type: z.literal('line'), url: LeadUrl }).strict()),
  leadAction('booking', z.object({ type: z.literal('booking'), url: LeadUrl }).strict()),
  leadAction('consultation_link', z.object({ type: z.literal('consultation_link'), url: LeadUrl }).strict()),
  leadAction('phone', z.object({ type: z.literal('phone'), phone: NonEmpty }).strict()),
  leadAction('email', z.object({ type: z.literal('email'), email: NonEmpty }).strict()),
  leadAction('form', z.object({ type: z.literal('form'), formId: NonEmpty }).strict()),
]);

const primaryConversion = <TChannel extends string, TDestination extends z.ZodTypeAny>(
  channel: TChannel,
  destination: TDestination,
) => z.object({
  channel: z.literal(channel),
  label: NonEmpty,
  destination,
  prefilledMessage: z.string().optional(),
}).strict();

const PrimaryConversionSchema = z.union([
  primaryConversion('whatsapp', z.object({ type: z.literal('whatsapp'), url: LeadUrl }).strict()),
  primaryConversion('telegram', z.object({ type: z.literal('telegram'), url: LeadUrl }).strict()),
  primaryConversion('line', z.object({ type: z.literal('line'), url: LeadUrl }).strict()),
  primaryConversion('booking', z.object({ type: z.literal('booking'), url: LeadUrl }).strict()),
  primaryConversion('consultation_link', z.object({ type: z.literal('consultation_link'), url: LeadUrl }).strict()),
  primaryConversion('phone', z.object({ type: z.literal('phone'), phone: NonEmpty }).strict()),
  primaryConversion('email', z.object({ type: z.literal('email'), email: NonEmpty }).strict()),
  primaryConversion('form', z.object({ type: z.literal('form'), formId: NonEmpty }).strict()),
]);

const StickyCtaConfigSchema = z.intersection(CallToActionSchema, z.object({
  position: z.enum(['bottom-left', 'bottom-right']).optional(),
  showAfterScrollPercent: z.number().min(0).max(100).optional(),
}));

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
});

const HeroSchemaZ = z.object({
  badge: z.string().optional(),
  title: NonEmpty,
  subtitle: z.string(),
  background: z.object({
    type: z.enum(['image', 'color', 'video']),
    value: NonEmpty,
  }),
  cta: CallToActionSchema,
  secondaryCta: CallToActionSchema.optional(),
  trustText: z.string().optional(),
  stats: z.array(HeroStatSchema).optional(),
  media: HeroMediaSchema.optional(),
});

const OfferOptionSchema = z.object({
  id: NonEmpty,
  name: NonEmpty,
  description: z.string(),
  valueProps: z.array(z.string()),
  badge: z.string().optional(),
  image: z.string().optional(),
  urgencyText: z.string().optional(),
  cta: CallToActionSchema,
}).strict();

const ConsultationOptionsSchemaZ = z.object({
  title: NonEmpty,
  subtitle: z.string().optional(),
  options: z.array(OfferOptionSchema).min(1),
  showImages: z.boolean().optional(),
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
  url: LeadUrl.optional(),
  content: z.string().optional(),
}).refine(link => Boolean(link.url?.trim() || link.content?.trim()), {
  message: 'Footer link must include either url or content.',
  path: ['url'],
});

const FooterLinksSchema = z.array(FooterLinkSchema).min(1).transform(links => [
  links[0]!,
  ...links.slice(1),
] as [z.infer<typeof FooterLinkSchema>, ...z.infer<typeof FooterLinkSchema>[]]);

const MicroFooterSchemaZ = z.object({
  brandName: NonEmpty,
  copyrightYear: NonEmpty,
  contactEmail: z.string().optional(),
  socialLinks: z.array(z.object({
    platform: z.string(),
    url: LeadUrl,
  })).optional(),
  links: FooterLinksSchema,
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
});

const ReviewItemSchema = z.object({
  id: NonEmpty,
  authorName: NonEmpty,
  authorRole: z.string().optional(),
  avatar: z.string().optional(),
  rating: z.number().min(1).max(5),
  content: NonEmpty,
  proofImage: z.string().optional(),
  proofVideo: z.string().optional(),
  sourcePlatform: z.string().optional(),
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
}).strict();

const TrustBadgeSchema = z.object({
  id: NonEmpty,
  icon: NonEmpty,
  text: NonEmpty,
  subtext: z.string().optional(),
});

const TrustBannerSchemaZ = z.object({
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
  image: ImageMetaSchema.optional(),
  stats: z.array(z.object({ label: NonEmpty, value: NonEmpty })).optional(),
  credentials: z.array(AuthorityCredentialSchema).optional(),
  signature: z.object({ name: NonEmpty, role: NonEmpty }).optional(),
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

const LeadFormExtraFieldSchema = z.object({
  id: NonEmpty,
  name: NonEmpty,
  label: NonEmpty,
  type: z.enum(['text', 'select']),
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
  options: z.array(z.object({ label: NonEmpty, value: NonEmpty })).optional(),
});

const LeadContactFieldSchema = z.enum(['name', 'phone', 'email', 'whatsapp', 'telegram']);
const ReachableLeadContactFieldSchema = z.enum(['phone', 'email', 'whatsapp', 'telegram']);
const LeadFormRequiredFieldsSchema = z.union([
  z.tuple([ReachableLeadContactFieldSchema]).rest(LeadContactFieldSchema),
  z.tuple([z.literal('name'), ReachableLeadContactFieldSchema]).rest(LeadContactFieldSchema),
]);

const LeadFormSchemaZ = z.object({
  id: NonEmpty,
  title: NonEmpty,
  subtitle: z.string().optional(),
  submitText: NonEmpty,
  successMessage: z.string().optional(),
  requiredFields: LeadFormRequiredFieldsSchema,
  optionalFields: z.array(LeadContactFieldSchema).optional(),
  consentText: z.string().optional(),
  includeMessage: z.boolean().optional(),
  extraFields: z.array(LeadFormExtraFieldSchema).max(2).optional(),
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

const LandingPageSchemaBase = z.object({
  pageMeta: PageMetaSchema.optional(),
  primaryConversion: PrimaryConversionSchema,
  hero: HeroSchemaZ,
  offer: ConsultationOptionsSchemaZ.optional(),
  howItWorks: HowItWorksSchemaZ.optional(),
  footer: MicroFooterSchemaZ,
  blocks: z.array(OptionalBlockSchema).optional(),
  leadForm: LeadFormSchemaZ.optional(),
  stickyCta: StickyCtaConfigSchema.optional(),
});

type ParsedLeadAction = z.infer<typeof CallToActionSchema> | z.infer<typeof PrimaryConversionSchema>;

function formIdForAction(action: ParsedLeadAction | undefined): string | undefined {
  return action?.destination.type === 'form' ? action.destination.formId : undefined;
}

function collectFormActionIds(template: z.infer<typeof LandingPageSchemaBase>): string[] {
  const formIds = [
    formIdForAction(template.primaryConversion),
    formIdForAction(template.hero.cta),
    formIdForAction(template.hero.secondaryCta),
    formIdForAction(template.stickyCta),
    ...(template.offer?.options.map(option => formIdForAction(option.cta)) ?? []),
  ];

  for (const block of template.blocks ?? []) {
    if (block.type === 'Countdown') formIds.push(formIdForAction(block.data.cta));
    if (block.type === 'FAQ') formIds.push(formIdForAction(block.data.contactCta));
    if (block.type === 'Assurance') formIds.push(formIdForAction(block.data.cta));
  }

  return formIds.filter((formId): formId is string => Boolean(formId));
}

export const LandingPageSchema = LandingPageSchemaBase.superRefine((template, ctx) => {
  const formActionIds = collectFormActionIds(template);
  const mismatchedFormId = formActionIds.find(formId => template.leadForm?.id !== formId);

  if (mismatchedFormId) {
    ctx.addIssue({
      code: 'custom',
      path: ['leadForm'],
      message: 'Every form CTA must reference the single page lead form.',
    });
  }
});

export const LandingPageTemplateSchema = LandingPageSchema.extend({
  templateId: NonEmpty,
  templateName: NonEmpty,
  themeConfig: z.object({
    mode: z.enum(['light', 'dark']),
    primaryColor: NonEmpty,
  }),
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
export type ZodLandingPage = z.infer<typeof LandingPageSchema>;
export type ZodLandingPageTemplate = z.infer<typeof LandingPageTemplateSchema>;
