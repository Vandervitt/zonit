import type { CallToAction, IconType } from "@/types/schema";

export type ExtractedModuleType =
  | "hero"
  | "stats"
  | "offer"
  | "productShowcase"
  | "beforeAfter"
  | "videoTestimonials"
  | "howItWorks"
  | "trustBanner"
  | "logoWall"
  | "features"
  | "reviews"
  | "authority"
  | "countdown"
  | "faq"
  | "assurance"
  | "footer"
  | "stickyCta";

export type StyleMap = Record<string, string>;

export type ImageResource = {
  src: string;
  alt: string;
};

export type ExtractedTemplateModule = {
  id: string;
  type: ExtractedModuleType;
  dataKey: string;
  stylesKey: string;
};

export type ExtractedTemplate = {
  templateId: string;
  templateName: string;
  modules: ExtractedTemplateModule[];
  content: Record<string, unknown>;
  styles: Record<string, StyleMap>;
};

export type HeroContent = {
  badge?: string;
  title: string;
  subtitle: string;
  background: ImageResource;
  media?: ImageResource;
  cta: CallToAction;
  secondaryCta?: CallToAction;
  trustText?: string;
  stats?: Array<{ id: string; label: string; value?: string; icon?: IconType }>;
};

export type StatsContent = {
  title: string;
  subtitle: string;
  items: Array<{ id: string; value: string; label: string; icon: string; image: ImageResource }>;
};

export type OfferContent = {
  title: string;
  subtitle?: string;
  showImages?: boolean;
  options: Array<{
    id: string;
    name: string;
    description: string;
    badge?: string;
    image?: string;
    valueProps: string[];
    urgencyText?: string;
    cta: CallToAction;
  }>;
};

export type ProductShowcaseContent = {
  title: string;
  subtitle: string;
  items: Array<{ id: string; image: ImageResource; title: string; description: string }>;
  note?: string;
};

export type BeforeAfterContent = {
  title: string;
  subtitle: string;
  labels: {
    before: string;
    after: string;
    client: string;
    concern: string;
    timeline: string;
  };
  items: Array<{
    id: string;
    before: ImageResource;
    after: ImageResource;
    name: string;
    concern: string;
    duration: string;
  }>;
  disclaimer?: string;
};

export type VideoTestimonialsContent = {
  title: string;
  subtitle: string;
  items: Array<{ id: string; thumbnail: ImageResource; name: string; title: string; duration: string }>;
  closingText?: string;
  cta?: CallToAction;
};

export type HowItWorksContent = {
  title: string;
  subtitle?: string;
  stepImages: ImageResource[];
  steps: Array<{ id: string; icon: IconType; title: string; description: string }>;
};

export type TrustBannerContent = {
  background: ImageResource;
  badges: Array<{ id: string; icon: IconType; text: string; subtext?: string }>;
};

export type LogoWallContent = {
  title?: string;
  logos: Array<{ id: string; src: string; alt: string; url?: string }>;
};

export type FeaturesContent = {
  title: string;
  subtitle?: string;
  decorations: [ImageResource, ImageResource];
  items: Array<{ id: string; icon: IconType; title: string; description: string }>;
};

export type ReviewsContent = {
  title: string;
  subtitle?: string;
  ratingSummary?: { average: number; scale?: number; totalLabel?: string };
  items: Array<{
    id: string;
    authorName: string;
    authorRole?: string;
    avatar?: string;
    rating: number;
    content: string;
    proofImage?: string;
    sourcePlatform?: string;
    country?: string;
  }>;
  verifiedPrefix: string;
  proofImageSuffix: string;
  disclaimer?: string;
};

export type AuthorityContent = {
  title: string;
  subtitle?: string;
  image?: ImageResource;
  paragraphs: string[];
  stats?: Array<{ label: string; value: string }>;
  credentialsTitle?: string;
  credentials?: Array<{ id: string; label: string }>;
  signature?: { name: string; role: string };
};

export type CountdownContent = {
  title?: string;
  subtitle?: string;
  endsAt: string;
  background: ImageResource;
  labels: [string, string, string, string];
  expiredFallback?: { title?: string; subtitle?: string };
  cta?: CallToAction;
};

export type FaqContent = {
  title: string;
  subtitle?: string;
  items: Array<{ id: string; question: string; answer: string }>;
  contactCta?: CallToAction;
};

export type AssuranceContent = {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  imageAlt: string;
  closingText?: string;
  badges?: Array<{ id: string; icon: IconType; text: string; subtext?: string }>;
  cta?: CallToAction;
};

export type FooterContent = {
  brandName: string;
  copyrightYear: string;
  contactEmail?: string;
  socialIcons: Record<string, string>;
  socialLinks?: Array<{ platform: string; url: string }>;
  links: Array<{ text: string; url?: string; content?: string }>;
  closeLabel: string;
  rightsText: string;
  disclaimer?: string;
};

export type StickyCtaContent = CallToAction & {
  position?: "bottom-left" | "bottom-right";
  showAfterScrollPercent?: number;
};
