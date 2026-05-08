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
import { Check, Sparkles, MessageSquare, Shield, User, HelpCircle, Timer, BadgeCheck } from "lucide-react";
import type { BlockType } from "@/types/schema";

interface BlockOption {
  type: BlockType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const ALL_OPTIONAL_BLOCKS: BlockOption[] = [
  {
    type: "TrustBanner",
    label: "信任条",
    description: "一排信任徽章，展示响应速度、隐私保护、专业支持等",
    icon: <Shield className="w-5 h-5 text-sky-500" />,
  },
  {
    type: "Features",
    label: "服务卖点",
    description: "网格或列表展示核心优势，吸引用户",
    icon: <Sparkles className="w-5 h-5 text-violet-500" />,
  },
  {
    type: "AuthorityStory",
    label: "权威背书",
    description: "创始人故事、专家认证、品牌数据展示",
    icon: <User className="w-5 h-5 text-amber-500" />,
  },
  {
    type: "Reviews",
    label: "用户评价",
    description: "展示真实客户评价、截图或评分，增强信任",
    icon: <MessageSquare className="w-5 h-5 text-emerald-500" />,
  },
  {
    type: "FAQ",
    label: "常见问题",
    description: "解答用户疑虑，引导点击咨询",
    icon: <HelpCircle className="w-5 h-5 text-rose-500" />,
  },
  {
    type: "Countdown",
    label: "倒计时",
    description: "限时活动倒计时，制造稀缺感与紧迫感",
    icon: <Timer className="w-5 h-5 text-orange-500" />,
  },
  {
    type: "Assurance",
    label: "服务承诺",
    description: "免费咨询、响应时效、隐私保护等信任保障徽章",
    icon: <BadgeCheck className="w-5 h-5 text-green-500" />,
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingTypes: BlockType[];
  onAdd: (type: BlockType) => void;
}

export function AddBlockDialog({ open, onOpenChange, existingTypes, onAdd }: Props) {
  const [selected, setSelected] = useState<BlockOption | null>(null);

  const available = ALL_OPTIONAL_BLOCKS.filter(b => !existingTypes.includes(b.type));

  const handleAdd = () => {
    if (!selected) return;
    onAdd(selected.type);
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
