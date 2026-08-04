// landing-renderer/PolicyDocument.tsx
// 政策子页（隐私政策 / 服务条款）的独立文档渲染。
//
// 正文直接取页脚里那段文案：单一真源，客户不必再写第二遍，52 套模板已有的
// 行业化政策文字直接成为可达的政策页。刻意不加 CTA、不加追踪、不加弹窗 ——
// 这是一张给审核和访客看的说明页，任何转化元素都只会让它显得像广告。

import type { FooterSection } from "@/types/schema.draft";
import type { PolicyKind } from "@/lib/landing-pages/policy-paths";

const TITLES: Record<PolicyKind, string> = {
  privacy: "Privacy Policy",
  terms: "Terms of Service",
};

/** 段落切分：文案里的空行视为段落边界，单个换行不切（保留原意）。 */
function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function PolicyDocument({ footer, kind, homeHref, companyInfo }: {
  footer: FooterSection;
  kind: PolicyKind;
  /** 返回落地页的地址。访客必须能走回去，也保证这张页不是死胡同。 */
  homeHref: string;
  /** 已成文的经营主体信息（账号级，由路由解析后传入）。 */
  companyInfo?: string;
}) {
  const body = kind === "privacy" ? footer.privacyPolicy : footer.termsOfService;
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
        <a href={homeHref} className="text-sm text-slate-500 hover:text-slate-900">&larr; {footer.brandName}</a>
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl">{TITLES[kind]}</h1>
        <div className="mt-6 space-y-4">
          {paragraphs(body).map((p, i) => (
            <p key={i} className="text-base leading-relaxed text-slate-700">{p}</p>
          ))}
        </div>
        {companyInfo ? (
          <p className="mt-10 border-t border-slate-200 pt-6 text-sm leading-relaxed text-slate-500">
            {companyInfo}
          </p>
        ) : null}
        <p className="mt-8 text-sm text-slate-500">© {footer.copyrightYear} {footer.brandName}</p>
      </main>
    </div>
  );
}
