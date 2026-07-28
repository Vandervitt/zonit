// 获客指南正文渲染器（纯 Tailwind，无 antd / 无内联样式）。
// 与后台 HelpChapter（antd 版）分离，公开站专用；块模型见 _content/types.ts。
import type { GuideArticle, GuideBlock, GuideSection } from "../_content/types";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

function Block({ block }: { block: GuideBlock }) {
  switch (block.t) {
    case "p":
      return <p className="mt-4 text-base leading-relaxed text-foreground/80">{block.text}</p>;
    case "list":
      return (
        <ul className="mt-4 space-y-2 pl-5 marker:text-aqua-500 list-disc">
          {block.items.map((item, i) => (
            <li key={i} className="text-base leading-relaxed text-foreground/80">
              {item}
            </li>
          ))}
        </ul>
      );
    case "steps":
      return (
        <ol className="mt-5 space-y-4">
          {block.items.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-aqua-600 to-tech text-sm font-semibold text-white">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{s.title}</p>
                {s.desc && <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>}
              </div>
            </li>
          ))}
        </ol>
      );
    case "table":
      return (
        <div className="mt-5 overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-aqua-50/60">
                {block.head.map((h, i) => (
                  <th key={i} className="px-4 py-2.5 text-left font-semibold text-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="border-t border-border">
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`px-4 py-2.5 align-top text-muted-foreground ${
                        ci === 0 ? "font-medium text-foreground" : ""
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "callout": {
      const tone =
        block.tone === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : block.tone === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-aqua-200 bg-aqua-50 text-aqua-900";
      return (
        <div className={`mt-5 rounded-xl border px-4 py-3 text-sm leading-relaxed ${tone}`}>
          {block.text}
        </div>
      );
    }
    case "faq":
      return (
        <dl className="mt-5 divide-y divide-border border-t border-border">
          {block.items.map((item) => (
            <div key={item.q} className="py-4">
              <dt className="text-sm font-semibold text-foreground">{item.q}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>
      );
  }
}

function Section({ section }: { section: GuideSection }) {
  return (
    <section id={section.id} className="mt-12 scroll-mt-28">
      <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{section.heading}</h2>
      {section.blocks.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </section>
  );
}

export function GuideArticleView({ article, locale }: { article: GuideArticle; locale: Locale }) {
  const t = getDictionary(locale).guides.detail;
  return (
    <div>
      <p className="text-lg leading-relaxed text-foreground/80">{article.intro}</p>
      {article.sections.map((s) => (
        <Section key={s.id} section={s} />
      ))}
      {article.references && article.references.length > 0 && (
        <section id="references" className="mt-12 scroll-mt-28">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{t.referencesHeading}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t.referencesNote}</p>
          <ul className="mt-4 space-y-2">
            {article.references.map((ref) => (
              <li key={ref.url} className="text-sm leading-relaxed">
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-aqua-700 underline decoration-aqua-300 underline-offset-2 hover:decoration-aqua-600"
                >
                  {ref.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
