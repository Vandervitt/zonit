import type { LandingPageTemplate, OptionalBlock } from '@/types/schema';
import { TemplateId } from './constants/templates';

export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  accentColor: string;
  gradient: string;
  data: LandingPageTemplate;
}

const trustBannerBlock: OptionalBlock = {
  id: 'trust-default',
  type: 'TrustBanner',
  data: {
    theme: 'light',
    badges: [
      { id: 'b1', icon: 'Shield', text: 'Secure Payment' },
      { id: 'b2', icon: 'Truck', text: 'Fast Delivery' },
      { id: 'b3', icon: 'RotateCcw', text: '30-day Returns' },
      { id: 'b4', icon: 'Headphones', text: '24/7 Support' },
    ],
  },
};

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: TemplateId.EcommerceStarter,
    name: 'E-commerce Starter',
    description: 'Perfect for selling physical products via WhatsApp',
    category: 'E-commerce',
    accentColor: '#4f46e5',
    gradient: 'from-indigo-500 to-purple-600',
    data: {
      templateId: TemplateId.EcommerceStarter,
      templateName: 'E-commerce Starter',
      themeConfig: { mode: 'light', primaryColor: '#4f46e5' },
      hero: {
        badge: '🔥 Limited Time Offer',
        title: 'Premium Products\nDelivered to Your Door',
        subtitle: 'Shop our curated collection of premium products at unbeatable prices. Quality guaranteed.',
        background: { type: 'color', value: '#f0f4ff', overlayOpacity: 0 },
        cta: { text: 'Chat on WhatsApp', url: 'https://wa.me/1234567890', icon: 'WhatsApp', theme: 'whatsapp' },
        trustText: '✓ Free shipping on orders over $50 · No credit card required',
      },
      bundles: {
        title: 'Choose Your Bundle',
        subtitle: 'Save more when you buy more',
        tiers: [
          {
            id: 'tier-1', name: 'Starter', price: '$29', originalPrice: '$49',
            description: 'Perfect for individuals',
            features: ['1 Premium Item', 'Free Shipping', '30-day Return', 'Email Support'],
            cta: { text: 'Order via WhatsApp', url: 'https://wa.me/1234567890', icon: 'WhatsApp', theme: 'whatsapp' },
          },
          {
            id: 'tier-2', name: 'Family Pack', price: '$79', originalPrice: '$129',
            description: 'Great for families',
            features: ['3 Premium Items', 'Express Shipping', '60-day Return', 'Priority Support', 'Gift Wrapping'],
            tag: 'Most Popular',
            cta: { text: 'Order via WhatsApp', url: 'https://wa.me/1234567890', icon: 'WhatsApp', theme: 'whatsapp' },
          },
          {
            id: 'tier-3', name: 'VIP Bundle', price: '$149', originalPrice: '$249',
            description: 'The ultimate experience',
            features: ['6 Premium Items', 'Express Shipping', '90-day Return', '24/7 VIP Support', 'Gift Wrapping', 'Exclusive Card'],
            tag: 'Best Value',
            cta: { text: 'Order via WhatsApp', url: 'https://wa.me/1234567890', icon: 'WhatsApp', theme: 'whatsapp' },
          },
        ],
      },
      howItWorks: {
        title: 'How to Order',
        subtitle: 'Simple 3-step process',
        steps: [
          { id: 's1', icon: 'WhatsApp', title: 'Step 1: Chat with Us', description: 'Click the WhatsApp button to start chatting with our team.' },
          { id: 's2', icon: 'ShoppingBag', title: 'Step 2: Pick a Bundle', description: 'Choose the bundle that fits your needs and confirm your order.' },
          { id: 's3', icon: 'Truck', title: 'Step 3: Receive & Enjoy', description: 'We ship directly to your door within 3–5 business days.' },
        ],
      },
      footer: {
        brandName: 'PremiumShop',
        copyrightYear: '2025',
        contactEmail: 'support@premiumshop.com',
        links: [
          { text: 'Privacy Policy', url: '/privacy' },
          { text: 'Terms of Service', url: '/terms' },
          { text: 'Refund Policy', url: '/refund' },
        ],
      },
      upperBlocks: [
        trustBannerBlock,
        {
          id: 'features-1', type: 'Features',
          data: {
            title: 'Why Choose Us', subtitle: "We're committed to your satisfaction", layout: 'grid',
            items: [
              { id: 'f1', icon: 'Star', title: 'Premium Quality', description: 'All products are sourced from trusted manufacturers and quality-checked.' },
              { id: 'f2', icon: 'Truck', title: 'Fast Shipping', description: 'Orders processed within 24 hours and delivered in 3–5 business days.' },
              { id: 'f3', icon: 'Shield', title: 'Money-back Guarantee', description: 'Not satisfied? Get a full refund within 30 days, no questions asked.' },
              { id: 'f4', icon: 'Headphones', title: 'Expert Support', description: 'Our team is available 24/7 to help with any questions or concerns.' },
            ],
          },
        },
      ],
      lowerBlocks: [
        {
          id: 'reviews-1', type: 'Reviews',
          data: {
            title: "What Our Customers Say", subtitle: 'Join thousands of satisfied customers',
            averageRating: 4.9, totalReviews: '2,340+',
            items: [
              { id: 'r1', authorName: 'Sarah M.', authorRole: 'Verified Buyer', rating: 5, content: 'Absolutely love the quality! Fast shipping and excellent packaging.' },
              { id: 'r2', authorName: 'John D.', authorRole: 'Verified Buyer', rating: 5, content: 'The family pack was perfect for us. Great value for money!' },
              { id: 'r3', authorName: 'Emma L.', authorRole: 'VIP Member', rating: 5, content: 'Customer service is outstanding. Will definitely order again.' },
            ],
          },
        },
        {
          id: 'faq-1', type: 'FAQ',
          data: {
            title: 'Frequently Asked Questions',
            items: [
              { id: 'q1', question: 'How long does shipping take?', answer: 'Standard shipping takes 3–5 business days. Express shipping is 1–2 business days.' },
              { id: 'q2', question: 'What payment methods do you accept?', answer: 'We accept payments via WhatsApp chat, bank transfer, and major credit cards.' },
              { id: 'q3', question: 'Can I return a product?', answer: 'Yes! We offer a 30-day return policy. Contact us via WhatsApp to initiate a return.' },
            ],
            contactCta: { text: 'Still have questions? Chat with us', url: 'https://wa.me/1234567890', icon: 'WhatsApp', theme: 'whatsapp' },
          },
        },
      ],
    },
  },
  {
    id: TemplateId.ServiceBusiness,
    name: 'Service Business',
    description: 'Ideal for consultants, agencies, and local services',
    category: 'Services',
    accentColor: '#0ea5e9',
    gradient: 'from-sky-500 to-cyan-600',
    data: {
      templateId: TemplateId.ServiceBusiness,
      templateName: 'Service Business',
      themeConfig: { mode: 'light', primaryColor: '#0ea5e9' },
      hero: {
        badge: '⭐ Trusted by 500+ Clients',
        title: 'Professional Services\nYou Can Trust',
        subtitle: 'Expert solutions tailored to your needs. Get a free consultation today.',
        background: { type: 'color', value: '#f0f9ff', overlayOpacity: 0 },
        cta: { text: 'Get Free Consultation', url: 'https://wa.me/1234567890', icon: 'WhatsApp', theme: 'whatsapp' },
        trustText: '✓ No commitment required · Response within 2 hours',
      },
      bundles: {
        title: 'Our Service Packages',
        subtitle: 'Transparent pricing, no hidden fees',
        tiers: [
          {
            id: 'tier-1', name: 'Basic', price: '$199/mo', description: 'For small businesses getting started',
            features: ['Monthly Consultation', '5 Deliverables', 'Email Support', 'Monthly Report'],
            cta: { text: 'Get Started', url: 'https://wa.me/1234567890', icon: 'WhatsApp', theme: 'whatsapp' },
          },
          {
            id: 'tier-2', name: 'Professional', price: '$499/mo', description: 'For growing businesses',
            features: ['Weekly Consultations', '15 Deliverables', 'Priority Support', 'Weekly Reports', 'Strategy Sessions'],
            tag: 'Most Popular',
            cta: { text: 'Get Started', url: 'https://wa.me/1234567890', icon: 'WhatsApp', theme: 'whatsapp' },
          },
          {
            id: 'tier-3', name: 'Enterprise', price: 'Custom', description: 'Full-service for large teams',
            features: ['Daily Support', 'Unlimited Deliverables', 'Dedicated Manager', 'Custom Reports', 'On-site Visits'],
            cta: { text: 'Contact Us', url: 'https://wa.me/1234567890', icon: 'WhatsApp', theme: 'whatsapp' },
          },
        ],
      },
      howItWorks: {
        title: 'How We Work',
        subtitle: 'Simple, transparent process',
        steps: [
          { id: 's1', icon: 'MessageCircle', title: 'Free Consultation', description: 'Share your goals and challenges with our expert team.' },
          { id: 's2', icon: 'FileText', title: 'Custom Proposal', description: 'We craft a tailored strategy and send you a detailed proposal.' },
          { id: 's3', icon: 'Check', title: 'We Deliver Results', description: 'Our team executes the plan and delivers measurable outcomes.' },
        ],
      },
      footer: {
        brandName: 'ProServices Co.',
        copyrightYear: '2025',
        contactEmail: 'hello@proservices.com',
        links: [{ text: 'Privacy Policy', url: '/privacy' }, { text: 'Terms of Service', url: '/terms' }],
      },
      upperBlocks: [
        {
          id: 'authority-1', type: 'AuthorityStory',
          data: {
            title: 'Meet Our Expert Team', subtitle: '15+ years of combined experience',
            paragraphs: [
              'We are a team of seasoned professionals dedicated to delivering exceptional results for our clients.',
              'With over 500 successful projects and clients across 20+ industries, our track record speaks for itself.',
            ],
            image: { src: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80', alt: 'Our team' },
            stats: [{ label: 'Years Exp', value: '15+' }, { label: 'Clients', value: '500+' }, { label: 'Projects', value: '1,200+' }],
            signature: { name: 'Dr. Michael Chen', role: 'Founder & CEO' },
          },
        },
      ],
      lowerBlocks: [
        {
          id: 'reviews-1', type: 'Reviews',
          data: {
            title: 'Client Success Stories', averageRating: 4.8, totalReviews: '340+',
            items: [
              { id: 'r1', authorName: 'Mark T.', authorRole: 'CEO, TechCorp', rating: 5, content: 'Exceptional service! They transformed our operations and doubled our efficiency in 3 months.' },
              { id: 'r2', authorName: 'Lisa K.', authorRole: 'Marketing Director', rating: 5, content: 'Professional, responsive, and incredibly knowledgeable. Highly recommended!' },
            ],
          },
        },
        {
          id: 'faq-1', type: 'FAQ',
          data: {
            title: 'Common Questions',
            items: [
              { id: 'q1', question: 'How quickly can you start?', answer: 'We typically onboard new clients within 48 hours of signing the agreement.' },
              { id: 'q2', question: 'Do you offer a money-back guarantee?', answer: 'Yes! We offer a 14-day satisfaction guarantee. If you are not happy, we will issue a full refund.' },
            ],
          },
        },
      ],
    },
  },
  {
    id: TemplateId.CryptoTrading,
    name: 'Crypto Trading Signals',
    description: 'Built for crypto signal groups and trading communities',
    category: 'Finance',
    accentColor: '#f59e0b',
    gradient: 'from-amber-500 to-orange-600',
    data: {
      templateId: TemplateId.CryptoTrading,
      templateName: 'Crypto Trading Signals',
      themeConfig: { mode: 'dark', primaryColor: '#f59e0b' },
      hero: {
        badge: '📈 87% Win Rate This Month',
        title: 'Elite Crypto Signals\nThat Actually Win',
        subtitle: 'Join 5,000+ traders receiving daily high-accuracy signals directly on Telegram.',
        background: { type: 'color', value: '#0f172a', overlayOpacity: 0.6 },
        cta: { text: 'Join on Telegram', url: 'https://t.me/yourchannel', icon: 'Telegram', theme: 'telegram' },
        trustText: '✓ 7-day free trial · Cancel anytime · No credit card needed',
      },
      bundles: {
        title: 'Signal Packages',
        subtitle: 'Choose the plan that fits your trading style',
        tiers: [
          {
            id: 'tier-1', name: 'Basic Signals', price: '$49/mo', description: 'For beginners',
            features: ['3–5 Signals/Day', 'Spot Trading', 'Telegram Access', 'Basic Analysis'],
            cta: { text: 'Subscribe via Telegram', url: 'https://t.me/yourchannel', icon: 'Telegram', theme: 'telegram' },
          },
          {
            id: 'tier-2', name: 'VIP Signals', price: '$149/mo', description: 'For serious traders',
            features: ['10+ Signals/Day', 'Spot + Futures', 'VIP Telegram Group', 'Detailed Analysis', 'Risk Management'],
            tag: 'Most Popular',
            cta: { text: 'Subscribe via Telegram', url: 'https://t.me/yourchannel', icon: 'Telegram', theme: 'telegram' },
          },
          {
            id: 'tier-3', name: 'Elite Bundle', price: '$349/mo', description: '1-on-1 coaching included',
            features: ['Unlimited Signals', 'All Markets', 'Private Group', 'Live Sessions', 'Portfolio Review', '1-on-1 Calls'],
            tag: 'Best Value',
            cta: { text: 'Apply Now', url: 'https://t.me/yourchannel', icon: 'Telegram', theme: 'telegram' },
          },
        ],
      },
      howItWorks: {
        title: 'How to Join',
        subtitle: 'Start receiving signals in minutes',
        steps: [
          { id: 's1', icon: 'Telegram', title: 'Join Our Channel', description: 'Click the button to join our private Telegram signal group.' },
          { id: 's2', icon: 'CreditCard', title: 'Choose Your Plan', description: 'Select the signal package that matches your trading goals.' },
          { id: 's3', icon: 'TrendingUp', title: 'Start Trading', description: 'Receive real-time signals and follow our expert analysis.' },
        ],
      },
      footer: {
        brandName: 'CryptoEdge Signals',
        copyrightYear: '2025',
        contactEmail: 'support@cryptoedge.io',
        links: [{ text: 'Privacy Policy', url: '/privacy' }, { text: 'Terms of Service', url: '/terms' }],
        disclaimer: 'Trading cryptocurrencies involves significant risk. Past performance is not indicative of future results. Always trade responsibly.',
      },
      upperBlocks: [
        {
          id: 'trust-1', type: 'TrustBanner',
          data: {
            theme: 'dark',
            badges: [
              { id: 'b1', icon: 'Shield', text: '256-bit Encrypted' },
              { id: 'b2', icon: 'Users', text: '5,000+ Members' },
              { id: 'b3', icon: 'TrendingUp', text: '87% Win Rate' },
              { id: 'b4', icon: 'Clock', text: '24/7 Signals' },
            ],
          },
        },
      ],
      lowerBlocks: [
        {
          id: 'reviews-1', type: 'Reviews',
          data: {
            title: 'Trader Testimonials', subtitle: 'Real results from real traders',
            averageRating: 4.9, totalReviews: '1,200+',
            items: [
              { id: 'r1', authorName: 'Alex W.', authorRole: 'Full-time Trader', rating: 5, content: 'Made $4,200 profit in my first month following these signals. Incredible accuracy!' },
              { id: 'r2', authorName: 'Sophie R.', authorRole: 'Verified Member', rating: 5, content: 'Finally found signals I can trust. The risk management tips alone are worth the subscription.' },
              { id: 'r3', authorName: 'David L.', authorRole: 'VIP Member', rating: 5, content: 'Best investment I have made. ROI in the first week covered my subscription for the year.' },
            ],
          },
        },
        {
          id: 'faq-1', type: 'FAQ',
          data: {
            title: 'Got Questions?',
            items: [
              { id: 'q1', question: 'How are signals delivered?', answer: 'Signals are sent directly to your Telegram instantly, including entry price, take profit, and stop loss levels.' },
              { id: 'q2', question: 'What exchanges do you support?', answer: 'We support Binance, Bybit, OKX, and most major exchanges for both spot and futures trading.' },
              { id: 'q3', question: 'Is there a free trial?', answer: 'Yes! We offer a 7-day free trial so you can see our signal quality before committing.' },
            ],
          },
        },
      ],
    },
  },
  {
    id: TemplateId.HealthBeauty,
    name: 'Health & Beauty',
    description: 'For health supplements, beauty products, and wellness brands',
    category: 'Health',
    accentColor: '#ec4899',
    gradient: 'from-pink-500 to-rose-600',
    data: {
      templateId: TemplateId.HealthBeauty,
      templateName: 'Health & Beauty',
      themeConfig: { mode: 'light', primaryColor: '#ec4899' },
      hero: {
        badge: '🌿 Natural & Certified',
        title: 'Transform Your Skin\nin 30 Days',
        subtitle: 'Clinically tested, dermatologist-approved skincare that actually delivers visible results.',
        background: { type: 'color', value: '#fff0f6', overlayOpacity: 0 },
        cta: { text: 'Order via WhatsApp', url: 'https://wa.me/1234567890', icon: 'WhatsApp', theme: 'whatsapp' },
        trustText: '✓ 30-day money-back guarantee · Free shipping on first order',
      },
      bundles: {
        title: 'Our Skincare Bundles',
        subtitle: 'Complete routines for lasting results',
        tiers: [
          {
            id: 'tier-1', name: 'Starter Kit', price: '$39', originalPrice: '$65',
            description: 'Begin your skincare journey',
            features: ['Cleanser (100ml)', 'Moisturizer (50ml)', 'Usage Guide', 'Free Sample'],
            cta: { text: 'Order via WhatsApp', url: 'https://wa.me/1234567890', icon: 'WhatsApp', theme: 'whatsapp' },
          },
          {
            id: 'tier-2', name: 'Complete Routine', price: '$89', originalPrice: '$140',
            description: 'Full 4-step skincare system',
            features: ['Cleanser (200ml)', 'Toner', 'Serum', 'Moisturizer', 'SPF Protection', 'Free Eye Cream'],
            tag: 'Most Popular',
            cta: { text: 'Order via WhatsApp', url: 'https://wa.me/1234567890', icon: 'WhatsApp', theme: 'whatsapp' },
          },
          {
            id: 'tier-3', name: 'VIP Luxury Set', price: '$159', originalPrice: '$250',
            description: 'Premium anti-aging collection',
            features: ['Full Routine Set', 'Anti-Aging Serum', 'Eye Cream', 'Face Mask (4pcs)', 'Collagen Supplement', 'Free Consultation'],
            tag: 'Best Value',
            cta: { text: 'Order via WhatsApp', url: 'https://wa.me/1234567890', icon: 'WhatsApp', theme: 'whatsapp' },
          },
        ],
      },
      howItWorks: {
        title: 'How It Works',
        subtitle: 'Your journey to glowing skin',
        steps: [
          { id: 's1', icon: 'WhatsApp', title: 'Order via WhatsApp', description: 'Chat with our beauty advisor and choose the right products for your skin type.' },
          { id: 's2', icon: 'Package', title: 'Fast Delivery', description: 'Your order is carefully packaged and shipped within 24 hours.' },
          { id: 's3', icon: 'Star', title: 'See Results', description: 'Follow our expert guide and watch your skin transform in just 30 days.' },
        ],
      },
      footer: {
        brandName: 'GlowLab Beauty',
        copyrightYear: '2025',
        contactEmail: 'care@glowlab.com',
        links: [{ text: 'Privacy Policy', url: '/privacy' }, { text: 'Terms of Service', url: '/terms' }, { text: 'Ingredients', url: '/ingredients' }],
        disclaimer: 'Individual results may vary. Our products are not intended to diagnose, treat, or cure any skin condition.',
      },
      upperBlocks: [
        {
          id: 'trust-1', type: 'TrustBanner',
          data: {
            theme: 'light',
            badges: [
              { id: 'b1', icon: 'Leaf', text: '100% Natural' },
              { id: 'b2', icon: 'Award', text: 'Dermatologist Tested' },
              { id: 'b3', icon: 'Shield', text: 'Cruelty Free' },
              { id: 'b4', icon: 'Heart', text: 'Vegan Formula' },
            ],
          },
        },
        {
          id: 'authority-1', type: 'AuthorityStory',
          data: {
            title: 'Formulated by Dr. Sarah Lee', subtitle: 'Board-certified dermatologist',
            paragraphs: [
              'After 12 years of treating patients with sensitive skin, I developed GlowLab to fill a gap in the market for truly effective, clean skincare.',
              'Every formula is backed by clinical research and tested on diverse skin types to ensure safety and efficacy for everyone.',
            ],
            image: { src: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80', alt: 'Dr. Sarah Lee' },
            stats: [{ label: 'Years Research', value: '12' }, { label: 'Patients', value: '3,000+' }, { label: 'Clinical Trials', value: '8' }],
            signature: { name: 'Dr. Sarah Lee', role: 'Founder & Chief Dermatologist' },
          },
        },
      ],
      lowerBlocks: [
        {
          id: 'reviews-1', type: 'Reviews',
          data: {
            title: 'Real Results, Real People', subtitle: 'Thousands have transformed their skin',
            averageRating: 4.9, totalReviews: '8,400+',
            items: [
              { id: 'r1', authorName: 'Jessica M.', authorRole: 'Verified Buyer', rating: 5, content: 'My dark spots have visibly reduced after just 3 weeks! This serum is a game changer.' },
              { id: 'r2', authorName: 'Amara T.', authorRole: 'VIP Customer', rating: 5, content: 'Finally a skincare brand that works for my melanin-rich skin. Absolutely love the results!' },
              { id: 'r3', authorName: 'Priya S.', authorRole: 'Verified Buyer', rating: 5, content: 'The complete routine transformed my skin. I get compliments every day now!' },
            ],
          },
        },
        {
          id: 'faq-1', type: 'FAQ',
          data: {
            title: 'Skincare FAQs',
            items: [
              { id: 'q1', question: 'Is it suitable for sensitive skin?', answer: 'Yes! All GlowLab products are hypoallergenic and tested on sensitive skin. Free from parabens, sulfates, and fragrances.' },
              { id: 'q2', question: 'How long before I see results?', answer: 'Most customers notice improvements within 2 weeks. For full results, we recommend using consistently for 30 days.' },
              { id: 'q3', question: 'What if it does not work for me?', answer: 'We offer a full 30-day money-back guarantee. No questions asked – just contact us via WhatsApp.' },
            ],
            contactCta: { text: 'Ask our beauty advisor', url: 'https://wa.me/1234567890', icon: 'WhatsApp', theme: 'whatsapp' },
          },
        },
      ],
    },
  },
];

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
