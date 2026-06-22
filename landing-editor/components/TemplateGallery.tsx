"use client";
// landing-editor/components/TemplateGallery.tsx
// 模板选择页：行业/范式/转化 三维筛选 + 名称搜索（纯前端，过滤静态 TEMPLATES）。
import { useMemo, useState } from "react";
import { TEMPLATES } from "../samples/registry";
import { facetOptions, filterTemplates, type TemplateFilters } from "../samples/templateFilter";
import { TemplateGalleryCard } from "./TemplateGalleryCard";

const selectCls =
  "rounded-lg border border-edge bg-panel px-3 py-2 text-sm text-ink focus:border-edge-strong focus:outline-none";

export function TemplateGallery() {
  const [filters, setFilters] = useState<TemplateFilters>({});
  const opts = useMemo(() => facetOptions(TEMPLATES), []);
  const list = useMemo(() => filterTemplates(TEMPLATES, filters), [filters]);
  const set = (patch: Partial<TemplateFilters>) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <header className="mb-8 text-center">
          <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            落地页编辑器
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">选择一个模板开始</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ink-soft sm:text-base">
            挑选最贴近你业务的行业模板，进入编辑器后可自由调整、增删与排序每个模块。
          </p>
        </header>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
          <select className={selectCls} value={filters.category ?? ""} onChange={(e) => set({ category: e.target.value || undefined })}>
            <option value="">全部行业</option>
            {opts.category.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className={selectCls} value={filters.archetype ?? ""} onChange={(e) => set({ archetype: e.target.value || undefined })}>
            <option value="">全部范式</option>
            {opts.archetype.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className={selectCls} value={filters.conversion ?? ""} onChange={(e) => set({ conversion: e.target.value || undefined })}>
            <option value="">全部转化方式</option>
            {opts.conversion.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input
            type="search"
            className={selectCls + " w-56"}
            placeholder="搜索模板名称…"
            value={filters.query ?? ""}
            onChange={(e) => set({ query: e.target.value || undefined })}
          />
        </div>

        {list.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-ink-soft">没有匹配的模板</p>
            <button
              type="button"
              onClick={() => setFilters({})}
              className="mt-3 rounded-lg border border-edge px-4 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-edge-strong"
            >
              清空筛选
            </button>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((t) => (
              <li key={t.id}>
                <TemplateGalleryCard template={t} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
