import { Plus, X } from "lucide-react";
import { BackgroundType, CtaTheme, TrustBannerTheme, FeaturesLayout } from "@/lib/constants";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
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

// ── Shared helpers ──────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
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
      <SelectTrigger className="h-8 text-xs">
        <SelectValue placeholder="选择图标" />
      </SelectTrigger>
      <SelectContent className="max-h-52">
        {ICON_OPTIONS.map(icon => (
          <SelectItem key={icon} value={icon} className="text-xs">{icon}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CtaFields({ value, onChange }: { value: CallToAction; onChange: (v: CallToAction) => void }) {
  return (
    <div className="space-y-2 bg-slate-50 rounded-lg p-3">
      <p className="text-xs font-medium text-slate-600">行动按钮 (CTA)</p>
      <div className="grid grid-cols-2 gap-2">
        <Field label="按钮文案">
          <Input className="h-8 text-xs" value={value.text} onChange={e => onChange({ ...value, text: e.target.value })} placeholder="Chat on WhatsApp" />
        </Field>
        <Field label="链接 URL">
          <Input className="h-8 text-xs" value={value.url} onChange={e => onChange({ ...value, url: e.target.value })} placeholder="https://wa.me/..." />
        </Field>
        <Field label="图标">
          <IconSelect value={value.icon ?? ""} onChange={v => onChange({ ...value, icon: v })} />
        </Field>
        <Field label="风格">
          <Select value={value.theme ?? CtaTheme.Primary} onValueChange={v => onChange({ ...value, theme: v as CallToAction["theme"] })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={CtaTheme.Primary}>Primary</SelectItem>
              <SelectItem value={CtaTheme.Secondary}>Secondary</SelectItem>
              <SelectItem value={CtaTheme.WhatsApp}>WhatsApp</SelectItem>
              <SelectItem value={CtaTheme.Telegram}>Telegram</SelectItem>
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
    <div className="space-y-3">
      <Field label="顶部标签 (Badge)">
        <Input className="h-8 text-xs" value={data.badge ?? ""} onChange={e => onChange({ ...data, badge: e.target.value })} placeholder="🔥 Limited Time Offer" />
      </Field>
      <Field label="主标题">
        <Textarea className="text-xs min-h-[60px]" value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} placeholder="Your Main Headline" />
      </Field>
      <Field label="副标题">
        <Textarea className="text-xs min-h-[60px]" value={data.subtitle} onChange={e => onChange({ ...data, subtitle: e.target.value })} placeholder="Supporting text that describes your offer..." />
      </Field>
      <Separator />
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-600">背景设置</p>
        <div className="grid grid-cols-2 gap-2">
          <Field label="类型">
            <Select value={data.background.type} onValueChange={v => onChange({ ...data, background: { ...data.background, type: v as "color" | "image" | "video" } })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={BackgroundType.Color}>纯色</SelectItem>
                <SelectItem value={BackgroundType.Image}>图片</SelectItem>
                <SelectItem value={BackgroundType.Video}>视频</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={data.background.type === BackgroundType.Color ? "颜色 (Hex)" : "URL"}>
            <Input className="h-8 text-xs" value={data.background.value} onChange={e => onChange({ ...data, background: { ...data.background, value: e.target.value } })} placeholder={data.background.type === BackgroundType.Color ? "#f0f4ff" : "https://..."} />
          </Field>
        </div>
      </div>
      <Separator />
      <CtaFields value={data.cta} onChange={cta => onChange({ ...data, cta })} />
      <Field label="按钮下方小字背书">
        <Input className="h-8 text-xs" value={data.trustText ?? ""} onChange={e => onChange({ ...data, trustText: e.target.value })} placeholder="✓ No credit card required" />
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
    <div className="border rounded-lg p-3 space-y-2 bg-slate-50/50">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-700">套餐 {index + 1}</p>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onRemove}><X className="w-3 h-3" /></Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="名称"><Input className="h-7 text-xs" value={tier.name} onChange={e => onChange({ ...tier, name: e.target.value })} /></Field>
        <Field label="价格"><Input className="h-7 text-xs" value={tier.price} onChange={e => onChange({ ...tier, price: e.target.value })} placeholder="$49" /></Field>
        <Field label="原价（划线价）"><Input className="h-7 text-xs" value={tier.originalPrice ?? ""} onChange={e => onChange({ ...tier, originalPrice: e.target.value })} placeholder="$99" /></Field>
        <Field label="推荐标签"><Input className="h-7 text-xs" value={tier.tag ?? ""} onChange={e => onChange({ ...tier, tag: e.target.value })} placeholder="Most Popular" /></Field>
      </div>
      <Field label="简介"><Input className="h-7 text-xs" value={tier.description} onChange={e => onChange({ ...tier, description: e.target.value })} /></Field>
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">权益列表</Label>
        <div className="space-y-1">
          {tier.features.map((f, i) => (
            <div key={i} className="flex gap-1">
              <Input className="h-6 text-xs flex-1" value={f} onChange={e => updateFeature(i, e.target.value)} />
              <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => removeFeature(i)}><X className="w-3 h-3" /></Button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="h-6 text-xs mt-1 w-full" onClick={addFeature}><Plus className="w-3 h-3 mr-1" />添加权益</Button>
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
    <div className="space-y-3">
      <Field label="标题"><Input className="h-8 text-xs" value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Input className="h-8 text-xs" value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value })} /></Field>
      <Separator />
      <div className="space-y-2">
        {data.tiers.map((tier, i) => (
          <TierEditor key={tier.id} tier={tier} index={i} onChange={t => updateTier(i, t)} onRemove={() => removeTier(i)} />
        ))}
        {data.tiers.length < 3 && (
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={addTier}>
            <Plus className="w-3 h-3 mr-1" /> 添加套餐
          </Button>
        )}
      </div>
    </div>
  );
}

// ── HowItWorksForm ──────────────────────────────────────────────────────────

function StepEditor({ step, onChange, onRemove, index }: { step: StepItem; onChange: (s: StepItem) => void; onRemove: () => void; index: number }) {
  return (
    <div className="border rounded-lg p-3 space-y-2 bg-slate-50/50">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-700">步骤 {index + 1}</p>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onRemove}><X className="w-3 h-3" /></Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="图标"><IconSelect value={step.icon} onChange={v => onChange({ ...step, icon: v })} /></Field>
        <Field label="标题"><Input className="h-7 text-xs" value={step.title} onChange={e => onChange({ ...step, title: e.target.value })} /></Field>
      </div>
      <Field label="描述"><Textarea className="text-xs min-h-[50px]" value={step.description} onChange={e => onChange({ ...step, description: e.target.value })} /></Field>
    </div>
  );
}

export function HowItWorksForm({ data, onChange }: { data: HowItWorksSchema; onChange: (d: HowItWorksSchema) => void }) {
  const addStep = () => {
    const newStep: StepItem = { id: crypto.randomUUID(), icon: "Check", title: "New Step", description: "Describe this step." };
    onChange({ ...data, steps: [...data.steps, newStep] });
  };
  return (
    <div className="space-y-3">
      <Field label="标题"><Input className="h-8 text-xs" value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Input className="h-8 text-xs" value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value })} /></Field>
      <Separator />
      <div className="space-y-2">
        {data.steps.map((step, i) => (
          <StepEditor key={step.id} step={step} index={i} onChange={s => onChange({ ...data, steps: data.steps.map((st, si) => si === i ? s : st) })} onRemove={() => onChange({ ...data, steps: data.steps.filter((_, si) => si !== i) })} />
        ))}
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={addStep}>
          <Plus className="w-3 h-3 mr-1" /> 添加步骤
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
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="品牌名称"><Input className="h-8 text-xs" value={data.brandName} onChange={e => onChange({ ...data, brandName: e.target.value })} /></Field>
        <Field label="版权年份"><Input className="h-8 text-xs" value={data.copyrightYear} onChange={e => onChange({ ...data, copyrightYear: e.target.value })} /></Field>
      </div>
      <Field label="联系邮箱"><Input className="h-8 text-xs" value={data.contactEmail ?? ""} onChange={e => onChange({ ...data, contactEmail: e.target.value })} /></Field>
      <Separator />
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">链接列表</Label>
        <div className="space-y-1.5">
          {data.links.map((link, i) => (
            <div key={i} className="flex gap-1.5">
              <Input className="h-7 text-xs flex-1" placeholder="文案" value={link.text} onChange={e => updateLink(i, { ...link, text: e.target.value })} />
              <Input className="h-7 text-xs flex-1" placeholder="URL" value={link.url} onChange={e => updateLink(i, { ...link, url: e.target.value })} />
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => removeLink(i)}><X className="w-3 h-3" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={addLink}><Plus className="w-3 h-3 mr-1" />添加链接</Button>
        </div>
      </div>
      <Field label="免责声明">
        <Textarea className="text-xs min-h-[60px]" value={data.disclaimer ?? ""} onChange={e => onChange({ ...data, disclaimer: e.target.value })} placeholder="Investment involves risk..." />
      </Field>
    </div>
  );
}

// ── FeaturesForm ─────────────────────────────────────────────────────────────

function FeatureEditor({ item, onChange, onRemove }: { item: FeatureItem; onChange: (i: FeatureItem) => void; onRemove: () => void }) {
  return (
    <div className="border rounded-lg p-2.5 space-y-2 bg-slate-50/50">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 gap-2 flex-1">
          <Field label="图标"><IconSelect value={item.icon} onChange={v => onChange({ ...item, icon: v })} /></Field>
          <Field label="标题"><Input className="h-7 text-xs" value={item.title} onChange={e => onChange({ ...item, title: e.target.value })} /></Field>
        </div>
        <Button size="icon" variant="ghost" className="h-6 w-6 ml-1 mt-5 shrink-0" onClick={onRemove}><X className="w-3 h-3" /></Button>
      </div>
      <Field label="描述"><Textarea className="text-xs min-h-[50px]" value={item.description} onChange={e => onChange({ ...item, description: e.target.value })} /></Field>
    </div>
  );
}

export function FeaturesForm({ data, onChange }: { data: FeaturesSchema; onChange: (d: FeaturesSchema) => void }) {
  const addItem = () => {
    const newItem: FeatureItem = { id: crypto.randomUUID(), icon: "Star", title: "New Feature", description: "Describe this feature." };
    onChange({ ...data, items: [...data.items, newItem] });
  };
  return (
    <div className="space-y-3">
      <Field label="标题"><Input className="h-8 text-xs" value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Input className="h-8 text-xs" value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value })} /></Field>
      <Field label="布局">
        <Select value={data.layout ?? FeaturesLayout.Grid} onValueChange={v => onChange({ ...data, layout: v as "grid" | "list" })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={FeaturesLayout.Grid}>网格</SelectItem>
            <SelectItem value={FeaturesLayout.List}>列表</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Separator />
      <div className="space-y-2">
        {data.items.map((item, i) => (
          <FeatureEditor key={item.id} item={item} onChange={updated => onChange({ ...data, items: data.items.map((it, ii) => ii === i ? updated : it) })} onRemove={() => onChange({ ...data, items: data.items.filter((_, ii) => ii !== i) })} />
        ))}
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={addItem}><Plus className="w-3 h-3 mr-1" />添加卖点</Button>
      </div>
    </div>
  );
}

