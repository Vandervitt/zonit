"use client";
// landing-renderer/sections/FloatingButton.tsx
// 悬浮 CTA：首屏 hero 内隐藏（hero 已有主 CTA，避免重复遮挡），滚过 hero 后固定常驻右下角。
// 用 IntersectionObserver 观察页面首个 <section>（恒为 hero）；在预览 iframe 内经 ownerDocument
// 绑定到 iframe 文档，故编辑器实时预览与真实页面行为一致。
import { useEffect, useRef, useState } from "react";
import type { FloatingButton as FloatingButtonData } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { inferChannel } from "../tracking/events";

export function FloatingButton({ data, theme }: { data: FloatingButtonData; theme: RendererTheme }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const doc = ref.current?.ownerDocument ?? document;
    const hero = doc.querySelector("section"); // 页面首个 section = hero
    if (!hero) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 无 hero 可观察时默认常驻，保证按钮不丢失
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { threshold: 0 });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  return (
    <a
      ref={ref}
      href={data.link}
      data-cta={inferChannel(data.link)}
      aria-hidden={!visible}
      tabIndex={visible ? undefined : -1}
      className={`fixed bottom-5 right-5 z-50 inline-flex items-center rounded-full px-5 py-3 text-sm font-bold text-white transition-opacity duration-300 ${theme.accentGradient} ${theme.accentShadow} ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      {data.text}
    </a>
  );
}
