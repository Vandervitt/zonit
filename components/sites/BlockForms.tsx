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
  CountdownSchema,
  BeforeAfterSchema,
  BeforeAfterPair,
  GuaranteeSchema,
  GuaranteeBadge,
  LeadFormSchema,
  LeadFormField,
  LeadFormFieldType,
  MediaLogosSchema,
  MediaLogo,
  VideoTestimonialsSchema,
  VideoTestimonialItem,
  PaymentBadgesSchema,
  PaymentBadge,
  ShippingInfoSchema,
  ShippingInfoItem,
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
  const dl = value.download;
  const toggleDownload = () =>
    onChange({ ...value, download: dl ? undefined : { fileUrl: "" } });
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
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium">下载行为（Lead Magnet）</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[10px] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          onClick={toggleDownload}
        >
          {dl ? "移除" : "启用"}
        </Button>
      </div>
      {dl && (
        <div className="space-y-2">
          <Field label="文件 URL">
            <Input className={di} value={dl.fileUrl} onChange={e => onChange({ ...value, download: { ...dl, fileUrl: e.target.value } })} placeholder="https://.../guide.pdf" />
          </Field>
          <Field label="下载文件名（可选）">
            <Input className={di} value={dl.fileName ?? ""} onChange={e => onChange({ ...value, download: { ...dl, fileName: e.target.value } })} placeholder="lead-magnet.pdf" />
          </Field>
          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={!!dl.requireLeadCapture}
              onChange={e => onChange({ ...value, download: { ...dl, requireLeadCapture: e.target.checked } })}
            />
            下载前先弹出 LeadForm 收集线索
          </label>
          {dl.requireLeadCapture && (
            <Field label="关联 LeadForm Block ID">
              <Input className={di} value={dl.leadFormBlockId ?? ""} onChange={e => onChange({ ...value, download: { ...dl, leadFormBlockId: e.target.value } })} placeholder="block-uuid" />
            </Field>
          )}
        </div>
      )}
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

const DEFAULT_COUNTDOWN: CountdownSchema = {
  title: "Limited-Time Offer",
  subtitle: "Special pricing ends soon — act now",
  endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  expiredFallback: { title: "Offer Ended", subtitle: "Stay tuned for the next campaign" },
  variant: "section",
};

const DEFAULT_STICKY_CTA: CallToAction = {
  text: "Chat on WhatsApp",
  url: "https://wa.me/1234567890",
  icon: "WhatsApp",
  theme: "whatsapp",
  channel: "whatsapp",
};

// ── HeroForm ────────────────────────────────────────────────────────────────

export function HeroForm({ data, onChange }: { data: HeroSchema; onChange: (d: HeroSchema) => void }) {
  const toggleCountdown = () =>
    onChange({ ...data, countdown: data.countdown ? undefined : DEFAULT_COUNTDOWN });
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
      <SectionDivider label="首屏内嵌倒计时" />
      <Button variant="ghost" size="sm" className={addBtn} onClick={toggleCountdown}>
        {data.countdown ? "禁用倒计时" : "启用倒计时"}
      </Button>
      {data.countdown && (
        <CountdownForm data={data.countdown} onChange={countdown => onChange({ ...data, countdown })} />
      )}
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
      <div className="grid grid-cols-2 gap-2">
        <Field label="标题">
          <Input className={di} value={data.title ?? ""} onChange={e => onChange({ ...data, title: e.target.value })} placeholder="Limited-Time Offer" />
        </Field>
        <Field label="样式">
          <Select value={data.variant ?? "section"} onValueChange={v => onChange({ ...data, variant: v as CountdownSchema["variant"] })}>
            <SelectTrigger className={dst}><SelectValue /></SelectTrigger>
            <SelectContent className={dsc}>
              <SelectItem value="section" className={dsi}>独立区块</SelectItem>
              <SelectItem value="banner" className={dsi}>顶部横幅</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="副标题">
        <Input className={di} value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value })} placeholder="Special pricing ends soon" />
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

