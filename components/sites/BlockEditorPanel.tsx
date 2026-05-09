import { useState } from "react";
import { Plus, Trash2, Zap, Package, List, FileText, Sparkles, MessageSquare, Shield, User, HelpCircle, Timer, MousePointerClick, Mail, Palette } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "../ui/utils";
import {
  HeroForm, OfferForm, HowItWorksForm, FooterForm,
  FeaturesForm, ReviewsForm, TrustBannerForm, AuthorityForm, FAQForm,
  CountdownForm, StickyCtaEditor, AssuranceForm, LeadFormForm,
} from "./BlockForms";
import { AddBlockDialog } from "./AddBlockDialog";
import { AiRewriteButton } from "../editor/AiRewriteButton";
import { getDefaultBlockData } from "../../lib/templates";
import {
  setModuleLayout,
  toLandingPageTemplateV2,
  toLegacyLandingPageTemplate,
} from "../../lib/templates/landing-page-v2-adapter";
import { FixedBlockKey } from "../../lib/constants";
import type {
  LandingPageTemplate,
  HeroSchema,
  OfferSchema,
  HowItWorksSchema,
  MicroFooterSchema,
  FeaturesSchema,
  ReviewsSchema,
  TrustBannerSchema,
  AuthoritySchema,
  FAQSchema,
  CountdownSchema,
  AssuranceSchema,
  LeadFormSchema,
  OptionalBlock,
  BlockType,
  LandingPageDesignConfig,
  ModuleDefinition,
  ModuleLayoutConfig,
} from "@/types/schema";

interface Props {
  data: LandingPageTemplate;
  onChange: (data: LandingPageTemplate) => void;
  expandedKey: string;
  onExpandedKeyChange: (key: string) => void;
}

interface BlockMeta {
  key: string;
  label: string;
  icon: React.ReactNode;
  required: boolean;
  type: string;
  badgeText?: string;
  removable?: boolean;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  Hero: <Zap className="w-3.5 h-3.5 text-rose-400" />,
  Offer: <Package className="w-3.5 h-3.5 text-indigo-400" />,
  HowItWorks: <List className="w-3.5 h-3.5 text-sky-400" />,
  MicroFooter: <FileText className="w-3.5 h-3.5 text-zinc-400" />,
  Features: <Sparkles className="w-3.5 h-3.5 text-violet-400" />,
  Reviews: <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />,
  TrustBanner: <Shield className="w-3.5 h-3.5 text-amber-400" />,
  AuthorityStory: <User className="w-3.5 h-3.5 text-orange-400" />,
  FAQ: <HelpCircle className="w-3.5 h-3.5 text-pink-400" />,
  Countdown: <Timer className="w-3.5 h-3.5 text-orange-400" />,
  LeadForm: <Mail className="w-3.5 h-3.5 text-indigo-400" />,
  StickyCta: <MousePointerClick className="w-3.5 h-3.5 text-cyan-400" />,
  Design: <Palette className="w-3.5 h-3.5 text-fuchsia-400" />,
};

const TYPE_BG: Record<string, string> = {
  Hero: "bg-rose-500/10",
  Offer: "bg-indigo-500/10",
  HowItWorks: "bg-sky-500/10",
  MicroFooter: "bg-zinc-500/10",
  Features: "bg-violet-500/10",
  Reviews: "bg-emerald-500/10",
  TrustBanner: "bg-amber-500/10",
  AuthorityStory: "bg-orange-500/10",
  FAQ: "bg-pink-500/10",
  Countdown: "bg-orange-500/10",
  LeadForm: "bg-indigo-500/10",
  StickyCta: "bg-cyan-500/10",
  Design: "bg-fuchsia-500/10",
};

const TYPE_LABEL: Record<string, string> = {
  Hero: "首屏主视觉",
  Offer: "咨询入口",
  HowItWorks: "联系流程",
  MicroFooter: "页脚",
  Features: "服务卖点",
  Reviews: "用户评价",
  TrustBanner: "信任条",
  AuthorityStory: "权威背书",
  FAQ: "常见问题",
  Countdown: "倒计时",
  LeadForm: "表单线索",
  StickyCta: "全站浮动 CTA",
  Design: "全局设计",
};

