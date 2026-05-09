import type {
  BlockType,
  CallToAction,
  LandingPage,
  LandingPageTemplate,
  LandingPageTemplateV2,
  LeadMagnetSchema,
  ModuleDefinition,
  ModuleLayoutConfig,
  PageBlock,
} from './schema';
import type { ZodLandingPageTemplate } from '../lib/schema.zod';

// @ts-expect-error offer entries are consultation paths, not pricing tiers.
import type { OfferTier } from './schema';

const primaryConversionTemplate: Partial<LandingPageTemplate> = {
  primaryConversion: {
    channel: 'whatsapp',
    label: 'Chat on WhatsApp',
    destination: { type: 'whatsapp', url: 'https://wa.me/1234567890' },
    prefilledMessage: 'I would like a consultation.',
  },
};

void primaryConversionTemplate;

const primaryConversionWithLegacyUrl: Partial<LandingPageTemplate> = {
  primaryConversion: {
    channel: 'whatsapp',
    label: 'Chat on WhatsApp',
    // @ts-expect-error primaryConversion must use an explicit destination, not a loose url.
    url: 'https://wa.me/1234567890',
  },
};

void primaryConversionWithLegacyUrl;

const primaryConversionWithMismatchedDestination: Partial<LandingPageTemplate> = {
  primaryConversion: {
    channel: 'whatsapp',
    label: 'Chat on WhatsApp',
    // @ts-expect-error primaryConversion channel and destination must describe the same lead path.
    destination: { type: 'email', email: 'hello@example.com' },
  },
};

void primaryConversionWithMismatchedDestination;

const ctaWithDestination: CallToAction = {
  text: 'Chat on WhatsApp',
  channel: 'whatsapp',
  destination: { type: 'whatsapp', url: 'https://wa.me/1234567890' },
};

void ctaWithDestination;

const ctaWithLooseUrl: CallToAction = {
  text: 'Chat on WhatsApp',
  channel: 'whatsapp',
  // @ts-expect-error CTAs must use destination, not a loose optional url.
  url: 'https://wa.me/1234567890',
};

void ctaWithLooseUrl;

const ctaWithMismatchedDestination: CallToAction = {
  text: 'Chat on WhatsApp',
  channel: 'whatsapp',
  // @ts-expect-error CTA channel and destination must describe the same lead path.
  destination: { type: 'email', email: 'hello@example.com' },
};

void ctaWithMismatchedDestination;

// @ts-expect-error LeadForm is a single page-level lead capture, not a movable optional block.
const optionalLeadForm: BlockType = 'LeadForm';

void optionalLeadForm;

// @ts-expect-error visual attraction blocks stay consultation-oriented, not product showcase blocks.
const productShowcaseBlock: BlockType = 'ProductShowcase';

void productShowcaseBlock;

const leadMagnetBlock: PageBlock = {
  id: 'lead-magnet',
  type: 'LeadMagnet',
  data: {
    title: 'Get a Free Skin Assessment',
    subtitle: 'Share your concern and receive a personalized next-step suggestion.',
    incentive: 'Personalized consultation summary',
    valueProps: ['No payment required', 'Human reply within 10 minutes'],
    cta: {
      text: 'Start Assessment',
      channel: 'form',
      destination: { type: 'form', formId: 'lead-form' },
    },
  },
};

void leadMagnetBlock;

const leadMagnetWithRendererClass: LeadMagnetSchema = {
  title: 'Get a Free Skin Assessment',
  incentive: 'Personalized consultation summary',
  valueProps: ['No payment required'],
  cta: {
    text: 'Start Assessment',
    channel: 'form',
    destination: { type: 'form', formId: 'lead-form' },
  },
  // @ts-expect-error schema describes marketing content, not renderer CSS classes.
  className: 'rounded-2xl bg-white',
};

void leadMagnetWithRendererClass;

const consultationLinkCta: CallToAction = {
  text: 'Request Consultation',
  channel: 'consultation_link',
  destination: { type: 'consultation_link', url: 'https://example.com/contact' },
};

void consultationLinkCta;

const legacyContactLinkCta: CallToAction = {
  text: 'Contact Us',
  // @ts-expect-error use consultation_link for lead-oriented contact pages, not the loose legacy contact_link channel.
  channel: 'contact_link',
  // @ts-expect-error use consultation_link for lead-oriented contact pages, not the loose legacy contact_link destination.
  destination: { type: 'contact_link', url: 'https://example.com/contact' },
};

void legacyContactLinkCta;

