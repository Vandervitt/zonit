"use client";

import { useEffect } from "react";
import type { LandingPageTemplate, OptionalBlock } from "@/types/schema";
import { HeroBlock } from "@/components/renderer/blocks/HeroBlock";
import { OfferBlock } from "@/components/renderer/blocks/OfferBlock";
import { HowItWorksBlock } from "@/components/renderer/blocks/HowItWorksBlock";
import { FooterBlock } from "@/components/renderer/blocks/FooterBlock";
import { LeadFormBlock } from "@/components/renderer/blocks/LeadFormBlock";
import { StickyCtaBar } from "@/components/renderer/blocks/StickyCtaBar";
import { BLOCK_REGISTRY } from "@/components/renderer/registry";

const WATERMARK = (
  <div className="fixed bottom-4 right-4 z-50 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm pointer-events-none select-none">
    <div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-rose-400 to-pink-600" />
    <span className="text-xs text-slate-500">Powered by <span className="font-medium text-slate-700">PULSAR</span></span>
  </div>
);

export function PreviewRenderer({
  template,
  highlightKey = "",
  showWatermark = false,
}: {
  template: LandingPageTemplate;
  highlightKey?: string;
  showWatermark?: boolean;
}) {
  const pc = template.themeConfig.primaryColor;

  useEffect(() => {
    if (!highlightKey) return;
    document.getElementById(highlightKey)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [highlightKey]);

  const renderBlock = (block: OptionalBlock) => {
    const Block = BLOCK_REGISTRY[block.type];
    if (!Block) return null;
    return (
      <Block
        key={block.id}
        id={block.id}
        data={block.data}
        primaryColor={pc}
        highlight={block.id === highlightKey}
      />
    );
  };

  return (
    <div className="relative min-h-screen bg-white font-sans">
      <HeroBlock data={template.hero} primaryColor={pc} highlight={highlightKey === "hero"} />

      {template.offer && (
        <OfferBlock data={template.offer} primaryColor={pc} highlight={highlightKey === "offer"} />
      )}
      {template.howItWorks && (
        <HowItWorksBlock data={template.howItWorks} primaryColor={pc} highlight={highlightKey === "howItWorks"} />
      )}

      {template.blocks?.map(renderBlock)}

      {template.leadForm && (
        <LeadFormBlock
          id="leadForm"
          data={template.leadForm}
          primaryColor={pc}
          highlight={highlightKey === "leadForm"}
        />
      )}

      <FooterBlock data={template.footer} highlight={highlightKey === "footer"} />

      {template.stickyCta && <StickyCtaBar cta={template.stickyCta} primaryColor={pc} />}

      {showWatermark && WATERMARK}
    </div>
  );
}