// ── ReviewsForm ──────────────────────────────────────────────────────────────

function ReviewEditor({ item, onChange, onRemove }: { item: ReviewItem; onChange: (i: ReviewItem) => void; onRemove: () => void }) {
  return (
    <div className="border rounded-lg p-2.5 space-y-2 bg-slate-50/50">
      <div className="flex items-start justify-between gap-2">
        <div className="grid grid-cols-2 gap-2 flex-1">
          <Field label="作者名"><Input className="h-7 text-xs" value={item.authorName} onChange={e => onChange({ ...item, authorName: e.target.value })} /></Field>
          <Field label="头衔"><Input className="h-7 text-xs" value={item.authorRole ?? ""} onChange={e => onChange({ ...item, authorRole: e.target.value })} /></Field>
          <Field label="评分 (1-5)">
            <Select value={String(item.rating)} onValueChange={v => onChange({ ...item, rating: Number(v) })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[5, 4, 3, 2, 1].map(r => <SelectItem key={r} value={String(r)}>{r} 星</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Button size="icon" variant="ghost" className="h-6 w-6 mt-5 shrink-0" onClick={onRemove}><X className="w-3 h-3" /></Button>
      </div>
      <Field label="评价内容"><Textarea className="text-xs min-h-[60px]" value={item.content} onChange={e => onChange({ ...item, content: e.target.value })} /></Field>
    </div>
  );
}

export function ReviewsForm({ data, onChange }: { data: ReviewsSchema; onChange: (d: ReviewsSchema) => void }) {
  const addItem = () => {
    const newItem: ReviewItem = { id: crypto.randomUUID(), authorName: "Happy Customer", rating: 5, content: "Great product!" };
    onChange({ ...data, items: [...data.items, newItem] });
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="标题"><Input className="h-8 text-xs" value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
        <Field label="副标题"><Input className="h-8 text-xs" value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value })} /></Field>
        <Field label="平均评分"><Input className="h-8 text-xs" type="number" min={1} max={5} step={0.1} value={data.averageRating ?? ""} onChange={e => onChange({ ...data, averageRating: Number(e.target.value) })} /></Field>
        <Field label="总评论数"><Input className="h-8 text-xs" value={data.totalReviews ?? ""} onChange={e => onChange({ ...data, totalReviews: e.target.value })} placeholder="10k+" /></Field>
      </div>
      <Separator />
      <div className="space-y-2">
        {data.items.map((item, i) => (
          <ReviewEditor key={item.id} item={item} onChange={updated => onChange({ ...data, items: data.items.map((it, ii) => ii === i ? updated : it) })} onRemove={() => onChange({ ...data, items: data.items.filter((_, ii) => ii !== i) })} />
        ))}
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={addItem}><Plus className="w-3 h-3 mr-1" />添加评价</Button>
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
      <Input className="h-8 text-xs flex-1" value={badge.text} onChange={e => onChange({ ...badge, text: e.target.value })} placeholder="Badge text" />
      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onRemove}><X className="w-3 h-3" /></Button>
    </div>
  );
}

