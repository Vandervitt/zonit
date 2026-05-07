// 给 E2E 用的最小可用 LandingPageTemplate 构造器：4 个必填模块 + 自由拼接 OptionalBlock。

import type { LandingPageTemplate, OptionalBlock } from '@/types/schema';

export function makeBaseTemplate(overrides: Partial<LandingPageTemplate> = {}): LandingPageTemplate {
  return {
    templateId: 'e2e-template',
    templateName: 'E2E Fixture',
    themeConfig: { mode: 'light', primaryColor: '#2563eb' },
    hero: {
      title: 'E2E Hero',
      subtitle: 'Sub',
      background: { type: 'color', value: '#f8fafc' },
      cta: { text: 'Buy', url: 'https://example.com/buy', channel: 'external' },
    },
    bundles: {
      title: 'Pricing',
      tiers: [
        {
          id: 'tier-basic', name: 'Basic', price: '$29', description: 'Entry tier',
          features: ['Feature A'], currency: 'USD',
          cta: { text: 'Pick Basic', url: 'https://example.com/basic' },
        },
        {
          id: 'tier-pro', name: 'Pro', price: '$99', description: 'Recommended tier',
          features: ['Feature A', 'Feature B'], currency: 'USD', isRecommended: true,
          image: 'https://example.com/pro.png',
          cta: { text: 'Pick Pro', url: 'https://example.com/pro' },
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
        { id: 'q1', question: 'Does it ship worldwide?', answer: 'Yes, to 50+ countries.' },
        { id: 'q2', question: 'Refund policy?', answer: '30-day money back.' },
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
      averageRating: 4.8,
      ratingSummary: { average: 4.8, scale: 5, totalLabel: 'Based on 245 reviews' },
      items: [
        { id: 'r1', authorName: 'Alice', rating: 5, content: 'Loved it', reviewDate: '2025-12-01' },
        { id: 'r2', authorName: 'Bob', rating: 4, content: 'Solid product' },
      ],
    },
  };
}

export function videoTestimonialsBlock(): OptionalBlock {
  return {
    id: 'block-video',
    type: 'VideoTestimonials',
    data: {
      title: 'Video Stories',
      items: [
        {
          id: 'v1', authorName: 'Carol',
          videoUrl: 'https://example.com/v.mp4',
          poster: 'https://example.com/p.jpg',
          quote: 'Changed my life',
        },
      ],
    },
  };
}

export function paymentBadgesBlock(): OptionalBlock {
  return {
    id: 'block-payment',
    type: 'PaymentTrust',
    data: {
      title: 'Secure Payment Methods',
      secureNote: 'SSL encrypted',
      badges: [
        { id: 'p1', provider: 'visa', label: 'Visa' },
        { id: 'p2', provider: 'cod', label: 'Cash on Delivery' },
      ],
    },
  };
}

export function shippingInfoBlock(): OptionalBlock {
  return {
    id: 'block-shipping',
    type: 'ShippingInfo',
    data: {
      title: 'Shipping & Returns',
      estimatedDelivery: 'Order today, get it within 7 days',
      items: [
        { id: 's1', icon: 'Truck', title: 'Worldwide Shipping', description: 'Free over $50' },
      ],
    },
  };
}
