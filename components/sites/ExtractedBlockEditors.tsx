"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  HeroContent,
  FaqContent,
  StatsContent,
  OfferContent,
  ProductShowcaseContent,
  BeforeAfterContent,
  VideoTestimonialsContent,
  HowItWorksContent,
  TrustBannerContent,
  LogoWallContent,
  FeaturesContent,
  ReviewsContent,
  AuthorityContent,
  CountdownContent,
  AssuranceContent,
  FooterContent,
  StickyCtaContent,
} from "@/components/template-extraction/types";

// ── Style constants (light theme) ─────────────────────────────────────────

const di =
  "h-9 text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-400";
const dt =
  "text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-400 resize-none";
const card = "bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3";
const addBtn =
  "w-full h-8 text-xs border border-dashed border-slate-300 text-slate-500 hover:text-slate-700 hover:bg-slate-50 hover:border-slate-500 bg-transparent gap-1.5 rounded-md";
const delBtn =
  "h-7 w-7 shrink-0 flex items-center justify-center rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors";

// ── Shared primitives ─────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      {children}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{label}</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function DeleteButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} className={delBtn} onClick={onClick}>
      <Trash2 className="w-3 h-3" />
    </button>
  );
}

// ── HeroEditor ────────────────────────────────────────────────────────────

export function HeroEditor({ data, onChange }: { data: HeroContent; onChange: (d: HeroContent) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Badge 文字">
        <Input className={di} value={data.badge ?? ""} onChange={e => onChange({ ...data, badge: e.target.value })} placeholder="✨ Free Consultation Available" />
      </Field>
      <Field label="主标题">
        <Textarea className={`${dt} min-h-[60px]`} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} />
      </Field>
      <Field label="副标题">
        <Textarea className={`${dt} min-h-[60px]`} value={data.subtitle} onChange={e => onChange({ ...data, subtitle: e.target.value })} />
      </Field>
      <SectionDivider label="图片" />
      <Field label="背景图 URL">
        <Input className={di} value={data.background.src} onChange={e => onChange({ ...data, background: { ...data.background, src: e.target.value } })} placeholder="https://..." />
      </Field>
      {data.media && (
        <Field label="产品图 URL">
          <Input className={di} value={data.media.src} onChange={e => onChange({ ...data, media: { ...data.media!, src: e.target.value } })} placeholder="https://..." />
        </Field>
      )}
      <SectionDivider label="其他" />
      <Field label="背书文字">
        <Input className={di} value={data.trustText ?? ""} onChange={e => onChange({ ...data, trustText: e.target.value })} placeholder="Reply within 10 minutes" />
      </Field>
    </div>
  );
}

// ── FaqEditor ─────────────────────────────────────────────────────────────

export function FaqEditor({ data, onChange }: { data: FaqContent; onChange: (d: FaqContent) => void }) {
  const add = () => onChange({ ...data, items: [...data.items, { id: crypto.randomUUID(), question: "Your question here?", answer: "Your answer here." }] });
  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Input className={di} value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value || undefined })} /></Field>
      <SectionDivider label="问答列表" />
      <div className="space-y-2">
        {data.items.map((item, i) => (
          <div key={item.id} className={card}>
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <Field label="问题"><Input className={`${di} h-8`} value={item.question} onChange={e => onChange({ ...data, items: data.items.map((it, ii) => ii === i ? { ...it, question: e.target.value } : it) })} /></Field>
              </div>
              <DeleteButton label="删除此问题" onClick={() => onChange({ ...data, items: data.items.filter((_, ii) => ii !== i) })} />
            </div>
            <Field label="回答"><Textarea className={`${dt} min-h-[60px]`} value={item.answer} onChange={e => onChange({ ...data, items: data.items.map((it, ii) => ii === i ? { ...it, answer: e.target.value } : it) })} /></Field>
          </div>
        ))}
        <Button variant="ghost" size="sm" className={addBtn} onClick={add}><Plus className="w-3 h-3" />添加问题</Button>
      </div>
    </div>
  );
}

// ── StatsEditor ───────────────────────────────────────────────────────────

