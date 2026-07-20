import type { Metadata } from "next";
import { Syne, Sora, JetBrains_Mono } from "next/font/google";
import { LegalPage, type LegalSection } from "@/components/marketing/LegalPage";

const display = Syne({ subsets: ["latin"], weight: ["700", "800"], display: "swap" });
const body = Sora({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap" });

export const metadata: Metadata = {
  title: "隐私政策 | Zap Bridge",
  description: "Zap Bridge 如何收集、使用与保护你的信息，以及你对个人数据享有的权利。",
};

const UPDATED = "2026 年 7 月 20 日";
const CONTACT = "vandervitt.li@gmail.com";

const sections: LegalSection[] = [
  {
    id: "overview",
    title: "1. 概述",
    paragraphs: [
      `本隐私政策说明 Zap Bridge（下称“我们”“本服务”，通过 zapbridge.tech 及相关子域名提供）如何收集、使用、存储与保护你的信息。本服务由个人开发者独立运营。`,
      `使用本服务即表示你已阅读并理解本政策。如你不同意本政策，请停止使用本服务。若对本政策有任何疑问，可通过 ${CONTACT} 与我们联系。`,
    ],
  },
  {
    id: "collect",
    title: "2. 我们收集的信息",
    paragraphs: ["为提供与改进服务，我们可能收集以下类别的信息："],
    bullets: [
      "账户信息：当你通过第三方账户（如 Google）登录时获取的电子邮箱、显示名称与头像。",
      "你创建的内容：你在本服务中制作的落地页配置与文案、你上传或选用的图片素材、你绑定的自定义域名等。",
      "通过落地页采集的访客数据：你发布的落地页可能采集访客提交的姓名、邮箱、电话或留言。就此类数据，你是数据控制者，我们仅作为你的数据处理方代为存储与传递。",
      "使用与技术数据：访问日志、IP 地址、设备与浏览器类型、页面访问与转化的统计信息。",
      "支付信息：付费套餐由第三方支付服务商（作为 Merchant of Record）处理，我们不接触也不存储你的完整银行卡信息。",
      "Cookie 与类似技术：用于维持登录状态、保存偏好及进行访问分析。",
    ],
  },
  {
    id: "use",
    title: "3. 我们如何使用信息",
    bullets: [
      "提供、维护与改进本服务的功能与体验；",
      "创建与管理你的账户，进行身份验证；",
      "处理套餐订阅、计费与相关通知；",
      "保障服务安全，预防与排查欺诈及滥用行为；",
      "在必要时就服务变更、安全事项与重要通知与你沟通；",
      "遵守适用的法律义务。",
    ],
  },
  {
    id: "third-parties",
    title: "4. 第三方服务与子处理方",
    paragraphs: [
      "为运行本服务，我们使用若干第三方服务提供商，它们可能在其为我们提供服务的范围内处理相关数据，包括：登录认证服务、云托管与数据库、支付服务商、图片素材服务、以及用于生成落地页内容的人工智能服务。",
      "此外，你可在自己的落地页上自行配置第三方追踪像素（如 Meta、TikTok、Google）。这些第三方对数据的处理受其各自隐私政策约束，由你自行决定是否启用并对其合规使用负责。",
    ],
  },
  {
    id: "roles",
    title: "5. 关于落地页与访客数据的角色划分",
    paragraphs: [
      "就你通过落地页采集的访客个人数据，你是数据控制者，我们是数据处理方，仅按你的指示存储与提供该等数据。",
      "你需自行确保对访客数据的采集具备合法依据，并在你的落地页上向访客提供必要的隐私告知与同意机制。你应对你的落地页内容及数据处理的合规性负责。",
    ],
  },
  {
    id: "retention",
    title: "6. 数据留存",
    paragraphs: [
      "我们在你的账户存续期间及为实现本政策所述目的所必需的期间内保留你的信息。你注销账户后，我们将在合理期限内删除或匿名化相关数据，法律要求继续保留的除外。",
    ],
  },
  {
    id: "security",
    title: "7. 数据安全",
    paragraphs: [
      "我们采取合理的技术与组织措施保护你的信息，防止未经授权的访问、使用或披露。但请注意，任何通过互联网传输或电子存储的方式都无法保证绝对安全。",
    ],
  },
  {
    id: "rights",
    title: "8. 你的权利",
    paragraphs: [
      `在适用法律允许的范围内，你有权访问、更正、删除或导出你的个人数据，并可撤回此前作出的同意。你可通过 ${CONTACT} 与我们联系以行使上述权利，我们将在合理期限内响应。`,
    ],
  },
  {
    id: "transfers",
    title: "9. 国际数据传输",
    paragraphs: [
      "本服务面向全球用户，你的信息可能在不同国家或地区被存储与处理。使用本服务即表示你理解并同意此类跨境传输。",
    ],
  },
  {
    id: "cookies",
    title: "10. Cookie",
    paragraphs: [
      "我们使用必要 Cookie 维持服务的基本功能（如登录会话），并使用分析类 Cookie 了解服务的使用情况。你可通过浏览器设置管理或清除 Cookie，但这可能影响部分功能的正常使用。",
    ],
  },
  {
    id: "children",
    title: "11. 未成年人",
    paragraphs: [
      "本服务不面向 16 岁以下的未成年人。我们不会在知情的情况下收集未成年人的个人数据；如你认为我们可能持有此类数据，请及时联系我们予以删除。",
    ],
  },
  {
    id: "changes",
    title: "12. 政策变更",
    paragraphs: [
      "我们可能不时更新本隐私政策。更新后将在本页面公布并更新“最后更新”日期；如涉及重大变更，我们会通过适当方式提示你。",
    ],
  },
  {
    id: "contact",
    title: "13. 联系我们",
    paragraphs: [`如你对本隐私政策或个人数据处理有任何疑问，请通过电子邮箱联系我们：${CONTACT}。`],
  },
];

export default function Page() {
  return (
    <LegalPage
      fonts={{ display: display.className, body: body.className, mono: mono.className }}
      title="隐私政策"
      subtitle="我们如何收集、使用与保护你的信息。"
      updated={UPDATED}
      sections={sections}
    />
  );
}
