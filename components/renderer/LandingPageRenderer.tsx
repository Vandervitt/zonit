import type { LandingPage } from "@/types/schema";
import type { PresetTemplateData } from "@/lib/templates";
import { isExtractedTemplateData } from "@/lib/templates";
import { BeautyTemplateRenderer } from "@/components/template-extraction";
import { TemplateRenderer } from "./TemplateRenderer";
import { HeroBlock } from "./blocks/HeroBlock";
import { OfferBlock } from "./blocks/OfferBlock";
import { HowItWorksBlock } from "./blocks/HowItWorksBlock";
import { FooterBlock } from "./blocks/FooterBlock";
import { LeadFormBlock } from "./blocks/LeadFormBlock";
import { StickyCtaBar } from "./blocks/StickyCtaBar";
import { BLOCK_REGISTRY } from "./registry";

type Props = {
  page: LandingPage;
  primaryColor: string;
  showWatermark?: boolean;
};

export function LandingPageRenderer({ page, primaryColor, showWatermark }: Props) {
  return (
    <div className="relative min-h-screen bg-white font-sans">
      <HeroBlock data={page.hero} primaryColor={primaryColor} />

      {page.offer && <OfferBlock data={page.offer} primaryColor={primaryColor} />}

      {page.howItWorks && <HowItWorksBlock data={page.howItWorks} primaryColor={primaryColor} />}

      {page.blocks?.map(block => {
        const Block = BLOCK_REGISTRY[block.type];
        if (!Block) return null;
        return <Block key={block.id} id={block.id} data={block.data} primaryColor={primaryColor} />;
      })}

      {page.leadForm && (
        <LeadFormBlock id="leadForm" data={page.leadForm} primaryColor={primaryColor} />
      )}

      <FooterBlock data={page.footer} />

      {page.stickyCta && <StickyCtaBar cta={page.stickyCta} primaryColor={primaryColor} />}

      {showWatermark && (
        <div className="fixed bottom-4 right-4 z-50 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm pointer-events-none select-none">
          <div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-rose-400 to-pink-600" />
          <span className="text-xs text-slate-500">Powered by <span className="font-medium text-slate-700">PULSAR</span></span>
        </div>
      )}
    </div>
  );
}

// Convenience overload accepting a template (reads primaryColor from themeConfig)
export function LandingPageTemplateRenderer({
  template,
  showWatermark,
}: {
  template: PresetTemplateData;
  showWatermark?: boolean;
}) {
  if (isExtractedTemplateData(template)) {
    return <BeautyTemplateRenderer template={template} />;
  }

  return <TemplateRenderer template={template} showWatermark={showWatermark} />;
}
