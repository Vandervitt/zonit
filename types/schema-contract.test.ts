import type { LandingPageTemplate, OptionalBlockType, SeoMeta } from './schema';

// Landing pages are lead-generation pages. Do not allow arbitrary JSON-LD
// that can reintroduce Product/Offer/price transaction schema.
const leadGenerationJsonLd: SeoMeta['jsonLd'] = {
  organization: true,
  faqPage: true,
  autoDerive: true,
  deriveReviews: false,
};

void leadGenerationJsonLd;

// @ts-expect-error custom JSON-LD is out of scope for the MVP landing-page schema.
const arbitraryJsonLd: SeoMeta['jsonLd'] = { custom: [{ '@type': 'Product' }] };

void arbitraryJsonLd;

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