export function TrustBannerForm({ data, onChange }: { data: TrustBannerSchema; onChange: (d: TrustBannerSchema) => void }) {
  const addBadge = () => onChange({ ...data, badges: [...data.badges, { id: crypto.randomUUID(), icon: "Check", text: "New Badge" }] });
  return (
    <div className="space-y-3">
      <Field label="主题">
        <Select value={data.theme ?? TrustBannerTheme.Light} onValueChange={v => onChange({ ...data, theme: v as "light" | "dark" | "brand" })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TrustBannerTheme.Light}>浅色</SelectItem>
            <SelectItem value={TrustBannerTheme.Dark}>深色</SelectItem>
            <SelectItem value={TrustBannerTheme.Brand}>品牌色</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Separator />
      <Label className="text-xs text-muted-foreground block">徽章列表</Label>
      <div className="space-y-2">
        {data.badges.map((badge, i) => (
          <BadgeEditor key={badge.id} badge={badge} onChange={b => onChange({ ...data, badges: data.badges.map((bg, bi) => bi === i ? b : bg) })} onRemove={() => onChange({ ...data, badges: data.badges.filter((_, bi) => bi !== i) })} />
        ))}
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={addBadge}><Plus className="w-3 h-3 mr-1" />添加徽章</Button>
      </div>
    </div>
  );
}

