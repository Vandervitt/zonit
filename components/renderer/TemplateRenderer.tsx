import type {
  AnyLandingPageTemplate,
  AssuranceSchema,
  AuthoritySchema,
  CountdownSchema,
  FAQSchema,
  FeaturesSchema,
  HeroSchema,
  HowItWorksSchema,
  LeadFormSchema,
  MetricsSchema,
  MicroFooterSchema,
  OfferSchema,
  PainPointsSchema,
  ProofCasesSchema,
  ReviewsSchema,
  StickyCtaConfig,
  TrustBannerSchema,
  VisualGallerySchema,
  LogoWallSchema,
  LeadMagnetSchema,
} from "@/types/schema";
import { toLandingPageTemplateV2 } from "@/lib/templates/landing-page-v2-adapter";
import { HeroBlock } from "./blocks/HeroBlock";
import { OfferBlock } from "./blocks/OfferBlock";
import { HowItWorksBlock } from "./blocks/HowItWorksBlock";
import { FooterBlock } from "./blocks/FooterBlock";
import { LeadFormBlock } from "./blocks/LeadFormBlock";
import { StickyCtaBar } from "./blocks/StickyCtaBar";
import { AssuranceBlock } from "./blocks/AssuranceBlock";
import { AuthorityBlock } from "./blocks/AuthorityBlock";
import { CountdownBlock } from "./blocks/CountdownBlock";
import { FAQBlock } from "./blocks/FAQBlock";
import { FeaturesBlock } from "./blocks/FeaturesBlock";
import { LeadMagnetBlock } from "./blocks/LeadMagnetBlock";
import { LogoWallBlock } from "./blocks/LogoWallBlock";
import { MetricsBlock } from "./blocks/MetricsBlock";
import { PainPointsBlock } from "./blocks/PainPointsBlock";
import { ProofCasesBlock } from "./blocks/ProofCasesBlock";
import { ReviewsBlock } from "./blocks/ReviewsBlock";
import { TrustBannerBlock } from "./blocks/TrustBannerBlock";
import { VisualGalleryBlock } from "./blocks/VisualGalleryBlock";

const WATERMARK = (
  <div className="fixed bottom-4 right-4 z-50 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm pointer-events-none select-none">
    <div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-rose-400 to-pink-600" />
    <span className="text-xs text-slate-500">Powered by <span className="font-medium text-slate-700">PULSAR</span></span>
  </div>
);

type Props = {
  template: AnyLandingPageTemplate;
  highlightKey?: string;
  showWatermark?: boolean;
};

export function TemplateRenderer({ template, highlightKey = "", showWatermark = false }: Props) {
  const v2 = toLandingPageTemplateV2(template);
  const primaryColor = v2.design.palette.primary;

  return (
    <div className="relative min-h-screen bg-white font-sans">
      {v2.modules.map(module => {
        if (module.enabled === false) return null;

        const content = v2.content[module.contentKey];
        if (!content) return null;

        const highlighted = highlightKey === module.id;

        switch (module.type) {
          case "Hero":
            return <HeroBlock key={module.id} data={content as HeroSchema} primaryColor={primaryColor} highlight={highlighted} />;
          case "Offer":
            return <OfferBlock key={module.id} data={content as OfferSchema} primaryColor={primaryColor} highlight={highlighted} />;
          case "HowItWorks":
            return <HowItWorksBlock key={module.id} data={content as HowItWorksSchema} primaryColor={primaryColor} highlight={highlighted} />;
          case "LeadForm":
            return <LeadFormBlock key={module.id} id={module.id} data={content as LeadFormSchema} primaryColor={primaryColor} highlight={highlighted} />;
          case "MicroFooter":
            return <FooterBlock key={module.id} data={content as MicroFooterSchema} highlight={highlighted} />;
          case "StickyCta":
            return <StickyCtaBar key={module.id} cta={content as StickyCtaConfig} primaryColor={primaryColor} />;
          case "Features":
            return <FeaturesBlock key={module.id} id={module.id} data={content as FeaturesSchema} primaryColor={primaryColor} highlight={highlighted} />;
          case "Reviews":
            return <ReviewsBlock key={module.id} id={module.id} data={content as ReviewsSchema} highlight={highlighted} />;
          case "TrustBanner":
            return <TrustBannerBlock key={module.id} id={module.id} data={content as TrustBannerSchema} highlight={highlighted} />;
          case "PainPoints":
            return <PainPointsBlock key={module.id} id={module.id} data={content as PainPointsSchema} primaryColor={primaryColor} highlight={highlighted} />;
          case "LeadMagnet":
            return <LeadMagnetBlock key={module.id} id={module.id} data={content as LeadMagnetSchema} primaryColor={primaryColor} highlight={highlighted} />;
          case "ProofCases":
            return <ProofCasesBlock key={module.id} id={module.id} data={content as ProofCasesSchema} primaryColor={primaryColor} highlight={highlighted} />;
          case "VisualGallery":
            return <VisualGalleryBlock key={module.id} id={module.id} data={content as VisualGallerySchema} primaryColor={primaryColor} highlight={highlighted} />;
          case "Metrics":
            return <MetricsBlock key={module.id} id={module.id} data={content as MetricsSchema} primaryColor={primaryColor} highlight={highlighted} />;
          case "LogoWall":
            return <LogoWallBlock key={module.id} id={module.id} data={content as LogoWallSchema} highlight={highlighted} />;
          case "AuthorityStory":
            return <AuthorityBlock key={module.id} id={module.id} data={content as AuthoritySchema} primaryColor={primaryColor} highlight={highlighted} />;
          case "FAQ":
            return <FAQBlock key={module.id} id={module.id} data={content as FAQSchema} primaryColor={primaryColor} highlight={highlighted} />;
          case "Countdown":
            return <CountdownBlock key={module.id} id={module.id} data={content as CountdownSchema} primaryColor={primaryColor} highlight={highlighted} />;
          case "Assurance":
            return <AssuranceBlock key={module.id} id={module.id} data={content as AssuranceSchema} primaryColor={primaryColor} highlight={highlighted} />;
        }
      })}

      {showWatermark && WATERMARK}
    </div>
  );
}
