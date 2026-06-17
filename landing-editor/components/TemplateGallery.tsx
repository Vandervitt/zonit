// landing-editor/components/TemplateGallery.tsx
// 模板选择页（从零构建）：进入编辑器前先挑选行业模板。
// 点击卡片跳转 /editor-next?template=<id>，由页面以对应模板为种子挂载编辑器。
import { TEMPLATES } from "../samples/registry";
import { TemplateGalleryCard } from "./TemplateGalleryCard";

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
              <TemplateGalleryCard template={t} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
