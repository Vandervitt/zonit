import { Plus, X } from "lucide-react";
import { BackgroundType, CtaTheme, TrustBannerTheme, FeaturesLayout } from "@/lib/constants";
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
  BundlesSchema,
  BundleTier,
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
  "Star", "Shield", "Truck", "Check", "Heart", "Award", "Zap",
  "MessageCircle", "ShoppingBag", "Package", "Headphones", "Users",
  "TrendingUp", "CreditCard", "RotateCcw", "Clock", "Leaf", "Globe",
];

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
        <Field label="链接 URL">
          <Input className={di} value={value.url} onChange={e => onChange({ ...value, url: e.target.value })} placeholder="https://wa.me/..." />
        </Field>
        <Field label="图标">
          <IconSelect value={value.icon ?? ""} onChange={v => onChange({ ...value, icon: v })} />
        </Field>
        <Field label="风格">
          <Select value={value.theme ?? CtaTheme.Primary} onValueChange={v => onChange({ ...value, theme: v as CallToAction["theme"] })}>
            <SelectTrigger className={dst}><SelectValue /></SelectTrigger>
            <SelectContent className={dsc}>
              <SelectItem value={CtaTheme.Primary} className={dsi}>Primary</SelectItem>
              <SelectItem value={CtaTheme.Secondary} className={dsi}>Secondary</SelectItem>
              <SelectItem value={CtaTheme.WhatsApp} className={dsi}>WhatsApp</SelectItem>
              <SelectItem value={CtaTheme.Telegram} className={dsi}>Telegram</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  );
}

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

// ── BundlesForm ─────────────────────────────────────────────────────────────

function TierEditor({ tier, onChange, onRemove, index }: { tier: BundleTier; onChange: (t: BundleTier) => void; onRemove: () => void; index: number }) {
  const addFeature = () => onChange({ ...tier, features: [...tier.features, "New feature"] });
  const updateFeature = (i: number, val: string) => onChange({ ...tier, features: tier.features.map((f, fi) => fi === i ? val : f) });
  const removeFeature = (i: number) => onChange({ ...tier, features: tier.features.filter((_, fi) => fi !== i) });

  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">套餐 {index + 1}</span>
        <button className={delBtn} onClick={onRemove}><X className="w-3 h-3" /></button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="名称"><Input className={`${di} h-8`} value={tier.name} onChange={e => onChange({ ...tier, name: e.target.value })} /></Field>
        <Field label="价格"><Input className={`${di} h-8`} value={tier.price} onChange={e => onChange({ ...tier, price: e.target.value })} placeholder="$49" /></Field>
        <Field label="原价（划线价）"><Input className={`${di} h-8`} value={tier.originalPrice ?? ""} onChange={e => onChange({ ...tier, originalPrice: e.target.value })} placeholder="$99" /></Field>
        <Field label="推荐标签"><Input className={`${di} h-8`} value={tier.tag ?? ""} onChange={e => onChange({ ...tier, tag: e.target.value })} placeholder="Most Popular" /></Field>
      </div>
      <Field label="简介"><Input className={`${di} h-8`} value={tier.description} onChange={e => onChange({ ...tier, description: e.target.value })} /></Field>
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium block">权益列表</label>
        <div className="space-y-1">
          {tier.features.map((f, i) => (
            <div key={i} className="flex gap-1 items-center">
              <Input className={`${di} h-7 flex-1`} value={f} onChange={e => updateFeature(i, e.target.value)} />
              <button className={delBtn} onClick={() => removeFeature(i)}><X className="w-3 h-3" /></button>
            </div>
          ))}
          <Button variant="ghost" size="sm" className={addBtn} onClick={addFeature}><Plus className="w-3 h-3" />添加权益</Button>
        </div>
      </div>
      <CtaFields value={tier.cta} onChange={cta => onChange({ ...tier, cta })} />
    </div>
  );
}

