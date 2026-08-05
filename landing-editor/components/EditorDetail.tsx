"use client";
// landing-editor/components/EditorDetail.tsx
// 右栏：渲染当前选中节点的表单。
import { useAdminT } from "@/lib/i18n/admin/context";
import type { ReactNode } from "react";
import { SECTION_REGISTRY } from "@/types/schema.draft";
import { useEditorState, useEditorDispatch, CONTACT_ID, HERO_ID, FOOTER_ID, FLOATING_ID, LEADFORM_ID, BRANDING_ID, SEO_ID } from "../store/editorStore";
import { HeroForm } from "../forms/HeroForm";
import { ContactForm, floatingChannelOf } from "../forms/ContactForm";
import { BrandingForm } from "../forms/BrandingForm";
import { SeoForm } from "../forms/SeoForm";
import { FooterForm } from "../forms/FooterForm";
import { FloatingButtonForm } from "../forms/FloatingButtonForm";
import { LeadFormForm } from "../forms/LeadFormForm";
import { renderSectionForm } from "../registry/sectionForms";

export function EditorDetail() {
  const d = useAdminT().editor;
  const t = d.panels.detail;
  const state = useEditorState();
  const dispatch = useEditorDispatch();
  const id = state.selectedId;

  let title = "";
  let body: ReactNode = null;

  if (id === CONTACT_ID) {
    title = t.contact;
    body = (
      <ContactForm
        value={state.contact}
        leadFormEnabled={Boolean(state.leadForm?.enabled)}
        floatingChannel={floatingChannelOf({ floatingButton: state.floatingButton ?? undefined, contact: state.contact })}
        onPrimaryChange={(channel) => dispatch({ kind: "switchPrimaryChannel", channel })}
        onValueChange={(v) => dispatch({ kind: "updateContact", value: v })}
        onFloatingChannelChange={(channel) =>
          state.floatingButton &&
          dispatch({
            kind: "updateFloating",
            value: { ...state.floatingButton, target: { kind: "channel", channel } },
          })
        }
      />
    );
  } else if (id === HERO_ID) {
    title = t.hero;
    body = <HeroForm value={state.hero} onChange={(v) => dispatch({ kind: "updateHero", value: v })} />;
  } else if (id === FOOTER_ID) {
    title = t.footer;
    body = <FooterForm value={state.footer} onChange={(v) => dispatch({ kind: "updateFooter", value: v })} />;
  } else if (id === FLOATING_ID && state.floatingButton) {
    title = t.floatingButton;
    body = (
      <FloatingButtonForm value={state.floatingButton} onChange={(v) => dispatch({ kind: "updateFloating", value: v })} />
    );
  } else if (id === LEADFORM_ID && state.leadForm) {
    title = t.leadForm;
    body = (
      <LeadFormForm value={state.leadForm} onChange={(v) => dispatch({ kind: "updateLeadForm", value: v })} />
    );
  } else if (id === BRANDING_ID) {
    title = t.branding;
    body = <BrandingForm value={state.branding} onChange={(v) => dispatch({ kind: "updateBranding", value: v })} />;
  } else if (id === SEO_ID) {
    title = "SEO";
    body = <SeoForm value={state.seo} onChange={(v) => dispatch({ kind: "updateSeo", value: v })} />;
  } else {
    const section = state.sections.find((s) => s._key === id);
    if (section) {
      title = d.issues.sections[section.type];
      body = renderSectionForm(section, (data) =>
        dispatch({ kind: "updateSection", key: section._key, data }),
      );
    }
  }

  if (!body) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-muted">
        {t.empty}
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
