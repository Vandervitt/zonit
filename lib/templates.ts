import type { CSSProperties } from "react";
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

export function heroBackgroundStyle(tpl: PresetTemplate | undefined): CSSProperties {
  const bg = tpl?.data?.hero?.background;
  if (!bg) return {};
  if (bg.type === "image") return { backgroundImage: `url(${bg.value})`, backgroundSize: "cover", backgroundPosition: "center" };
  if (bg.type === "color") return { backgroundColor: bg.value };
  return {};
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
      title: 'Client Reviews', subtitle: 'Hear from people who contacted us', averageRating: 5, totalReviews: '100+',
      items: [
        { id: crypto.randomUUID(), authorName: 'Happy Client', authorRole: 'Verified Client', rating: 5, content: 'The team responded quickly and guided me through the next step.' },
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
    Countdown: {
      title: 'Limited-Time Offer',
      subtitle: 'Consultation slots are limited this week',
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      expiredFallback: { title: 'Offer Ended', subtitle: 'Stay tuned for the next campaign' },
      variant: 'section',
    },
    LeadForm: {
      title: 'Get a Free Quote',
      subtitle: 'Tell us about your needs and we\'ll get back within 24 hours',
      submitText: 'Send Request',
      successMessage: 'Thanks! We\'ll be in touch shortly.',
      webhookUrl: 'https://hooks.example.com/lead',
      consentText: 'By submitting, you agree to our privacy policy.',
      eventName: 'lead_form_submit',
      fields: [
        { id: crypto.randomUUID(), name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Jane Doe' },
        { id: crypto.randomUUID(), name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'you@example.com' },
        { id: crypto.randomUUID(), name: 'phone', label: 'Phone (with country code)', type: 'phone', placeholder: '+1 555 000 1234' },
        { id: crypto.randomUUID(), name: 'message', label: 'How can we help?', type: 'textarea', placeholder: 'Tell us a bit about your project...' },
      ],
    },
  };
  return defaults[type] || {};
}