export function BundlesForm({ data, onChange }: { data: BundlesSchema; onChange: (d: BundlesSchema) => void }) {
  const addTier = () => {
    const newTier: BundleTier = {
      id: crypto.randomUUID(),
      name: "New Package",
      price: "$99",
      description: "Package description",
      features: ["Feature 1", "Feature 2"],
      cta: { text: "Order Now", url: "https://wa.me/1234567890", icon: "WhatsApp", theme: "whatsapp" },
    };
    onChange({ ...data, tiers: [...data.tiers, newTier] });
  };
  const updateTier = (i: number, t: BundleTier) => onChange({ ...data, tiers: data.tiers.map((ti, idx) => idx === i ? t : ti) });
  const removeTier = (i: number) => onChange({ ...data, tiers: data.tiers.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Input className={di} value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value })} /></Field>
      <SectionDivider label="套餐" />
      <div className="space-y-2">
        {data.tiers.map((tier, i) => (
          <TierEditor key={tier.id} tier={tier} index={i} onChange={t => updateTier(i, t)} onRemove={() => removeTier(i)} />
        ))}
        {data.tiers.length < 3 && (
          <Button variant="ghost" size="sm" className={addBtn} onClick={addTier}>
            <Plus className="w-3 h-3" />添加套餐
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
  const addLink = () => onChange({ ...data, links: [...data.links, { text: "Link", url: "/" }] });
  const updateLink = (i: number, link: FooterLink) => onChange({ ...data, links: data.links.map((l, li) => li === i ? link : l) });
  const removeLink = (i: number) => onChange({ ...data, links: data.links.filter((_, li) => li !== i) });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Field label="品牌名称"><Input className={di} value={data.brandName} onChange={e => onChange({ ...data, brandName: e.target.value })} /></Field>
        <Field label="版权年份"><Input className={di} value={data.copyrightYear} onChange={e => onChange({ ...data, copyrightYear: e.target.value })} /></Field>
      </div>
      <Field label="联系邮箱"><Input className={di} value={data.contactEmail ?? ""} onChange={e => onChange({ ...data, contactEmail: e.target.value })} /></Field>
      <SectionDivider label="链接" />
      <div className="space-y-1.5">
        {data.links.map((link, i) => (
          <div key={i} className="flex gap-1.5 items-center">
            <Input className={`${di} h-7 flex-1`} placeholder="文案" value={link.text} onChange={e => updateLink(i, { ...link, text: e.target.value })} />
            <Input className={`${di} h-7 flex-1`} placeholder="URL" value={link.url} onChange={e => updateLink(i, { ...link, url: e.target.value })} />
            <button className={delBtn} onClick={() => removeLink(i)}><X className="w-3 h-3" /></button>
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
      <Field label="布局">
        <Select value={data.layout ?? FeaturesLayout.Grid} onValueChange={v => onChange({ ...data, layout: v as "grid" | "list" })}>
          <SelectTrigger className={dst}><SelectValue /></SelectTrigger>
          <SelectContent className={dsc}>
            <SelectItem value={FeaturesLayout.Grid} className={dsi}>网格</SelectItem>
            <SelectItem value={FeaturesLayout.List} className={dsi}>列表</SelectItem>
          </SelectContent>
        </Select>
      </Field>
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
    </div>
  );
}

export function ReviewsForm({ data, onChange }: { data: ReviewsSchema; onChange: (d: ReviewsSchema) => void }) {
  const addItem = () => {
    const newItem: ReviewItem = { id: crypto.randomUUID(), authorName: "Happy Customer", rating: 5, content: "Great product!" };
    onChange({ ...data, items: [...data.items, newItem] });
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
        <Field label="副标题"><Input className={di} value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value })} /></Field>
        <Field label="平均评分"><Input className={di} type="number" min={1} max={5} step={0.1} value={data.averageRating ?? ""} onChange={e => onChange({ ...data, averageRating: Number(e.target.value) })} /></Field>
        <Field label="总评论数"><Input className={di} value={data.totalReviews ?? ""} onChange={e => onChange({ ...data, totalReviews: e.target.value })} placeholder="10k+" /></Field>
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
      <Field label="主题">
        <Select value={data.theme ?? TrustBannerTheme.Light} onValueChange={v => onChange({ ...data, theme: v as "light" | "dark" | "brand" })}>
          <SelectTrigger className={dst}><SelectValue /></SelectTrigger>
          <SelectContent className={dsc}>
            <SelectItem value={TrustBannerTheme.Light} className={dsi}>浅色</SelectItem>
            <SelectItem value={TrustBannerTheme.Dark} className={dsi}>深色</SelectItem>
            <SelectItem value={TrustBannerTheme.Brand} className={dsi}>品牌色</SelectItem>
          </SelectContent>
        </Select>
      </Field>
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
        value={data.image.src}
        onChange={src => onChange({ ...data, image: { ...data.image, src } })}
      />
      <Field label="Alt 文本">
        <Input
          className={di}
          value={data.image.alt}
          onChange={e => onChange({ ...data, image: { ...data.image, alt: e.target.value } })}
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
