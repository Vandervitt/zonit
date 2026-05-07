// 给 E2E 用的最小可用 LandingPageTemplate 构造器：核心模块 + 自由拼接 OptionalBlock。

import type { LandingPageTemplate, LeadFormSchema, OptionalBlock } from '@/types/schema';

export function makeBaseTemplate(overrides: Partial<LandingPageTemplate> = {}): LandingPageTemplate {
  return {
    templateId: 'e2e-template',
    templateName: 'E2E Fixture',
    themeConfig: { mode: 'light', primaryColor: '#2563eb' },
    hero: {
      title: 'E2E Hero',
      subtitle: 'Sub',
      background: { type: 'color', value: '#f8fafc' },
      cta: { text: 'Contact Us', url: 'https://example.com/contact', channel: 'external' },
    },
    offer: {
      title: 'Consultation Options',
      showImages: true,
      options: [
        {
          id: 'tier-basic', name: 'Basic Consultation', labelText: 'Free Quote', description: 'Entry consultation',
          valueProps: ['Feature A'],
          cta: { text: 'Request Info', url: 'https://example.com/basic' },
        },
        {
          id: 'tier-pro', name: 'Priority Consultation', labelText: 'Book Call', description: 'Recommended consultation',
          valueProps: ['Feature A', 'Feature B'], isRecommended: true,
          image: 'https://example.com/pro.png',
          cta: { text: 'Book a Call', url: 'https://example.com/pro' },
        },
      ],
    },
    howItWorks: {
      title: 'How',
      steps: [{ id: 's1', icon: 'Check', title: 'Step 1', description: 'Do this' }],
    },
    footer: {
      brandName: 'E2E Brand',
      copyrightYear: '2026',
      contactEmail: 'hello@e2e.test',
      links: [{ text: 'Privacy', url: '/privacy' }],
    },
    upperBlocks: [],
    lowerBlocks: [],
    ...overrides,
  };
}

export function faqBlock(): OptionalBlock {
  return {
    id: 'block-faq',
    type: 'FAQ',
    data: {
      title: 'Frequently Asked Questions',
      items: [
        { id: 'q1', question: 'Do you support clients worldwide?', answer: 'Yes, we can consult with clients in multiple regions.' },
        { id: 'q2', question: 'How do I get started?', answer: 'Send an inquiry and our team will follow up.' },
      ],
    },
  };
}

export function reviewsBlock(): OptionalBlock {
  return {
    id: 'block-reviews',
    type: 'Reviews',
    data: {
      title: 'Customer Reviews',
      ratingSummary: { average: 4.8, scale: 5, totalLabel: 'Based on 245 reviews' },
      items: [
        { id: 'r1', authorName: 'Alice', rating: 5, content: 'Loved it', reviewDate: '2025-12-01' },
        { id: 'r2', authorName: 'Bob', rating: 4, content: 'Helpful consultation' },
      ],
    },
  };
}

export function leadFormFixture(): LeadFormSchema {
  return {
    title: 'Get a Free Quote',
    fields: [
      { id: 'f1', name: 'name', label: 'Full Name', type: 'text', required: true },
      { id: 'f2', name: 'email', label: 'Email', type: 'email', required: true },
    ],
    submitText: 'Send Request',
    webhookUrl: 'https://hooks.example.com/lead',
  };
}