export function StickyCtaEditor({ value, onChange }: { value: CallToAction | undefined; onChange: (v: CallToAction | undefined) => void }) {
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
      <CtaFields value={value} onChange={onChange} />
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
      <ImagePickerField
        label="套餐配图"
        value={tier.image ?? ""}
        onChange={url => onChange({ ...tier, image: url || undefined })}
      />
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

// ── BeforeAfterForm ─────────────────────────────────────────────────────────

function PairEditor({ pair, onChange, onRemove, index }: { pair: BeforeAfterPair; onChange: (p: BeforeAfterPair) => void; onRemove: () => void; index: number }) {
  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">对比 {index + 1}</span>
        <button className={delBtn} onClick={onRemove}><X className="w-3 h-3" /></button>
      </div>
      <ImagePickerField
        label="Before 图"
        value={pair.before.src}
        onChange={src => onChange({ ...pair, before: { ...pair.before, src } })}
      />
      <Field label="Before Alt">
        <Input className={`${di} h-8`} value={pair.before.alt} onChange={e => onChange({ ...pair, before: { ...pair.before, alt: e.target.value } })} placeholder="Before" />
      </Field>
      <ImagePickerField
        label="After 图"
        value={pair.after.src}
        onChange={src => onChange({ ...pair, after: { ...pair.after, src } })}
      />
      <Field label="After Alt">
        <Input className={`${di} h-8`} value={pair.after.alt} onChange={e => onChange({ ...pair, after: { ...pair.after, alt: e.target.value } })} placeholder="After" />
      </Field>
      <Field label="说明文字">
        <Input className={`${di} h-8`} value={pair.caption ?? ""} onChange={e => onChange({ ...pair, caption: e.target.value })} placeholder="After 12 weeks" />
      </Field>
    </div>
  );
}

export function BeforeAfterForm({ data, onChange }: { data: BeforeAfterSchema; onChange: (d: BeforeAfterSchema) => void }) {
  const addPair = () => {
    const newPair: BeforeAfterPair = {
      id: crypto.randomUUID(),
      before: { src: "", alt: "Before" },
      after: { src: "", alt: "After" },
      caption: "",
    };
    onChange({ ...data, pairs: [...data.pairs, newPair] });
  };
  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Input className={di} value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value })} /></Field>
      <Field label="排版">
        <Select value={data.variant ?? "side-by-side"} onValueChange={v => onChange({ ...data, variant: v as BeforeAfterSchema["variant"] })}>
          <SelectTrigger className={dst}><SelectValue /></SelectTrigger>
          <SelectContent className={dsc}>
            <SelectItem value="side-by-side" className={dsi}>左右并排</SelectItem>
            <SelectItem value="slider" className={dsi}>滑块对比</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <SectionDivider label="对比组" />
      <div className="space-y-2">
        {data.pairs.map((pair, i) => (
          <PairEditor
            key={pair.id}
            pair={pair}
            index={i}
            onChange={p => onChange({ ...data, pairs: data.pairs.map((pp, pi) => pi === i ? p : pp) })}
            onRemove={() => onChange({ ...data, pairs: data.pairs.filter((_, pi) => pi !== i) })}
          />
        ))}
        <Button variant="ghost" size="sm" className={addBtn} onClick={addPair}>
          <Plus className="w-3 h-3" />添加对比
        </Button>
      </div>
      <Field label="免责声明">
        <Textarea className={`${dt} min-h-[50px]`} value={data.disclaimer ?? ""} onChange={e => onChange({ ...data, disclaimer: e.target.value })} placeholder="Results may vary from person to person." />
      </Field>
    </div>
  );
}

// ── GuaranteeForm ───────────────────────────────────────────────────────────

function GuaranteeBadgeEditor({ badge, onChange, onRemove }: { badge: GuaranteeBadge; onChange: (b: GuaranteeBadge) => void; onRemove: () => void }) {
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
      <Field label="副文案"><Input className={`${di} h-8`} value={badge.subtext ?? ""} onChange={e => onChange({ ...badge, subtext: e.target.value })} placeholder="Full refund guaranteed" /></Field>
    </div>
  );
}

