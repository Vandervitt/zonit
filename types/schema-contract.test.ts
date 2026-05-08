import type { LandingPageTemplate, OptionalBlockType } from './schema';

// @ts-expect-error offer entries are consultation paths, not pricing tiers.
import type { OfferTier } from './schema';

const primaryConversionTemplate: Partial<LandingPageTemplate> = {
  primaryConversion: {
    channel: 'whatsapp',
    label: 'Chat on WhatsApp',
    destination: { type: 'url', url: 'https://wa.me/1234567890' },
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

// @ts-expect-error LeadForm is a single page-level lead capture, not a movable optional block.
const optionalLeadForm: OptionalBlockType = 'LeadForm';

void optionalLeadForm;

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

void (null as unknown as OfferTier);
