"use client"

import { useEffect } from "react";
import { ctaThemeColor, BackgroundType, TrustBannerTheme, FeaturesLayout } from "@/lib/constants";
import type {
  LandingPageTemplate,
  HeroSchema,
  BundlesSchema,
  HowItWorksSchema,
  MicroFooterSchema,
  FeaturesSchema,
  ReviewsSchema,
  TrustBannerSchema,
  AuthoritySchema,
  FAQSchema,
  OptionalBlock,
} from "@/types/schema";

const HIGHLIGHT_STYLE = "0 0 0 3px #3b82f6";

// ── Shared helpers ───────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= rating ? "text-amber-400" : "text-slate-200"}>★</span>
      ))}
    </div>
  );
}

// ── Block Renderers ──────────────────────────────────────────────────────────

function HeroBlock({ data, primaryColor, highlight }: { data: HeroSchema; primaryColor: string; highlight?: boolean }) {
  const v = data.variant ?? 'overlay';
  const bgImg = data.background.type === BackgroundType.Image ? data.background.value : undefined;
  const bgColor = data.background.type === BackgroundType.Color ? data.background.value : undefined;

  const textContent = (
    <>
      {data.badge && (
        <div className="inline-block px-3 py-1 rounded-full text-xs mb-3" style={{ backgroundColor: primaryColor + "20", color: primaryColor }}>
          {data.badge}
        </div>
      )}
      <h1 className="text-xl leading-snug mb-2 text-slate-800" style={{ whiteSpace: "pre-line" }}>
        {data.title}
      </h1>
      <p className="text-xs leading-relaxed mb-4 text-slate-500">{data.subtitle}</p>
      <button
        className="px-5 py-2.5 rounded-full text-sm text-white"
        style={{ backgroundColor: ctaThemeColor(data.cta.theme, primaryColor) }}
      >
        {data.cta.text}
      </button>
      {data.trustText && (
        <p className="text-xs mt-2 text-slate-400">{data.trustText}</p>
      )}
    </>
  );

  if (v === 'split-left' || v === 'split-right') {
    return (
      <section
        id="hero"
        className="px-5 py-8"
        style={{ backgroundColor: bgColor ?? '#f8f9ff', boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}
      >
        <div className={`flex items-center gap-4 ${v === 'split-right' ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className="flex-1 min-w-0">{textContent}</div>
          {bgImg && (
            <div className="w-2/5 shrink-0">
              <img src={bgImg} alt="" className="w-full h-32 object-cover rounded-xl" />
            </div>
          )}
        </div>
      </section>
    );
  }

  // overlay (default)
  return (
    <section
      id="hero"
      className="relative px-5 py-12 text-center"
      style={{
        backgroundColor: bgColor ?? "#f8f9ff",
        backgroundImage: bgImg ? `url(${bgImg})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        boxShadow: highlight ? HIGHLIGHT_STYLE : undefined,
      }}
    >
      {bgImg && (
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${data.background.overlayOpacity ?? 0.4})` }} />
      )}
      <div className="relative z-10">
        {data.badge && (
          <div className="inline-block px-3 py-1 rounded-full text-xs mb-4" style={{ backgroundColor: primaryColor + "20", color: primaryColor }}>
            {data.badge}
          </div>
        )}
        <h1 className="text-2xl leading-snug mb-3" style={{ color: bgImg ? "#fff" : "#1e293b", whiteSpace: "pre-line" }}>
          {data.title}
        </h1>
        <p className="text-sm leading-relaxed mb-6 max-w-sm mx-auto" style={{ color: bgImg ? "rgba(255,255,255,0.85)" : "#64748b" }}>
          {data.subtitle}
        </p>
        <button
          className="px-5 py-2.5 rounded-full text-sm text-white"
          style={{ backgroundColor: ctaThemeColor(data.cta.theme, primaryColor) }}
        >
          {data.cta.text}
        </button>
        {data.trustText && (
          <p className="text-xs mt-3" style={{ color: bgImg ? "rgba(255,255,255,0.7)" : "#94a3b8" }}>
            {data.trustText}
          </p>
        )}
      </div>
    </section>
  );
}

function TrustBannerBlock({ data, id, highlight }: { data: TrustBannerSchema; id?: string; highlight?: boolean }) {
  const dark = data.theme === TrustBannerTheme.Dark;
  return (
    <section id={id} className="px-4 py-4" style={{ backgroundColor: dark ? "#1e293b" : "#f8fafc", boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
        {data.badges.map(badge => (
          <div key={badge.id} className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: dark ? "#94a3b8" : "#64748b" }}>✦</span>
            <span className="text-xs" style={{ color: dark ? "#e2e8f0" : "#475569" }}>{badge.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturesBlock({ data, primaryColor, id, highlight }: { data: FeaturesSchema; primaryColor: string; id?: string; highlight?: boolean }) {
  return (
    <section id={id} className="px-5 py-10" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <p className="text-lg text-center text-slate-800 mb-1">{data.title}</p>
      {data.subtitle && <p className="text-xs text-center text-slate-500 mb-6">{data.subtitle}</p>}
      <div className={`gap-4 ${data.layout === FeaturesLayout.List ? "flex flex-col" : "grid grid-cols-2"}`}>
        {data.items.map(item => (
          <div key={item.id} className="bg-slate-50 rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 text-sm" style={{ backgroundColor: primaryColor + "20", color: primaryColor }}>
              ◆
            </div>
            <p className="text-sm text-slate-800 mb-1">{item.title}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AuthorityBlock({ data, primaryColor, id, highlight }: { data: AuthoritySchema; primaryColor: string; id?: string; highlight?: boolean }) {
  return (
    <section id={id} className="px-5 py-10 bg-slate-50" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <p className="text-lg text-slate-800 mb-1">{data.title}</p>
      {data.subtitle && <p className="text-xs text-slate-500 mb-4">{data.subtitle}</p>}
      {data.image.src && (
        <img src={data.image.src} alt={data.image.alt} className="w-full h-36 object-cover rounded-xl mb-4" />
      )}
      <div className="space-y-2">
        {data.paragraphs.map((p, i) => (
          <p key={i} className="text-xs text-slate-600 leading-relaxed">{p}</p>
        ))}
      </div>
      {data.stats && data.stats.length > 0 && (
        <div className="flex gap-4 mt-5 pt-4 border-t border-slate-200">
          {data.stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-xl" style={{ color: primaryColor }}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}
      {data.signature && (
        <div className="mt-4 pt-3 border-t border-slate-200">
          <p className="text-sm text-slate-800">{data.signature.name}</p>
          <p className="text-xs text-slate-500">{data.signature.role}</p>
        </div>
      )}
    </section>
  );
}

function BundlesBlock({ data, primaryColor, highlight }: { data: BundlesSchema; primaryColor: string; highlight?: boolean }) {
  return (
    <section id="bundles" className="px-5 py-10" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <p className="text-lg text-center text-slate-800 mb-1">{data.title}</p>
      {data.subtitle && <p className="text-xs text-center text-slate-500 mb-6">{data.subtitle}</p>}
      <div className="space-y-4">
        {data.tiers.map(tier => (
          <div key={tier.id} className="border-2 rounded-2xl p-4 relative" style={{ borderColor: tier.tag ? primaryColor : "#e2e8f0" }}>
            {tier.tag && (
              <div className="absolute -top-3 left-4 px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: primaryColor }}>
                {tier.tag}
              </div>
            )}
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-slate-800">{tier.name}</p>
                <p className="text-xs text-slate-500">{tier.description}</p>
              </div>
              <div className="text-right">
                <p className="text-xl" style={{ color: primaryColor }}>{tier.price}</p>
                {tier.originalPrice && (
                  <p className="text-xs text-slate-400 line-through">{tier.originalPrice}</p>
                )}
              </div>
            </div>
            <ul className="space-y-1 my-3">
              {tier.features.map((f, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="text-emerald-500 text-base leading-none">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              className="w-full py-2 rounded-full text-xs text-white mt-2"
              style={{ backgroundColor: ctaThemeColor(tier.cta.theme, primaryColor) }}
            >
              {tier.cta.text}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorksBlock({ data, primaryColor, highlight }: { data: HowItWorksSchema; primaryColor: string; highlight?: boolean }) {
  return (
    <section id="howItWorks" className="px-5 py-10 bg-slate-50" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <p className="text-lg text-center text-slate-800 mb-1">{data.title}</p>
      {data.subtitle && <p className="text-xs text-center text-slate-500 mb-6">{data.subtitle}</p>}
      <div className="space-y-4">
        {data.steps.map((step, i) => (
          <div key={step.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm text-white shrink-0" style={{ backgroundColor: primaryColor }}>
              {i + 1}
            </div>
            <div>
              <p className="text-sm text-slate-800">{step.title}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReviewsBlock({ data, id, highlight }: { data: ReviewsSchema; id?: string; highlight?: boolean }) {
  return (
    <section id={id} className="px-5 py-10" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <p className="text-lg text-center text-slate-800 mb-1">{data.title}</p>
      {data.subtitle && <p className="text-xs text-center text-slate-500 mb-2">{data.subtitle}</p>}
      {data.averageRating && (
        <div className="flex items-center justify-center gap-2 mb-5">
          <span className="text-2xl text-amber-400 font-bold">{data.averageRating}</span>
          <StarRating rating={Math.round(data.averageRating)} />
          {data.totalReviews && <span className="text-xs text-slate-400">({data.totalReviews})</span>}
        </div>
      )}
      <div className="space-y-3">
        {data.items.map(item => (
          <div key={item.id} className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-start gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600 shrink-0">
                {item.authorName.charAt(0)}
              </div>
              <div>
                <p className="text-xs text-slate-800">{item.authorName}</p>
                {item.authorRole && <p className="text-[10px] text-slate-400">{item.authorRole}</p>}
              </div>
              <div className="ml-auto">
                <StarRating rating={item.rating} />
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{item.content}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQBlock({ data, primaryColor, id, highlight }: { data: FAQSchema; primaryColor: string; id?: string; highlight?: boolean }) {
  return (
    <section id={id} className="px-5 py-10 bg-slate-50" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <p className="text-lg text-center text-slate-800 mb-1">{data.title}</p>
      {data.subtitle && <p className="text-xs text-center text-slate-500 mb-6">{data.subtitle}</p>}
      <div className="space-y-3">
        {data.items.map((item, i) => (
          <div key={item.id} className="bg-white rounded-xl p-4">
            <p className="text-sm text-slate-800 mb-1.5">{item.question}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{item.answer}</p>
          </div>
        ))}
      </div>
      {data.contactCta && (
        <div className="mt-6 text-center">
          <button
            className="px-5 py-2.5 rounded-full text-sm text-white"
            style={{ backgroundColor: ctaThemeColor(data.contactCta.theme, primaryColor) }}
          >
            {data.contactCta.text}
          </button>
        </div>
      )}
    </section>
  );
}

function FooterBlock({ data, highlight }: { data: MicroFooterSchema; highlight?: boolean }) {
  return (
    <footer id="footer" className="bg-slate-800 text-white px-5 py-8 text-center" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <p className="text-sm mb-3">{data.brandName}</p>
      {data.disclaimer && (
        <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">{data.disclaimer}</p>
      )}
      <div className="flex flex-wrap justify-center gap-3 mb-3">
        {data.links.map((link, i) => (
          <a key={i} href={link.url} className="text-[10px] text-slate-400 hover:text-white underline">
            {link.text}
          </a>
        ))}
      </div>
      {data.contactEmail && (
        <p className="text-[10px] text-slate-400 mb-2">{data.contactEmail}</p>
      )}
      <p className="text-[10px] text-slate-500">© {data.copyrightYear} {data.brandName}. All rights reserved.</p>
    </footer>
  );
}

// ── Main renderer ─────────────────────────────────────────────────────────────

export function PreviewRenderer({ template, highlightKey = "", showWatermark = false }: { template: LandingPageTemplate; highlightKey?: string; showWatermark?: boolean }) {
  const pc = template.themeConfig.primaryColor;

  useEffect(() => {
    if (!highlightKey) return;
    const el = document.getElementById(highlightKey);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [highlightKey]);

  const renderOptional = (block: OptionalBlock) => {
    const hl = block.id === highlightKey;
    switch (block.type) {
      case "TrustBanner": return <TrustBannerBlock key={block.id} id={block.id} data={block.data as TrustBannerSchema} highlight={hl} />;
      case "Features": return <FeaturesBlock key={block.id} id={block.id} data={block.data as FeaturesSchema} primaryColor={pc} highlight={hl} />;
      case "AuthorityStory": return <AuthorityBlock key={block.id} id={block.id} data={block.data as AuthoritySchema} primaryColor={pc} highlight={hl} />;
      case "Reviews": return <ReviewsBlock key={block.id} id={block.id} data={block.data as ReviewsSchema} highlight={hl} />;
      case "FAQ": return <FAQBlock key={block.id} id={block.id} data={block.data as FAQSchema} primaryColor={pc} highlight={hl} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <HeroBlock data={template.hero} primaryColor={pc} highlight={highlightKey === "hero"} />
      {template.upperBlocks.map(renderOptional)}
      <BundlesBlock data={template.bundles} primaryColor={pc} highlight={highlightKey === "bundles"} />
      <HowItWorksBlock data={template.howItWorks} primaryColor={pc} highlight={highlightKey === "howItWorks"} />
      {template.lowerBlocks.map(renderOptional)}
      <FooterBlock data={template.footer} highlight={highlightKey === "footer"} />
      {showWatermark && (
        <div className="fixed bottom-4 right-4 z-50 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm pointer-events-none select-none">
          <div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-rose-400 to-pink-600" />
          <span className="text-xs text-slate-500">Powered by <span className="font-medium text-slate-700">PULSAR</span></span>
        </div>
      )}
    </div>
  );
}
