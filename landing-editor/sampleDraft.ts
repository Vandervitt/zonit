// landing-editor/sampleDraft.ts
// 编辑器初始种子：按所选模板从注册表取 LandingPageDraft 数据并派生 EditorState，
// 使 /editor-next?template=<id> 打开即为该落地页，可在各表单中完整复刻与调整。
import type { LandingPageDraft } from "@/types/schema.draft";
import type { EditorState } from "./store/editorStore";
import { withKeys, HERO_ID } from "./store/editorStore";
import { getTemplate } from "./samples/registry";
import { createTracking } from "./store/defaults";

/** 把干净的 LandingPageDraft 适配为编辑器状态（为可排序区块补 _key）。 */
export function fromDraft(draft: LandingPageDraft): EditorState {
  return {
    hero: draft.hero,
    footer: draft.footer,
    floatingButton: draft.floatingButton ?? null,
    sections: withKeys(draft.sections),
    selectedId: HERO_ID,
    tracking: draft.tracking ?? createTracking(),
  };
}

/** 按模板 id 生成初始状态；缺省或未命中时回退默认模板。 */
export function createInitialState(templateId?: string | null): EditorState {
  return fromDraft(getTemplate(templateId).draft);
}
