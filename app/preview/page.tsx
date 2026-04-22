"use client"

import { useEffect, useState } from "react";
import { PreviewRenderer } from "@/components/sites/PreviewRenderer";
import type { LandingPageTemplate } from "@/types/schema";

export default function PreviewPage() {
  const [template, setTemplate] = useState<LandingPageTemplate | null>(null);
  const [highlightKey, setHighlightKey] = useState("");
  const [showWatermark, setShowWatermark] = useState(false);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "PREVIEW_UPDATE" && e.data.data) {
        setTemplate(e.data.data as LandingPageTemplate);
        if (typeof e.data.showWatermark === "boolean") {
          setShowWatermark(e.data.showWatermark);
        }
      }
      if (e.data?.type === "HIGHLIGHT_BLOCK") {
        setHighlightKey(e.data.key ?? "");
      }
    };
    window.addEventListener("message", handler);
    window.parent.postMessage({ type: "PREVIEW_READY" }, "*");
    return () => window.removeEventListener("message", handler);
  }, []);

  if (!template) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">等待预览数据…</p>
        </div>
      </div>
    );
  }

  return <PreviewRenderer template={template} highlightKey={highlightKey} showWatermark={showWatermark} />;
}
