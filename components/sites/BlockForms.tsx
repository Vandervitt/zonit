import { Plus, X } from "lucide-react";
import { BackgroundType } from "@/lib/constants";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ImagePickerField } from "./ImagePickerField";
import type {
  HeroSchema,
  OfferSchema,
  OfferOption,
  HowItWorksSchema,
  StepItem,
  MicroFooterSchema,
  FooterLink,
  FeaturesSchema,
  FeatureItem,
  ReviewsSchema,
  ReviewItem,
  TrustBannerSchema,
  TrustBadge,
  AuthoritySchema,
  FAQSchema,
  FAQItem,
  CallToAction,
  CountdownSchema,
  AssuranceSchema,
  AssuranceBadge,
  LeadFormSchema,
  LeadFormExtraField,
  LeadFormExtraFieldType,
  PixelEventName,
  CtaChannel,
  LeadDestination,
  StickyCtaConfig,
} from "@/types/schema";

// ── Dark style constants ────────────────────────────────────────────────────

const di = "h-9 text-sm bg-zinc-800/60 border-zinc-700/70 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-500/60 focus-visible:border-zinc-600";
const dt = "text-sm bg-zinc-800/60 border-zinc-700/70 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-500/60 focus-visible:border-zinc-600 resize-none";
const dst = "h-9 text-sm bg-zinc-800/60 border-zinc-700/70 text-zinc-100 hover:bg-zinc-800 data-[placeholder]:text-zinc-600";
const dsc = "bg-zinc-900 border-zinc-700/80 text-zinc-200";
const dsi = "text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100 text-sm";
const card = "bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4 space-y-3";
const addBtn = "w-full h-8 text-xs border border-dashed border-zinc-700 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60 hover:border-zinc-600 bg-transparent gap-1.5 rounded-md";
const delBtn = "h-7 w-7 shrink-0 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors";

// ── Shared helpers ──────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium block">{label}</label>
      {children}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className="text-[11px] uppercase tracking-widest text-zinc-600 font-medium whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  );
}

const ICON_OPTIONS = [
  "WhatsApp", "Telegram", "Line", "Phone", "Mail", "ArrowRight",
  "Star", "Shield", "Calendar", "Check", "Heart", "Award", "Zap",
  "MessageCircle", "Headphones", "Users",
  "TrendingUp", "Clock", "Leaf", "Globe",
];

const LEAD_EVENT_OPTIONS: PixelEventName[] = [
  "Lead",
  "Contact",
  "FormSubmit",
  "WhatsAppClick",
  "TelegramClick",
  "LineClick",
  "PhoneClick",
  "EmailClick",
  "ScheduleClick",
  "QuoteRequest",
];

const CTA_CHANNEL_OPTIONS: CtaChannel[] = [
  "whatsapp",
  "telegram",
  "line",
  "phone",
  "email",
  "form",
  "booking",
  "consultation_link",
];

function destinationValue(destination: LeadDestination): string {
  switch (destination.type) {
    case "phone":
      return destination.phone;
    case "email":
      return destination.email;
    case "form":
      return destination.formId;
    default:
      return destination.url;
  }
}

function destinationForChannel(channel: CtaChannel, value: string): LeadDestination {
  switch (channel) {
    case "phone":
      return { type: "phone", phone: value };
    case "email":
      return { type: "email", email: value };
    case "form":
      return { type: "form", formId: value };
    case "whatsapp":
      return { type: "whatsapp", url: value };
    case "telegram":
      return { type: "telegram", url: value };
    case "line":
      return { type: "line", url: value };
    case "booking":
      return { type: "booking", url: value };
    case "consultation_link":
      return { type: "consultation_link", url: value };
  }
}

function ctaWithChannel(value: CallToAction, channel: CtaChannel): CallToAction {
  return {
    ...value,
    channel,
    destination: destinationForChannel(channel, destinationValue(value.destination)),
  } as CallToAction;
}

function ctaWithDestinationValue(value: CallToAction, destinationValue: string): CallToAction {
  return {
    ...value,
    destination: destinationForChannel(value.channel, destinationValue),
  } as CallToAction;
}

