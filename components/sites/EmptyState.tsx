import { Globe, Plus } from "lucide-react";
import { Button } from "../ui/button";

interface Props {
  onNew: () => void;
  hasSearch: boolean;
}

export function EmptyState({ onNew, hasSearch }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
        <Globe className="w-8 h-8 text-slate-400" />
      </div>
      <div>
        <p className="text-slate-700">{hasSearch ? "没有找到匹配的站点" : "还没有站点"}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {hasSearch ? "尝试搜索其他关键词" : "点击新建站点开始你的第一个落地页"}
        </p>
      </div>
      {!hasSearch && (
        <Button onClick={onNew} className="gap-1.5 rounded-full">
          <Plus className="w-4 h-4" />
          新建站点
        </Button>
      )}
    </div>
  );
}
