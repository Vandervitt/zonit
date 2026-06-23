// landing-renderer/LandingPage.tsx
// 渲染器入口：按页面 branding 派生主题（换肤）+ Logo 透传 + sections + 页脚 + 留资表单 + 悬浮按钮。
import type { LandingPageDraft } from "@/types/schema.draft";
import { resolveTheme, type RendererTheme } from "./theme";
import { Hero } from "./sections/Hero";
import { Footer } from "./sections/Footer";
import { FloatingButton } from "./sections/FloatingButton";
import { LeadForm } from "./sections/LeadForm";
import { renderSection } from "./sections";

export function LandingPage({
  page,
  theme,
  pageId = "",
}: {
  page: LandingPageDraft;
  theme?: RendererTheme; // 显式覆盖；默认按 branding 派生
  pageId?: string;
}) {
  const resolved = theme ?? resolveTheme(page.branding?.theme);
  const logo = page.branding?.logo;
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Hero data={page.hero} theme={resolved} logo={logo} />
      {page.sections.map((section, i) => renderSection(section, resolved, i))}
      {page.leadForm?.enabled ? <LeadForm data={page.leadForm} pageId={pageId} theme={resolved} /> : null}
      <Footer data={page.footer} theme={resolved} logo={logo} />
      {page.floatingButton && <FloatingButton data={page.floatingButton} theme={resolved} />}
    </div>
  );
}
