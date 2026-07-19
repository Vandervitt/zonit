"use client";
// landing-editor/store/editorStore.tsx
// 编辑器状态：useReducer + Context。sections 用 _key 维持稳定身份，toDraft 剥离后产出干净的 LandingPageDraft。

import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import type {
  HeroSection,
  FooterSection,
  FloatingButton,
  LeadForm,
  LandingSection,
  LandingSectionType,
  LandingPageDraft,
  PageTracking,
  Branding,
  PageSeo,
} from "@/types/schema.draft";
import {
  createSection,
  createFloatingButton,
  createLeadForm,
  createTracking,
  createBranding,
  createSeo,
} from "./defaults";

export type EditorSection = LandingSection & { _key: string };

export const HERO_ID = "hero";
export const FOOTER_ID = "footer";
export const FLOATING_ID = "floatingButton";
export const LEADFORM_ID = "leadForm";
export const BRANDING_ID = "branding";
export const SEO_ID = "seo";

export interface EditorState {
  hero: HeroSection;
  footer: FooterSection;
  floatingButton: FloatingButton | null;
  leadForm: LeadForm | null;
  sections: EditorSection[];
  selectedId: string;
  tracking: PageTracking;
  branding: Branding;
  seo: PageSeo;
  variantSeed?: string; // 反同质化种子（Pro/Agency 生效；缺省渲染端回退 page.id）
}

export type EditorAction =
  | { kind: "select"; id: string }
  | { kind: "updateHero"; value: HeroSection }
  | { kind: "updateFooter"; value: FooterSection }
  | { kind: "updateFloating"; value: FloatingButton }
  | { kind: "toggleFloating"; on: boolean }
  | { kind: "toggleLeadForm"; on: boolean }
  | { kind: "updateLeadForm"; value: LeadForm }
  | { kind: "updateTracking"; value: PageTracking }
  | { kind: "updateBranding"; value: Branding }
  | { kind: "updateSeo"; value: PageSeo }
  | { kind: "setVariantSeed"; value: string }
  | { kind: "updateSection"; key: string; data: LandingSection["data"] }
  | { kind: "addSection"; sectionType: LandingSectionType }
  | { kind: "removeSection"; key: string }
  | { kind: "moveSection"; key: string; dir: -1 | 1 }
  | { kind: "reorderSection"; fromIndex: number; toIndex: number }
  | { kind: "replaceDraft"; draft: LandingPageDraft };

let keySeq = 0;
export const nextSectionKey = () => `s${++keySeq}`;

export function withKeys(sections: LandingSection[]): EditorSection[] {
  return sections.map((s) => ({ ...s, _key: nextSectionKey() }) as EditorSection);
}

