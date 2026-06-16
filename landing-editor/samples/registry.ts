// landing-editor/samples/registry.ts
//
// 模板注册表：集中登记 /editor-next 可用的 LandingPageDraft 样例模板。
// 选择页与编辑器种子共用本表 —— 新增模板只需在此追加一条。
import type { LandingPageDraft } from "@/types/schema.draft";
import { skincareConsultDraft } from "./skincareConsultDraft";
import { dentalClinicDraft } from "./dentalClinicDraft";
import { solarHomeDraft } from "./solarHomeDraft";

export interface TemplateMeta {
  /** 唯一标识，作为 /editor-next?template=<id> 的取值 */
  id: string;
  /** 模板名称（选择页卡片标题） */
  name: string;
  /** 行业归类小标签 */
  industry: string;
  /** 一句话简介（选择页卡片描述） */
  tagline: string;
  /** 卡片缩略图（在线占位图） */
  thumbnail: string;
  /** 模板数据 */
  draft: LandingPageDraft;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "skincare",
    name: "Aurae Skincare",
    industry: "美妆 / 护肤",
    tagline: "皮肤咨询型落地页，访客经 WhatsApp 领取免费肤质分析。",
    thumbnail: skincareConsultDraft.hero.backgroundImage?.src ?? "",
    draft: skincareConsultDraft,
  },
  {
    id: "dental",
    name: "Lumora Dental Studio",
    industry: "牙科 / 医美",
    tagline: "牙科预约型落地页，免费微笑评估 + WhatsApp 预约咨询。",
    thumbnail: dentalClinicDraft.hero.backgroundImage?.src ?? "",
    draft: dentalClinicDraft,
  },
  {
    id: "solar",
    name: "Solterra Home Solar",
    industry: "家装 / 太阳能",
    tagline: "家装太阳能落地页，免费上门测评 + 省电方案咨询。",
    thumbnail: solarHomeDraft.hero.backgroundImage?.src ?? "",
    draft: solarHomeDraft,
  },
];

export const DEFAULT_TEMPLATE_ID = TEMPLATES[0].id;

/** 按 id 取模板；缺省或未命中时回退默认模板。 */
export function getTemplate(id?: string | null): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
