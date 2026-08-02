// landing-editor/sampleDraft.ts
// 编辑器初始种子：把已加载的 LandingPageDraft 适配为编辑器 EditorState。
// 刻意「不导入模板注册表」——草稿由调用方（已从 DB 取出的落地页）传入，
// 避免编辑器路由把全部模板草稿拖进首次编译的模块图。
import type { LandingPageDraft } from "@/types/schema.draft";
import type { EditorState } from "./store/editorStore";
import { withKeys, CONTACT_ID } from "./store/editorStore";
import { createTracking, createBranding, createSeo } from "./store/defaults";

/** 把干净的 LandingPageDraft 适配为编辑器状态（为可排序区块补 _key）。 */
export function fromDraft(draft: LandingPageDraft): EditorState {
  return {
    contact: draft.contact,
    hero: draft.hero,
    footer: draft.footer,
    floatingButton: draft.floatingButton ?? null,
    leadForm: draft.leadForm ?? null,
    sections: withKeys(draft.sections),
    // 默认选中联系方式而不是 Hero：新建页面的第一件事是回答「客户怎么找你」，
    // 它决定全页 160 个 CTA 的落点。不做阻断式向导（渠道随时可改，
    // 且想先看看模板长什么样的用户被弹窗拦住会直接退出）。
    selectedId: CONTACT_ID,
    tracking: draft.tracking ?? createTracking(),
    branding: draft.branding ?? createBranding(),
    seo: draft.seo ?? createSeo(),
    variantSeed: draft.variantSeed,
  };
}
