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
  // 外层容器尺寸：iframe 以「真实设备宽度」渲染后等比缩入，高度按缩放反推填满外层，
  // 让落地页在 iframe 内部自身滚动——position:fixed 才会吸附到可视区，且页尾 min-h-screen
  // 不会撑出多余留白（旧实现把 iframe 高设为整页内容高 + 外层滚动，导致底部白块与悬浮按钮错位）。
  const [outerSize, setOuterSize] = useState({ width: virtualWidth, height: 0 });

  // iframe onLoad：注入样式 + 暴露 body 作为 portal 容器
  const handleLoad = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    syncHeadStyles(doc);
    setBody(doc.body);
  };

  // 无 src 的 iframe 会在浏览器内部立刻完成 about:blank 的加载，
  // 该原生 load 事件常常在 React 把 onLoad 处理器绑定到 DOM 节点之前就已触发，
  // 导致 handleLoad 永远不会被调用、body 状态停留在 null、预览内容无法挂载。
  // 这里在挂载后兜底检测一次：若 contentDocument 已是 complete，直接补跑一次 handleLoad。
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (doc && doc.readyState === "complete") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 兜底：about:blank 原生 load 可能早于 onLoad 绑定，挂载后补跑一次
      handleLoad();
    }
  }, []);

  // 父文档 head 变化（Turbopack dev / HMR 新增 <style>）时同步到 iframe
  useEffect(() => {
    const mo = new MutationObserver(() => {
      const doc = iframeRef.current?.contentDocument;
      if (doc) syncHeadStyles(doc);
    });
    mo.observe(document.head, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  // 外层尺寸变化 → 记录宽高并计算缩放比（scale = 外层宽 / 虚拟设备宽）
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setScale(width / virtualWidth);
      setOuterSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [virtualWidth]);

  // iframe 以虚拟宽渲染、按 scale 缩放；高度反推为 外层高/scale，缩放后正好填满外层。
  // 落地页在 iframe 内部滚动，position:fixed 吸附可视区，页尾无多余留白。
  const iframeHeight = scale > 0 ? outerSize.height / scale : outerSize.height;

  return (
    <div ref={outerRef} className="h-full w-full overflow-hidden bg-canvas">
      <iframe
        ref={iframeRef}
        onLoad={handleLoad}
        title="落地页实时预览"
        className="border-0 bg-white"
        style={{
          width: virtualWidth,
          height: iframeHeight || "100%",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
      {body && createPortal(children, body)}
    </div>
  );
}
