"use client";
// landing-editor/Editor.tsx
import { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { LandingPageDraft } from "@/types/schema.draft";
import type { PlanId } from "@/lib/plans";
import type { Locale } from "@/lib/i18n/config";
import { AdminLocaleProvider } from "@/lib/i18n/admin/context";
import { EditorProvider } from "./store/editorStore";
import { fromDraft } from "./sampleDraft";
import { MetaProvider } from "./MetaContext";
import { EditorLayout } from "./components/EditorLayout";
import { AutoSave } from "./components/AutoSave";
import { GenerateBriefDialog } from "./components/GenerateBriefDialog";

export function Editor({
  pageId,
  initialName,
  initialDraft,
  plan,
  initialStatus = "draft",
  initialPublishedDirty = false,
  autoGenerate = false,
  locale,
}: {
  pageId: string;
  initialName: string;
  initialDraft: LandingPageDraft;
  plan: PlanId;
  initialStatus?: "draft" | "published";
  /** 已发布页的草稿是否领先线上快照（updated_at > published_at）。 */
  initialPublishedDirty?: boolean;
  /** 从「AI 一键成页」进入（?ai=1）时为 true：默认弹出生成表单。 */
  autoGenerate?: boolean;
  /**
   * 后台界面语言，由路由在服务端解析后传入。
   * 编辑器不在 (workspace) 布局下，拿不到那边的 Provider，故在此自建一层——
   * 少了它，编辑器内任何 useAdminT() 都会抛错（见 lib/i18n/admin/context.tsx）。
   */
  locale: Locale;
}) {
  const [initial] = useState(() => fromDraft(initialDraft));
  return (
    <AdminLocaleProvider locale={locale}>
      <DndProvider backend={HTML5Backend}>
        <EditorProvider initial={initial}>
          <MetaProvider
            pageId={pageId}
            initialName={initialName}
            plan={plan}
            initialStatus={initialStatus}
            initialPublishedDirty={initialPublishedDirty}
            initialGenerateOpen={autoGenerate}
          >
            <AutoSave />
            <EditorLayout />
            <GenerateBriefDialog />
          </MetaProvider>
        </EditorProvider>
      </DndProvider>
    </AdminLocaleProvider>
  );
}
