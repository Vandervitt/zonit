// landing-renderer/sections/Footer.tsx
import type { FooterSection, LeadChannel, PageContact } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { channelHref } from "@/lib/contact/channel-href";

/**
 * 页脚展示的联系方式：contact 里已填、且不是主渠道的那些。
 *
 * 主渠道已经占着首屏主按钮，页脚再重复一遍是噪音；其余渠道则相反 ——
 * 用户填了却没地方露出，等于白填。表单不进页脚：它是页内区块不是联系方式。
 */
const FOOTER_CHANNELS: Exclude<LeadChannel, "form">[] = ["email", "phone", "whatsapp", "telegram"];

function footerContacts(contact: PageContact) {
  return FOOTER_CHANNELS.filter((c) => c !== contact.primary)
    .map((channel) => ({ channel, value: contact[channel] ?? "", resolved: channelHref(channel, contact[channel] ?? "") }))
    .filter((x) => x.resolved !== null);
}

export function Footer({ data, contact, theme, logo }: { data: FooterSection; contact: PageContact; theme: RendererTheme; logo?: string }) {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="mb-3 h-8 w-auto" />
        ) : null}
        <div className="text-lg font-bold text-white">{data.brandName}</div>
        <p className="mt-3 max-w-2xl text-xs leading-relaxed">{data.privacyPolicy}</p>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed">{data.termsOfService}</p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
          {footerContacts(contact).map(({ channel, value, resolved }) => (
            <a
              key={channel}
              href={resolved!.href}
              {...(resolved!.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={`text-xs ${theme.accentText}`}
            >
              {value}
            </a>
          ))}
        </div>
        <div className="mt-6 text-[11px] text-slate-500">© {data.copyrightYear} {data.brandName}</div>
      </div>
    </footer>
  );
}
