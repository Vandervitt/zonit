"use client";

import { motion } from "motion/react";
import { Backdrop, SiteFooter, SiteNav, type Fonts } from "./chrome";

export type LegalSection = {
  id: string;
  title: string;
  /** 正文段落，逐段渲染 */
  paragraphs?: string[];
  /** 可选无序列表，紧随段落之后 */
  bullets?: string[];
};

/** 官网法律类静态页（隐私政策 / 服务条款）共用排版外壳。 */
export function LegalPage({
  fonts,
  title,
  subtitle,
  updated,
  sections,
}: {
  fonts: Fonts;
  title: string;
  subtitle: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <div className={`relative min-h-screen bg-background text-foreground ${fonts.body}`}>
      <Backdrop />
      <SiteNav fonts={fonts} />

      <main className="relative mx-auto max-w-3xl px-6 pb-24 pt-32">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h1 className={`text-3xl font-bold tracking-tight sm:text-4xl ${fonts.display}`}>{title}</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{subtitle}</p>
          <p className={`mt-2 text-xs uppercase tracking-[0.18em] text-aqua-600 ${fonts.mono}`}>
            最后更新：{updated}
          </p>
        </motion.header>

        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className={`text-xl font-semibold tracking-tight ${fonts.display}`}>{section.title}</h2>
              {section.paragraphs?.map((p, i) => (
                <p key={i} className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
                  {section.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </main>

      <SiteFooter fonts={fonts} />
    </div>
  );
}