// ── AuthorityForm ─────────────────────────────────────────────────────────────

export function AuthorityForm({ data, onChange }: { data: AuthoritySchema; onChange: (d: AuthoritySchema) => void }) {
  const addParagraph = () => onChange({ ...data, paragraphs: [...data.paragraphs, ""] });
  const addStat = () => onChange({ ...data, stats: [...(data.stats ?? []), { label: "Label", value: "100+" }] });
  return (
    <div className="space-y-3">
      <Field label="标题"><Input className="h-8 text-xs" value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Input className="h-8 text-xs" value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value })} /></Field>
      <Separator />
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">故事段落</Label>
        <div className="space-y-1.5">
          {data.paragraphs.map((p, i) => (
            <div key={i} className="flex gap-1">
              <Textarea className="text-xs min-h-[50px] flex-1" value={p} onChange={e => onChange({ ...data, paragraphs: data.paragraphs.map((pg, pi) => pi === i ? e.target.value : pg) })} />
              <Button size="icon" variant="ghost" className="h-6 w-6 mt-1 shrink-0" onClick={() => onChange({ ...data, paragraphs: data.paragraphs.filter((_, pi) => pi !== i) })}><X className="w-3 h-3" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={addParagraph}><Plus className="w-3 h-3 mr-1" />添加段落</Button>
        </div>
      </div>
      <Separator />
      <p className="text-xs font-medium text-slate-600">配图</p>
      <div className="grid grid-cols-2 gap-2">
        <Field label="图片 URL"><Input className="h-8 text-xs" value={data.image.src} onChange={e => onChange({ ...data, image: { ...data.image, src: e.target.value } })} /></Field>
        <Field label="Alt 文本"><Input className="h-8 text-xs" value={data.image.alt} onChange={e => onChange({ ...data, image: { ...data.image, alt: e.target.value } })} /></Field>
      </div>
      <Separator />
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">数据统计</Label>
        <div className="space-y-1.5">
          {(data.stats ?? []).map((stat, i) => (
            <div key={i} className="flex gap-1.5">
              <Input className="h-7 text-xs flex-1" placeholder="标签" value={stat.label} onChange={e => onChange({ ...data, stats: (data.stats ?? []).map((s, si) => si === i ? { ...s, label: e.target.value } : s) })} />
              <Input className="h-7 text-xs w-24" placeholder="数值" value={stat.value} onChange={e => onChange({ ...data, stats: (data.stats ?? []).map((s, si) => si === i ? { ...s, value: e.target.value } : s) })} />
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => onChange({ ...data, stats: (data.stats ?? []).filter((_, si) => si !== i) })}><X className="w-3 h-3" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={addStat}><Plus className="w-3 h-3 mr-1" />添加统计</Button>
        </div>
      </div>
      <Separator />
      <p className="text-xs font-medium text-slate-600">署名</p>
      <div className="grid grid-cols-2 gap-2">
        <Field label="姓名"><Input className="h-8 text-xs" value={data.signature?.name ?? ""} onChange={e => onChange({ ...data, signature: { ...data.signature, name: e.target.value, role: data.signature?.role ?? "" } })} /></Field>
        <Field label="职位"><Input className="h-8 text-xs" value={data.signature?.role ?? ""} onChange={e => onChange({ ...data, signature: { ...data.signature, role: e.target.value, name: data.signature?.name ?? "" } })} /></Field>
      </div>
    </div>
  );
}

// ── FAQForm ──────────────────────────────────────────────────────────────────

function FAQItemEditor({ item, onChange, onRemove }: { item: FAQItem; onChange: (i: FAQItem) => void; onRemove: () => void }) {
  return (
    <div className="border rounded-lg p-2.5 space-y-2 bg-slate-50/50">
      <div className="flex items-start justify-between gap-2">
        <Field label="问题">
          <Input className="h-7 text-xs" value={item.question} onChange={e => onChange({ ...item, question: e.target.value })} />
        </Field>
        <Button size="icon" variant="ghost" className="h-6 w-6 mt-5 shrink-0" onClick={onRemove}><X className="w-3 h-3" /></Button>
      </div>
      <Field label="回答"><Textarea className="text-xs min-h-[60px]" value={item.answer} onChange={e => onChange({ ...item, answer: e.target.value })} /></Field>
    </div>
  );
}

export function FAQForm({ data, onChange }: { data: FAQSchema; onChange: (d: FAQSchema) => void }) {
  const addItem = () => {
    const newItem: FAQItem = { id: crypto.randomUUID(), question: "Your question here?", answer: "Your answer here." };
    onChange({ ...data, items: [...data.items, newItem] });
  };
  return (
    <div className="space-y-3">
      <Field label="标题"><Input className="h-8 text-xs" value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} /></Field>
      <Field label="副标题"><Input className="h-8 text-xs" value={data.subtitle ?? ""} onChange={e => onChange({ ...data, subtitle: e.target.value })} /></Field>
      <Separator />
      <div className="space-y-2">
        {data.items.map((item, i) => (
          <FAQItemEditor key={item.id} item={item} onChange={updated => onChange({ ...data, items: data.items.map((it, ii) => ii === i ? updated : it) })} onRemove={() => onChange({ ...data, items: data.items.filter((_, ii) => ii !== i) })} />
        ))}
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={addItem}><Plus className="w-3 h-3 mr-1" />添加问题</Button>
      </div>
      {data.contactCta && (
        <>
          <Separator />
          <CtaFields value={data.contactCta} onChange={cta => onChange({ ...data, contactCta: cta })} />
        </>
      )}
    </div>
  );
}