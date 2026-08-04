// landing-renderer/sections/Footer.tsx
import type { FooterSection, LeadChannel, PageContact } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { channelHref } from "@/lib/contact/channel-href";
import { policyPath } from "@/lib/landing-pages/policy-paths";

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

export function Footer({ data, contact, theme, logo, policyBase, companyInfo }: {
  data: FooterSection;
  contact: PageContact;
  theme: RendererTheme;
  logo?: string;
  /**
   * 已成文的经营主体信息（法律实体 / 地址 / 注册号 / 执照）。
   * 由页面路由按 footer.companyProfileId 查库解析后传入 —— 渲染器不碰库，
   * 也不从 draft 读文案（主体信息是账号级真源，见 schema 注释）。
   */
  companyInfo?: string;
  /**
   * 政策子页所挂的路径前缀（公开页 = 落地页发布路径，预览 = /preview/{token}）。
   *
   * 缺省不渲染政策链接：宁可没有，也不能给出点开 404 的死链——四家平台都会
   * 实际点开这两个链接。页脚的政策**正文段落**与链接并存是有意的：正文里带着
   * 医疗、法律这类模板的免责声明，必须留在落地页可见处，链接负责「可达」。
   */
  policyBase?: string;
}) {
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
        {policyBase ? (
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
            <a href={policyPath(policyBase, "privacy")} className={`text-xs ${theme.accentText}`}>Privacy Policy</a>
            <a href={policyPath(policyBase, "terms")} className={`text-xs ${theme.accentText}`}>Terms of Service</a>
          </div>
        ) : null}
        {companyInfo ? (
          <p className="mt-4 max-w-2xl text-xs leading-relaxed text-slate-500">{companyInfo}</p>
        ) : null}
        {/* 版权行原为 11px，按「不放大就能读」上调到 text-xs（12px），与其余页脚文字齐平。 */}
        <div className="mt-6 text-xs text-slate-500">© {data.copyrightYear} {data.brandName}</div>
      </div>
    </footer>
  );
}
