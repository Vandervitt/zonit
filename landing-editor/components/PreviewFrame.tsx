"use client";
// landing-editor/components/PreviewFrame.tsx
// 通用 iframe 承载：把 children 渲染进隔离 iframe，并按外层容器宽度缩放，
// 使落地页以「真实桌面宽度」渲染后等比缩入面板。
// 注意：本文件是编辑器工具链中唯一允许动态行内样式的地方——缩放比例 / iframe 宽高
// 均为运行时计算值，无法用静态 Tailwind class 表达，故对 iframe 与外层容器使用
// 动态 style（transform/width/height）。此豁免仅限预览 chrome，不影响落地页 Tailwind-only。
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** 把父文档 <head> 的样式（<style> 与 <link rel=stylesheet>）克隆进 iframe <head>。 */
function syncHeadStyles(doc: Document) {
  const head = doc.head;
  // 清掉旧克隆，避免重复
  head.querySelectorAll("[data-preview-style]").forEach((n) => n.remove());
  const nodes = document.head.querySelectorAll('style, link[rel="stylesheet"]');
  nodes.forEach((node) => {
    const clone = node.cloneNode(true) as HTMLElement;
    clone.setAttribute("data-preview-style", "");
    head.appendChild(clone);
  });
}

export function PreviewFrame({ virtualWidth, children }: { virtualWidth: number; children: ReactNode }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(0);

  // iframe onLoad：注入样式 + 暴露 body 作为 portal 容器
  const handleLoad = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    syncHeadStyles(doc);
    setBody(doc.body);
  };

  // 父文档 head 变化（Turbopack dev / HMR 新增 <style>）时同步到 iframe
  useEffect(() => {
    const mo = new MutationObserver(() => {
      const doc = iframeRef.current?.contentDocument;
      if (doc) syncHeadStyles(doc);
    });
    mo.observe(document.head, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  // 外层宽度变化 → 计算缩放比
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setScale(w / virtualWidth);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [virtualWidth]);

  // iframe 内容高度变化 → 调整占位高
  useEffect(() => {
    if (!body) return;
    const measure = () => setContentHeight(body.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(body);
    return () => ro.disconnect();
  }, [body]);

  return (
    <div ref={outerRef} className="h-full w-full overflow-auto bg-canvas">
      {/* 占位容器：高度 = 缩放后的内容高度，避免截断/留白（动态值 → 行内样式豁免） */}
      <div style={{ height: contentHeight * scale }}>
        <iframe
          ref={iframeRef}
          onLoad={handleLoad}
          title="落地页实时预览"
          className="border-0 bg-white"
          style={{
            width: virtualWidth,
            height: contentHeight || "100%",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
      {body && createPortal(children, body)}
    </div>
  );
}