function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={dst}>
        <SelectValue placeholder="选择图标" />
      </SelectTrigger>
      <SelectContent className={dsc}>
        {ICON_OPTIONS.map(icon => (
          <SelectItem key={icon} value={icon} className={dsi}>{icon}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CtaFields({ value, onChange }: { value: CallToAction; onChange: (v: CallToAction) => void }) {
  return (
    <div className={`space-y-2.5 ${card}`}>
      <SectionDivider label="行动按钮 CTA" />
      <div className="grid grid-cols-2 gap-2">
        <Field label="按钮文案">
          <Input className={di} value={value.text} onChange={e => onChange({ ...value, text: e.target.value })} placeholder="Chat on WhatsApp" />
        </Field>
        <Field label="转化目标">
          <Input className={di} value={destinationValue(value.destination)} onChange={e => onChange(ctaWithDestinationValue(value, e.target.value))} placeholder="https://wa.me/... / phone / email / form id" />
        </Field>
        <Field label="图标">
          <IconSelect value={value.icon ?? ""} onChange={v => onChange({ ...value, icon: v })} />
        </Field>
        <Field label="引流渠道">
          <Select value={value.channel ?? "form"} onValueChange={v => onChange(ctaWithChannel(value, v as CtaChannel))}>
            <SelectTrigger className={dst}><SelectValue /></SelectTrigger>
            <SelectContent className={dsc}>
              {CTA_CHANNEL_OPTIONS.map(channel => (
                <SelectItem key={channel} value={channel} className={dsi}>{channel}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  );
}

// ── Countdown helpers ───────────────────────────────────────────────────────

// datetime-local input <-> ISO string 互转
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function localInputToIso(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  return isNaN(d.getTime()) ? "" : d.toISOString();
}

const DEFAULT_STICKY_CTA: StickyCtaConfig = {
  text: "Chat on WhatsApp",
  icon: "WhatsApp",
  channel: "whatsapp",
  destination: { type: "whatsapp", url: "https://wa.me/1234567890" },
};

// ── HeroForm ────────────────────────────────────────────────────────────────

export function HeroForm({ data, onChange }: { data: HeroSchema; onChange: (d: HeroSchema) => void }) {
  return (
    <div className="space-y-4">
      <Field label="顶部标签 Badge">
        <Input className={di} value={data.badge ?? ""} onChange={e => onChange({ ...data, badge: e.target.value })} placeholder="🔥 Limited Time Offer" />
      </Field>
      <Field label="主标题">
        <Textarea className={`${dt} min-h-[60px]`} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} placeholder="Your Main Headline" />
      </Field>
      <Field label="副标题">
        <Textarea className={`${dt} min-h-[60px]`} value={data.subtitle} onChange={e => onChange({ ...data, subtitle: e.target.value })} placeholder="Supporting text that describes your offer..." />
      </Field>
      <SectionDivider label="背景设置" />
      <Field label="类型">
        <Select
          value={data.background.type}
          onValueChange={v =>
            onChange({ ...data, background: { ...data.background, type: v as "color" | "image" | "video", value: "" } })
          }
        >
          <SelectTrigger className={dst}><SelectValue /></SelectTrigger>
          <SelectContent className={dsc}>
            <SelectItem value={BackgroundType.Color} className={dsi}>纯色</SelectItem>
            <SelectItem value={BackgroundType.Image} className={dsi}>图片</SelectItem>
            <SelectItem value={BackgroundType.Video} className={dsi}>视频</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {data.background.type === BackgroundType.Image ? (
        <ImagePickerField
          label="背景图片"
          value={data.background.value}
          onChange={value => onChange({ ...data, background: { ...data.background, value } })}
        />
      ) : (
        <Field label={data.background.type === BackgroundType.Color ? "颜色 Hex" : "视频 URL"}>
          <Input
            className={di}
            value={data.background.value}
            onChange={e => onChange({ ...data, background: { ...data.background, value: e.target.value } })}
            placeholder={data.background.type === BackgroundType.Color ? "#f0f4ff" : "https://..."}
          />
        </Field>
      )}
      <SectionDivider label="转化" />
      <CtaFields value={data.cta} onChange={cta => onChange({ ...data, cta })} />
      <Field label="按钮下方背书文字">
        <Input className={di} value={data.trustText ?? ""} onChange={e => onChange({ ...data, trustText: e.target.value })} placeholder="✓ No credit card required" />
      </Field>
    </div>
  );
}

// ── CountdownForm ───────────────────────────────────────────────────────────

export function CountdownForm({ data, onChange }: { data: CountdownSchema; onChange: (d: CountdownSchema) => void }) {
  return (
    <div className={`space-y-3 ${card}`}>
      <Field label="结束时间">
        <Input
          className={di}
          type="datetime-local"
          value={isoToLocalInput(data.endsAt)}
          onChange={e => onChange({ ...data, endsAt: localInputToIso(e.target.value) || data.endsAt })}
        />
      </Field>
      <Field label="标题">
        <Input className={di} value={data.title ?? ""} onChange={e => onChange({ ...data, title: e.target.value })} placeholder="Limited-Time Offer" />
      </Field>
      <Field label="副标题">
        <Input className={di} value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value })} placeholder="Consultation slots are limited this week" />
      </Field>
      <SectionDivider label="过期兜底" />
      <div className="grid grid-cols-2 gap-2">
        <Field label="过期标题">
          <Input className={di} value={data.expiredFallback?.title ?? ""} onChange={e => onChange({ ...data, expiredFallback: { ...data.expiredFallback, title: e.target.value } })} placeholder="Offer Ended" />
        </Field>
        <Field label="过期副标题">
          <Input className={di} value={data.expiredFallback?.subtitle ?? ""} onChange={e => onChange({ ...data, expiredFallback: { ...data.expiredFallback, subtitle: e.target.value } })} placeholder="Stay tuned" />
        </Field>
      </div>
    </div>
  );
}

// ── StickyCtaEditor ─────────────────────────────────────────────────────────

export function StickyCtaEditor({ value, onChange }: { value: StickyCtaConfig | undefined; onChange: (v: StickyCtaConfig | undefined) => void }) {
  if (!value) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-zinc-500 leading-relaxed">
          全站底部悬浮按钮，移动端用户无论滑到哪里都能看到。常用于 WhatsApp/Telegram 直跳，是海外移动端转化主力。
        </p>
        <Button variant="ghost" size="sm" className={addBtn} onClick={() => onChange(DEFAULT_STICKY_CTA)}>
          <Plus className="w-3 h-3" />启用全站浮动按钮
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <CtaFields value={value} onChange={cta => onChange({ ...cta, position: value.position, showAfterScrollPercent: value.showAfterScrollPercent })} />
      <Button
        variant="ghost"
        size="sm"
        className="w-full h-8 text-xs border border-dashed border-rose-900/40 text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 hover:border-rose-800 bg-transparent gap-1.5 rounded-md"
        onClick={() => onChange(undefined)}
      >
        <X className="w-3 h-3" />停用全站浮动按钮
      </Button>
    </div>
  );
}

// ── OfferForm ────────────────────────────────────────────────────────────────

function OptionEditor({ option, onChange, onRemove, index }: { option: OfferOption; onChange: (option: OfferOption) => void; onRemove: () => void; index: number }) {
  const addProp = () => onChange({ ...option, valueProps: [...option.valueProps, "New value prop"] });
  const updateProp = (i: number, val: string) => onChange({ ...option, valueProps: option.valueProps.map((f, fi) => fi === i ? val : f) });
  const removeProp = (i: number) => onChange({ ...option, valueProps: option.valueProps.filter((_, fi) => fi !== i) });

  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">方案 {index + 1}</span>
        <button className={delBtn} onClick={onRemove}><X className="w-3 h-3" /></button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="名称"><Input className={`${di} h-8`} value={option.name} onChange={e => onChange({ ...option, name: e.target.value })} /></Field>
        <Field label="徽章"><Input className={`${di} h-8`} value={option.badge ?? ""} onChange={e => onChange({ ...option, badge: e.target.value || undefined })} placeholder="Free Quote" /></Field>
        <Field label="紧迫文案"><Input className={`${di} h-8`} value={option.urgencyText ?? ""} onChange={e => onChange({ ...option, urgencyText: e.target.value })} placeholder="仅剩 5 名额" /></Field>
      </div>
      <Field label="简介"><Input className={`${di} h-8`} value={option.description} onChange={e => onChange({ ...option, description: e.target.value })} /></Field>
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium block">核心价值点</label>
        <div className="space-y-1">
          {option.valueProps.map((f, i) => (
            <div key={i} className="flex gap-1 items-center">
              <Input className={`${di} h-7 flex-1`} value={f} onChange={e => updateProp(i, e.target.value)} />
              <button className={delBtn} onClick={() => removeProp(i)}><X className="w-3 h-3" /></button>
            </div>
          ))}
          <Button variant="ghost" size="sm" className={addBtn} onClick={addProp}><Plus className="w-3 h-3" />添加价值点</Button>
        </div>
      </div>
      <ImagePickerField
        label="方案配图"
        value={option.image ?? ""}
        onChange={url => onChange({ ...option, image: url || undefined })}
      />
      <CtaFields value={option.cta} onChange={cta => onChange({ ...option, cta })} />
    </div>
  );
}

