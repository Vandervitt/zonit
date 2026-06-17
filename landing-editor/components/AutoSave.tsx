"use client";
import { useEffect, useRef } from "react";
import { useEditorState, toDraft } from "../store/editorStore";
import { useMeta } from "../MetaContext";
import { apiLandingPagePath } from "@/lib/constants";

/** 监听编辑状态与页面名，防抖 1.5s 后 PUT 保存。挂在 EditorProvider+MetaProvider 内、无渲染。 */
export function AutoSave() {
  const state = useEditorState();
  const { pageId, name, setSaveState } = useMeta();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; } // 跳过初次挂载
    if (timer.current) clearTimeout(timer.current);
    setSaveState("saving");
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(apiLandingPagePath(pageId), {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, data: toDraft(state) }),
        });
        setSaveState(res.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    }, 1500);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [state, name, pageId, setSaveState]);

  return null;
}