const DEFAULT_LEAD_FORM = getDefaultBlockData("LeadForm") as LeadFormSchema;

function createOptionalBlock(type: BlockType): OptionalBlock {
  const id = crypto.randomUUID();

  switch (type) {
    case "Features":
      return { id, type, data: getDefaultBlockData(type) as FeaturesSchema };
    case "Reviews":
      return { id, type, data: getDefaultBlockData(type) as ReviewsSchema };
    case "TrustBanner":
      return { id, type, data: getDefaultBlockData(type) as TrustBannerSchema };
    case "AuthorityStory":
      return { id, type, data: getDefaultBlockData(type) as AuthoritySchema };
    case "FAQ":
      return { id, type, data: getDefaultBlockData(type) as FAQSchema };
    case "Countdown":
      return { id, type, data: getDefaultBlockData(type) as CountdownSchema };
    case "Assurance":
      return { id, type, data: getDefaultBlockData(type) as AssuranceSchema };
  }
  throw new Error(`Unsupported optional block type: ${type}`);
}

function replaceOptionalBlockData(block: OptionalBlock, newData: OptionalBlock["data"]): OptionalBlock {
  switch (block.type) {
    case "Features":
      return { ...block, data: newData as FeaturesSchema };
    case "Reviews":
      return { ...block, data: newData as ReviewsSchema };
    case "TrustBanner":
      return { ...block, data: newData as TrustBannerSchema };
    case "AuthorityStory":
      return { ...block, data: newData as AuthoritySchema };
    case "FAQ":
      return { ...block, data: newData as FAQSchema };
    case "Countdown":
      return { ...block, data: newData as CountdownSchema };
    case "Assurance":
      return { ...block, data: newData as AssuranceSchema };
  }
  throw new Error(`Unsupported optional block type: ${block.type}`);
}

function FieldShell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</Label>
      {children}
    </div>
  );
}