export function OfferForm({ data, onChange }: { data: OfferSchema; onChange: (d: OfferSchema) => void }) {
  const addOption = () => {
    const newOption: OfferOption = {
      id: crypto.randomUUID(),
      name: "New Option",
      description: "Option description",
      valueProps: ["Value prop 1", "Value prop 2"],
      cta: { text: "Contact Us", icon: "WhatsApp", channel: "whatsapp", destination: { type: "whatsapp", url: "https://wa.me/1234567890" } },
    };
    onChange({ ...data, options: [...data.options, newOption] });
  };
  const updateOption = (i: number, option: OfferOption) => onChange({ ...data, options: data.options.map((item, idx) => idx === i ? option : item) });
  const removeOption = (i: number) => onChange({ ...data, options: data.options.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Input className={di} value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value })} /></Field>
      <SectionDivider label="方案" />
      <div className="space-y-2">
        {data.options.map((option, i) => (
          <OptionEditor key={option.id} option={option} index={i} onChange={item => updateOption(i, item)} onRemove={() => removeOption(i)} />
        ))}
        {data.options.length < 3 && (
          <Button variant="ghost" size="sm" className={addBtn} onClick={addOption}>
            <Plus className="w-3 h-3" />添加方案
          </Button>
        )}
      </div>
    </div>
  );
}

// ── HowItWorksForm ──────────────────────────────────────────────────────────

