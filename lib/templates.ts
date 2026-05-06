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
    Countdown: {
      title: 'Limited-Time Offer',
      subtitle: 'Special pricing ends soon — act now',
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      expiredFallback: { title: 'Offer Ended', subtitle: 'Stay tuned for the next campaign' },
      variant: 'section',
    },
    BeforeAfter: {
      title: 'Real Results',
      subtitle: 'See the transformation our customers experienced',
      variant: 'side-by-side',
      pairs: [
        {
          id: crypto.randomUUID(),
          before: { src: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80', alt: 'Before' },
          after: { src: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80', alt: 'After' },
          caption: 'After 12 weeks',
        },
      ],
      disclaimer: 'Results may vary from person to person.',
    },
    LeadForm: {
      title: 'Get a Free Quote',
      subtitle: 'Tell us about your needs and we\'ll get back within 24 hours',
      submitText: 'Send Request',
      successMessage: 'Thanks! We\'ll be in touch shortly.',
      consentText: 'By submitting, you agree to our privacy policy.',
      eventName: 'lead_form_submit',
      fields: [
        { id: crypto.randomUUID(), name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Jane Doe' },
        { id: crypto.randomUUID(), name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'you@example.com' },
        { id: crypto.randomUUID(), name: 'phone', label: 'Phone (with country code)', type: 'phone', placeholder: '+1 555 000 1234' },
        { id: crypto.randomUUID(), name: 'message', label: 'How can we help?', type: 'textarea', placeholder: 'Tell us a bit about your project...' },
      ],
    },
    MediaLogos: {
      title: 'As Featured In',
      variant: 'mono',
      logos: [
        { id: crypto.randomUUID(), name: 'Forbes', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Forbes_logo.svg/320px-Forbes_logo.svg.png' },
        { id: crypto.randomUUID(), name: 'TechCrunch', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/TechCrunch_logo.svg/320px-TechCrunch_logo.svg.png' },
        { id: crypto.randomUUID(), name: 'Bloomberg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/New_Bloomberg_Logo.svg/320px-New_Bloomberg_Logo.svg.png' },
      ],
    },
    VideoTestimonials: {
      title: 'Hear From Our Customers',
      subtitle: 'Real stories from verified buyers',
      variant: 'carousel',
      items: [
        {
          id: crypto.randomUUID(),
          authorName: 'Sarah M.',
          authorRole: 'Verified Buyer',
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          poster: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
          duration: '0:45',
          quote: 'Honestly the best decision I\'ve made this year.',
          country: 'United States',
        },
      ],
    },
    PaymentBadges: {
      title: 'Secure Payment Methods',
      secureNote: 'SSL encrypted · PCI-DSS compliant',
      badges: [
        { id: crypto.randomUUID(), provider: 'visa', label: 'Visa' },
        { id: crypto.randomUUID(), provider: 'mastercard', label: 'Mastercard' },
        { id: crypto.randomUUID(), provider: 'paypal', label: 'PayPal' },
        { id: crypto.randomUUID(), provider: 'cod', label: 'Cash on Delivery' },
      ],
    },
    ShippingInfo: {
      title: 'Shipping & Returns',
      estimatedDelivery: 'Order today, get it within 7-14 business days',
      items: [
        { id: crypto.randomUUID(), icon: 'Truck', title: 'Worldwide Shipping', description: 'Free over $50 · 7-14 days' },
        { id: crypto.randomUUID(), icon: 'Shield', title: 'Customs Covered', description: 'No surprise fees on delivery' },
        { id: crypto.randomUUID(), icon: 'RotateCcw', title: 'Easy Returns', description: '30-day no-question returns' },
      ],
    },
    Guarantee: {
      title: 'Risk-Free Guarantee',
      subtitle: 'Try it with complete confidence',
      description: 'If you\'re not 100% satisfied within 30 days, we\'ll refund every penny — no questions asked.',
      badges: [
        { id: crypto.randomUUID(), icon: 'Shield', text: '30-Day Money Back', subtext: 'Full refund guaranteed' },
        { id: crypto.randomUUID(), icon: 'RotateCcw', text: 'Free Returns', subtext: 'On all orders' },
        { id: crypto.randomUUID(), icon: 'Check', text: 'Secure Checkout', subtext: 'SSL encrypted' },
      ],
    },
  };
  return defaults[type] || {};
}