export function GuaranteeForm({ data, onChange }: { data: GuaranteeSchema; onChange: (d: GuaranteeSchema) => void }) {
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
          <GuaranteeBadgeEditor
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

const FIELD_TYPE_LABEL: Record<LeadFormFieldType, string> = {
  text: "文本",
  email: "邮箱",
  phone: "电话",
  select: "下拉",
  textarea: "多行文本",
  checkbox: "勾选",
};

function LeadFieldEditor({ field, onChange, onRemove }: { field: LeadFormField; onChange: (f: LeadFormField) => void; onRemove: () => void }) {
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
          <Select value={field.type} onValueChange={v => onChange({ ...field, type: v as LeadFormFieldType })}>
            <SelectTrigger className={`${dst} h-8`}><SelectValue /></SelectTrigger>
            <SelectContent className={dsc}>
              {(Object.keys(FIELD_TYPE_LABEL) as LeadFormFieldType[]).map(t => (
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
    const newField: LeadFormField = { id: crypto.randomUUID(), name: "field", label: "New Field", type: "text" };
    onChange({ ...data, fields: [...data.fields, newField] });
  };
  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Input className={di} value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="提交按钮文案"><Input className={di} value={data.submitText} onChange={e => onChange({ ...data, submitText: e.target.value })} placeholder="Send Request" /></Field>
        <Field label="提交埋点事件名"><Input className={di} value={data.eventName ?? ""} onChange={e => onChange({ ...data, eventName: e.target.value })} placeholder="lead_form_submit" /></Field>
      </div>
      <Field label="提交后提示语"><Input className={di} value={data.successMessage ?? ""} onChange={e => onChange({ ...data, successMessage: e.target.value })} placeholder="Thanks! We'll be in touch shortly." /></Field>
      <Field label="Webhook URL（可选）"><Input className={di} value={data.webhookUrl ?? ""} onChange={e => onChange({ ...data, webhookUrl: e.target.value })} placeholder="https://hooks.zapier.com/..." /></Field>
      <Field label="GDPR 同意文本">
        <Textarea className={`${dt} min-h-[50px]`} value={data.consentText ?? ""} onChange={e => onChange({ ...data, consentText: e.target.value })} placeholder="By submitting, you agree to our privacy policy." />
      </Field>
      <SectionDivider label="字段" />
      <div className="space-y-2">
        {data.fields.map((field, i) => (
          <LeadFieldEditor
            key={field.id}
            field={field}
            onChange={f => onChange({ ...data, fields: data.fields.map((ff, fi) => fi === i ? f : ff) })}
            onRemove={() => onChange({ ...data, fields: data.fields.filter((_, fi) => fi !== i) })}
          />
        ))}
        <Button variant="ghost" size="sm" className={addBtn} onClick={addField}>
          <Plus className="w-3 h-3" />添加字段
        </Button>
      </div>
    </div>
  );
}

// ── MediaLogosForm ──────────────────────────────────────────────────────────

function MediaLogoEditor({ logo, onChange, onRemove }: { logo: MediaLogo; onChange: (l: MediaLogo) => void; onRemove: () => void }) {
  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">{logo.name || "Logo"}</span>
        <button className={delBtn} onClick={onRemove}><X className="w-3 h-3" /></button>
      </div>
      <Field label="媒体名称">
        <Input className={`${di} h-8`} value={logo.name} onChange={e => onChange({ ...logo, name: e.target.value })} placeholder="Forbes" />
      </Field>
      <ImagePickerField
        label="Logo 图片"
        value={logo.image}
        onChange={image => onChange({ ...logo, image })}
      />
      <Field label="原文链接（可选）">
        <Input className={`${di} h-8`} value={logo.url ?? ""} onChange={e => onChange({ ...logo, url: e.target.value })} placeholder="https://..." />
      </Field>
    </div>
  );
}

export function MediaLogosForm({ data, onChange }: { data: MediaLogosSchema; onChange: (d: MediaLogosSchema) => void }) {
  const addLogo = () => onChange({
    ...data,
    logos: [...data.logos, { id: crypto.randomUUID(), name: "Media", image: "" }],
  });
  return (
    <div className="space-y-4">
      <Field label="标题（可选）">
        <Input className={di} value={data.title ?? ""} onChange={e => onChange({ ...data, title: e.target.value })} placeholder="As Featured In" />
      </Field>
      <Field label="样式">
        <Select value={data.variant ?? "mono"} onValueChange={v => onChange({ ...data, variant: v as MediaLogosSchema["variant"] })}>
          <SelectTrigger className={dst}><SelectValue /></SelectTrigger>
          <SelectContent className={dsc}>
            <SelectItem value="mono" className={dsi}>统一灰度</SelectItem>
            <SelectItem value="color" className={dsi}>原色</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <SectionDivider label="Logo 列表" />
      <div className="space-y-2">
        {data.logos.map((logo, i) => (
          <MediaLogoEditor
            key={logo.id}
            logo={logo}
            onChange={l => onChange({ ...data, logos: data.logos.map((ll, li) => li === i ? l : ll) })}
            onRemove={() => onChange({ ...data, logos: data.logos.filter((_, li) => li !== i) })}
          />
        ))}
        <Button variant="ghost" size="sm" className={addBtn} onClick={addLogo}>
          <Plus className="w-3 h-3" />添加 Logo
        </Button>
      </div>
    </div>
  );
}

// ── VideoTestimonialsForm ───────────────────────────────────────────────────

function VideoItemEditor({ item, onChange, onRemove }: { item: VideoTestimonialItem; onChange: (i: VideoTestimonialItem) => void; onRemove: () => void }) {
  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">{item.authorName || "证言"}</span>
        <button className={delBtn} onClick={onRemove}><X className="w-3 h-3" /></button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="作者名"><Input className={`${di} h-8`} value={item.authorName} onChange={e => onChange({ ...item, authorName: e.target.value })} /></Field>
        <Field label="头衔"><Input className={`${di} h-8`} value={item.authorRole ?? ""} onChange={e => onChange({ ...item, authorRole: e.target.value })} placeholder="Verified Buyer" /></Field>
        <Field label="国家/地区"><Input className={`${di} h-8`} value={item.country ?? ""} onChange={e => onChange({ ...item, country: e.target.value })} placeholder="United States" /></Field>
        <Field label="时长"><Input className={`${di} h-8`} value={item.duration ?? ""} onChange={e => onChange({ ...item, duration: e.target.value })} placeholder="0:45" /></Field>
      </div>
      <Field label="视频 URL">
        <Input className={`${di} h-8`} value={item.videoUrl} onChange={e => onChange({ ...item, videoUrl: e.target.value })} placeholder="https://..." />
      </Field>
      <ImagePickerField
        label="封面图"
        value={item.poster ?? ""}
        onChange={poster => onChange({ ...item, poster: poster || undefined })}
      />
      <Field label="核心金句（无声字幕）">
        <Textarea className={`${dt} min-h-[50px]`} value={item.quote ?? ""} onChange={e => onChange({ ...item, quote: e.target.value })} placeholder="The best decision I've made this year." />
      </Field>
    </div>
  );
}

