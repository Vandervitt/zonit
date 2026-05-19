"use client";

import {
  BarChart2, CheckCircle2, Clock, FileText, Grid3X3,
  HelpCircle, ListOrdered, MessageSquare, MousePointerClick,
  Package, Play, ShoppingBag, Shield, Sparkles,
  ArrowLeftRight, User, Zap,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ExtractedTemplate } from "@/components/template-extraction/types";
import type {
  HeroContent, FaqContent, StatsContent, OfferContent,
  ProductShowcaseContent, BeforeAfterContent, VideoTestimonialsContent,
  HowItWorksContent, TrustBannerContent, LogoWallContent, FeaturesContent,
  ReviewsContent, AuthorityContent, CountdownContent, AssuranceContent,
  FooterContent, StickyCtaContent,
} from "@/components/template-extraction/types";
import {
  HeroEditor, FaqEditor, StatsEditor, OfferEditor,
  ProductShowcaseEditor, BeforeAfterEditor, VideoTestimonialsEditor,
  HowItWorksEditor, TrustBannerEditor, LogoWallEditor, FeaturesEditor,
  ReviewsEditor, AuthorityEditor, CountdownEditor, AssuranceEditor,
  FooterEditor, StickyCtaEditor,
} from "./ExtractedBlockEditors";

// ── Module metadata ───────────────────────────────────────────────────────

const MODULE_META: Record<string, { label: string; icon: React.ReactNode }> = {
  hero:               { label: "首屏",     icon: <Zap              className="w-3.5 h-3.5 text-rose-500"   /> },
  stats:              { label: "数据",     icon: <BarChart2        className="w-3.5 h-3.5 text-amber-500"  /> },
  offer:              { label: "套餐",     icon: <Package          className="w-3.5 h-3.5 text-indigo-500" /> },
  productShowcase:    { label: "产品",     icon: <ShoppingBag      className="w-3.5 h-3.5 text-purple-500" /> },
  beforeAfter:        { label: "前后对比", icon: <ArrowLeftRight   className="w-3.5 h-3.5 text-teal-500"   /> },
  videoTestimonials:  { label: "视频见证", icon: <Play             className="w-3.5 h-3.5 text-sky-500"    /> },
  howItWorks:         { label: "流程",     icon: <ListOrdered      className="w-3.5 h-3.5 text-blue-500"   /> },
  trustBanner:        { label: "信任横幅", icon: <Shield           className="w-3.5 h-3.5 text-amber-500"  /> },
  logoWall:           { label: "媒体墙",   icon: <Grid3X3          className="w-3.5 h-3.5 text-slate-500"  /> },
  features:           { label: "特性",     icon: <Sparkles         className="w-3.5 h-3.5 text-violet-500" /> },
  reviews:            { label: "评价",     icon: <MessageSquare    className="w-3.5 h-3.5 text-emerald-500"/> },
  authority:          { label: "权威故事", icon: <User             className="w-3.5 h-3.5 text-rose-500"   /> },
  countdown:          { label: "倒计时",   icon: <Clock            className="w-3.5 h-3.5 text-orange-500" /> },
  faq:                { label: "常见问题", icon: <HelpCircle       className="w-3.5 h-3.5 text-violet-500" /> },
  assurance:          { label: "保障承诺", icon: <CheckCircle2     className="w-3.5 h-3.5 text-green-500"  /> },
  footer:             { label: "页脚",     icon: <FileText         className="w-3.5 h-3.5 text-slate-500"  /> },
  stickyCta:          { label: "悬浮按钮", icon: <MousePointerClick className="w-3.5 h-3.5 text-pink-500"  /> },
};

// ── Patch helper ──────────────────────────────────────────────────────────

function patchContent(template: ExtractedTemplate, dataKey: string, value: unknown): ExtractedTemplate {
  return { ...template, content: { ...template.content, [dataKey]: value } };
}

// ── Editor router ─────────────────────────────────────────────────────────

function renderEditor(
  type: string,
  content: unknown,
  onChange: (v: unknown) => void,
): React.ReactNode {
  const p = <T,>(editor: (props: { data: T; onChange: (d: T) => void }) => React.ReactNode) =>
    editor({ data: content as T, onChange: onChange as (d: T) => void });

  switch (type) {
    case "hero":              return p<HeroContent>(HeroEditor);
    case "faq":               return p<FaqContent>(FaqEditor);
    case "stats":             return p<StatsContent>(StatsEditor);
    case "offer":             return p<OfferContent>(OfferEditor);
    case "productShowcase":   return p<ProductShowcaseContent>(ProductShowcaseEditor);
    case "beforeAfter":       return p<BeforeAfterContent>(BeforeAfterEditor);
    case "videoTestimonials": return p<VideoTestimonialsContent>(VideoTestimonialsEditor);
    case "howItWorks":        return p<HowItWorksContent>(HowItWorksEditor);
    case "trustBanner":       return p<TrustBannerContent>(TrustBannerEditor);
    case "logoWall":          return p<LogoWallContent>(LogoWallEditor);
    case "features":          return p<FeaturesContent>(FeaturesEditor);
    case "reviews":           return p<ReviewsContent>(ReviewsEditor);
    case "authority":         return p<AuthorityContent>(AuthorityEditor);
    case "countdown":         return p<CountdownContent>(CountdownEditor);
    case "assurance":         return p<AssuranceContent>(AssuranceEditor);
    case "footer":            return p<FooterContent>(FooterEditor);
    case "stickyCta":         return p<StickyCtaContent>(StickyCtaEditor);
    default:                  return <p className="text-xs text-slate-400">此模块暂不支持编辑。</p>;
  }
}

// ── Root export ───────────────────────────────────────────────────────────

export function ExtractedTemplateEditorPanel({
  template,
  onChange,
}: {
  template: ExtractedTemplate;
  onChange: (t: ExtractedTemplate) => void;
}) {
  if (template.modules.length === 0) {
    return <div className="p-4 text-xs text-slate-400 bg-white">此模板没有可编辑的模块。</div>;
  }

  return (
    <ScrollArea className="flex-1 min-h-0 overflow-hidden bg-white">
      <Accordion type="single" collapsible className="divide-y divide-slate-100">
        {template.modules.map(mod => {
          const meta = MODULE_META[mod.type];
          const content = template.content[mod.dataKey];

          return (
            <AccordionItem key={mod.id} value={mod.id} className="border-0">
              <AccordionTrigger className="hover:no-underline py-2.5 px-4 hover:bg-slate-50 data-[state=open]:bg-slate-50 [&>svg]:text-slate-400">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                    {meta?.icon ?? <span className="text-[10px] text-slate-400">{mod.type[0]}</span>}
                  </div>
                  <p className="text-xs text-slate-700 truncate flex-1 text-left">
                    {meta?.label ?? mod.type}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="border-t border-slate-100 px-4 pb-6 pt-3">
                {!content ? (
                  <p className="text-xs text-slate-400">数据缺失。</p>
                ) : (
                  renderEditor(mod.type, content, v => onChange(patchContent(template, mod.dataKey, v)))
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </ScrollArea>
  );
}
