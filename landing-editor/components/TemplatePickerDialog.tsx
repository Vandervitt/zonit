"use client";
// landing-editor/components/TemplatePickerDialog.tsx
//
// 模板选择弹窗（替代原独立画廊页 /admin/editor）。
// 从「新建落地页」按钮唤起；在弹窗内用「行业 chip + 搜索」筛选，选卡后建库并跳编辑器。
// 视觉取齐官网 marketing 主题（theme.ts）：净白玻璃 + aqua/tech 渐变 + 细网格光感。
// 交互升级：① 下拉筛选 → 行业胶囊 chip（带计数，含「全部」）；archetype/conversion
// 因数据近单一值已下线；② 卡片操作按钮改为悬停/聚焦浮现（触屏常驻），默认更干净现代。
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Sparkles, LayoutTemplate, PenLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/components/ui/utils";
import { glassCard, gradientText, gridBackdrop, glowAura, pill } from "@/lib/theme";
import { landingEditorPath, Routes } from "@/lib/constants";
import { handleSessionExpired } from "@/lib/auth-client";
import { TEMPLATES, type TemplateMeta } from "../samples/registry";
import { CATEGORY_LABELS, filterTemplates } from "../samples/templateFilter";

const monoCls = "font-[family-name:var(--font-mono-app)]";

interface CategoryChip {
  value: string;
  label: string;
  count: number;
}

/** 从静态 TEMPLATES 统计各行业计数，按数量降序生成 chip（含中文标签）。 */
function useCategoryChips(): CategoryChip[] {
  return useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of TEMPLATES) counts.set(t.tags.category, (counts.get(t.tags.category) ?? 0) + 1);
    return [...counts.entries()]
      .map(([value, count]) => ({ value, label: CATEGORY_LABELS[value] ?? value, count }))
      .sort((a, b) => b.count - a.count);
  }, []);
}

