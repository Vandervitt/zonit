import type { FooterLink, HeroSchema, LandingPageTemplate, OfferSchema, OptionalBlockType, ReviewsSchema, SeoMeta } from './schema';

// @ts-expect-error offer entries are options, not pricing tiers.
import type { OfferTier } from './schema';

// Landing pages are lead-generation pages. Do not allow arbitrary JSON-LD
// that can reintroduce Product/Offer/price transaction schema.
const leadGenerationJsonLd: SeoMeta['jsonLd'] = {
  organization: true,
  faqPage: true,
};

void leadGenerationJsonLd;

// @ts-expect-error custom JSON-LD is out of scope for the MVP landing-page schema.
const arbitraryJsonLd: SeoMeta['jsonLd'] = { custom: [{ '@type': 'Product' }] };

void arbitraryJsonLd;

// @ts-expect-error review JSON-LD is out of scope for MVP lead-generation pages.
const reviewJsonLd: SeoMeta['jsonLd'] = { deriveReviews: true };

void reviewJsonLd;

// @ts-expect-error autoDerive was removed; JSON-LD derivation is controlled by explicit node switches.
const legacyAutoDeriveJsonLd: SeoMeta['jsonLd'] = { autoDerive: true };

void legacyAutoDeriveJsonLd;

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

const minimalLandingPageTemplate: LandingPageTemplate = {
  templateId: 'minimal-lead-page',
  templateName: 'Minimal Lead Page',
  themeConfig: { mode: 'light', primaryColor: '#2563eb' },
  hero: {
    title: 'Book a Free Consultation',
    subtitle: 'Talk with our team before making any decision.',
    background: { type: 'color', value: '#ffffff' },
    cta: { text: 'Contact Us', action: 'open_form', channel: 'form' },
  },
  footer: {
    brandName: 'Zonit',
    copyrightYear: '2026',
    links: [{ text: 'Privacy Policy', content: 'We only use contact details to respond to inquiries.' }],
  },
  upperBlocks: [],
  lowerBlocks: [],
};

void minimalLandingPageTemplate;

const heroWithStats: HeroSchema = {
  title: 'Trusted Consultation',
  subtitle: 'Fast human response for overseas clients.',
  background: { type: 'image', value: '/hero.jpg' },
  cta: { text: 'Chat on WhatsApp', channel: 'whatsapp', action: 'chat' },
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

const reviewsWithAverageRating: ReviewsSchema = {
  title: 'Client Reviews',
  // @ts-expect-error rating summary must stay grouped; do not reintroduce top-level averageRating.
  averageRating: 4.9,
  items: [
    { id: 'review-1', authorName: 'Verified Client', rating: 5, content: 'The team responded quickly.' },
  ],
};

void reviewsWithAverageRating;

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