function StepEditor({ step, onChange, onRemove, index }: { step: StepItem; onChange: (s: StepItem) => void; onRemove: () => void; index: number }) {
  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">步骤 {index + 1}</span>
        <button className={delBtn} onClick={onRemove}><X className="w-3 h-3" /></button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="图标"><IconSelect value={step.icon} onChange={v => onChange({ ...step, icon: v })} /></Field>
        <Field label="标题"><Input className={`${di} h-8`} value={step.title} onChange={e => onChange({ ...step, title: e.target.value })} /></Field>
      </div>
      <Field label="描述"><Textarea className={`${dt} min-h-[50px]`} value={step.description} onChange={e => onChange({ ...step, description: e.target.value })} /></Field>
    </div>
  );
}

export function HowItWorksForm({ data, onChange }: { data: HowItWorksSchema; onChange: (d: HowItWorksSchema) => void }) {
  const addStep = () => {
    const newStep: StepItem = { id: crypto.randomUUID(), icon: "Check", title: "New Step", description: "Describe this step." };
    onChange({ ...data, steps: [...data.steps, newStep] });
  };
  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Input className={di} value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value })} /></Field>
      <SectionDivider label="步骤" />
      <div className="space-y-2">
        {data.steps.map((step, i) => (
          <StepEditor key={step.id} step={step} index={i} onChange={s => onChange({ ...data, steps: data.steps.map((st, si) => si === i ? s : st) })} onRemove={() => onChange({ ...data, steps: data.steps.filter((_, si) => si !== i) })} />
        ))}
        <Button variant="ghost" size="sm" className={addBtn} onClick={addStep}>
          <Plus className="w-3 h-3" />添加步骤
        </Button>
      </div>
    </div>
  );
}

// ── FooterForm ──────────────────────────────────────────────────────────────

export function FooterForm({ data, onChange }: { data: MicroFooterSchema; onChange: (d: MicroFooterSchema) => void }) {
  const defaultLink: FooterLink = { text: "Privacy Policy", content: "Add privacy policy content here." };
  const updateLinks = (links: FooterLink[]) => onChange({ ...data, links: links.length ? [links[0], ...links.slice(1)] : [defaultLink] });
  const addLink = () => updateLinks([...data.links, { text: "Policy Link", content: "Add policy content here." }]);
  const updateLink = (i: number, link: FooterLink) => updateLinks(data.links.map((l, li) => li === i ? link : l));
  const removeLink = (i: number) => updateLinks(data.links.filter((_, li) => li !== i));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Field label="品牌名称"><Input className={di} value={data.brandName} onChange={e => onChange({ ...data, brandName: e.target.value })} /></Field>
        <Field label="版权年份"><Input className={di} value={data.copyrightYear} onChange={e => onChange({ ...data, copyrightYear: e.target.value })} /></Field>
      </div>
      <Field label="联系邮箱"><Input className={di} value={data.contactEmail ?? ""} onChange={e => onChange({ ...data, contactEmail: e.target.value })} /></Field>
      <SectionDivider label="链接" />
      <div className="space-y-2">
        {data.links.map((link, i) => (
          <div key={i} className="rounded-lg border border-zinc-700/50 bg-zinc-800/20 p-2 space-y-2">
            <div className="flex gap-1.5 items-center">
              <Input className={`${di} h-7 flex-1`} placeholder="文案" value={link.text} onChange={e => updateLink(i, { ...link, text: e.target.value })} />
              <Input className={`${di} h-7 flex-1`} placeholder="外跳 URL（可选）" value={link.url ?? ""} onChange={e => updateLink(i, { ...link, url: e.target.value || undefined })} />
              <button className={delBtn} onClick={() => removeLink(i)}><X className="w-3 h-3" /></button>
            </div>
            <Textarea
              className={`${dt} min-h-[72px]`}
              placeholder="弹窗正文（有值时优先弹窗展示）"
              value={link.content ?? ""}
              onChange={e => updateLink(i, { ...link, content: e.target.value || undefined })}
            />
          </div>
        ))}
        <Button variant="ghost" size="sm" className={addBtn} onClick={addLink}><Plus className="w-3 h-3" />添加链接</Button>
      </div>
      <Field label="免责声明">
        <Textarea className={`${dt} min-h-[60px]`} value={data.disclaimer ?? ""} onChange={e => onChange({ ...data, disclaimer: e.target.value })} placeholder="Investment involves risk..." />
      </Field>
    </div>
  );
}

// ── FeaturesForm ─────────────────────────────────────────────────────────────

function FeatureEditor({ item, onChange, onRemove }: { item: FeatureItem; onChange: (i: FeatureItem) => void; onRemove: () => void }) {
  return (
    <div className={card}>
      <div className="grid grid-cols-2 gap-2">
        <Field label="图标"><IconSelect value={item.icon} onChange={v => onChange({ ...item, icon: v })} /></Field>
        <Field label="标题">
          <div className="flex gap-1 items-center">
            <Input className={`${di} h-7 flex-1`} value={item.title} onChange={e => onChange({ ...item, title: e.target.value })} />
            <button className={delBtn} onClick={onRemove}><X className="w-3 h-3" /></button>
          </div>
        </Field>
      </div>
      <Field label="描述"><Textarea className={`${dt} min-h-[50px]`} value={item.description} onChange={e => onChange({ ...item, description: e.target.value })} /></Field>
    </div>
  );
}

