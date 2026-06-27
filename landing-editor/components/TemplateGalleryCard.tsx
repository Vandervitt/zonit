"use client";
// landing-editor/components/TemplateGalleryCard.tsx
// 模板卡片：官网玻璃质感（glassCard）+ aqua 悬停光感 + Syne 标题 + 渐变主 CTA。
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { landingEditorPath, Routes } from "@/lib/constants";
import { handleSessionExpired } from "@/lib/auth-client";
import { glassCard } from "@/lib/theme";
import type { TemplateMeta } from "../samples/registry";
import { GeneratePageDialog } from "@/components/ai/GeneratePageDialog";

const monoCls = "font-[family-name:var(--font-mono-app)]";

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
      if (handleSessionExpired(res, router)) return;
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
    <div
      className={`group relative flex h-full w-full flex-col overflow-hidden text-left transition-all duration-300 hover:-translate-y-1.5 hover:border-aqua-300 hover:shadow-[0_30px_70px_-32px_color-mix(in_oklab,var(--color-aqua-500)_55%,transparent)] ${glassCard}`}
    >
      {/* 悬停顶部光感 */}
      <div className="pointer-events-none absolute inset-x-0 -top-16 h-32 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,color-mix(in_oklab,var(--color-aqua-400)_30%,transparent),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative aspect-[4/3] overflow-hidden bg-aqua-50/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={template.thumbnail}
          alt={template.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/15 via-transparent to-transparent" />
        <span className={`absolute left-3 top-3 inline-flex items-center rounded-full border border-aqua-100 bg-white/85 px-2.5 py-0.5 text-[11px] font-medium text-aqua-700 shadow-sm backdrop-blur ${monoCls}`}>
          {template.industry}
        </span>
      </div>

      <div className="relative flex flex-1 flex-col p-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-aqua-700">
          {template.name}
        </h2>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{template.tagline}</p>

        <div className="mt-5 flex items-center gap-2.5">
          <button
            type="button"
            onClick={start}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-xl border border-border bg-white/70 px-3.5 py-2 text-sm font-medium text-foreground/75 backdrop-blur transition-colors hover:border-aqua-300 hover:text-aqua-700 disabled:opacity-60"
          >
            {loading ? "创建中…" : "空白开始"}
          </button>
          <GeneratePageDialog templateId={template.id}>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-aqua-600 to-tech px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-aqua-600/25 transition-all hover:brightness-105"
            >
              <Sparkles className="h-3.5 w-3.5" />
              用 AI 填充
            </button>
          </GeneratePageDialog>
        </div>
      </div>
    </div>
  );
}
