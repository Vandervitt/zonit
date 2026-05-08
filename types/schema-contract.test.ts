import type { FooterLink, HeroSchema, LandingPageTemplate, OfferSchema, OptionalBlockType, ReviewsSchema, SeoMeta } from './schema';

// @ts-expect-error offer entries are options, not pricing tiers.
import type { OfferTier } from './schema';

const seoWithoutJsonLd: SeoMeta = {
  title: 'Lead generation page',
  description: 'Contact our team for a consultation.',
};

void seoWithoutJsonLd;

const seoWithJsonLdSwitches: SeoMeta = {
  title: 'Old SEO Shape',
  description: 'JSON-LD switches are derived by the renderer now.',
  // @ts-expect-error JSON-LD switches are renderer inference, not content schema.
  jsonLd: { organization: true, faqPage: true },
};

void seoWithJsonLdSwitches;

// @ts-expect-error LeadForm is a single page-level lead capture, not a movable optional block.
const optionalLeadForm: OptionalBlockType = 'LeadForm';

void optionalLeadForm;

const rootLeadFormTemplate: Partial<LandingPageTemplate> = {
  leadForm: {
    title: 'Get a Free Consultation',
    fields: [
      { id: 'name', name: 'name', label: 'Full Name', type: 'text', required: true },
      { id: 'email', name: 'email', label: 'Email', type: 'email', required: true },
    ],
    submitText: 'Send Inquiry',
  },
};

void rootLeadFormTemplate;

const leadFormWithWebhook: Partial<LandingPageTemplate> = {
  leadForm: {
    title: 'Old Webhook Shape',
    fields: [
      { id: 'name', name: 'name', label: 'Full Name', type: 'text' },
    ],
    submitText: 'Send Inquiry',
    // @ts-expect-error MVP lead forms submit to the platform API, not arbitrary third-party webhooks.
    webhookUrl: 'https://hooks.example.com/lead',
  },
};

void leadFormWithWebhook;

const primaryConversionTemplate: Partial<LandingPageTemplate> = {
  primaryConversion: {
    channel: 'whatsapp',
    label: 'Chat on WhatsApp',
    url: 'https://wa.me/1234567890',
    prefilledMessage: 'I would like a consultation.',
  },
};

void primaryConversionTemplate;

const primaryConversionWithoutLabel: Partial<LandingPageTemplate> = {
  primaryConversion: {
    channel: 'form',
    // @ts-expect-error primaryConversion keeps a user-facing label as the page conversion anchor.
    action: 'open_form',
  },
};

void primaryConversionWithoutLabel;

const minimalLandingPageTemplate: LandingPageTemplate = {
  templateId: 'minimal-lead-page',
  templateName: 'Minimal Lead Page',
  themeConfig: { mode: 'light', primaryColor: '#2563eb' },
  hero: {
    title: 'Book a Free Consultation',
    subtitle: 'Talk with our team before making any decision.',
    background: { type: 'color', value: '#ffffff' },
    cta: { text: 'Contact Us', channel: 'form' },
  },
  footer: {
    brandName: 'Zonit',
    copyrightYear: '2026',
    links: [{ text: 'Privacy Policy', content: 'We only use contact details to respond to inquiries.' }],
  },
  blocks: [],
};

void minimalLandingPageTemplate;

const heroWithStats: HeroSchema = {
  title: 'Trusted Consultation',
  subtitle: 'Fast human response for overseas clients.',
  background: { type: 'image', value: '/hero.jpg' },
  cta: { text: 'Chat on WhatsApp', channel: 'whatsapp' },
  stats: [
    { id: 'rating', value: '4.9/5', label: 'Client rating', icon: 'Star' },
    { id: 'support', label: '24/7 Human Support', icon: 'MessageCircle' },
  ],
};

void heroWithStats;

const heroWithLegacyHighlights: HeroSchema = {
  title: 'Old Shape',
  subtitle: 'Old split hero trust fields.',
  background: { type: 'color', value: '#ffffff' },
  cta: { text: 'Contact Us' },
  // @ts-expect-error highlights/proofPoints were merged into stats.
  highlights: [],
};

void heroWithLegacyHighlights;

const heroWithInlineCountdown: HeroSchema = {
  title: 'Old Countdown Shape',
  subtitle: 'Countdowns now live in optional blocks.',
  background: { type: 'color', value: '#ffffff' },
  cta: { text: 'Contact Us' },
  // @ts-expect-error hero countdown duplicates the standalone Countdown block.
  countdown: {
    endsAt: '2026-12-31T23:59:59+08:00',
  },
};

void heroWithInlineCountdown;

const inlineComplianceLink: FooterLink = {
  text: 'Privacy Policy',
  content: 'We only use submitted contact details to respond to inquiries.',
};

void inlineComplianceLink;

const leadGenerationOffer: OfferSchema = {
  title: 'Choose a Consultation Path',
  showImages: false,
  options: [
    {
      id: 'quick-chat',
      name: 'Quick Chat',
      description: 'Talk with our team before booking.',
      valueProps: ['Human response', 'No checkout required'],
      cta: { text: 'Contact Us', url: 'https://wa.me/1234567890' },
    },
  ],
};

void leadGenerationOffer;

const tieredOffer: OfferSchema = {
  title: 'Old Shape',
  // @ts-expect-error OfferSchema no longer exposes ecommerce/SaaS tier language.
  tiers: [],
};

void tieredOffer;

const reviewsWithSummary: ReviewsSchema = {
  title: 'Client Reviews',
  ratingSummary: {
    average: 4.9,
    scale: 5,
    totalLabel: 'Based on 248 reviews',
  },
  items: [
    { id: 'review-1', authorName: 'Verified Client', rating: 5, content: 'The team responded quickly.' },
  ],
};

void reviewsWithSummary;

const reviewsWithVideoProof: ReviewsSchema = {
  title: 'Client Reviews',
  items: [
    {
      id: 'review-1',
      authorName: 'Verified Client',
      rating: 5,
      content: 'The team responded quickly.',
      proofVideo: 'https://example.com/testimonial.mp4',
    },
  ],
};

void reviewsWithVideoProof;

const reviewsWithAverageRating: ReviewsSchema = {
  title: 'Client Reviews',
  // @ts-expect-error rating summary must stay grouped; do not reintroduce top-level averageRating.
  averageRating: 4.9,
  items: [
    { id: 'review-1', authorName: 'Verified Client', rating: 5, content: 'The team responded quickly.' },
  ],
};

void reviewsWithAverageRating;

const reviewsWithVerifiedFlag: ReviewsSchema = {
  title: 'Client Reviews',
  items: [
    {
      id: 'review-1',
      authorName: 'Client',
      rating: 5,
      content: 'The team responded quickly.',
      // @ts-expect-error verified needs a real verification mechanism and is out of MVP schema.
      verified: true,
    },
  ],
};

void reviewsWithVerifiedFlag;

const reviewsWithTotalReviews: ReviewsSchema = {
  title: 'Client Reviews',
  // @ts-expect-error total review copy belongs in ratingSummary.totalLabel.
  totalReviews: '248 reviews',
  items: [
    { id: 'review-1', authorName: 'Verified Client', rating: 5, content: 'The team responded quickly.' },
  ],
};

void reviewsWithTotalReviews;

void (null as unknown as OfferTier);