export function FeaturesForm({ data, onChange }: { data: FeaturesSchema; onChange: (d: FeaturesSchema) => void }) {
  const addItem = () => {
    const newItem: FeatureItem = { id: crypto.randomUUID(), icon: "Star", title: "New Feature", description: "Describe this feature." };
    onChange({ ...data, items: [...data.items, newItem] });
  };
  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Input className={di} value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value })} /></Field>
      <SectionDivider label="卖点" />
      <div className="space-y-2">
        {data.items.map((item, i) => (
          <FeatureEditor key={item.id} item={item} onChange={updated => onChange({ ...data, items: data.items.map((it, ii) => ii === i ? updated : it) })} onRemove={() => onChange({ ...data, items: data.items.filter((_, ii) => ii !== i) })} />
        ))}
        <Button variant="ghost" size="sm" className={addBtn} onClick={addItem}><Plus className="w-3 h-3" />添加卖点</Button>
      </div>
    </div>
  );
}

// ── ReviewsForm ──────────────────────────────────────────────────────────────

function ReviewEditor({ item, onChange, onRemove }: { item: ReviewItem; onChange: (i: ReviewItem) => void; onRemove: () => void }) {
  return (
    <div className={card}>
      <div className="flex items-start justify-between gap-2">
        <div className="grid grid-cols-2 gap-2 flex-1">
          <Field label="作者名"><Input className={`${di} h-8`} value={item.authorName} onChange={e => onChange({ ...item, authorName: e.target.value })} /></Field>
          <Field label="头衔"><Input className={`${di} h-8`} value={item.authorRole ?? ""} onChange={e => onChange({ ...item, authorRole: e.target.value })} /></Field>
          <Field label="评分">
            <Select value={String(item.rating)} onValueChange={v => onChange({ ...item, rating: Number(v) })}>
              <SelectTrigger className={`${dst} h-8`}><SelectValue /></SelectTrigger>
              <SelectContent className={dsc}>
                {[5, 4, 3, 2, 1].map(r => <SelectItem key={r} value={String(r)} className={dsi}>{r} 星</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <button className={`${delBtn} mt-5`} onClick={onRemove}><X className="w-3 h-3" /></button>
      </div>
      <Field label="评价内容"><Textarea className={`${dt} min-h-[60px]`} value={item.content} onChange={e => onChange({ ...item, content: e.target.value })} /></Field>
      <ImagePickerField
        label="头像"
        value={item.avatar ?? ""}
        onChange={url => onChange({ ...item, avatar: url || undefined })}
      />
      <ImagePickerField
        label="证据截图"
        value={item.proofImage ?? ""}
        onChange={url => onChange({ ...item, proofImage: url || undefined })}
      />
      <Field label="视频见证链接">
        <Input className={di} value={item.proofVideo ?? ""} onChange={e => onChange({ ...item, proofVideo: e.target.value || undefined })} placeholder="https://example.com/testimonial.mp4" />
      </Field>
    </div>
  );
}

export function ReviewsForm({ data, onChange }: { data: ReviewsSchema; onChange: (d: ReviewsSchema) => void }) {
  const addItem = () => {
    const newItem: ReviewItem = { id: crypto.randomUUID(), authorName: "Happy Client", rating: 5, content: "The team responded quickly and helped me understand the next step." };
    onChange({ ...data, items: [...data.items, newItem] });
  };
  const updateRatingSummary = (patch: Partial<NonNullable<ReviewsSchema["ratingSummary"]>>) => {
    const current = data.ratingSummary ?? { average: 5 };
    onChange({ ...data, ratingSummary: { ...current, ...patch } });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
        <Field label="副标题"><Input className={di} value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value })} /></Field>
        <Field label="平均评分"><Input className={di} type="number" min={1} max={5} step={0.1} value={data.ratingSummary?.average ?? ""} onChange={e => updateRatingSummary({ average: Number(e.target.value) })} /></Field>
        <Field label="评分总览"><Input className={di} value={data.ratingSummary?.totalLabel ?? ""} onChange={e => updateRatingSummary({ totalLabel: e.target.value || undefined })} placeholder="Based on 248 reviews" /></Field>
      </div>
      <SectionDivider label="评价" />
      <div className="space-y-2">
        {data.items.map((item, i) => (
          <ReviewEditor key={item.id} item={item} onChange={updated => onChange({ ...data, items: data.items.map((it, ii) => ii === i ? updated : it) })} onRemove={() => onChange({ ...data, items: data.items.filter((_, ii) => ii !== i) })} />
        ))}
        <Button variant="ghost" size="sm" className={addBtn} onClick={addItem}><Plus className="w-3 h-3" />添加评价</Button>
      </div>
    </div>
  );
}

// ── TrustBannerForm ──────────────────────────────────────────────────────────

