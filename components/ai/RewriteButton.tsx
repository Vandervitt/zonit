"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

export function RewriteButton({
  field,
  currentText,
  onApply,
}: {
  field: string;
  currentText: string;
  onApply: (text: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<string[]>([]);

  const run = async () => {
    if (!currentText.trim()) {
      toast.error("先填写一些内容，再让 AI 改写");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionType: "hero", field, currentText }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error === "ai_quota_exhausted" ? "AI 改写额度已用完，请升级" : "改写失败，请重试");
        return;
      }
      setCandidates(data.candidates ?? []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={run}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 transition-colors hover:text-brand-700"
        >
          <Sparkles className="h-3 w-3" />
          {loading ? "改写中…" : "AI 改写"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-2">
        {candidates.length === 0 ? (
          <p className="text-xs text-ink-muted">点击「AI 改写」生成候选文案</p>
        ) : (
          candidates.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onApply(c)}
              className="block w-full rounded-md border border-edge p-2 text-left text-sm text-ink transition-colors hover:border-edge-strong hover:bg-canvas"
            >
              {c}
            </button>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}
