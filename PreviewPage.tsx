import { useEffect, useState } from "react";
import { PreviewRenderer } from "@/components/sites/PreviewRenderer";
import type { LandingPageTemplate } from "@/types/schema";

export function PreviewPage() {
  const [template, setTemplate] = useState<LandingPageTemplate | null>(null);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "PREVIEW_UPDATE" && e.data.data) {
        setTemplate(e.data.data as LandingPageTemplate);
      }
    };
    window.addEventListener("message", handler);

    // Notify parent that we're ready
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

  return <PreviewRenderer template={template} />;
}