function BadgeEditor({ badge, onChange, onRemove }: { badge: TrustBadge; onChange: (b: TrustBadge) => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-28 shrink-0">
        <IconSelect value={badge.icon} onChange={v => onChange({ ...badge, icon: v })} />
      </div>
      <Input className={`${di} flex-1`} value={badge.text} onChange={e => onChange({ ...badge, text: e.target.value })} placeholder="Badge text" />
      <button className={delBtn} onClick={onRemove}><X className="w-3 h-3" /></button>
    </div>
  );
}

export function TrustBannerForm({ data, onChange }: { data: TrustBannerSchema; onChange: (d: TrustBannerSchema) => void }) {
  const addBadge = () => onChange({ ...data, badges: [...data.badges, { id: crypto.randomUUID(), icon: "Check", text: "New Badge" }] });
  return (
    <div className="space-y-4">
      <SectionDivider label="徽章" />
      <div className="space-y-2">
        {data.badges.map((badge, i) => (
          <BadgeEditor key={badge.id} badge={badge} onChange={b => onChange({ ...data, badges: data.badges.map((bg, bi) => bi === i ? b : bg) })} onRemove={() => onChange({ ...data, badges: data.badges.filter((_, bi) => bi !== i) })} />
        ))}
        <Button variant="ghost" size="sm" className={addBtn} onClick={addBadge}><Plus className="w-3 h-3" />添加徽章</Button>
      </div>
    </div>
  );
}

// ── AuthorityForm ─────────────────────────────────────────────────────────────

export function AuthorityForm({ data, onChange }: { data: AuthoritySchema; onChange: (d: AuthoritySchema) => void }) {
  const addParagraph = () => onChange({ ...data, paragraphs: [...data.paragraphs, ""] });
  const addStat = () => onChange({ ...data, stats: [...(data.stats ?? []), { label: "Label", value: "100+" }] });
  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Input className={di} value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value })} /></Field>
      <SectionDivider label="故事段落" />
      <div className="space-y-1.5">
        {data.paragraphs.map((p, i) => (
          <div key={i} className="flex gap-1 items-start">
            <Textarea className={`${dt} min-h-[50px] flex-1`} value={p} onChange={e => onChange({ ...data, paragraphs: data.paragraphs.map((pg, pi) => pi === i ? e.target.value : pg) })} />
            <button className={`${delBtn} mt-1`} onClick={() => onChange({ ...data, paragraphs: data.paragraphs.filter((_, pi) => pi !== i) })}><X className="w-3 h-3" /></button>
          </div>
        ))}
        <Button variant="ghost" size="sm" className={addBtn} onClick={addParagraph}><Plus className="w-3 h-3" />添加段落</Button>
      </div>
      <SectionDivider label="配图" />
      <ImagePickerField
        label="图片"
        value={data.image?.src ?? ""}
        onChange={src => onChange({ ...data, image: { src, alt: data.image?.alt ?? "" } })}
      />
      <Field label="Alt 文本">
        <Input
          className={di}
          value={data.image?.alt ?? ""}
          onChange={e => onChange({ ...data, image: { src: data.image?.src ?? "", alt: e.target.value } })}
        />
      </Field>
      <SectionDivider label="数据统计" />
      <div className="space-y-1.5">
        {(data.stats ?? []).map((stat, i) => (
          <div key={i} className="flex gap-1.5 items-center">
            <Input className={`${di} h-7 flex-1`} placeholder="标签" value={stat.label} onChange={e => onChange({ ...data, stats: (data.stats ?? []).map((s, si) => si === i ? { ...s, label: e.target.value } : s) })} />
            <Input className={`${di} h-7 w-20`} placeholder="数值" value={stat.value} onChange={e => onChange({ ...data, stats: (data.stats ?? []).map((s, si) => si === i ? { ...s, value: e.target.value } : s) })} />
            <button className={delBtn} onClick={() => onChange({ ...data, stats: (data.stats ?? []).filter((_, si) => si !== i) })}><X className="w-3 h-3" /></button>
          </div>
        ))}
        <Button variant="ghost" size="sm" className={addBtn} onClick={addStat}><Plus className="w-3 h-3" />添加统计</Button>
      </div>
      <SectionDivider label="署名" />
      <div className="grid grid-cols-2 gap-2">
        <Field label="姓名"><Input className={di} value={data.signature?.name ?? ""} onChange={e => onChange({ ...data, signature: { ...data.signature, name: e.target.value, role: data.signature?.role ?? "" } })} /></Field>
        <Field label="职位"><Input className={di} value={data.signature?.role ?? ""} onChange={e => onChange({ ...data, signature: { ...data.signature, role: e.target.value, name: data.signature?.name ?? "" } })} /></Field>
      </div>
    </div>
  );
}

// ── FAQForm ──────────────────────────────────────────────────────────────────

function FAQItemEditor({ item, onChange, onRemove }: { item: FAQItem; onChange: (i: FAQItem) => void; onRemove: () => void }) {
  return (
    <div className={card}>
      <div className="flex items-center gap-2">
        <Field label="问题">
          <Input className={`${di} h-8`} value={item.question} onChange={e => onChange({ ...item, question: e.target.value })} />
        </Field>
        <button className={`${delBtn} mt-5 shrink-0`} onClick={onRemove}><X className="w-3 h-3" /></button>
      </div>
      <Field label="回答"><Textarea className={`${dt} min-h-[60px]`} value={item.answer} onChange={e => onChange({ ...item, answer: e.target.value })} /></Field>
    </div>
  );
}

