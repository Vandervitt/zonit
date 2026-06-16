// landing-editor/components/TemplateGallery.tsx
// 模板选择页（从零构建）：进入编辑器前先挑选行业模板。
// 点击卡片跳转 /editor-next?template=<id>，由页面以对应模板为种子挂载编辑器。
import Link from "next/link";
import { TEMPLATES } from "../samples/registry";

export function TemplateGallery() {
  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <header className="mb-12 text-center">
          <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            落地页编辑器
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            选择一个模板开始
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ink-soft sm:text-base">
            挑选最贴近你业务的行业模板，进入编辑器后可自由调整、增删与排序每个模块。
          </p>
        </header>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => (
            <li key={t.id}>
              <Link
                href={`/editor-next?template=${t.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-edge bg-panel shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-edge-strong hover:shadow-lg"
              >
                <div className="aspect-[4/3] overflow-hidden bg-canvas">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.thumbnail}
                    alt={t.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <span className="inline-flex w-fit items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                    {t.industry}
                  </span>
                  <h2 className="mt-3 text-lg font-semibold text-ink">{t.name}</h2>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-soft">
                    {t.tagline}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 transition-colors group-hover:text-brand-700">
                    开始编辑
                    <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