export function VideoTestimonialsForm({ data, onChange }: { data: VideoTestimonialsSchema; onChange: (d: VideoTestimonialsSchema) => void }) {
  const addItem = () => {
    const newItem: VideoTestimonialItem = {
      id: crypto.randomUUID(),
      authorName: "Customer",
      videoUrl: "",
    };
    onChange({ ...data, items: [...data.items, newItem] });
  };
  return (
    <div className="space-y-4">
      <Field label="标题"><Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Input className={di} value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value })} /></Field>
      <Field label="排版">
        <Select value={data.variant ?? "carousel"} onValueChange={v => onChange({ ...data, variant: v as VideoTestimonialsSchema["variant"] })}>
          <SelectTrigger className={dst}><SelectValue /></SelectTrigger>
          <SelectContent className={dsc}>
            <SelectItem value="carousel" className={dsi}>横滑卡片</SelectItem>
            <SelectItem value="grid" className={dsi}>网格</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <SectionDivider label="证言" />
      <div className="space-y-2">
        {data.items.map((item, i) => (
          <VideoItemEditor
            key={item.id}
            item={item}
            onChange={it => onChange({ ...data, items: data.items.map((ii, idx) => idx === i ? it : ii) })}
            onRemove={() => onChange({ ...data, items: data.items.filter((_, idx) => idx !== i) })}
          />
        ))}
        <Button variant="ghost" size="sm" className={addBtn} onClick={addItem}>
          <Plus className="w-3 h-3" />添加证言
        </Button>
      </div>
    </div>
  );
}

// ── PaymentBadgesForm ───────────────────────────────────────────────────────

const PAYMENT_PROVIDERS = [
  "visa", "mastercard", "amex", "paypal", "apple-pay", "google-pay",
  "cod", "bank-transfer", "crypto",
];

