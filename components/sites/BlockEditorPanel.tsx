import { useState } from "react";
import { Plus, Trash2, Zap, Package, List, FileText, Sparkles, MessageSquare, Shield, User, HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
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
  Hero: <Zap className="w-4 h-4 text-rose-500" />,
  ProductBundles: <Package className="w-4 h-4 text-indigo-500" />,
  HowItWorks: <List className="w-4 h-4 text-sky-500" />,
  MicroFooter: <FileText className="w-4 h-4 text-slate-500" />,
  Features: <Sparkles className="w-4 h-4 text-violet-500" />,
  Reviews: <MessageSquare className="w-4 h-4 text-emerald-500" />,
  TrustBanner: <Shield className="w-4 h-4 text-amber-500" />,
  AuthorityStory: <User className="w-4 h-4 text-orange-500" />,
  FAQ: <HelpCircle className="w-4 h-4 text-pink-500" />,
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

  // Build ordered list of all block metas
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
    // Optional blocks
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
    <div className="flex flex-col h-full bg-white border-r border-border">
      <div className="p-4 border-b border-border shrink-0">
        <p className="text-sm text-slate-700">模块编辑</p>
        <p className="text-xs text-muted-foreground mt-0.5">{blockList.length} 个模块</p>
      </div>

      <ScrollArea className="flex-1 min-h-0 overflow-hidden">
        <Accordion
          type="single"
          collapsible
          value={expandedKey}
          onValueChange={v => setExpandedKey(v)}
          className="px-3"
        >
          {blockList.map((meta, index) => (
            <AccordionItem
              key={meta.key}
              value={meta.key}
              className={cn(
                "border-b border-border/50 last:border-0",
              )}
            >
              <AccordionTrigger className="hover:no-underline py-3 gap-2">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    {meta.icon}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-xs text-slate-800 truncate">{meta.label}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {meta.required ? (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">必填</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground">可选</Badge>
                    )}
                    {!meta.required && expandedKey === meta.key && (
                      <div
                        role="button"
                        className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-accent cursor-pointer"
                        onClick={e => { e.stopPropagation(); removeOptionalBlock(meta.key); }}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </div>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-1 pb-4">
                {renderForm(meta)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>

      {/* Add Block Button */}
      <div className="p-3 border-t border-border shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs gap-1.5"
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