export function FAQForm({ data, onChange }: { data: FAQSchema; onChange: (d: FAQSchema) => void }) {
  const addItem = () => {
    const newItem: FAQItem = { id: crypto.randomUUID(), question: "Your question here?", answer: "Your answer here." };
    onChange({ ...data, items: [...data.items, newItem] });
  };
  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Input className={di} value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value })} /></Field>
      <SectionDivider label="问答" />
      <div className="space-y-2">
        {data.items.map((item, i) => (
          <FAQItemEditor key={item.id} item={item} onChange={updated => onChange({ ...data, items: data.items.map((it, ii) => ii === i ? updated : it) })} onRemove={() => onChange({ ...data, items: data.items.filter((_, ii) => ii !== i) })} />
        ))}
        <Button variant="ghost" size="sm" className={addBtn} onClick={addItem}><Plus className="w-3 h-3" />添加问题</Button>
      </div>
      {data.contactCta && (
        <>
          <SectionDivider label="联系 CTA" />
          <CtaFields value={data.contactCta} onChange={cta => onChange({ ...data, contactCta: cta })} />
        </>
      )}
    </div>
  );
}

// ── AssuranceForm ───────────────────────────────────────────────────────────

function AssuranceBadgeEditor({ badge, onChange, onRemove }: { badge: AssuranceBadge; onChange: (b: AssuranceBadge) => void; onRemove: () => void }) {
  return (
    <div className={card}>
      <div className="grid grid-cols-2 gap-2">
        <Field label="图标"><IconSelect value={badge.icon} onChange={v => onChange({ ...badge, icon: v })} /></Field>
        <Field label="主文案">
          <div className="flex gap-1 items-center">
            <Input className={`${di} h-8 flex-1`} value={badge.text} onChange={e => onChange({ ...badge, text: e.target.value })} />
            <button className={delBtn} onClick={onRemove}><X className="w-3 h-3" /></button>
          </div>
        </Field>
      </div>
      <Field label="副文案"><Input className={`${di} h-8`} value={badge.subtext ?? ""} onChange={e => onChange({ ...badge, subtext: e.target.value })} placeholder="Privacy protected" /></Field>
    </div>
  );
}

export function AssuranceForm({ data, onChange }: { data: AssuranceSchema; onChange: (d: AssuranceSchema) => void }) {
  const addBadge = () => onChange({
    ...data,
    badges: [...(data.badges ?? []), { id: crypto.randomUUID(), icon: "Shield", text: "New Badge" }],
  });
  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Input className={di} value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value })} /></Field>
      <Field label="承诺正文">
        <Textarea className={`${dt} min-h-[60px]`} value={data.description ?? ""} onChange={e => onChange({ ...data, description: e.target.value })} placeholder="If you're not 100% satisfied within 30 days..." />
      </Field>
      <ImagePickerField
        label="徽章/印章图"
        value={data.image ?? ""}
        onChange={url => onChange({ ...data, image: url || undefined })}
      />
      <SectionDivider label="信任徽章" />
      <div className="space-y-2">
        {(data.badges ?? []).map((badge, i) => (
          <AssuranceBadgeEditor
            key={badge.id}
            badge={badge}
            onChange={b => onChange({ ...data, badges: (data.badges ?? []).map((bg, bi) => bi === i ? b : bg) })}
            onRemove={() => onChange({ ...data, badges: (data.badges ?? []).filter((_, bi) => bi !== i) })}
          />
        ))}
        <Button variant="ghost" size="sm" className={addBtn} onClick={addBadge}>
          <Plus className="w-3 h-3" />添加徽章
        </Button>
      </div>
      {data.cta && (
        <>
          <SectionDivider label="政策入口 CTA" />
          <CtaFields value={data.cta} onChange={cta => onChange({ ...data, cta })} />
        </>
      )}
    </div>
  );
}

// ── LeadFormForm ────────────────────────────────────────────────────────────

const FIELD_TYPE_LABEL: Record<LeadFormExtraFieldType, string> = {
  text: "文本",
  select: "下拉",
};