function PaymentBadgeEditor({ badge, onChange, onRemove }: { badge: PaymentBadge; onChange: (b: PaymentBadge) => void; onRemove: () => void }) {
  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">{badge.label || badge.provider}</span>
        <button className={delBtn} onClick={onRemove}><X className="w-3 h-3" /></button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="支付方式">
          <Select value={badge.provider} onValueChange={v => onChange({ ...badge, provider: v })}>
            <SelectTrigger className={dst}><SelectValue placeholder="选择" /></SelectTrigger>
            <SelectContent className={dsc}>
              {PAYMENT_PROVIDERS.map(p => (
                <SelectItem key={p} value={p} className={dsi}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="显示文案">
          <Input className={`${di} h-8`} value={badge.label ?? ""} onChange={e => onChange({ ...badge, label: e.target.value })} placeholder="Visa" />
        </Field>
      </div>
    </div>
  );
}

export function PaymentBadgesForm({ data, onChange }: { data: PaymentBadgesSchema; onChange: (d: PaymentBadgesSchema) => void }) {
  const addBadge = () => onChange({
    ...data,
    badges: [...data.badges, { id: crypto.randomUUID(), provider: "visa", label: "Visa" }],
  });
  return (
    <div className="space-y-4">
      <Field label="标题（可选）">
        <Input className={di} value={data.title ?? ""} onChange={e => onChange({ ...data, title: e.target.value })} placeholder="Secure Payment Methods" />
      </Field>
      <Field label="安全提示文案">
        <Input className={di} value={data.secureNote ?? ""} onChange={e => onChange({ ...data, secureNote: e.target.value })} placeholder="SSL encrypted · PCI-DSS compliant" />
      </Field>
      <SectionDivider label="支付方式" />
      <div className="space-y-2">
        {data.badges.map((badge, i) => (
          <PaymentBadgeEditor
            key={badge.id}
            badge={badge}
            onChange={b => onChange({ ...data, badges: data.badges.map((bb, bi) => bi === i ? b : bb) })}
            onRemove={() => onChange({ ...data, badges: data.badges.filter((_, bi) => bi !== i) })}
          />
        ))}
        <Button variant="ghost" size="sm" className={addBtn} onClick={addBadge}>
          <Plus className="w-3 h-3" />添加支付方式
        </Button>
      </div>
    </div>
  );
}

// ── ShippingInfoForm ────────────────────────────────────────────────────────

function ShippingItemEditor({ item, onChange, onRemove }: { item: ShippingInfoItem; onChange: (i: ShippingInfoItem) => void; onRemove: () => void }) {
  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">{item.title || "Item"}</span>
        <button className={delBtn} onClick={onRemove}><X className="w-3 h-3" /></button>
      </div>
      <Field label="图标">
        <IconSelect value={item.icon} onChange={v => onChange({ ...item, icon: v })} />
      </Field>
      <Field label="标题">
        <Input className={`${di} h-8`} value={item.title} onChange={e => onChange({ ...item, title: e.target.value })} placeholder="Worldwide Shipping" />
      </Field>
      <Field label="描述">
        <Textarea className={`${dt} min-h-[50px]`} value={item.description} onChange={e => onChange({ ...item, description: e.target.value })} placeholder="Free over $50, 7-14 days" />
      </Field>
    </div>
  );
}

export function ShippingInfoForm({ data, onChange }: { data: ShippingInfoSchema; onChange: (d: ShippingInfoSchema) => void }) {
  const addItem = () => onChange({
    ...data,
    items: [...data.items, { id: crypto.randomUUID(), icon: "Truck", title: "New Item", description: "" }],
  });
  return (
    <div className="space-y-4">
      <Field label="标题">
        <Input className={di} value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} placeholder="Shipping & Returns" />
      </Field>
      <Field label="预计送达">
        <Input className={di} value={data.estimatedDelivery ?? ""} onChange={e => onChange({ ...data, estimatedDelivery: e.target.value })} placeholder="Order today, get it by Oct 12" />
      </Field>
      <Field label="退货政策链接">
        <Input className={di} value={data.returnsPolicyUrl ?? ""} onChange={e => onChange({ ...data, returnsPolicyUrl: e.target.value })} placeholder="https://..." />
      </Field>
      <SectionDivider label="保障条目" />
      <div className="space-y-2">
        {data.items.map((item, i) => (
          <ShippingItemEditor
            key={item.id}
            item={item}
            onChange={it => onChange({ ...data, items: data.items.map((ii, idx) => idx === i ? it : ii) })}
            onRemove={() => onChange({ ...data, items: data.items.filter((_, idx) => idx !== i) })}
          />
        ))}
        <Button variant="ghost" size="sm" className={addBtn} onClick={addItem}>
          <Plus className="w-3 h-3" />添加条目
        </Button>
      </div>
    </div>
  );
}
