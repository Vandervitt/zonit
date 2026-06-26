"use client";
// landing-editor/components/EditorDetail.tsx
// 右栏：渲染当前选中节点的表单。
import type { ReactNode } from "react";
import { SECTION_REGISTRY } from "@/types/schema.draft";
import { useEditorState, useEditorDispatch, HERO_ID, FOOTER_ID, FLOATING_ID, LEADFORM_ID, BRANDING_ID } from "../store/editorStore";
import { HeroForm } from "../forms/HeroForm";
import { BrandingForm } from "../forms/BrandingForm";
import { FooterForm } from "../forms/FooterForm";
import { FloatingButtonForm } from "../forms/FloatingButtonForm";
import { LeadFormForm } from "../forms/LeadFormForm";
import { renderSectionForm } from "../registry/sectionForms";

export function EditorDetail() {
  const state = useEditorState();
  const dispatch = useEditorDispatch();
  const id = state.selectedId;

  let title = "";
  let body: ReactNode = null;

  if (id === HERO_ID) {
    title = "首屏 Hero";
    body = <HeroForm value={state.hero} onChange={(v) => dispatch({ kind: "updateHero", value: v })} />;
  } else if (id === FOOTER_ID) {
    title = "页脚 Footer";
    body = <FooterForm value={state.footer} onChange={(v) => dispatch({ kind: "updateFooter", value: v })} />;
  } else if (id === FLOATING_ID && state.floatingButton) {
    title = "悬浮按钮";
    body = (
      <FloatingButtonForm value={state.floatingButton} onChange={(v) => dispatch({ kind: "updateFloating", value: v })} />
    );
  } else if (id === LEADFORM_ID && state.leadForm) {
    title = "留资表单";
    body = (
      <LeadFormForm value={state.leadForm} onChange={(v) => dispatch({ kind: "updateLeadForm", value: v })} />
    );
  } else if (id === BRANDING_ID) {
    title = "品牌主题";
    body = <BrandingForm value={state.branding} onChange={(v) => dispatch({ kind: "updateBranding", value: v })} />;
  } else {
    const section = state.sections.find((s) => s._key === id);
    if (section) {
      title = SECTION_REGISTRY[section.type].label;
      body = renderSectionForm(section, (data) =>
        dispatch({ kind: "updateSection", key: section._key, data }),
      );
    }
  }

  if (!body) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-muted">
        选择左侧区块开始编辑
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-edge px-5 py-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <div className="mx-auto max-w-xl">{body}</div>
      </div>
    </div>
  );
}
