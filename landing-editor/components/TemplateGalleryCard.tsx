"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { landingEditorPath, Routes } from "@/lib/constants";
import type { TemplateMeta } from "../samples/registry";
import { GeneratePageDialog } from "@/components/ai/GeneratePageDialog";

export function TemplateGalleryCard({ template }: { template: TemplateMeta }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function start() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/landing-pages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ templateId: template.id }),
      });
      if (res.status === 403) {
        toast.error("已达当前套餐的落地页上限，请升级后再创建");
        router.push(Routes.Billing);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const page = await res.json();
      router.push(landingEditorPath(page.id));
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-edge bg-panel text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-edge-strong hover:shadow-lg">
      <div className="aspect-[4/3] overflow-hidden bg-canvas">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={template.thumbnail} alt={template.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span className="inline-flex w-fit items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">{template.industry}</span>
        <h2 className="mt-3 text-lg font-semibold text-ink">{template.name}</h2>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-soft">{template.tagline}</p>
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={start}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg border border-edge px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-edge-strong disabled:opacity-60"
          >
            {loading ? "创建中…" : "空白开始"}
          </button>
          <GeneratePageDialog templateId={template.id}>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              ✨ 用 AI 填充
            </button>
          </GeneratePageDialog>
        </div>
      </div>
    </div>
  );
}
