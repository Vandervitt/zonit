"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { rewriteBlockContent } from "@/app/actions/ai-rewrite";

interface Props {
  blockType: string;
  currentData: unknown;
  onSuccess: (data: unknown) => void;
}

export function AiRewriteButton({ blockType, currentData, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await rewriteBlockContent(blockType, currentData);
      if (result.success && result.data !== undefined) {
        onSuccess(result.data);
        toast.success("文案重写成功 ✨");
      } else {
        toast.error(result.error ?? "重写失败，请重试");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full h-8 rounded-md text-xs font-medium text-white flex items-center justify-center gap-1.5 transition-opacity disabled:opacity-60 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 mb-4"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Sparkles className="w-3.5 h-3.5" />
      )}
      {loading ? "AI 洗稿中..." : "AI 一键洗稿"}
    </button>
  );
}
