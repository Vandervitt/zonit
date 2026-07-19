"use client";
import { useEffect, useRef } from "react";
import { useEditorState, toDraft } from "../store/editorStore";
import { useMeta } from "../MetaContext";
import { apiLandingPagePath } from "@/lib/constants";

/**
 * 监听编辑状态与页面名，防抖 1.5s 后 PUT 保存。挂在 EditorProvider+MetaProvider 内、无渲染。
 * 通过 flushSaveRef 暴露「立即落库」：发布前调用以消除防抖窗口内草稿未落库的竞态。
 * 有未落库改动或保存失败时，拦截关闭/刷新（beforeunload）。
 */
export function AutoSave() {
  const state = useEditorState();
  const { pageId, name, setSaveState, setSaveError, status, setPublishedDirty, flushSaveRef, saveState } = useMeta();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);
  // status 用 ref 读取：发布成功把 status 翻成 published 不应触发一轮保存/标脏。
  const statusRef = useRef(status);
  useEffect(() => { statusRef.current = status; }, [status]);
  // 待保存的最新草稿；null 表示没有待保存改动。flush 与防抖回调共用。
  const pendingRef = useRef<{ name: string; data: ReturnType<typeof toDraft> } | null>(null);
  const inflightRef = useRef<Promise<boolean> | null>(null);

  async function doSave(): Promise<boolean> {
    const payload = pendingRef.current;
    if (!payload) return true;
    pendingRef.current = null;
    const run = (async () => {
      try {
        const res = await fetch(apiLandingPagePath(pageId), {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        setSaveState(res.ok ? "saved" : "error");
        if (res.ok) {
          setSaveError("");
        } else {
          setSaveError(res.status === 409 ? "页面名称已被使用，请换一个名称" : "");
          pendingRef.current = pendingRef.current ?? payload; // 失败保留待保存，供重试/flush
        }
        return res.ok;
      } catch {
        setSaveState("error");
        setSaveError("");
        pendingRef.current = pendingRef.current ?? payload;
        return false;
      }
    })();
    inflightRef.current = run;
    const ok = await run;
    inflightRef.current = null;
    return ok;
  }

  // 注册 flush：取消防抖，立即保存（若有在途保存，先等它完成再补存余量）。
  useEffect(() => {
    flushSaveRef.current = async () => {
      if (timer.current) { clearTimeout(timer.current); timer.current = null; }
      if (inflightRef.current) await inflightRef.current;
      return doSave();
    };
    return () => { flushSaveRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  useEffect(() => {
    if (first.current) { first.current = false; return; } // 跳过初次挂载
    if (timer.current) clearTimeout(timer.current);
    setSaveState("saving");
    if (statusRef.current === "published") setPublishedDirty(true); // 已发布页：草稿开始领先线上快照
    pendingRef.current = { name, data: toDraft(state) };
    timer.current = setTimeout(() => { void doSave(); }, 1500);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, name, pageId, setSaveState, setPublishedDirty]);

  // 改动未落库（防抖中/保存失败）时拦截关闭或刷新，避免静默丢改动。
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (pendingRef.current || saveState === "saving" || saveState === "error") {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [saveState]);

  return null;
}