export function StatsEditor({ data, onChange }: { data: StatsContent; onChange: (d: StatsContent) => void }) {
  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Textarea className={`${dt} min-h-[50px]`} value={data.subtitle} onChange={e => onChange({ ...data, subtitle: e.target.value })} /></Field>
      <SectionDivider label="数据项" />
      <div className="space-y-2">
        {data.items.map((item, i) => (
          <div key={item.id} className={card}>
            <div className="grid grid-cols-2 gap-2">
              <Field label="数值"><Input className={`${di} h-8`} value={item.value} onChange={e => onChange({ ...data, items: data.items.map((it, ii) => ii === i ? { ...it, value: e.target.value } : it) })} /></Field>
              <Field label="标签"><Input className={`${di} h-8`} value={item.label} onChange={e => onChange({ ...data, items: data.items.map((it, ii) => ii === i ? { ...it, label: e.target.value } : it) })} /></Field>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── OfferEditor ───────────────────────────────────────────────────────────

export function OfferEditor({ data, onChange }: { data: OfferContent; onChange: (d: OfferContent) => void }) {
  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Input className={di} value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value || undefined })} /></Field>
      <SectionDivider label="选项列表" />
      <div className="space-y-2">
        {data.options.map((opt, i) => (
          <div key={opt.id} className={card}>
            <Field label="名称"><Input className={`${di} h-8`} value={opt.name} onChange={e => onChange({ ...data, options: data.options.map((o, ii) => ii === i ? { ...o, name: e.target.value } : o) })} /></Field>
            <Field label="描述"><Textarea className={`${dt} min-h-[50px]`} value={opt.description} onChange={e => onChange({ ...data, options: data.options.map((o, ii) => ii === i ? { ...o, description: e.target.value } : o) })} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Badge"><Input className={`${di} h-8`} value={opt.badge ?? ""} onChange={e => onChange({ ...data, options: data.options.map((o, ii) => ii === i ? { ...o, badge: e.target.value || undefined } : o) })} /></Field>
              <Field label="紧迫提示"><Input className={`${di} h-8`} value={opt.urgencyText ?? ""} onChange={e => onChange({ ...data, options: data.options.map((o, ii) => ii === i ? { ...o, urgencyText: e.target.value || undefined } : o) })} /></Field>
            </div>
            <Field label="价值点（每行一条）">
              <Textarea
                className={`${dt} min-h-[70px]`}
                value={opt.valueProps.join("\n")}
                onChange={e => onChange({ ...data, options: data.options.map((o, ii) => ii === i ? { ...o, valueProps: e.target.value.split("\n") } : o) })}
              />
            </Field>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ProductShowcaseEditor ─────────────────────────────────────────────────

export function ProductShowcaseEditor({ data, onChange }: { data: ProductShowcaseContent; onChange: (d: ProductShowcaseContent) => void }) {
  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Textarea className={`${dt} min-h-[50px]`} value={data.subtitle} onChange={e => onChange({ ...data, subtitle: e.target.value })} /></Field>
      <SectionDivider label="产品列表" />
      <div className="space-y-2">
        {data.items.map((item, i) => (
          <div key={item.id} className={card}>
            <Field label="名称"><Input className={`${di} h-8`} value={item.title} onChange={e => onChange({ ...data, items: data.items.map((it, ii) => ii === i ? { ...it, title: e.target.value } : it) })} /></Field>
            <Field label="描述"><Textarea className={`${dt} min-h-[50px]`} value={item.description} onChange={e => onChange({ ...data, items: data.items.map((it, ii) => ii === i ? { ...it, description: e.target.value } : it) })} /></Field>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── BeforeAfterEditor ─────────────────────────────────────────────────────

export function BeforeAfterEditor({ data, onChange }: { data: BeforeAfterContent; onChange: (d: BeforeAfterContent) => void }) {
  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Textarea className={`${dt} min-h-[50px]`} value={data.subtitle} onChange={e => onChange({ ...data, subtitle: e.target.value })} /></Field>
      {data.disclaimer && (
        <Field label="免责声明">
          <Textarea className={`${dt} min-h-[50px]`} value={data.disclaimer} onChange={e => onChange({ ...data, disclaimer: e.target.value })} />
        </Field>
      )}
      <SectionDivider label="案例列表" />
      <div className="space-y-2">
        {data.items.map((item, i) => (
          <div key={item.id} className={card}>
            <div className="grid grid-cols-2 gap-2">
              <Field label="客户名"><Input className={`${di} h-8`} value={item.name} onChange={e => onChange({ ...data, items: data.items.map((it, ii) => ii === i ? { ...it, name: e.target.value } : it) })} /></Field>
              <Field label="周期"><Input className={`${di} h-8`} value={item.duration} onChange={e => onChange({ ...data, items: data.items.map((it, ii) => ii === i ? { ...it, duration: e.target.value } : it) })} /></Field>
            </div>
            <Field label="问题描述"><Input className={`${di} h-8`} value={item.concern} onChange={e => onChange({ ...data, items: data.items.map((it, ii) => ii === i ? { ...it, concern: e.target.value } : it) })} /></Field>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── VideoTestimonialsEditor ───────────────────────────────────────────────

export function VideoTestimonialsEditor({ data, onChange }: { data: VideoTestimonialsContent; onChange: (d: VideoTestimonialsContent) => void }) {
  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Textarea className={`${dt} min-h-[50px]`} value={data.subtitle} onChange={e => onChange({ ...data, subtitle: e.target.value })} /></Field>
      {data.closingText !== undefined && (
        <Field label="结尾文字"><Input className={di} value={data.closingText} onChange={e => onChange({ ...data, closingText: e.target.value })} /></Field>
      )}
      <SectionDivider label="视频列表" />
      <div className="space-y-2">
        {data.items.map((item, i) => (
          <div key={item.id} className={card}>
            <div className="grid grid-cols-2 gap-2">
              <Field label="客户名"><Input className={`${di} h-8`} value={item.name} onChange={e => onChange({ ...data, items: data.items.map((it, ii) => ii === i ? { ...it, name: e.target.value } : it) })} /></Field>
              <Field label="时长"><Input className={`${di} h-8`} value={item.duration} onChange={e => onChange({ ...data, items: data.items.map((it, ii) => ii === i ? { ...it, duration: e.target.value } : it) })} /></Field>
            </div>
            <Field label="标题"><Input className={`${di} h-8`} value={item.title} onChange={e => onChange({ ...data, items: data.items.map((it, ii) => ii === i ? { ...it, title: e.target.value } : it) })} /></Field>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HowItWorksEditor ──────────────────────────────────────────────────────

export function HowItWorksEditor({ data, onChange }: { data: HowItWorksContent; onChange: (d: HowItWorksContent) => void }) {
  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Input className={di} value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value || undefined })} /></Field>
      <SectionDivider label="步骤列表" />
      <div className="space-y-2">
        {data.steps.map((step, i) => (
          <div key={step.id} className={card}>
            <Field label="标题"><Input className={`${di} h-8`} value={step.title} onChange={e => onChange({ ...data, steps: data.steps.map((s, ii) => ii === i ? { ...s, title: e.target.value } : s) })} /></Field>
            <Field label="描述"><Textarea className={`${dt} min-h-[50px]`} value={step.description} onChange={e => onChange({ ...data, steps: data.steps.map((s, ii) => ii === i ? { ...s, description: e.target.value } : s) })} /></Field>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TrustBannerEditor ─────────────────────────────────────────────────────

export function TrustBannerEditor({ data, onChange }: { data: TrustBannerContent; onChange: (d: TrustBannerContent) => void }) {
  return (
    <div className="space-y-4">
      <Field label="背景图 URL">
        <Input className={di} value={data.background.src} onChange={e => onChange({ ...data, background: { ...data.background, src: e.target.value } })} placeholder="https://..." />
      </Field>
      <SectionDivider label="信任徽章" />
      <div className="space-y-2">
        {data.badges.map((badge, i) => (
          <div key={badge.id} className={card}>
            <div className="grid grid-cols-2 gap-2">
              <Field label="主文案"><Input className={`${di} h-8`} value={badge.text} onChange={e => onChange({ ...data, badges: data.badges.map((b, ii) => ii === i ? { ...b, text: e.target.value } : b) })} /></Field>
              <Field label="副文案"><Input className={`${di} h-8`} value={badge.subtext ?? ""} onChange={e => onChange({ ...data, badges: data.badges.map((b, ii) => ii === i ? { ...b, subtext: e.target.value || undefined } : b) })} /></Field>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── LogoWallEditor ────────────────────────────────────────────────────────

export function LogoWallEditor({ data, onChange }: { data: LogoWallContent; onChange: (d: LogoWallContent) => void }) {
  const add = () => onChange({ ...data, logos: [...data.logos, { id: crypto.randomUUID(), src: "", alt: "" }] });
  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title ?? ""} onChange={e => onChange({ ...data, title: e.target.value || undefined })} /></Field>
      <SectionDivider label="Logo 列表" />
      <div className="space-y-2">
        {data.logos.map((logo, i) => (
          <div key={logo.id} className={card}>
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <Field label="图片 URL"><Input className={`${di} h-8`} value={logo.src} onChange={e => onChange({ ...data, logos: data.logos.map((l, ii) => ii === i ? { ...l, src: e.target.value } : l) })} placeholder="https://..." /></Field>
                <Field label="Alt 文字"><Input className={`${di} h-8`} value={logo.alt} onChange={e => onChange({ ...data, logos: data.logos.map((l, ii) => ii === i ? { ...l, alt: e.target.value } : l) })} /></Field>
              </div>
              <DeleteButton label="删除此 Logo" onClick={() => onChange({ ...data, logos: data.logos.filter((_, ii) => ii !== i) })} />
            </div>
          </div>
        ))}
        <Button variant="ghost" size="sm" className={addBtn} onClick={add}><Plus className="w-3 h-3" />添加 Logo</Button>
      </div>
    </div>
  );
}

// ── FeaturesEditor ────────────────────────────────────────────────────────

export function FeaturesEditor({ data, onChange }: { data: FeaturesContent; onChange: (d: FeaturesContent) => void }) {
  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Input className={di} value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value || undefined })} /></Field>
      <SectionDivider label="特性列表" />
      <div className="space-y-2">
        {data.items.map((item, i) => (
          <div key={item.id} className={card}>
            <Field label="标题"><Input className={`${di} h-8`} value={item.title} onChange={e => onChange({ ...data, items: data.items.map((it, ii) => ii === i ? { ...it, title: e.target.value } : it) })} /></Field>
            <Field label="描述"><Textarea className={`${dt} min-h-[50px]`} value={item.description} onChange={e => onChange({ ...data, items: data.items.map((it, ii) => ii === i ? { ...it, description: e.target.value } : it) })} /></Field>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ReviewsEditor ─────────────────────────────────────────────────────────

export function ReviewsEditor({ data, onChange }: { data: ReviewsContent; onChange: (d: ReviewsContent) => void }) {
  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Input className={di} value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value || undefined })} /></Field>
      {data.ratingSummary && (
        <Field label="评分说明">
          <Input className={di} value={data.ratingSummary.totalLabel ?? ""} onChange={e => onChange({ ...data, ratingSummary: { ...data.ratingSummary!, totalLabel: e.target.value } })} placeholder="Based on 2,847 reviews" />
        </Field>
      )}
      <SectionDivider label="评价列表" />
      <div className="space-y-2">
        {data.items.map((item, i) => (
          <div key={item.id} className={card}>
            <div className="grid grid-cols-2 gap-2">
              <Field label="客户名"><Input className={`${di} h-8`} value={item.authorName} onChange={e => onChange({ ...data, items: data.items.map((it, ii) => ii === i ? { ...it, authorName: e.target.value } : it) })} /></Field>
              <Field label="身份"><Input className={`${di} h-8`} value={item.authorRole ?? ""} onChange={e => onChange({ ...data, items: data.items.map((it, ii) => ii === i ? { ...it, authorRole: e.target.value || undefined } : it) })} /></Field>
            </div>
            <Field label="评价内容"><Textarea className={`${dt} min-h-[60px]`} value={item.content} onChange={e => onChange({ ...data, items: data.items.map((it, ii) => ii === i ? { ...it, content: e.target.value } : it) })} /></Field>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AuthorityEditor ───────────────────────────────────────────────────────

export function AuthorityEditor({ data, onChange }: { data: AuthorityContent; onChange: (d: AuthorityContent) => void }) {
  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Input className={di} value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value || undefined })} /></Field>
      <Field label="正文段落（每段空一行）">
        <Textarea
          className={`${dt} min-h-[100px]`}
          value={data.paragraphs.join("\n\n")}
          onChange={e => onChange({ ...data, paragraphs: e.target.value.split(/\n{2,}/) })}
        />
      </Field>
      {data.signature && (
        <>
          <SectionDivider label="署名" />
          <div className="grid grid-cols-2 gap-2">
            <Field label="姓名"><Input className={`${di} h-8`} value={data.signature.name} onChange={e => onChange({ ...data, signature: { ...data.signature!, name: e.target.value } })} /></Field>
            <Field label="职位"><Input className={`${di} h-8`} value={data.signature.role} onChange={e => onChange({ ...data, signature: { ...data.signature!, role: e.target.value } })} /></Field>
          </div>
        </>
      )}
    </div>
  );
}

// ── CountdownEditor ───────────────────────────────────────────────────────

export function CountdownEditor({ data, onChange }: { data: CountdownContent; onChange: (d: CountdownContent) => void }) {
  // Convert ISO → datetime-local string and back
  const toLocal = (iso: string) => iso.slice(0, 16);
  const fromLocal = (local: string) => local ? new Date(local).toISOString() : data.endsAt;

  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title ?? ""} onChange={e => onChange({ ...data, title: e.target.value || undefined })} /></Field>
      <Field label="副标题"><Textarea className={`${dt} min-h-[50px]`} value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value || undefined })} /></Field>
      <Field label="截止时间">
        <input
          type="datetime-local"
          className={`${di} w-full px-3`}
          value={toLocal(data.endsAt)}
          onChange={e => onChange({ ...data, endsAt: fromLocal(e.target.value) })}
        />
      </Field>
      <SectionDivider label="过期后显示" />
      <Field label="标题"><Input className={di} value={data.expiredFallback?.title ?? ""} onChange={e => onChange({ ...data, expiredFallback: { ...data.expiredFallback, title: e.target.value || undefined } })} /></Field>
      <Field label="副标题"><Input className={di} value={data.expiredFallback?.subtitle ?? ""} onChange={e => onChange({ ...data, expiredFallback: { ...data.expiredFallback, subtitle: e.target.value || undefined } })} /></Field>
    </div>
  );
}

// ── AssuranceEditor ───────────────────────────────────────────────────────

export function AssuranceEditor({ data, onChange }: { data: AssuranceContent; onChange: (d: AssuranceContent) => void }) {
  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Input className={di} value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value || undefined })} /></Field>
      <Field label="描述"><Textarea className={`${dt} min-h-[60px]`} value={data.description ?? ""} onChange={e => onChange({ ...data, description: e.target.value || undefined })} /></Field>
      <Field label="结尾文字"><Input className={di} value={data.closingText ?? ""} onChange={e => onChange({ ...data, closingText: e.target.value || undefined })} /></Field>
      {data.badges && data.badges.length > 0 && (
        <>
          <SectionDivider label="保障徽章" />
          <div className="space-y-2">
            {data.badges.map((badge, i) => (
              <div key={badge.id} className={card}>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="主文案"><Input className={`${di} h-8`} value={badge.text} onChange={e => onChange({ ...data, badges: data.badges!.map((b, ii) => ii === i ? { ...b, text: e.target.value } : b) })} /></Field>
                  <Field label="副文案"><Input className={`${di} h-8`} value={badge.subtext ?? ""} onChange={e => onChange({ ...data, badges: data.badges!.map((b, ii) => ii === i ? { ...b, subtext: e.target.value || undefined } : b) })} /></Field>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── FooterEditor ──────────────────────────────────────────────────────────

export function FooterEditor({ data, onChange }: { data: FooterContent; onChange: (d: FooterContent) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Field label="品牌名称"><Input className={`${di} h-8`} value={data.brandName} onChange={e => onChange({ ...data, brandName: e.target.value })} /></Field>
        <Field label="版权年份"><Input className={`${di} h-8`} value={data.copyrightYear} onChange={e => onChange({ ...data, copyrightYear: e.target.value })} /></Field>
      </div>
      <Field label="联系邮箱"><Input className={di} value={data.contactEmail ?? ""} onChange={e => onChange({ ...data, contactEmail: e.target.value || undefined })} type="email" /></Field>
      {data.socialLinks && data.socialLinks.length > 0 && (
        <>
          <SectionDivider label="社交链接" />
          <div className="space-y-2">
            {data.socialLinks.map((link, i) => (
              <div key={link.platform} className={card}>
                <div className="grid grid-cols-3 gap-2 items-end">
                  <Field label="平台"><Input className={`${di} h-8 opacity-60`} value={link.platform} readOnly /></Field>
                  <div className="col-span-2">
                    <Field label="URL"><Input className={`${di} h-8`} value={link.url} onChange={e => onChange({ ...data, socialLinks: data.socialLinks!.map((l, ii) => ii === i ? { ...l, url: e.target.value } : l) })} placeholder="https://..." /></Field>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <SectionDivider label="页脚链接" />
      <div className="space-y-2">
        {data.links.map((link, i) => (
          <div key={i} className={card}>
            <Field label="链接文字"><Input className={`${di} h-8`} value={link.text} onChange={e => onChange({ ...data, links: data.links.map((l, ii) => ii === i ? { ...l, text: e.target.value } : l) })} /></Field>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── StickyCtaEditor ───────────────────────────────────────────────────────

export function StickyCtaEditor({ data, onChange }: { data: StickyCtaContent; onChange: (d: StickyCtaContent) => void }) {
  return (
    <div className="space-y-4">
      <Field label="按钮文字"><Input className={di} value={data.text} onChange={e => onChange({ ...data, text: e.target.value })} /></Field>
    </div>
  );
}
