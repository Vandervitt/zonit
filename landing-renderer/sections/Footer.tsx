// landing-renderer/sections/Footer.tsx
import type { FooterSection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";

export function Footer({ data, theme }: { data: FooterSection; theme: RendererTheme }) {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6">
        <div className="text-lg font-bold text-white">{data.brandName}</div>
        <p className="mt-3 max-w-2xl text-xs leading-relaxed">{data.privacyPolicy}</p>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed">{data.termsOfService}</p>
        <a href={`mailto:${data.contactEmail}`} className={`mt-4 inline-block text-xs ${theme.accentText}`}>
          {data.contactEmail}
        </a>
        <div className="mt-6 text-[11px] text-slate-500">© {data.copyrightYear} {data.brandName}</div>
      </div>
    </footer>
  );
}