export function TemplatePickerDialog({ children }: { children: React.ReactNode }) {
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const chips = useCategoryChips();
  const list = useMemo(
    () => filterTemplates(TEMPLATES, { category: category ?? undefined, query: query || undefined }),
    [category, query],
  );
  const filtering = category !== null || query.trim() !== "";

  const chipBase =
    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua-400/40";
  const chipOn = "border-transparent bg-gradient-to-r from-aqua-600 to-tech text-white shadow-sm shadow-aqua-600/25";
  const chipOff = "border-border bg-white/70 text-foreground/70 backdrop-blur hover:border-aqua-300 hover:text-aqua-700";
  const countCls = (on: boolean) =>
    cn("rounded-full px-1.5 text-[11px] tabular-nums", monoCls, on ? "bg-white/20 text-white" : "bg-aqua-50 text-aqua-600");

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        // 开弹窗时不把内部可聚焦元素滚入视图，避免首屏被向下滚动裁掉计数行/首行
        onOpenAutoFocus={(e) => e.preventDefault()}
        // 用 dvh 并预留上下 4rem 边距，保证任意视口高度下都完整落在屏幕内、内部滚动
        className={cn(
          "flex max-h-[calc(100dvh-4rem)] w-[calc(100%-1.5rem)] max-w-6xl flex-col overflow-hidden border-border bg-background p-0",
          "sm:max-w-6xl",
        )}
      >
        {/* 顶部：装饰光感 + 标题 + 搜索 + 行业 chip（整体不随卡片滚动） */}
        <div className="relative shrink-0 border-b border-border/70 px-6 pb-5 pt-7 sm:px-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className={gridBackdrop} />
            <div className={cn("absolute -top-28 left-16 h-56 w-[520px]", glowAura("aqua-400"))} />
          </div>

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <span className={cn(pill, "uppercase tracking-[0.16em]", monoCls)}>
                <LayoutTemplate className="h-3.5 w-3.5" />
                落地页模板
              </span>
              <DialogTitle className={cn("mt-3 text-2xl font-bold tracking-tight sm:text-[28px]", gradientText)}>
                挑一套模板，几分钟搭出投放级落地页
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
                结构与文案已为海外获客调校好——选中即进编辑器，可自由增删、排序每个模块。
              </DialogDescription>
            </div>

            <div className="relative w-full sm:w-64 sm:shrink-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                aria-label="搜索模板名称"
                placeholder="搜索模板…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-white/80 py-2.5 pl-9 pr-3 text-sm text-foreground shadow-sm backdrop-blur transition-colors placeholder:text-muted-foreground/70 focus:border-aqua-300 focus:outline-none focus:ring-2 focus:ring-aqua-400/30"
              />
            </div>
          </div>

          {/* 行业 chip 行 */}
          <div className="relative mt-4 flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setCategory(null)}
              className={cn(chipBase, category === null ? chipOn : chipOff, "shrink-0")}
            >
              全部
              <span className={countCls(category === null)}>{TEMPLATES.length}</span>
            </button>
            {chips.map((c) => {
              const on = category === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(on ? null : c.value)}
                  className={cn(chipBase, on ? chipOn : chipOff, "shrink-0")}
                >
                  {c.label}
                  <span className={countCls(on)}>{c.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 卡片区（滚动） */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          <div className={cn("mb-4 flex items-center gap-2 text-xs text-muted-foreground", monoCls)}>
            <span className="h-1 w-1 rounded-full bg-aqua-400" />
            共 {list.length} 套模板
            {filtering && (
              <button
                type="button"
                onClick={() => {
                  setCategory(null);
                  setQuery("");
                }}
                className="text-aqua-600 underline-offset-2 transition-colors hover:text-aqua-700 hover:underline"
              >
                · 清空筛选
              </button>
            )}
          </div>

          {list.length === 0 ? (
            <div className={cn("mx-auto my-10 max-w-md px-8 py-14 text-center", glassCard)}>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-aqua-100 bg-aqua-50 text-aqua-600">
                <Sparkles className="h-5 w-5" />
              </span>
              <p className="mt-5 text-sm text-muted-foreground">没有匹配的模板，换个筛选条件试试。</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((t) => (
                <li key={t.id} className="animate-in fade-in-0 zoom-in-95 duration-300">
                  <TemplateCard template={t} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCard({ template }: { template: TemplateMeta }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 两个按钮都先建库并进编辑器；AI 走 ?ai=1，编辑器内默认弹出「AI 一键成页」资料表单。
  async function create(withAi: boolean) {
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
      router.push(withAi ? `${landingEditorPath(page.id)}?ai=1` : landingEditorPath(page.id));
    } catch {
      toast.error("创建失败，请检查网络后重试");
      setLoading(false);
    }
  }

  const revealCls =
    "translate-y-2 opacity-100 transition-all duration-300 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100";

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-aqua-300 hover:shadow-[0_28px_64px_-34px_color-mix(in_oklab,var(--color-aqua-500)_55%,transparent)]",
        glassCard,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-aqua-50/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={template.thumbnail}
          alt={template.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />
        {/* 底部渐变遮罩：悬停/聚焦时加深，衬托浮现的按钮 */}
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-foreground/75 via-foreground/25 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
        <span
          className={cn(
            "absolute left-3 top-3 inline-flex items-center rounded-full border border-aqua-100 bg-white/85 px-2.5 py-0.5 text-[11px] font-medium text-aqua-700 shadow-sm backdrop-blur",
            monoCls,
          )}
        >
          {template.industry}
        </span>

        {/* 浮现操作按钮 */}
        <div className={cn("absolute inset-x-3 bottom-3 flex items-center gap-2", revealCls)}>
          <button
            type="button"
            onClick={() => create(false)}
            disabled={loading}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/40 bg-white/85 px-3 py-2 text-sm font-medium text-foreground/80 backdrop-blur transition-colors hover:bg-white disabled:opacity-60"
          >
            <PenLine className="h-3.5 w-3.5" />
            {loading ? "创建中…" : "直接编辑"}
          </button>
          <button
            type="button"
            onClick={() => create(true)}
            disabled={loading}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-aqua-600 to-tech px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-aqua-600/30 transition-all hover:brightness-105 disabled:opacity-60"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI 一键成页
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-aqua-700">
          {template.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{template.tagline}</p>
      </div>
    </div>
  );
}
