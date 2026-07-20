import type { Metadata } from "next";
import { Syne, Sora, JetBrains_Mono } from "next/font/google";
import { LegalPage, type LegalSection } from "@/components/marketing/LegalPage";

const display = Syne({ subsets: ["latin"], weight: ["700", "800"], display: "swap" });
const body = Sora({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap" });

export const metadata: Metadata = {
  title: "服务条款 | Zap Bridge",
  description: "使用 Zap Bridge 服务的条款与条件，包括账户、计费、可接受使用与责任限制。",
};

const UPDATED = "2026 年 7 月 20 日";
const CONTACT = "vandervitt.li@gmail.com";

const sections: LegalSection[] = [
  {
    id: "acceptance",
    title: "1. 条款的接受",
    paragraphs: [
      `本服务条款（下称“条款”）是你与 Zap Bridge（下称“我们”“本服务”）之间就使用本服务达成的协议。访问或使用本服务即表示你同意受本条款约束；如你不同意，请勿使用本服务。`,
    ],
  },
  {
    id: "service",
    title: "2. 服务说明",
    paragraphs: [
      "Zap Bridge 提供面向海外获客的落地页创建、托管与追踪配置工具，帮助用户制作用于咨询与留资的营销落地页。本服务由个人开发者独立运营。",
      "我们可能不时增加、修改或停止部分功能。对于重大变更，我们会通过适当方式告知。",
    ],
  },
  {
    id: "accounts",
    title: "3. 账户与资格",
    paragraphs: [
      "你需提供真实、准确的信息以创建账户，并对账户下发生的一切活动负责，妥善保管登录凭据。你确认你已达到所在司法管辖区订立本条款所需的法定年龄。",
    ],
  },
  {
    id: "billing",
    title: "4. 套餐、计费与续订",
    bullets: [
      "本服务提供免费与付费套餐。付费套餐由第三方支付服务商（作为 Merchant of Record）代为处理收款、开票与相关税务。",
      "订阅型套餐将按所选计费周期自动续订，直至你取消。取消后，你的套餐将在当前已付费周期结束时降级，已付费用不再退还，法律另有强制规定的除外。",
      "一次性购买的项目（如额度充值包）在交付后不可退款，法律另有强制规定的除外。",
      "我们可能调整套餐价格，并在调整对你生效前以适当方式提前告知。",
    ],
  },
  {
    id: "acceptable-use",
    title: "5. 可接受使用",
    paragraphs: ["使用本服务时，你同意不从事以下行为："],
    bullets: [
      "将本服务用于任何非法、欺诈、侵权或误导性用途；",
      "发布或推广违反你所使用的广告投放平台政策的内容；",
      "利用本服务规避内容审核以传播违法或有害信息。",
    ],
  },
  {
    id: "anti-ban",
    title: "6. 关于反同质化功能",
    paragraphs: [
      "本服务的反同质化功能旨在为正当广告主打散同模板页面的结构指纹，降低被相似度检测误判的概率。该功能在保持页面内容一致的前提下运作，并非用于向审核方或用户隐藏真实内容的 cloaking 或欺骗行为。你不得将该功能用于任何欺骗审核以规避合规要求的目的。",
    ],
  },
  {
    id: "user-content",
    title: "7. 用户内容与责任",
    paragraphs: [
      "你保留你通过本服务创建的内容的所有权。你对该等内容的合法性、真实性，以及通过落地页采集访客数据的合规性负责，并保证已就使用相关素材取得必要授权。",
      "为向你提供服务，你授予我们一项有限的、非独占的许可，以存储、展示、复制与处理你的内容，范围仅限于运营与提供本服务所必需。",
    ],
  },
  {
    id: "ip",
    title: "8. 知识产权",
    paragraphs: [
      "本服务本身及其相关软件、界面、商标与内容（不含你的用户内容）的知识产权归本服务运营者所有。未经许可，你不得复制、修改、分发或以其他方式利用上述内容。",
    ],
  },
  {
    id: "third-parties",
    title: "9. 第三方服务",
    paragraphs: [
      "本服务可能集成或允许你接入第三方服务（如追踪像素、域名服务、支付服务商）。此类第三方服务受其各自的条款与政策约束，我们不对其行为或可用性负责。",
    ],
  },
  {
    id: "disclaimer",
    title: "10. 免责声明",
    paragraphs: [
      `本服务按“现状”与“现有”基础提供。在适用法律允许的最大范围内，我们不作任何明示或默示的保证，包括但不限于对适销性、特定用途适用性及不中断、无错误运行的保证。`,
    ],
  },
  {
    id: "liability",
    title: "11. 责任限制",
    paragraphs: [
      "在适用法律允许的最大范围内，对于因使用或无法使用本服务而产生的任何间接、附带、特殊或后果性损失，我们不承担责任。在任何情况下，我们的累计责任总额不超过你在导致责任事件发生前的合理期间内就本服务向我们实际支付的费用。",
    ],
  },
  {
    id: "termination",
    title: "12. 终止",
    paragraphs: [
      "你可随时停止使用本服务并注销账户。若你违反本条款，我们有权暂停或终止你对本服务的访问。终止后，本条款中依其性质应继续有效的条款仍然有效。",
    ],
  },
  {
    id: "changes",
    title: "13. 条款变更",
    paragraphs: [
      "我们可能不时更新本条款。更新后将在本页面公布并更新“最后更新”日期。你在变更生效后继续使用本服务，即视为接受修订后的条款。",
    ],
  },
  {
    id: "law",
    title: "14. 适用法律与争议",
    paragraphs: [
      "本条款依适用的法律解释与执行。双方就本服务产生的任何争议，应首先本着善意通过友好协商解决。本条款未指定特定的排他管辖司法辖区。",
    ],
  },
  {
    id: "contact",
    title: "15. 联系我们",
    paragraphs: [`如你对本服务条款有任何疑问，请通过电子邮箱联系我们：${CONTACT}。`],
  },
];

export default function Page() {
  return (
    <LegalPage
      fonts={{ display: display.className, body: body.className, mono: mono.className }}
      title="服务条款"
      subtitle="使用 Zap Bridge 服务的条款与条件。"
      updated={UPDATED}
      sections={sections}
    />
  );
}
