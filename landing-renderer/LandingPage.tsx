// landing-renderer/LandingPage.tsx
// 渲染器入口：首屏 + 可排序 sections（数组顺序即页面顺序）+ 页脚 + 兜底留资表单 + 悬浮按钮。
// theme 缺省 defaultTheme；传入其他 RendererTheme 即整页换肤。
import type { LandingPageDraft } from "@/types/schema.draft";
import { defaultTheme, type RendererTheme } from "./theme";
import { Hero } from "./sections/Hero";
import { Footer } from "./sections/Footer";
import { FloatingButton } from "./sections/FloatingButton";
import { LeadForm } from "./sections/LeadForm";
import { renderSection } from "./sections";

export function LandingPage({
  page,
  theme = defaultTheme,
  pageId = "",
}: {
  page: LandingPageDraft;
  theme?: RendererTheme;
  pageId?: string;
}) {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Hero data={page.hero} theme={theme} />
      {page.sections.map((section, i) => renderSection(section, theme, i))}
      {page.leadForm?.enabled ? <LeadForm data={page.leadForm} pageId={pageId} theme={theme} /> : null}
      <Footer data={page.footer} theme={theme} />
      {page.floatingButton && <FloatingButton data={page.floatingButton} theme={theme} />}
    </div>
  );
}
