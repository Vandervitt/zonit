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
} from "@/types/schema.draft";
import { createSection, createFloatingButton, createLeadForm } from "./defaults";

export type EditorSection = LandingSection & { _key: string };

export const HERO_ID = "hero";
export const FOOTER_ID = "footer";
export const FLOATING_ID = "floatingButton";
export const LEADFORM_ID = "leadForm";

export interface EditorState {
  hero: HeroSection;
  footer: FooterSection;
  floatingButton: FloatingButton | null;
  leadForm: LeadForm | null;
  sections: EditorSection[];
  selectedId: string;
  tracking: PageTracking;
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
  | { kind: "updateSection"; key: string; data: LandingSection["data"] }
  | { kind: "addSection"; sectionType: LandingSectionType }
  | { kind: "removeSection"; key: string }
  | { kind: "moveSection"; key: string; dir: -1 | 1 }
  | { kind: "reorderSection"; fromIndex: number; toIndex: number };

let keySeq = 0;
export const nextSectionKey = () => `s${++keySeq}`;

export function withKeys(sections: LandingSection[]): EditorSection[] {
  return sections.map((s) => ({ ...s, _key: nextSectionKey() }) as EditorSection);
}

function reducer(state: EditorState, action: EditorAction): EditorState {
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
  }
}

const StateContext = createContext<EditorState | null>(null);
const DispatchContext = createContext<Dispatch<EditorAction> | null>(null);

export function EditorProvider({
  initial,
  children,
}: {
  initial: EditorState;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, initial);
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useEditorState(): EditorState {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error("useEditorState must be used within EditorProvider");
  return ctx;
}

export function useEditorDispatch(): Dispatch<EditorAction> {
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
  return draft;
}