function DesignControls({
  design,
  onChange,
}: {
  design: LandingPageDesignConfig;
  onChange: (design: LandingPageDesignConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <FieldShell label="主色">
        <Input
          value={design.palette.primary}
          onChange={event => onChange({
            ...design,
            palette: { ...design.palette, primary: event.target.value },
          })}
          className="h-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-200"
        />
      </FieldShell>

      <FieldShell label="辅助色">
        <Input
          value={design.palette.accent ?? ""}
          onChange={event => onChange({
            ...design,
            palette: { ...design.palette, accent: event.target.value || undefined },
          })}
          className="h-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-200"
        />
      </FieldShell>

      <div className="grid grid-cols-2 gap-3">
        <FieldShell label="圆角">
          <Select
            value={design.radius ?? "md"}
            onValueChange={value => onChange({ ...design, radius: value as LandingPageDesignConfig["radius"] })}
          >
            <SelectTrigger className="h-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["none", "sm", "md", "lg", "full"].map(value => (
                <SelectItem key={value} value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldShell>

        <FieldShell label="密度">
          <Select
            value={design.density ?? "normal"}
            onValueChange={value => onChange({ ...design, density: value as LandingPageDesignConfig["density"] })}
          >
            <SelectTrigger className="h-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["compact", "normal", "relaxed"].map(value => (
                <SelectItem key={value} value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldShell>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldShell label="按钮">
          <Select
            value={design.buttonStyle ?? "solid"}
            onValueChange={value => onChange({ ...design, buttonStyle: value as LandingPageDesignConfig["buttonStyle"] })}
          >
            <SelectTrigger className="h-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["solid", "outline", "soft"].map(value => (
                <SelectItem key={value} value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldShell>

        <FieldShell label="图片">
          <Select
            value={design.imageStyle ?? "rounded"}
            onValueChange={value => onChange({ ...design, imageStyle: value as LandingPageDesignConfig["imageStyle"] })}
          >
            <SelectTrigger className="h-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["sharp", "rounded", "soft"].map(value => (
                <SelectItem key={value} value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldShell>
      </div>
    </div>
  );
}

function LayoutControls({
  layout,
  onChange,
}: {
  layout: ModuleLayoutConfig;
  onChange: (layout: ModuleLayoutConfig) => void;
}) {
  return (
    <div className="mt-5 border-t border-zinc-800 pt-4 space-y-3">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">布局控制</p>
      <div className="grid grid-cols-2 gap-3">
        <FieldShell label="对齐">
          <Select
            value={layout.alignment ?? "center"}
            onValueChange={value => onChange({ ...layout, alignment: value as ModuleLayoutConfig["alignment"] })}
          >
            <SelectTrigger className="h-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["left", "center", "right"].map(value => (
                <SelectItem key={value} value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldShell>

        <FieldShell label="列数">
          <Select
            value={String(layout.columns ?? 3)}
            onValueChange={value => onChange({ ...layout, columns: Number(value) as ModuleLayoutConfig["columns"] })}
          >
            <SelectTrigger className="h-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["1", "2", "3", "4"].map(value => (
                <SelectItem key={value} value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldShell>
      </div>
    </div>
  );
}

export function BlockEditorPanel({ data, onChange, expandedKey, onExpandedKeyChange }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const setExpandedKey = onExpandedKeyChange;
  const blocks = data.blocks ?? [];
  const v2Template = toLandingPageTemplateV2(data);

  const commitV2 = (nextTemplate: typeof v2Template) => {
    onChange(toLegacyLandingPageTemplate(nextTemplate, data));
  };

  const commitLegacy = (nextData: LandingPageTemplate) => {
    const normalized = toLandingPageTemplateV2({
      ...nextData,
      schemaVersion: undefined,
      modules: undefined,
      content: undefined,
      design: undefined,
      layout: undefined,
      integrations: undefined,
    });

    commitV2({
      ...v2Template,
      pageMeta: nextData.pageMeta,
      primaryConversion: nextData.primaryConversion,
      modules: normalized.modules,
      content: normalized.content,
      integrations: {
        ...v2Template.integrations,
        leadFormId: nextData.leadForm?.id,
      },
    });
  };

  const blockList: BlockMeta[] = [
    { key: "design", label: TYPE_LABEL.Design, icon: TYPE_ICON.Design, required: true, type: "Design", badgeText: "全局", removable: false },
    ...v2Template.modules.map(module => ({
      key: module.id,
      label: module.label ?? TYPE_LABEL[module.type] ?? module.type,
      icon: TYPE_ICON[module.type],
      required: module.type === "Hero" || module.type === "Offer" || module.type === "HowItWorks" || module.type === "MicroFooter",
      type: module.type,
      badgeText: module.type === "LeadForm" ? "单例" : module.type === "StickyCta" ? "全站" : undefined,
      removable: module.type !== "Hero" && module.type !== "Offer" && module.type !== "HowItWorks" && module.type !== "MicroFooter" && module.type !== "LeadForm" && module.type !== "StickyCta",
    })),
  ];

  const existingOptionalTypes = blocks.map(b => b.type) as BlockType[];

  const handleAddBlock = (type: BlockType) => {
    const newBlock = createOptionalBlock(type);
    commitLegacy({ ...data, blocks: [...blocks, newBlock] });
    setExpandedKey(newBlock.id);
  };

  const removeOptionalBlock = (blockId: string) => {
    commitLegacy({
      ...data,
      blocks: blocks.filter(b => b.id !== blockId),
    });
    if (expandedKey === blockId) setExpandedKey(FixedBlockKey.Hero);
  };

  const renderWithLayout = (module: ModuleDefinition | undefined, form: React.ReactNode) => {
    if (!module || module.type === "StickyCta" || module.type === "MicroFooter") return form;

    const layout = v2Template.layout?.modules?.[module.id]
      ?? (v2Template.layout?.[module.id] as ModuleLayoutConfig | undefined)
      ?? {};

    return (
      <>
        {form}
        <LayoutControls
          layout={layout}
          onChange={nextLayout => commitV2(setModuleLayout(v2Template, module.id, nextLayout))}
        />
      </>
    );
  };

  const renderForm = (meta: BlockMeta) => {
    if (meta.key === "design") {
      return (
        <DesignControls
          design={v2Template.design}
          onChange={design => commitV2({ ...v2Template, design })}
        />
      );
    }

    const moduleConfig = v2Template.modules.find(item => item.id === meta.key);

    if (meta.key === FixedBlockKey.Hero) {
      return renderWithLayout(moduleConfig, (
        <>
          <AiRewriteButton
            blockType="Hero"
            currentData={data.hero}
            onSuccess={d => commitLegacy({ ...data, hero: d as HeroSchema })}
          />
          <HeroForm data={data.hero as HeroSchema} onChange={hero => commitLegacy({ ...data, hero })} />
        </>
      ));
    }
    if (meta.key === FixedBlockKey.Offer) {
      return renderWithLayout(moduleConfig, (
        <>
          <AiRewriteButton
            blockType="Offer"
            currentData={data.offer}
            onSuccess={d => commitLegacy({ ...data, offer: d as OfferSchema })}
          />
          <OfferForm data={data.offer as OfferSchema} onChange={offer => commitLegacy({ ...data, offer })} />
        </>
      ));
    }
    if (meta.key === FixedBlockKey.HowItWorks) {
      return renderWithLayout(moduleConfig, (
        <>
          <AiRewriteButton
            blockType="HowItWorks"
            currentData={data.howItWorks}
            onSuccess={d => commitLegacy({ ...data, howItWorks: d as HowItWorksSchema })}
          />
          <HowItWorksForm data={data.howItWorks as HowItWorksSchema} onChange={howItWorks => commitLegacy({ ...data, howItWorks })} />
        </>
      ));
    }
    if (meta.key === FixedBlockKey.Footer) {
      return (
        <>
          <AiRewriteButton
            blockType="MicroFooter"
            currentData={data.footer}
            onSuccess={d => commitLegacy({ ...data, footer: d as MicroFooterSchema })}
          />
          <FooterForm data={data.footer as MicroFooterSchema} onChange={footer => commitLegacy({ ...data, footer })} />
        </>
      );
    }
    if (meta.key === FixedBlockKey.StickyCta) {
      return (
        <StickyCtaEditor
          value={data.stickyCta}
          onChange={stickyCta => commitLegacy({ ...data, stickyCta })}
        />
      );
    }
    if (meta.key === FixedBlockKey.LeadForm) {
      const leadForm = data.leadForm ?? DEFAULT_LEAD_FORM;
      return renderWithLayout(moduleConfig, (
        <>
          <AiRewriteButton
            blockType="LeadForm"
            currentData={leadForm}
            onSuccess={d => commitLegacy({ ...data, leadForm: d as LeadFormSchema })}
          />
          <LeadFormForm data={leadForm} onChange={leadForm => commitLegacy({ ...data, leadForm })} />
        </>
      ));
    }
    const updateOptional = (blockId: string, newData: OptionalBlock["data"]) => {
      commitLegacy({
        ...data,
        blocks: blocks.map(b => b.id === blockId ? replaceOptionalBlockData(b, newData) : b),
      });
    };
    const block = blocks.find(b => b.id === meta.key);
    if (!block) return null;
    switch (block.type) {
      case "Features":
        return renderWithLayout(moduleConfig, (
          <>
            <AiRewriteButton
              blockType="Features"
              currentData={block.data}
              onSuccess={d => updateOptional(block.id, d as OptionalBlock["data"])}
            />
            <FeaturesForm data={block.data as FeaturesSchema} onChange={d => updateOptional(block.id, d)} />
          </>
        ));
      case "Reviews":
        return renderWithLayout(moduleConfig, (
          <>
            <AiRewriteButton
              blockType="Reviews"
              currentData={block.data}
              onSuccess={d => updateOptional(block.id, d as OptionalBlock["data"])}
            />
            <ReviewsForm data={block.data as ReviewsSchema} onChange={d => updateOptional(block.id, d)} />
          </>
        ));
      case "TrustBanner":
        return renderWithLayout(moduleConfig, (
          <>
            <AiRewriteButton
              blockType="TrustBanner"
              currentData={block.data}
              onSuccess={d => updateOptional(block.id, d as OptionalBlock["data"])}
            />
            <TrustBannerForm data={block.data as TrustBannerSchema} onChange={d => updateOptional(block.id, d)} />
          </>
        ));
      case "AuthorityStory":
        return renderWithLayout(moduleConfig, (
          <>
            <AiRewriteButton
              blockType="AuthorityStory"
              currentData={block.data}
              onSuccess={d => updateOptional(block.id, d as OptionalBlock["data"])}
            />
            <AuthorityForm data={block.data as AuthoritySchema} onChange={d => updateOptional(block.id, d)} />
          </>
        ));
      case "FAQ":
        return renderWithLayout(moduleConfig, (
          <>
            <AiRewriteButton
              blockType="FAQ"
              currentData={block.data}
              onSuccess={d => updateOptional(block.id, d as OptionalBlock["data"])}
            />
            <FAQForm data={block.data as FAQSchema} onChange={d => updateOptional(block.id, d)} />
          </>
        ));
      case "Countdown":
        return renderWithLayout(moduleConfig, (
          <CountdownForm data={block.data as CountdownSchema} onChange={d => updateOptional(block.id, d)} />
        ));
      case "Assurance":
        return renderWithLayout(moduleConfig, (
          <>
            <AiRewriteButton
              blockType="Assurance"
              currentData={block.data}
              onSuccess={d => updateOptional(block.id, d as OptionalBlock["data"])}
            />
            <AssuranceForm data={block.data as AssuranceSchema} onChange={d => updateOptional(block.id, d)} />
          </>
        ));
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="px-4 py-3.5 shrink-0 border-b border-zinc-800/60 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">模块编辑</span>
        <span className="ml-auto font-mono text-[10px] bg-zinc-900 text-zinc-600 px-1.5 py-0.5 rounded">
          {blockList.length}
        </span>
      </div>

      <ScrollArea className="flex-1 min-h-0 overflow-hidden">
        <Accordion
          type="single"
          collapsible
          value={expandedKey}
          onValueChange={v => setExpandedKey(v)}
          className="divide-y divide-zinc-800/40"
        >
          {blockList.map((meta) => (
            <AccordionItem
              key={meta.key}
              value={meta.key}
              className="border-0"
            >
              <AccordionTrigger
                className={cn(
                  "hover:no-underline py-2.5 px-4 gap-2 transition-colors",
                  "hover:bg-zinc-900 data-[state=open]:bg-zinc-900",
                  "[&>svg]:text-zinc-700 data-[state=open]:[&>svg]:text-zinc-500",
                )}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
                    TYPE_BG[meta.type] ?? "bg-zinc-800",
                  )}>
                    {meta.icon}
                  </div>
                  <p className="text-xs text-zinc-300 truncate flex-1 text-left">{meta.label}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {meta.badgeText ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-500 font-medium">{meta.badgeText}</span>
                    ) : meta.required ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-600 font-medium">必填</span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-600 font-medium">可选</span>
                    )}
                    {(meta.removable ?? !meta.required) && expandedKey === meta.key && (
                      <div
                        role="button"
                        className="h-5 w-5 inline-flex items-center justify-center rounded hover:bg-rose-500/10 cursor-pointer transition-colors group"
                        onClick={e => { e.stopPropagation(); removeOptionalBlock(meta.key); }}
                      >
                        <Trash2 className="w-3 h-3 text-zinc-600 group-hover:text-rose-400 transition-colors" />
                      </div>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-zinc-900 border-t border-zinc-800/60 px-4 pb-6 pt-3">
                {renderForm(meta)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>

      <div className="p-3 border-t border-zinc-800/60 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs gap-1.5 h-8 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700 rounded-md transition-colors"
          onClick={() => setAddOpen(true)}
          disabled={existingOptionalTypes.length >= 8}
        >
          <Plus className="w-3.5 h-3.5" />
          添加模块
        </Button>
      </div>

      <AddBlockDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        existingTypes={existingOptionalTypes}
        onAdd={handleAddBlock}
      />
    </div>
  );
}
