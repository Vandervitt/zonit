// landing-renderer/LandingPage.tsx
// 渲染器入口：按页面 branding 派生主题（换肤）+ Logo 透传 + sections + 页脚 + 留资表单 + 悬浮按钮。
import type { LandingPageDraft } from "@/types/schema.draft";
import type { DialCode } from "@/lib/leads/dial-codes";
import { resolveTheme, type RendererTheme } from "./theme";
import { Hero } from "./sections/Hero";
import { Footer } from "./sections/Footer";
import { FloatingButton } from "./sections/FloatingButton";
import { LeadForm } from "./sections/LeadForm";
import { renderSection } from "./sections";
import { IDENTITY_VARIANT, type PageVariant } from "./variant";
import { policyPath } from "@/lib/landing-pages/policy-paths";

export function LandingPage({
  page,
  theme,
  pageId = "",
  variant = IDENTITY_VARIANT,
  preview = false,
  defaultDial,
  policyBase,
  companyInfo,
}: {
  page: LandingPageDraft;
  theme?: RendererTheme; // 显式覆盖；默认按 branding 派生
  pageId?: string;
  variant?: PageVariant; // 反同质化变体；缺省恒等（输出不变）
  preview?: boolean; // 预览渲染：留资表单停用提交；不完整 CTA 按钮显示占位标注而非隐藏
  defaultDial?: DialCode; // 按访客 IP 解析的默认国码；预览态不传，用组件内兜底
  /** 政策子页前缀（公开页 = 发布路径，预览 = /preview/{token}）；缺省不渲染政策链接 */
  policyBase?: string;
  /** 成文的经营主体信息；由路由按 footer.companyProfileId 解析 */
  companyInfo?: string;
}) {
  const resolved = theme ?? resolveTheme(page.branding?.theme);
  const logo = page.branding?.logo;
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Hero data={page.hero} contact={page.contact} theme={resolved} logo={logo} layout={variant.heroLayout} preview={preview} />
      {page.sections.map((section, i) => renderSection(section, page.contact, resolved, i, variant, preview))}
      {page.leadForm?.enabled ? (
        <LeadForm
          data={page.leadForm}
          pageId={pageId}
          theme={resolved}
          preview={preview}
          defaultDial={defaultDial}
          privacyHref={policyBase ? policyPath(policyBase, "privacy") : undefined}
        />
      ) : null}
      <Footer data={page.footer} contact={page.contact} theme={resolved} logo={logo} policyBase={policyBase} companyInfo={companyInfo} />
      {page.floatingButton && <FloatingButton data={page.floatingButton} contact={page.contact} theme={resolved} preview={preview} />}
    </div>
  );
}
