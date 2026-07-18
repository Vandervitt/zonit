// landing-editor/samples/registry.drafts.ts
//
// 模板草稿体的「按需加载器」：每套草稿经动态 import() 单独成块，仅在真正需要草稿
// 数据时（服务端新建 / AI 生成种子）才加载并编译。配合纯元数据的 registry.ts，
// 使画廊 / 编辑器路由的首次编译不再把全部模板草稿拖进模块图。
//
// 新增模板：在下方 loaders 追加同 id 的加载器，并在 registry.ts 追加对应 TemplateMeta。
import type { LandingPageDraft } from "@/types/schema.draft";
import { DEFAULT_TEMPLATE_ID } from "./registry";
import { blankPlaceholderContacts } from "../lib/contactIssues";

type DraftLoader = () => Promise<LandingPageDraft>;

const loaders: Record<string, DraftLoader> = {
  skincare: () => import("./skincareConsultDraft").then((m) => m.skincareConsultDraft),
  dental: () => import("./dentalClinicDraft").then((m) => m.dentalClinicDraft),
  solar: () => import("./solarHomeDraft").then((m) => m.solarHomeDraft),
  radiantglow: () => import("./radiantGlowBeautyDraft").then((m) => m.radiantGlowBeautyDraft),
  // 第一梯队 · 美妆个护
  makeup: () => import("./makeupConsultDraft").then((m) => m.makeupConsultDraft),
  "beauty-device": () => import("./beautyDeviceDraft").then((m) => m.beautyDeviceDraft),
  "hair-growth": () => import("./hairGrowthDraft").then((m) => m.hairGrowthDraft),
  fragrance: () => import("./fragranceDraft").then((m) => m.fragranceDraft),
  // 第一梯队 · 服饰配饰
  "fast-fashion": () => import("./fastFashionDraft").then((m) => m.fastFashionDraft),
  "plus-size": () => import("./plusSizeDraft").then((m) => m.plusSizeDraft),
  activewear: () => import("./activewearDraft").then((m) => m.activewearDraft),
  shapewear: () => import("./shapewearDraft").then((m) => m.shapewearDraft),
  footwear: () => import("./footwearDraft").then((m) => m.footwearDraft),
  // 第一梯队 · 3C 数码配件
  "phone-case": () => import("./phoneCaseDraft").then((m) => m.phoneCaseDraft),
  charging: () => import("./chargingDraft").then((m) => m.chargingDraft),
  audio: () => import("./audioDraft").then((m) => m.audioDraft),
  wearable: () => import("./wearableDraft").then((m) => m.wearableDraft),
  "smart-home": () => import("./smartHomeDraft").then((m) => m.smartHomeDraft),
  // 第一梯队 · 家居家纺
  storage: () => import("./storageDraft").then((m) => m.storageDraft),
  kitchen: () => import("./kitchenDraft").then((m) => m.kitchenDraft),
  pet: () => import("./petDraft").then((m) => m.petDraft),
  garden: () => import("./gardenDraft").then((m) => m.gardenDraft),
  bedding: () => import("./beddingDraft").then((m) => m.beddingDraft),
  // 第一梯队 · 健康保健品
  vitamins: () => import("./vitaminsDraft").then((m) => m.vitaminsDraft),
  "weight-mgmt": () => import("./weightMgmtDraft").then((m) => m.weightMgmtDraft),
  sleep: () => import("./sleepDraft").then((m) => m.sleepDraft),
  joint: () => import("./jointDraft").then((m) => m.jointDraft),
  "womens-health": () => import("./womensHealthDraft").then((m) => m.womensHealthDraft),
  // 第一梯队 · 玩具母婴
  "educational-toy": () => import("./educationalToyDraft").then((m) => m.educationalToyDraft),
  fidget: () => import("./fidgetToyDraft").then((m) => m.fidgetToyDraft),
  "baby-care": () => import("./babyCareDraft").then((m) => m.babyCareDraft),
  maternity: () => import("./maternityDraft").then((m) => m.maternityDraft),
  "outdoor-toy": () => import("./outdoorToyDraft").then((m) => m.outdoorToyDraft),
};

/** 按 id 异步加载模板草稿体；缺省或未命中时回退默认模板。
 *  实例化时把模板占位联系链接置空，让新建 / AI 生成页开局即被迫填真实联系方式。 */
export function loadTemplateDraft(id?: string | null): Promise<LandingPageDraft> {
  const loader = (id && loaders[id]) || loaders[DEFAULT_TEMPLATE_ID];
  return loader().then(blankPlaceholderContacts);
}
