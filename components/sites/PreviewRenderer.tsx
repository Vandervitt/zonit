"use client"

import { useEffect, useState } from "react";
import { ctaThemeColor, BackgroundType, TrustBannerTheme, FeaturesLayout } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type {
  LandingPageTemplate,
  HeroSchema,
  OfferSchema,
  OfferOption,
  HowItWorksSchema,
  MicroFooterSchema,
  FooterLink,
  FeaturesSchema,
  ReviewsSchema,
  ReviewItem,
  TrustBannerSchema,
  AuthoritySchema,
  FAQSchema,
  CountdownSchema,
  CallToAction,
  AssuranceSchema,
  LeadFormSchema,
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

// 倒计时剩余时间计算（每秒更新）
function useTimeLeft(endsAt: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const end = new Date(endsAt).getTime();
  const diff = Math.max(0, end - now);
  const expired = diff === 0;
  const total = Math.floor(diff / 1000);
  return {
    expired,
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function CountdownDigits({ data, primaryColor, dense }: { data: CountdownSchema; primaryColor: string; dense?: boolean }) {
  const t = useTimeLeft(data.endsAt);
  if (t.expired) {
    return (
      <div className="text-center">
        <p className="text-sm text-slate-700">{data.expiredFallback?.title ?? "Offer Ended"}</p>
        {data.expiredFallback?.subtitle && (
          <p className="text-xs text-slate-500 mt-1">{data.expiredFallback.subtitle}</p>
        )}
      </div>
    );
  }
  const cell = (n: number, label: string) => (
    <div className="flex flex-col items-center">
      <div
        className={`${dense ? "px-2 py-1 text-base" : "px-3 py-2 text-2xl"} rounded-lg text-white tabular-nums`}
        style={{ backgroundColor: primaryColor }}
      >
        {String(n).padStart(2, "0")}
      </div>
      <span className={`${dense ? "text-[9px]" : "text-[10px]"} text-slate-500 mt-1 uppercase tracking-wider`}>{label}</span>
    </div>
  );
  return (
    <div className={`flex items-center justify-center ${dense ? "gap-1.5" : "gap-2"}`}>
      {cell(t.days, "Days")}
      {cell(t.hours, "Hrs")}
      {cell(t.minutes, "Min")}
      {cell(t.seconds, "Sec")}
    </div>
  );
}

function CountdownBlock({ data, primaryColor, id, highlight }: { data: CountdownSchema; primaryColor: string; id?: string; highlight?: boolean }) {
  const banner = data.variant === "banner";
  if (banner) {
    return (
      <section id={id} className="px-4 py-2.5 text-white" style={{ backgroundColor: primaryColor, boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {data.title && <span className="text-xs">{data.title}</span>}
          <CountdownDigits data={data} primaryColor="#0f172a" dense />
        </div>
      </section>
    );
  }
  return (
    <section id={id} className="px-5 py-8 bg-slate-50" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      {data.title && <p className="text-base text-center text-slate-800 mb-1">{data.title}</p>}
      {data.subtitle && <p className="text-xs text-center text-slate-500 mb-4">{data.subtitle}</p>}
      <CountdownDigits data={data} primaryColor={primaryColor} />
      {data.cta && (
        <div className="text-center mt-4">
          <button
            className="px-5 py-2.5 rounded-full text-sm text-white"
            style={{ backgroundColor: ctaThemeColor(data.cta.theme, primaryColor) }}
          >
            {data.cta.text}
          </button>
        </div>
      )}
    </section>
  );
}

function StickyCtaBar({ cta, primaryColor }: { cta: CallToAction; primaryColor: string }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-3 py-2 z-40">
      <button
        className="w-full py-2.5 rounded-full text-sm text-white font-medium"
        style={{ backgroundColor: ctaThemeColor(cta.theme, primaryColor) }}
      >
        {cta.text}
      </button>
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
      <h1 className="text-xl leading-snug mb-2 text-slate-800 whitespace-pre-line">
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
      {data.countdown && (
        <div className="mt-4">
          <CountdownDigits data={data.countdown} primaryColor={primaryColor} dense />
        </div>
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
        <div className={`flex items-center gap-4 ${v === 'split-right' ? 'flex-row-reverse' : ''}`}>
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
        {data.countdown && (
          <div className="mt-5">
            <CountdownDigits data={data.countdown} primaryColor={primaryColor} dense />
          </div>
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
  const v = data.variant ?? 'image-left';

  const imageEl = data.image.src ? (
    <img src={data.image.src} alt={data.image.alt} className="w-full h-28 object-cover rounded-xl" />
  ) : null;

  const textEl = (
    <div className="flex-1 min-w-0">
      <p className="text-base text-slate-800 mb-1">{data.title}</p>
      {data.subtitle && <p className="text-xs text-slate-500 mb-3">{data.subtitle}</p>}
      <div className="space-y-1.5">
        {data.paragraphs.map((p, i) => (
          <p key={i} className="text-xs text-slate-600 leading-relaxed">{p}</p>
        ))}
      </div>
      {data.stats && data.stats.length > 0 && (
        <div className="flex gap-4 mt-4 pt-3 border-t border-slate-200">
          {data.stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-lg" style={{ color: primaryColor }}>{s.value}</p>
              <p className="text-[10px] text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}
      {data.signature && (
        <div className="mt-3 pt-2 border-t border-slate-200">
          <p className="text-sm text-slate-800">{data.signature.name}</p>
          <p className="text-xs text-slate-500">{data.signature.role}</p>
        </div>
      )}
    </div>
  );

  return (
    <section id={id} className="px-5 py-10 bg-slate-50" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <div className={`flex gap-4 items-start ${v === 'image-right' ? 'flex-row-reverse' : ''}`}>
        {imageEl && <div className="w-2/5 shrink-0">{imageEl}</div>}
        {textEl}
      </div>
    </section>
  );
}

function OfferBlock({ data, primaryColor, highlight }: { data: OfferSchema; primaryColor: string; highlight?: boolean }) {
  const v = data.variant ?? 'cards-row';

  const optionCard = (option: OfferOption) => (
    <div key={option.id} className="border-2 rounded-2xl p-4 relative" style={{ borderColor: option.tag ? primaryColor : "#e2e8f0" }}>
      {option.tag && (
        <div className="absolute -top-3 left-4 px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: primaryColor }}>
          {option.tag}
        </div>
      )}
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-sm text-slate-800">{option.name}</p>
          <p className="text-xs text-slate-500">{option.description}</p>
        </div>
        {option.labelText && (
          <p className="text-xl shrink-0 ml-2" style={{ color: primaryColor }}>{option.labelText}</p>
        )}
      </div>
      <ul className="space-y-1 my-3">
        {option.valueProps.map((f, i) => (
          <li key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-emerald-500 text-base leading-none">✓</span> {f}
          </li>
        ))}
      </ul>
      {option.urgencyText && (
        <p className="text-[10px] text-amber-600 text-center mb-2">{option.urgencyText}</p>
      )}
      <button
        className="w-full py-2 rounded-full text-xs text-white mt-2"
        style={{ backgroundColor: ctaThemeColor(option.cta.theme, primaryColor) }}
      >
        {option.cta.text}
      </button>
    </div>
  );

  return (
    <section id="offer" className="px-5 py-10" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <p className="text-lg text-center text-slate-800 mb-1">{data.title}</p>
      {data.subtitle && <p className="text-xs text-center text-slate-500 mb-6">{data.subtitle}</p>}
      <div className={v === 'cards-row' ? "grid grid-cols-2 gap-3" : "space-y-4"}>
        {data.options.map(optionCard)}
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
  const v = data.variant ?? 'grid';
  const ratingSummary = data.ratingSummary;
  const ratingScale = ratingSummary?.scale ?? 5;
  const normalizedRating = ratingSummary ? Math.round((ratingSummary.average / ratingScale) * 5) : 0;

  const reviewCard = (item: ReviewItem) => (
    <div key={item.id} className={`bg-slate-50 rounded-xl p-4 ${v === 'carousel' ? 'w-56 shrink-0 snap-start' : ''}`}>
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
  );

  return (
    <section id={id} className="py-10" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <div className="px-5">
        <p className="text-lg text-center text-slate-800 mb-1">{data.title}</p>
        {data.subtitle && <p className="text-xs text-center text-slate-500 mb-2">{data.subtitle}</p>}
        {ratingSummary && (
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="text-2xl text-amber-400 font-bold">{ratingSummary.average}</span>
            <StarRating rating={normalizedRating} />
            {ratingSummary.totalLabel && <span className="text-xs text-slate-400">({ratingSummary.totalLabel})</span>}
          </div>
        )}
      </div>
      {v === 'carousel' ? (
        <div className="flex gap-3 overflow-x-auto px-5 pb-2 snap-x snap-mandatory">
          {data.items.map(reviewCard)}
        </div>
      ) : (
        <div className="px-5 space-y-3">
          {data.items.map(reviewCard)}
        </div>
      )}
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

function AssuranceBlock({ data, primaryColor, id, highlight }: { data: AssuranceSchema; primaryColor: string; id?: string; highlight?: boolean }) {
  return (
    <section id={id} className="px-5 py-10 bg-slate-50" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <div className="flex flex-col items-center text-center">
        {data.image && (
          <img src={data.image} alt="" className="w-20 h-20 object-contain mb-3" />
        )}
        <p className="text-lg text-slate-800 mb-1">{data.title}</p>
        {data.subtitle && <p className="text-xs text-slate-500 mb-3">{data.subtitle}</p>}
        {data.description && (
          <p className="text-xs text-slate-600 leading-relaxed mb-5 max-w-sm">{data.description}</p>
        )}
        {data.badges && data.badges.length > 0 && (
          <div className="grid grid-cols-3 gap-3 w-full mb-4">
            {data.badges.map(badge => (
              <div key={badge.id} className="flex flex-col items-center">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center mb-1.5 text-sm"
                  style={{ backgroundColor: primaryColor + "20", color: primaryColor }}
                >
                  ✓
                </div>
                <p className="text-[11px] text-slate-700 leading-tight">{badge.text}</p>
                {badge.subtext && <p className="text-[9px] text-slate-400 mt-0.5">{badge.subtext}</p>}
              </div>
            ))}
          </div>
        )}
        {data.cta && (
          <button
            className="px-5 py-2.5 rounded-full text-sm text-white"
            style={{ backgroundColor: ctaThemeColor(data.cta.theme, primaryColor) }}
          >
            {data.cta.text}
          </button>
        )}
      </div>
    </section>
  );
}

function LeadFormBlock({ data, primaryColor, id, highlight }: { data: LeadFormSchema; primaryColor: string; id?: string; highlight?: boolean }) {
  return (
    <section id={id} className="px-5 py-10" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <p className="text-lg text-center text-slate-800 mb-1">{data.title}</p>
      {data.subtitle && <p className="text-xs text-center text-slate-500 mb-5">{data.subtitle}</p>}
      <div className="space-y-2.5 max-w-md mx-auto">
        {data.fields.map(field => {
          const labelEl = (
            <label className="text-xs text-slate-600 mb-1 block">
              {field.label}
              {field.required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
          );
          if (field.type === "textarea") {
            return (
              <div key={field.id}>
                {labelEl}
                <textarea
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 placeholder:text-slate-400 min-h-[60px] resize-none"
                  placeholder={field.placeholder}
                />
              </div>
            );
          }
          if (field.type === "checkbox") {
            return (
              <label key={field.id} className="flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" className="w-3.5 h-3.5" /> {field.label}
              </label>
            );
          }
          if (field.type === "select") {
            return (
              <div key={field.id}>
                {labelEl}
                <select className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700">
                  {(field.options ?? []).map((o, i) => (
                    <option key={i} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            );
          }
          return (
            <div key={field.id}>
              {labelEl}
              <input
                type={field.type === "phone" ? "tel" : field.type}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 placeholder:text-slate-400"
                placeholder={field.placeholder}
              />
            </div>
          );
        })}
        {data.consentText && (
          <p className="text-[10px] text-slate-400 leading-relaxed pt-1">{data.consentText}</p>
        )}
        <button
          className="w-full py-2.5 rounded-full text-sm text-white mt-2"
          style={{ backgroundColor: primaryColor }}
        >
          {data.submitText}
        </button>
      </div>
    </section>
  );
}

function FooterBlock({ data, highlight }: { data: MicroFooterSchema; highlight?: boolean }) {
  const renderLink = (link: FooterLink, i: number) => {
    if (link.content?.trim()) {
      return (
        <Dialog key={i}>
          <DialogTrigger className="text-[10px] text-slate-400 hover:text-white underline">
            {link.text}
          </DialogTrigger>
          <DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto border-slate-200 bg-white text-slate-900">
            <DialogHeader>
              <DialogTitle>{link.text}</DialogTitle>
            </DialogHeader>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {link.content}
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    if (link.url?.trim()) {
      return (
        <a
          key={i}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-slate-400 hover:text-white underline"
        >
          {link.text}
        </a>
      );
    }

    return null;
  };

  return (
    <footer id="footer" className="bg-slate-800 text-white px-5 py-8 text-center" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <p className="text-sm mb-3">{data.brandName}</p>
      {data.disclaimer && (
        <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">{data.disclaimer}</p>
      )}
      <div className="flex flex-wrap justify-center gap-3 mb-3">
        {data.links.map(renderLink)}
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
      case "Countdown": return <CountdownBlock key={block.id} id={block.id} data={block.data as CountdownSchema} primaryColor={pc} highlight={hl} />;
      case "Assurance": return <AssuranceBlock key={block.id} id={block.id} data={block.data as AssuranceSchema} primaryColor={pc} highlight={hl} />;
      default: return null;
    }
  };

  return (
    <div className="relative min-h-screen bg-white font-sans">
      <HeroBlock data={template.hero} primaryColor={pc} highlight={highlightKey === "hero"} />
      {template.upperBlocks.map(renderOptional)}
      <OfferBlock data={template.offer} primaryColor={pc} highlight={highlightKey === "offer"} />
      {template.afterOffer?.map(renderOptional)}
      <HowItWorksBlock data={template.howItWorks} primaryColor={pc} highlight={highlightKey === "howItWorks"} />
      {template.lowerBlocks.map(renderOptional)}
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
      {showWatermark && (
        <div className="fixed bottom-4 right-4 z-50 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm pointer-events-none select-none">
          <div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-rose-400 to-pink-600" />
          <span className="text-xs text-slate-500">Powered by <span className="font-medium text-slate-700">PULSAR</span></span>
        </div>
      )}
    </div>
  );
}
