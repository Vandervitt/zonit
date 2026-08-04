// landing-editor/lib/complianceHints.ts
//
// 发布前的合规提示：**不阻断发布**。
//
// 与 publishIssues 的分界很硬 —— publishIssues 是「不修就发不出去」的技术门槛
// （链接为空、模块缺失），提示是「平台可能因此拒你，但那是平台的裁量，我们不替
// 它下结论」。把这些塞进发布门槛等于我们替 Meta / TikTok 判定过不过审，既做不到
// 也不该做；反过来一句不说，客户就要靠被拒三次才知道页脚缺了什么。
//
// 每条提示都必须能追溯到一条平台明文要求，且判据是页面上可核实的客观事实
// （与 lib/tools/checks.ts 的「只报事实、不给评分」同一条原则）。
import type { LandingPageDraft } from "@/types/schema.draft";
import type { PublishIssue } from "./validate";

/**
 * 政策文案的最短长度。低于此值的通常是「Privacy Policy」这类占位标题，
 * 说明不了数据用途 —— 平台点开政策页看的就是有没有实质内容。
 */
const MIN_POLICY_LENGTH = 60;

export function collectComplianceHints(draft: LandingPageDraft): PublishIssue[] {
  const hints: PublishIssue[] = [];
  const footerTarget = { kind: "fixed", id: "footer" } as const;

  // TikTok 对电商与金融类落地页明确要求页脚展示公司信息与执照；
  // Meta / LinkedIn 也会核对页面身份是否真实。平台无从代填，只能提示。
  if (!draft.footer.companyProfileId) {
    hints.push({
      message: "页脚没有经营主体信息。投 TikTok 的电商 / 金融类页面按其政策必须展示公司信息与执照（设置 · 经营主体信息里填一次，所有页面可选用）",
      target: footerTarget,
    });
  }

  if (draft.footer.privacyPolicy.trim().length < MIN_POLICY_LENGTH) {
    hints.push({
      message: "隐私政策文字过短，说明不了你收集哪些信息、用于什么。四家平台都会点开这一页",
      target: footerTarget,
    });
  }
  if (draft.footer.termsOfService.trim().length < MIN_POLICY_LENGTH) {
    hints.push({
      message: "服务条款文字过短，看不出你提供什么服务、边界在哪",
      target: footerTarget,
    });
  }

  // 页面上有没有「可见的」邮箱或电话。WhatsApp / Telegram 链接不算：
  // Google 的着陆页体验与 TikTok 的页脚要求看的是能核实的联系方式，
  // 我们自己的自检器（detectContact）判据也是页面文本里的邮箱或号码。
  const hasVerifiableContact = !!(draft.contact.email?.trim() || draft.contact.phone?.trim());
  if (!hasVerifiableContact) {
    hints.push({
      message: "页面上没有邮箱或电话。即时通讯链接不计入可核实联系方式，Google 的着陆页体验与 TikTok 的页脚要求都按这一项判",
      target: { kind: "fixed", id: "contact" },
    });
  }

  return hints;
}
