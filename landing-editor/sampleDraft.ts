// landing-editor/sampleDraft.ts
// 编辑器初始种子：从美妆护肤「肤质咨询」LandingPageDraft 数据文件派生 EditorState，
// 使 /editor-next 打开即为该落地页，可在各表单中完整复刻与调整。
import type { LandingPageDraft } from "@/types/schema.draft";
import type { EditorState } from "./store/editorStore";
import { withKeys, HERO_ID } from "./store/editorStore";
import { skincareConsultDraft } from "./samples/skincareConsultDraft";

/** 把干净的 LandingPageDraft 适配为编辑器状态（为可排序区块补 _key）。 */
export function fromDraft(draft: LandingPageDraft): EditorState {
  return {
    hero: draft.hero,
    footer: draft.footer,
    floatingButton: draft.floatingButton ?? null,
    sections: withKeys(draft.sections),
    selectedId: HERO_ID,
  };
}

export function createInitialState(): EditorState {
  return fromDraft(skincareConsultDraft);
}