function LeadExtraFieldEditor({ field, onChange, onRemove }: { field: LeadFormExtraField; onChange: (f: LeadFormExtraField) => void; onRemove: () => void }) {
  const isSelect = field.type === "select";
  const addOption = () =>
    onChange({ ...field, options: [...(field.options ?? []), { label: "Option", value: "option" }] });
  return (
    <div className={card}>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Label">
          <div className="flex gap-1 items-center">
            <Input className={`${di} h-8 flex-1`} value={field.label} onChange={e => onChange({ ...field, label: e.target.value })} />
            <button className={delBtn} onClick={onRemove}><X className="w-3 h-3" /></button>
          </div>
        </Field>
        <Field label="Name (key)">
          <Input className={`${di} h-8`} value={field.name} onChange={e => onChange({ ...field, name: e.target.value })} placeholder="email" />
        </Field>
        <Field label="类型">
          <Select value={field.type} onValueChange={v => onChange({ ...field, type: v as LeadFormExtraFieldType })}>
            <SelectTrigger className={`${dst} h-8`}><SelectValue /></SelectTrigger>
            <SelectContent className={dsc}>
              {(Object.keys(FIELD_TYPE_LABEL) as LeadFormExtraFieldType[]).map(t => (
                <SelectItem key={t} value={t} className={dsi}>{FIELD_TYPE_LABEL[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="必填">
          <Select value={field.required ? "yes" : "no"} onValueChange={v => onChange({ ...field, required: v === "yes" })}>
            <SelectTrigger className={`${dst} h-8`}><SelectValue /></SelectTrigger>
            <SelectContent className={dsc}>
              <SelectItem value="yes" className={dsi}>必填</SelectItem>
              <SelectItem value="no" className={dsi}>可选</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Placeholder">
        <Input className={`${di} h-8`} value={field.placeholder ?? ""} onChange={e => onChange({ ...field, placeholder: e.target.value })} />
      </Field>
      {isSelect && (
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium block">下拉选项</label>
          <div className="space-y-1">
            {(field.options ?? []).map((opt, oi) => (
              <div key={oi} className="flex gap-1 items-center">
                <Input className={`${di} h-7 flex-1`} placeholder="Label" value={opt.label} onChange={e => onChange({ ...field, options: (field.options ?? []).map((o, i) => i === oi ? { ...o, label: e.target.value } : o) })} />
                <Input className={`${di} h-7 flex-1`} placeholder="value" value={opt.value} onChange={e => onChange({ ...field, options: (field.options ?? []).map((o, i) => i === oi ? { ...o, value: e.target.value } : o) })} />
                <button className={delBtn} onClick={() => onChange({ ...field, options: (field.options ?? []).filter((_, i) => i !== oi) })}><X className="w-3 h-3" /></button>
              </div>
            ))}
            <Button variant="ghost" size="sm" className={addBtn} onClick={addOption}><Plus className="w-3 h-3" />添加选项</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function LeadFormForm({ data, onChange }: { data: LeadFormSchema; onChange: (d: LeadFormSchema) => void }) {
  const addField = () => {
    const newField: LeadFormExtraField = { id: crypto.randomUUID(), name: "interest", label: "Service Needed", type: "text" };
    onChange({ ...data, extraFields: [...(data.extraFields ?? []), newField] });
  };
  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Input className={di} value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="提交按钮文案"><Input className={di} value={data.submitText} onChange={e => onChange({ ...data, submitText: e.target.value })} placeholder="Send Request" /></Field>
        <Field label="提交埋点事件名">
          <Select value={data.eventName ?? "FormSubmit"} onValueChange={v => onChange({ ...data, eventName: v as PixelEventName })}>
            <SelectTrigger className={dst}><SelectValue /></SelectTrigger>
            <SelectContent className={dsc}>
              {LEAD_EVENT_OPTIONS.map(eventName => (
                <SelectItem key={eventName} value={eventName} className={dsi}>{eventName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="提交后提示语"><Input className={di} value={data.successMessage ?? ""} onChange={e => onChange({ ...data, successMessage: e.target.value })} placeholder="Thanks! We'll be in touch shortly." /></Field>
      <Field label="GDPR 同意文本">
        <Textarea className={`${dt} min-h-[50px]`} value={data.consentText ?? ""} onChange={e => onChange({ ...data, consentText: e.target.value })} placeholder="By submitting, you agree to our privacy policy." />
      </Field>
      <Field label="留言字段">
        <Select value={data.includeMessage === false ? "no" : "yes"} onValueChange={v => onChange({ ...data, includeMessage: v === "yes" })}>
          <SelectTrigger className={dst}><SelectValue /></SelectTrigger>
          <SelectContent className={dsc}>
            <SelectItem value="yes" className={dsi}>展示可选留言</SelectItem>
            <SelectItem value="no" className={dsi}>不展示留言</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <SectionDivider label="行业意向字段" />
      <p className="text-xs text-zinc-500 leading-relaxed">
        基础字段固定为姓名、电话、邮箱。这里只添加 1-2 个行业意向字段，例如服务类型、目标国家或预算范围。
      </p>
      <div className="space-y-2">
        {(data.extraFields ?? []).map((field, i) => (
          <LeadExtraFieldEditor
            key={field.id}
            field={field}
            onChange={f => onChange({ ...data, extraFields: (data.extraFields ?? []).map((ff, fi) => fi === i ? f : ff) })}
            onRemove={() => onChange({ ...data, extraFields: (data.extraFields ?? []).filter((_, fi) => fi !== i) })}
          />
        ))}
        {(data.extraFields ?? []).length < 2 && (
          <Button variant="ghost" size="sm" className={addBtn} onClick={addField}>
            <Plus className="w-3 h-3" />添加意向字段
          </Button>
        )}
      </div>
    </div>
  );
}