export function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.kind) {
    case "select":
      return { ...state, selectedId: action.id };

    case "updateHero":
      return { ...state, hero: action.value };

    case "updateFooter":
      return { ...state, footer: action.value };

    case "updateFloating":
      return { ...state, floatingButton: action.value };

    case "updateTracking":
      return { ...state, tracking: action.value };

    case "updateBranding":
      return { ...state, branding: action.value };

    case "updateSeo":
      return { ...state, seo: action.value };

    case "setVariantSeed":
      return { ...state, variantSeed: action.value };

    case "toggleFloating":
      return {
        ...state,
        floatingButton: action.on ? (state.floatingButton ?? createFloatingButton()) : null,
        selectedId: action.on
          ? FLOATING_ID
          : state.selectedId === FLOATING_ID
            ? HERO_ID
            : state.selectedId,
      };

    case "updateLeadForm":
      return { ...state, leadForm: action.value };

    case "toggleLeadForm":
      return {
        ...state,
        leadForm: action.on ? (state.leadForm ?? createLeadForm()) : null,
        selectedId: action.on
          ? LEADFORM_ID
          : state.selectedId === LEADFORM_ID
            ? HERO_ID
            : state.selectedId,
      };

    case "updateSection":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s._key === action.key ? ({ ...s, data: action.data } as EditorSection) : s,
        ),
      };

    case "addSection": {
      const section = { ...createSection(action.sectionType), _key: nextSectionKey() } as EditorSection;
      return { ...state, sections: [...state.sections, section], selectedId: section._key };
    }

    case "removeSection": {
      const idx = state.sections.findIndex((s) => s._key === action.key);
      if (idx === -1) return state;
      const sections = state.sections.filter((s) => s._key !== action.key);
      const selectedId =
        state.selectedId === action.key
          ? (sections[idx]?._key ?? sections[idx - 1]?._key ?? HERO_ID)
          : state.selectedId;
      return { ...state, sections, selectedId };
    }

    case "moveSection": {
      const idx = state.sections.findIndex((s) => s._key === action.key);
      const j = idx + action.dir;
      if (idx === -1 || j < 0 || j >= state.sections.length) return state;
      const sections = state.sections.slice();
      [sections[idx], sections[j]] = [sections[j], sections[idx]];
      return { ...state, sections };
    }

    case "reorderSection": {
      const { fromIndex, toIndex } = action;
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return state;
      const sections = state.sections.slice();
      const [moved] = sections.splice(fromIndex, 1);
      sections.splice(toIndex, 0, moved);
      return { ...state, sections };
    }

    // 整页替换：AI 一键成页把生成的 LandingPageDraft 灌入编辑器（区块补 _key、选中回到 Hero）。
    // 逻辑与 sampleDraft.fromDraft 一致，此处内联以避免 editorStore ↔ sampleDraft 循环依赖。
    case "replaceDraft": {
      const d = action.draft;
      return {
        hero: d.hero,
        footer: d.footer,
        floatingButton: d.floatingButton ?? null,
        leadForm: d.leadForm ?? null,
        sections: withKeys(d.sections),
        selectedId: HERO_ID,
        tracking: d.tracking ?? createTracking(),
        branding: d.branding ?? createBranding(),
        seo: d.seo ?? createSeo(),
        variantSeed: d.variantSeed,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// 撤销/重做：历史栈包装。select 视为纯选中不入历史；同目标连续输入在合并窗口内
// 折叠为一步（一次 undo 回到输入前）；replaceDraft（AI 一键成页）同样入历史，可一步恢复。
// ---------------------------------------------------------------------------

export type HistoryAction = EditorAction | { kind: "undo" } | { kind: "redo" };

export interface HistoryState {
  past: EditorState[];
  present: EditorState;
  future: EditorState[];
  /** 上一次入历史动作的合并指纹与时间戳，用于连续输入折叠。 */
  lastEdit: { fingerprint: string; at: number } | null;
}

const HISTORY_LIMIT = 50;
/** 同目标连续修改的合并窗口（ms）：窗口内不新增历史步。 */
const COALESCE_MS = 800;

export function initHistory(present: EditorState): HistoryState {
  return { past: [], present, future: [], lastEdit: null };
}

/** 动作的合并指纹：同 kind + 同目标（updateSection 按区块 key 区分）。 */
function editFingerprint(action: EditorAction): string {
  return action.kind === "updateSection" ? `updateSection:${action.key}` : action.kind;
}

export function historyReducer(h: HistoryState, action: HistoryAction, now = Date.now()): HistoryState {
  if (action.kind === "undo") {
    if (h.past.length === 0) return h;
    const previous = h.past[h.past.length - 1];
    return {
      past: h.past.slice(0, -1),
      present: previous,
      future: [h.present, ...h.future],
      lastEdit: null,
    };
  }
  if (action.kind === "redo") {
    if (h.future.length === 0) return h;
    const [next, ...rest] = h.future;
    return { past: [...h.past, h.present], present: next, future: rest, lastEdit: null };
  }

  const next = reducer(h.present, action);
  if (next === h.present) return h;

  // 纯选中：更新 present，不入历史、不打断合并窗口。
  if (action.kind === "select") return { ...h, present: next };

  const fingerprint = editFingerprint(action);
  const coalesce =
    h.lastEdit !== null && h.lastEdit.fingerprint === fingerprint && now - h.lastEdit.at < COALESCE_MS;

  const past = coalesce ? h.past : [...h.past, h.present].slice(-HISTORY_LIMIT);
  return { past, present: next, future: [], lastEdit: { fingerprint, at: now } };
}

const StateContext = createContext<EditorState | null>(null);
const DispatchContext = createContext<Dispatch<HistoryAction> | null>(null);
const HistoryMetaContext = createContext<{ canUndo: boolean; canRedo: boolean } | null>(null);

export function EditorProvider({
  initial,
  children,
}: {
  initial: EditorState;
  children: ReactNode;
}) {
  // 包一层去掉 now 参数：useReducer 的 reducer 签名不接受额外入参（now 仅测试用）。
  const [history, dispatch] = useReducer(
    (h: HistoryState, a: HistoryAction) => historyReducer(h, a),
    initial,
    initHistory,
  );
  return (
    <StateContext.Provider value={history.present}>
      <DispatchContext.Provider value={dispatch}>
        <HistoryMetaContext.Provider
          value={{ canUndo: history.past.length > 0, canRedo: history.future.length > 0 }}
        >
          {children}
        </HistoryMetaContext.Provider>
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useEditorHistory(): { canUndo: boolean; canRedo: boolean } {
  const ctx = useContext(HistoryMetaContext);
  if (!ctx) throw new Error("useEditorHistory must be used within EditorProvider");
  return ctx;
}

export function useEditorState(): EditorState {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error("useEditorState must be used within EditorProvider");
  return ctx;
}

export function useEditorDispatch(): Dispatch<HistoryAction> {
  const ctx = useContext(DispatchContext);
  if (!ctx) throw new Error("useEditorDispatch must be used within EditorProvider");
  return ctx;
}

/** 产出干净的 LandingPageDraft（剥离 _key）。 */
export function toDraft(state: EditorState): LandingPageDraft {
  const draft: LandingPageDraft = {
    hero: state.hero,
    sections: state.sections.map((s) => ({ type: s.type, data: s.data }) as LandingSection),
    footer: state.footer,
  };
  if (state.floatingButton) draft.floatingButton = state.floatingButton;
  if (state.leadForm) draft.leadForm = state.leadForm;
  draft.tracking = state.tracking;
  draft.branding = state.branding;
  draft.seo = state.seo;
  if (state.variantSeed) draft.variantSeed = state.variantSeed;
  return draft;
}
