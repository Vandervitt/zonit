import { useState } from "react";
import { Plus, Trash2, Zap, Package, List, FileText, Sparkles, MessageSquare, Shield, User, HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../ui/utils";
import {
  HeroForm, BundlesForm, HowItWorksForm, FooterForm,
  FeaturesForm, ReviewsForm, TrustBannerForm, AuthorityForm, FAQForm,
} from "./BlockForms";
import { AddBlockDialog } from "./AddBlockDialog";
import { getDefaultBlockData } from "../../lib/templates";
import { BlockZone, FixedBlockKey } from "../../lib/constants";
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
  OptionalBlockType,
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
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  Hero: <Zap className="w-3.5 h-3.5 text-rose-400" />,
  ProductBundles: <Package className="w-3.5 h-3.5 text-indigo-400" />,
  HowItWorks: <List className="w-3.5 h-3.5 text-sky-400" />,
  MicroFooter: <FileText className="w-3.5 h-3.5 text-zinc-400" />,
  Features: <Sparkles className="w-3.5 h-3.5 text-violet-400" />,
  Reviews: <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />,
  TrustBanner: <Shield className="w-3.5 h-3.5 text-amber-400" />,
  AuthorityStory: <User className="w-3.5 h-3.5 text-orange-400" />,
  FAQ: <HelpCircle className="w-3.5 h-3.5 text-pink-400" />,
};

const TYPE_BG: Record<string, string> = {
  Hero: "bg-rose-500/10",
  ProductBundles: "bg-indigo-500/10",
  HowItWorks: "bg-sky-500/10",
  MicroFooter: "bg-zinc-500/10",
  Features: "bg-violet-500/10",
  Reviews: "bg-emerald-500/10",
  TrustBanner: "bg-amber-500/10",
  AuthorityStory: "bg-orange-500/10",
  FAQ: "bg-pink-500/10",
};

const TYPE_LABEL: Record<string, string> = {
  Hero: "首屏主视觉",
  ProductBundles: "套餐/价格",
  HowItWorks: "购买流程",
  MicroFooter: "页脚",
  Features: "产品卖点",
  Reviews: "用户评价",
  TrustBanner: "信任条",
  AuthorityStory: "权威背书",
  FAQ: "常见问题",
};

export function BlockEditorPanel({ data, onChange, expandedKey, onExpandedKeyChange }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const setExpandedKey = onExpandedKeyChange;

  const blockList: BlockMeta[] = [
    { key: FixedBlockKey.Hero, label: TYPE_LABEL.Hero, icon: TYPE_ICON.Hero, required: true, type: "Hero" },
    ...data.upperBlocks.map(b => ({
      key: b.id, label: TYPE_LABEL[b.type], icon: TYPE_ICON[b.type], required: false, type: b.type,
    })),
    { key: FixedBlockKey.Bundles, label: TYPE_LABEL.ProductBundles, icon: TYPE_ICON.ProductBundles, required: true, type: "ProductBundles" },
    { key: FixedBlockKey.HowItWorks, label: TYPE_LABEL.HowItWorks, icon: TYPE_ICON.HowItWorks, required: true, type: "HowItWorks" },
    ...data.lowerBlocks.map(b => ({
      key: b.id, label: TYPE_LABEL[b.type], icon: TYPE_ICON[b.type], required: false, type: b.type,
    })),
    { key: FixedBlockKey.Footer, label: TYPE_LABEL.MicroFooter, icon: TYPE_ICON.MicroFooter, required: true, type: "MicroFooter" },
  ];

  const existingOptionalTypes = [
    ...data.upperBlocks.map(b => b.type),
    ...data.lowerBlocks.map(b => b.type),
  ] as OptionalBlockType[];

  const handleAddBlock = (type: OptionalBlockType, zone: BlockZone.Upper | BlockZone.Lower) => {
    const newBlock: OptionalBlock = {
      id: crypto.randomUUID(),
      type,
      data: getDefaultBlockData(type) as OptionalBlock["data"],
    };
    if (zone === BlockZone.Upper) {
      onChange({ ...data, upperBlocks: [...data.upperBlocks, newBlock] });
    } else {
      onChange({ ...data, lowerBlocks: [...data.lowerBlocks, newBlock] });
    }
    setExpandedKey(newBlock.id);
  };

  const removeOptionalBlock = (blockId: string) => {
    onChange({
      ...data,
      upperBlocks: data.upperBlocks.filter(b => b.id !== blockId),
      lowerBlocks: data.lowerBlocks.filter(b => b.id !== blockId),
    });
    if (expandedKey === blockId) setExpandedKey(FixedBlockKey.Hero);
  };

  const renderForm = (meta: BlockMeta) => {
    if (meta.key === FixedBlockKey.Hero) {
      return <HeroForm data={data.hero as HeroSchema} onChange={hero => onChange({ ...data, hero })} />;
    }
    if (meta.key === FixedBlockKey.Bundles) {
      return <BundlesForm data={data.bundles as BundlesSchema} onChange={bundles => onChange({ ...data, bundles })} />;
    }
    if (meta.key === FixedBlockKey.HowItWorks) {
      return <HowItWorksForm data={data.howItWorks as HowItWorksSchema} onChange={howItWorks => onChange({ ...data, howItWorks })} />;
    }
    if (meta.key === FixedBlockKey.Footer) {
      return <FooterForm data={data.footer as MicroFooterSchema} onChange={footer => onChange({ ...data, footer })} />;
    }
    const updateOptional = (blockId: string, newData: OptionalBlock["data"]) => {
      onChange({
        ...data,
        upperBlocks: data.upperBlocks.map(b => b.id === blockId ? { ...b, data: newData } : b),
        lowerBlocks: data.lowerBlocks.map(b => b.id === blockId ? { ...b, data: newData } : b),
      });
    };
    const block = [...data.upperBlocks, ...data.lowerBlocks].find(b => b.id === meta.key);
    if (!block) return null;
    switch (block.type) {
      case "Features":
        return <FeaturesForm data={block.data as FeaturesSchema} onChange={d => updateOptional(block.id, d)} />;
      case "Reviews":
        return <ReviewsForm data={block.data as ReviewsSchema} onChange={d => updateOptional(block.id, d)} />;
      case "TrustBanner":
        return <TrustBannerForm data={block.data as TrustBannerSchema} onChange={d => updateOptional(block.id, d)} />;
      case "AuthorityStory":
        return <AuthorityForm data={block.data as AuthoritySchema} onChange={d => updateOptional(block.id, d)} />;
      case "FAQ":
        return <FAQForm data={block.data as FAQSchema} onChange={d => updateOptional(block.id, d)} />;
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
                    {meta.required ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-600 font-medium">必填</span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-600 font-medium">可选</span>
                    )}
                    {!meta.required && expandedKey === meta.key && (
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
          disabled={existingOptionalTypes.length >= 5}
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