const landingPageWithoutTemplateMetadata: LandingPage = {
  primaryConversion: {
    channel: 'email',
    label: 'Email Us',
    destination: { type: 'email', email: 'hello@example.com' },
  },
  hero: {
    title: 'Lead Page',
    subtitle: 'Book a consultation.',
    background: { type: 'color', value: '#ffffff' },
    cta: {
      text: 'Email Us',
      channel: 'email',
      destination: { type: 'email', email: 'hello@example.com' },
    },
  },
  footer: {
    brandName: 'Lead Brand',
    copyrightYear: '2026',
    links: [{ text: 'Privacy Policy', content: 'Privacy policy content.' }],
  },
};

void landingPageWithoutTemplateMetadata;

const rootLeadFormTemplate: Partial<LandingPageTemplate> = {
  leadForm: {
    id: 'lead-form',
    title: 'Get a Free Consultation',
    submitText: 'Send Inquiry',
    requiredFields: ['name', 'email'],
    includeMessage: true,
  },
};

void rootLeadFormTemplate;

const leadFormWithoutContactField: Partial<LandingPageTemplate> = {
  leadForm: {
    id: 'lead-form',
    title: 'Incomplete Lead Form',
    submitText: 'Send Inquiry',
    // @ts-expect-error lead forms must request at least one real contact field.
    requiredFields: ['name'],
  },
};

void leadFormWithoutContactField;

const zodLeadFormExtraFieldWithPayloadKey: Partial<ZodLandingPageTemplate> = {
  leadForm: {
    id: 'lead-form',
    title: 'Get a Free Consultation',
    submitText: 'Send Inquiry',
    requiredFields: ['name', 'email'],
    extraFields: [{
      id: 'budget',
      fieldKey: 'budget_range',
      label: 'Budget range',
      type: 'select',
      options: [{ label: '$1k - $5k', value: '1k_5k' }],
    }],
  },
};

void zodLeadFormExtraFieldWithPayloadKey;

const editableTemplateV2: LandingPageTemplateV2 = {
  templateId: 'lead-gen-v2',
  templateName: 'Lead Gen V2',
  version: 2,
  pageMeta: { locale: 'en-US' },
  primaryConversion: {
    channel: 'form',
    label: 'Request Consultation',
    destination: { type: 'form', formId: 'lead-form' },
  },
  modules: [
    { id: 'hero', type: 'Hero', contentKey: 'hero', enabled: true, variant: 'split' },
    { id: 'proof', type: 'Reviews', contentKey: 'proof', enabled: true, variant: 'cards' },
    { id: 'leadForm', type: 'LeadForm', contentKey: 'leadForm', enabled: true },
    { id: 'footer', type: 'MicroFooter', contentKey: 'footer', enabled: true },
  ],
  content: {
    hero: {
      title: 'Lead Page',
      subtitle: 'Book a consultation.',
      background: { type: 'color', value: '#ffffff' },
      cta: {
        text: 'Request Consultation',
        channel: 'form',
        destination: { type: 'form', formId: 'lead-form' },
      },
    },
    proof: {
      title: 'Client Reviews',
      items: [{ id: 'review-1', authorName: 'Client', rating: 5, content: 'Fast response.' }],
    },
    leadForm: {
      id: 'lead-form',
      title: 'Get a Free Consultation',
      submitText: 'Send Inquiry',
      requiredFields: ['name', 'email'],
    },
    footer: {
      brandName: 'Lead Brand',
      copyrightYear: '2026',
      links: [{ text: 'Privacy Policy', content: 'Privacy policy content.' }],
    },
  },
  design: {
    mode: 'light',
    palette: {
      primary: '#2563eb',
      accent: '#f97316',
    },
    typography: { family: 'sans' },
    radius: 'md',
    density: 'normal',
    buttonStyle: 'solid',
    imageStyle: 'rounded',
  },
  layout: {
    hero: { alignment: 'left', mediaPosition: 'right', height: 'large' },
    proof: { columns: 3, cardStyle: 'bordered' },
  },
  integrations: {
    leadFormId: 'lead-form',
  },
};

void editableTemplateV2;

const moduleWithRendererClass: ModuleDefinition = {
  id: 'hero',
  type: 'Hero',
  contentKey: 'hero',
  enabled: true,
  // @ts-expect-error modules expose controlled variants, not renderer CSS classes.
  className: 'grid grid-cols-2',
};

void moduleWithRendererClass;

const layoutWithRendererClass: ModuleLayoutConfig = {
  alignment: 'center',
  // @ts-expect-error layout exposes controlled options, not Tailwind class strings.
  className: 'px-8 py-24',
};

void layoutWithRendererClass;

void (null as unknown as OfferTier);
