import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { useState } from "react";
import { Check, Sparkles, MessageSquare, Shield, User, HelpCircle, Timer, ArrowLeftRight, BadgeCheck, Mail, Newspaper, Video } from "lucide-react";
import type { OptionalBlockType } from "@/types/schema";
import { BlockZone } from "@/lib/constants";

interface BlockOption {
  type: OptionalBlockType;
  label: string;
  description: string;
  icon: React.ReactNode;
  zone: BlockZone;
}

const ALL_OPTIONAL_BLOCKS: BlockOption[] = [
  {
    type: "TrustBanner",
    label: "信任条",
    description: "一排信任徽章，展示安全保障、配送、售后等",
    icon: <Shield className="w-5 h-5 text-sky-500" />,
    zone: BlockZone.Upper,
  },
  {
    type: "Features",
    label: "产品/服务卖点",
    description: "网格或列表展示核心优势，吸引用户",
    icon: <Sparkles className="w-5 h-5 text-violet-500" />,
    zone: BlockZone.Upper,
  },
  {
    type: "AuthorityStory",
    label: "权威背书",
    description: "创始人故事、专家认证、品牌数据展示",
    icon: <User className="w-5 h-5 text-amber-500" />,
    zone: BlockZone.Both,
  },
  {
    type: "Reviews",
    label: "用户评价",
    description: "展示真实买家评价、截图或评分，增强信任",
    icon: <MessageSquare className="w-5 h-5 text-emerald-500" />,
    zone: BlockZone.Lower,
  },
  {
    type: "FAQ",
    label: "常见问题",
    description: "解答用户疑虑，引导点击咨询",
    icon: <HelpCircle className="w-5 h-5 text-rose-500" />,
    zone: BlockZone.Lower,
  },
  {
    type: "Countdown",
    label: "倒计时",
    description: "限时活动倒计时，制造稀缺感与紧迫感",
    icon: <Timer className="w-5 h-5 text-orange-500" />,
    zone: BlockZone.Both,
  },
  {
    type: "BeforeAfter",
    label: "前后对比",
    description: "图片前后对比展示真实效果，适合医美/减肥/装修",
    icon: <ArrowLeftRight className="w-5 h-5 text-teal-500" />,
    zone: BlockZone.Middle,
  },
  {
    type: "Assurance",
    label: "服务承诺",
    description: "免费咨询、响应时效、隐私保护等信任保障徽章",
    icon: <BadgeCheck className="w-5 h-5 text-green-500" />,
    zone: BlockZone.Middle,
  },
  {
    type: "MediaLogos",
    label: "媒体 Logo 墙",
    description: "As seen on Forbes / TechCrunch，强化第三方权威背书",
    icon: <Newspaper className="w-5 h-5 text-slate-500" />,
    zone: BlockZone.Upper,
  },
  {
    type: "VideoTestimonials",
    label: "视频证言",
    description: "UGC 视频证言，TikTok/Reels 时代的转化利器",
    icon: <Video className="w-5 h-5 text-fuchsia-500" />,
    zone: BlockZone.Lower,
  },
  {
    type: "LeadForm",
    label: "表单线索",
    description: "高客单咨询场景：收集姓名/邮箱/电话进 CRM",
    icon: <Mail className="w-5 h-5 text-indigo-500" />,
    zone: BlockZone.Lower,
  },
];

type AddZone = BlockZone.Upper | BlockZone.Middle | BlockZone.Lower;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingTypes: OptionalBlockType[];
  onAdd: (type: OptionalBlockType, zone: AddZone) => void;
}

export function AddBlockDialog({ open, onOpenChange, existingTypes, onAdd }: Props) {
  const [selected, setSelected] = useState<BlockOption | null>(null);
  const [zone, setZone] = useState<BlockZone.Upper | BlockZone.Lower>(BlockZone.Lower);

  const available = ALL_OPTIONAL_BLOCKS.filter(b => !existingTypes.includes(b.type));

  const handleAdd = () => {
    if (!selected) return;
    const finalZone: AddZone = selected.zone === BlockZone.Both
      ? zone
      : (selected.zone as AddZone);
    onAdd(selected.type, finalZone);
    setSelected(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>添加模块</DialogTitle>
        </DialogHeader>

        {available.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            所有可选模块已添加完毕
          </div>
        ) : (
          <div className="space-y-2 py-2">
            {available.map(block => (
              <button
                key={block.type}
                type="button"
                onClick={() => setSelected(block)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all hover:bg-slate-50",
                  selected?.type === block.type
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-slate-50/50",
                )}
              >
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                  {block.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800">{block.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{block.description}</p>
                </div>
                {selected?.type === block.type && (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                )}
              </button>
            ))}

            {/* Zone selector for "both" zone blocks */}
            {selected?.zone === BlockZone.Both && (
              <div className="flex items-center gap-2 pt-2">
                <p className="text-xs text-muted-foreground">插入位置：</p>
                <Button
                  size="sm"
                  variant={zone === BlockZone.Upper ? "default" : "outline"}
                  className="text-xs h-7"
                  onClick={() => setZone(BlockZone.Upper)}
                >
                  Hero 之后
                </Button>
                <Button
                  size="sm"
                  variant={zone === BlockZone.Lower ? "default" : "outline"}
                  className="text-xs h-7"
                  onClick={() => setZone(BlockZone.Lower)}
                >
                  HowItWorks 之后
                </Button>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleAdd} disabled={!selected}>添加模块</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
