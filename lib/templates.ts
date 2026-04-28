import type { LandingPageTemplate } from '@/types/schema';

export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  accentColor: string;
  gradient: string;
  data: LandingPageTemplate;
}

export function getDefaultBlockData(type: string) {
  const defaults: Record<string, unknown> = {
    Features: {
      title: 'Our Features', subtitle: 'What makes us different', layout: 'grid',
      items: [
        { id: crypto.randomUUID(), icon: 'Star', title: 'Feature One', description: 'Describe this feature briefly.' },
        { id: crypto.randomUUID(), icon: 'Shield', title: 'Feature Two', description: 'Describe this feature briefly.' },
      ],
    },
    Reviews: {
      title: 'Customer Reviews', subtitle: 'Hear from our happy customers', averageRating: 5, totalReviews: '100+',
      items: [
        { id: crypto.randomUUID(), authorName: 'Happy Customer', authorRole: 'Verified Buyer', rating: 5, content: 'Great product, highly recommended!' },
      ],
    },
    TrustBanner: {
      theme: 'light',
      badges: [
        { id: crypto.randomUUID(), icon: 'Shield', text: 'Secure' },
        { id: crypto.randomUUID(), icon: 'Star', text: 'Top Rated' },
        { id: crypto.randomUUID(), icon: 'Check', text: 'Verified' },
      ],
    },
    AuthorityStory: {
      title: 'About Us', subtitle: 'Our story and expertise',
      paragraphs: ['We are passionate about delivering exceptional value to our customers.'],
      image: { src: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80', alt: 'Our team' },
      stats: [{ label: 'Years Exp', value: '10+' }, { label: 'Clients', value: '500+' }],
    },
    FAQ: {
      title: 'Frequently Asked Questions',
      items: [
        { id: crypto.randomUUID(), question: 'How do I get started?', answer: 'Simply reach out to us via the contact button and our team will guide you.' },
        { id: crypto.randomUUID(), question: 'Is there a free trial?', answer: 'Yes! We offer a risk-free trial period for new customers.' },
      ],
    },
  };
  return defaults[type] || {};
}
